// =============================================================================
// BACKGROUND JOB QUEUE — Postgres-backed, Zero-Cloud job processing
// =============================================================================
// This module provides a lightweight job queue that uses the existing Postgres
// database instead of requiring external infrastructure (Redis, RabbitMQ, etc.).
//
// Architecture:
//   1. Jobs are inserted into the "background_jobs" table with a scheduled time.
//   2. A worker runs every 60 seconds, picks up due jobs, and executes them.
//   3. Failed jobs are retried with exponential backoff (5min → 15min → 60min).
//   4. Permanently failed jobs (403 Private Profile, max retries) are marked and
//      not retried.
//   5. A cleanup task runs every 6 hours, deleting completed/failed jobs older
//      than 24 hours to prevent table bloat.
//   6. If any external API returns 429 (Rate Limited), ALL jobs are paused for
//      15 minutes to protect API keys from being banned.
//
// Supported Job Types:
//   - STEAM_LIBRARY_SYNC:       Full library + profile sync for a user.
//   - STEAM_ACHIEVEMENT_SYNC:   Full achievement sync for a user.
//   - STEAM_ACHIEVEMENT_RETRY:  Retry achievements for specific failed games.
// =============================================================================

const { pool } = require('../config/dbConfig');
const {
    syncSteamLibrary,
    syncSteamAchievements,
    syncSteamAchievementsForGames
} = require('./steamSyncService');

// ── Global API Cooldown ──────────────────────────────────────────────────────
// When an external API returns 429, we set this timestamp to prevent all jobs
// from hammering the API further. The worker skips processing until cooldown expires.
let apiCooldownUntil = null;

// ── Worker interval references (for graceful shutdown if needed) ─────────────
let workerInterval = null;
let cleanupInterval = null;

// =============================================================================
// TABLE INITIALIZATION
// =============================================================================

/**
 * Creates the background_jobs table if it doesn't exist.
 * Called once during server startup.
 */
async function initializeJobTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS "background_jobs" (
            "jobID"       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            "jobType"     VARCHAR(50)  NOT NULL,
            "payload"     JSONB        NOT NULL DEFAULT '{}',
            "status"      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
            "retries"     INTEGER      NOT NULL DEFAULT 0,
            "maxRetries"  INTEGER      NOT NULL DEFAULT 3,
            "lastError"   TEXT,
            "errorCode"   VARCHAR(10),
            "nextRunAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            "completedAt" TIMESTAMP WITH TIME ZONE,
            "updatedAt"   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `);

    // Partial index: only index PENDING jobs, since those are the only ones
    // the worker ever queries. This keeps the index tiny and fast.
    await pool.query(`
        CREATE INDEX IF NOT EXISTS "idx_background_jobs_pending"
        ON "background_jobs" ("nextRunAt")
        WHERE "status" = 'PENDING';
    `);

    console.log('[JobQueue] background_jobs table ready.');
}

// =============================================================================
// ENQUEUE
// =============================================================================

/**
 * Inserts a new job into the queue.
 *
 * @param {string} jobType - One of: STEAM_LIBRARY_SYNC, STEAM_ACHIEVEMENT_SYNC, STEAM_ACHIEVEMENT_RETRY
 * @param {object} payload - Job-specific data (e.g., { userId }, { userId, appIds })
 * @param {number} [delayMs=0] - How many milliseconds from now the job should first run.
 */
async function enqueueJob(jobType, payload, delayMs = 0) {
    const nextRunAt = new Date(Date.now() + delayMs);
    await pool.query(`
        INSERT INTO "background_jobs" ("jobType", "payload", "nextRunAt")
        VALUES ($1, $2, $3)
    `, [jobType, JSON.stringify(payload), nextRunAt]);
    console.log(`[JobQueue] Enqueued ${jobType} job (runs at ${nextRunAt.toISOString()})`);
}

// =============================================================================
// JOB HANDLERS — Map job types to their execution logic
// =============================================================================

const JOB_HANDLERS = {
    /**
     * Full library + avatar sync from Steam.
     * Payload: { userId: string }
     */
    STEAM_LIBRARY_SYNC: async (payload) => {
        await syncSteamLibrary(payload.userId);
    },

    /**
     * Full achievement sync across all games.
     * Payload: { userId: string }
     */
    STEAM_ACHIEVEMENT_SYNC: async (payload) => {
        const result = await syncSteamAchievements(payload.userId);
        // If some games still failed, enqueue a targeted retry for just those games
        if (result.failedGames.length > 0) {
            const retryableGames = result.failedGames
                .filter(g => g.httpStatus !== 403) // Don't retry private profile errors
                .map(g => g.appId);

            if (retryableGames.length > 0) {
                await enqueueJob('STEAM_ACHIEVEMENT_RETRY', {
                    userId: payload.userId,
                    appIds: retryableGames
                }, 5 * 60 * 1000); // Retry in 5 minutes
            }

            // Log permanently failed games (403 = private profile)
            const permanentFailures = result.failedGames.filter(g => g.httpStatus === 403);
            if (permanentFailures.length > 0) {
                console.warn(`[JobQueue] ${permanentFailures.length} games skipped (private profile/forbidden):`,
                    permanentFailures.map(g => g.appId).join(', '));
            }
        }
    },

    /**
     * Targeted achievement retry for specific failed games only.
     * Payload: { userId: string, appIds: string[] }
     */
    STEAM_ACHIEVEMENT_RETRY: async (payload) => {
        const result = await syncSteamAchievementsForGames(payload.userId, payload.appIds);
        // If STILL failing, the job's own retry mechanism (exponential backoff) handles it.
        if (result.failedGames.length > 0) {
            const stillFailing = result.failedGames.filter(g => g.httpStatus !== 403);
            if (stillFailing.length > 0) {
                // Throw so the job framework retries with exponential backoff
                throw new Error(
                    `${stillFailing.length} games still failing: ${stillFailing.map(g => `${g.appId}(${g.reason})`).join(', ')}`
                );
            }
        }
    }
};

// =============================================================================
// JOB PROCESSING ENGINE
// =============================================================================

/**
 * Picks up to `batchSize` due jobs and executes them sequentially.
 * Uses SELECT ... FOR UPDATE SKIP LOCKED to prevent duplicate processing
 * if multiple workers ever exist.
 */
async function processJobs(batchSize = 5) {
    // Check global API cooldown — if active, skip this entire cycle
    if (apiCooldownUntil && Date.now() < apiCooldownUntil) {
        return;
    }
    apiCooldownUntil = null; // Cooldown expired, clear it

    // Atomically claim a batch of due jobs by setting them to RUNNING
    const result = await pool.query(`
        UPDATE "background_jobs"
        SET "status" = 'RUNNING', "updatedAt" = NOW()
        WHERE "jobID" IN (
            SELECT "jobID" FROM "background_jobs"
            WHERE "status" = 'PENDING' AND "nextRunAt" <= NOW()
            ORDER BY "nextRunAt" ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
        )
        RETURNING *
    `, [batchSize]);

    for (const job of result.rows) {
        await executeJob(job);
    }
}

/**
 * Executes a single job by dispatching to the appropriate handler.
 */
async function executeJob(job) {
    const handler = JOB_HANDLERS[job.jobType];
    if (!handler) {
        await markPermanentlyFailed(job.jobID,
            `Unknown job type: "${job.jobType}". No handler registered.`);
        return;
    }

    try {
        console.log(`[JobQueue] Executing ${job.jobType} (attempt ${job.retries + 1}/${job.maxRetries})`);
        await handler(job.payload);
        await markCompleted(job.jobID);
        console.log(`[JobQueue] ${job.jobType} completed successfully.`);
    } catch (err) {
        await handleJobFailure(job, err);
    }
}

// =============================================================================
// FAILURE HANDLING — Smart categorization + exponential backoff
// =============================================================================

async function handleJobFailure(job, err) {
    const errorCode = err.response?.status?.toString() || null;
    const errorMessage = err.message || 'Unknown error';

    console.error(`[JobQueue] ${job.jobType} failed (attempt ${job.retries + 1}): ${errorMessage}`);

    // ── 429: Rate Limited ─────────────────────────────────────────────────
    // External API is telling us to slow down. Pause ALL jobs globally for
    // 15 minutes and put this specific job back in the queue.
    if (errorCode === '429') {
        apiCooldownUntil = Date.now() + 15 * 60 * 1000;
        console.warn(`[JobQueue] 429 Rate Limited! Global cooldown until ${new Date(apiCooldownUntil).toISOString()}`);

        await pool.query(`
            UPDATE "background_jobs"
            SET "status" = 'PENDING',
                "nextRunAt" = $1,
                "lastError" = $2,
                "errorCode" = $3,
                "updatedAt" = NOW()
            WHERE "jobID" = $4
        `, [
            new Date(apiCooldownUntil),
            `Rate limited by external API. Global cooldown active.`,
            errorCode,
            job.jobID
        ]);
        return;
    }

    // ── 403: Forbidden / Private Profile ──────────────────────────────────
    // No amount of retrying will fix a private Steam profile. Mark as
    // permanently failed so we don't waste resources.
    if (errorCode === '403') {
        await markPermanentlyFailed(
            job.jobID,
            `Access denied (HTTP 403). The user's Steam profile may be private. Change Steam privacy settings and retry manually.`,
            errorCode
        );
        return;
    }

    // ── All other errors: Retry with exponential backoff ──────────────────
    const newRetries = job.retries + 1;
    if (newRetries >= job.maxRetries) {
        await markPermanentlyFailed(
            job.jobID,
            `Max retries (${job.maxRetries}) exceeded. Last error: ${errorMessage}`,
            errorCode
        );
        return;
    }

    // Backoff schedule: 5 minutes → 15 minutes → 60 minutes
    const backoffDelays = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000];
    const delayMs = backoffDelays[Math.min(newRetries - 1, backoffDelays.length - 1)];
    const nextRunAt = new Date(Date.now() + delayMs);

    console.log(`[JobQueue] Scheduling retry ${newRetries}/${job.maxRetries} at ${nextRunAt.toISOString()}`);

    await pool.query(`
        UPDATE "background_jobs"
        SET "status" = 'PENDING',
            "retries" = $1,
            "nextRunAt" = $2,
            "lastError" = $3,
            "errorCode" = $4,
            "updatedAt" = NOW()
        WHERE "jobID" = $5
    `, [newRetries, nextRunAt, errorMessage, errorCode, job.jobID]);
}

// =============================================================================
// STATUS UPDATES
// =============================================================================

async function markCompleted(jobID) {
    await pool.query(`
        UPDATE "background_jobs"
        SET "status" = 'COMPLETED', "completedAt" = NOW(), "updatedAt" = NOW()
        WHERE "jobID" = $1
    `, [jobID]);
}

async function markPermanentlyFailed(jobID, errorMessage, errorCode = null) {
    console.warn(`[JobQueue] Job ${jobID} permanently failed: ${errorMessage}`);
    await pool.query(`
        UPDATE "background_jobs"
        SET "status" = 'PERMANENTLY_FAILED',
            "lastError" = $1,
            "errorCode" = $2,
            "completedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE "jobID" = $3
    `, [errorMessage, errorCode, jobID]);
}

// =============================================================================
// CLEANUP — Prevent infinite table growth
// =============================================================================

/**
 * Deletes completed and permanently failed jobs older than 24 hours.
 * This runs on a separate 6-hour interval to keep the table lean.
 */
async function cleanupOldJobs() {
    const result = await pool.query(`
        DELETE FROM "background_jobs"
        WHERE ("status" = 'COMPLETED' OR "status" = 'PERMANENTLY_FAILED')
        AND "updatedAt" < NOW() - INTERVAL '24 hours'
    `);
    if (result.rowCount > 0) {
        console.log(`[JobQueue] Cleaned up ${result.rowCount} old jobs.`);
    }
}

/**
 * Recovers jobs that were stuck in RUNNING state (e.g., server crashed mid-execution).
 * Resets them to PENDING so the worker picks them up again.
 * Called once during server startup.
 */
async function recoverStuckJobs() {
    const result = await pool.query(`
        UPDATE "background_jobs"
        SET "status" = 'PENDING', "updatedAt" = NOW()
        WHERE "status" = 'RUNNING'
    `);
    if (result.rowCount > 0) {
        console.log(`[JobQueue] Recovered ${result.rowCount} stuck jobs from RUNNING → PENDING.`);
    }
}

// =============================================================================
// WORKER LIFECYCLE
// =============================================================================

/**
 * Starts the background worker timers.
 * - Job processor: every 60 seconds
 * - Job cleanup: every 6 hours
 * Also recovers any jobs stuck in RUNNING from a previous crash.
 */
async function startJobWorker() {
    // Recover any jobs stuck from a previous crash
    await recoverStuckJobs();

    // Process jobs every 60 seconds
    workerInterval = setInterval(async () => {
        try {
            await processJobs(5);
        } catch (err) {
            console.error('[JobQueue] Worker cycle error:', err.message);
        }
    }, 60 * 1000);

    // Clean up old jobs every 6 hours
    cleanupInterval = setInterval(async () => {
        try {
            await cleanupOldJobs();
        } catch (err) {
            console.error('[JobQueue] Cleanup cycle error:', err.message);
        }
    }, 6 * 60 * 60 * 1000);

    console.log('[JobQueue] Background job worker started (processing every 60s, cleanup every 6h).');
}

module.exports = {
    initializeJobTable,
    enqueueJob,
    startJobWorker
};
