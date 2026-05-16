// =============================================================================
// BACKGROUND JOB QUEUE — In-Memory, Zero-Database job processing
// =============================================================================
// This module provides a lightweight job queue that runs entirely in server
// memory. No external infrastructure required (no Postgres table, no Redis).
//
// Architecture:
//   1. Jobs are pushed onto an in-memory array with a scheduled time.
//   2. A worker runs every 60 seconds, picks up due jobs, and executes them.
//   3. Failed jobs are retried with exponential backoff (5min → 15min → 60min).
//   4. Permanently failed jobs (403 Private Profile, max retries) are discarded.
//   5. Completed/failed jobs are immediately removed from memory — no cleanup
//      task needed.
//   6. If any external API returns 429 (Rate Limited), ALL jobs are paused for
//      15 minutes to protect API keys from being banned.
//
// Trade-off: Jobs are lost on server restart. This is acceptable because:
//   - Jobs are only enqueued on login/register (user triggers again next visit)
//   - User-initiated syncs call syncSteamLibrary directly, not through the queue
//
// Supported Job Types:
//   - STEAM_LIBRARY_SYNC:       Full library + profile sync for a user.
//   - STEAM_ACHIEVEMENT_SYNC:   Full achievement sync for a user.
// =============================================================================

const {
    syncSteamLibrary,
    syncSteamAchievements
} = require('./steamSyncService');

// ── In-Memory Job Store ──────────────────────────────────────────────────────
const jobQueue = [];
let jobIdCounter = 0;

// ── Global API Cooldown ──────────────────────────────────────────────────────
// When an external API returns 429, we set this timestamp to prevent all jobs
// from hammering the API further. The worker skips processing until cooldown expires.
let apiCooldownUntil = null;

// ── Worker interval reference (for graceful shutdown if needed) ──────────────
let workerInterval = null;

// =============================================================================
// ENQUEUE
// =============================================================================

/**
 * Adds a new job to the in-memory queue.
 *
 * @param {string} jobType - One of: STEAM_LIBRARY_SYNC, STEAM_ACHIEVEMENT_SYNC
 * @param {object} payload - Job-specific data (e.g., { userId })
 * @param {number} [delayMs=0] - How many milliseconds from now the job should first run.
 */
async function enqueueJob(jobType, payload, delayMs = 0) {
    const nextRunAt = new Date(Date.now() + delayMs);
    const job = {
        jobID: ++jobIdCounter,
        jobType,
        payload,
        status: 'PENDING',
        retries: 0,
        maxRetries: 3,
        lastError: null,
        errorCode: null,
        nextRunAt
    };
    jobQueue.push(job);
    console.log(`[JobQueue] Enqueued ${jobType} job #${job.jobID} (runs at ${nextRunAt.toISOString()})`);
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
        
        // Log any games that failed during sync
        if (result.failedGames.length > 0) {
            console.warn(`[JobQueue] Achievement sync for user ${payload.userId} completed with ${result.failedGames.length} game failures. No retries will be scheduled.`);
            
            const http403s = result.failedGames.filter(g => g.httpStatus === 403);
            if (http403s.length > 0) {
                console.warn(`[JobQueue] Private profile/forbidden errors (403) for:`, http403s.map(g => g.appId).join(', '));
            }
        }
    }
};

// =============================================================================
// JOB PROCESSING ENGINE
// =============================================================================

/**
 * Picks up to `batchSize` due jobs from the in-memory queue and executes them
 * sequentially. Single-threaded Node.js guarantees no duplicate processing.
 */
async function processJobs(batchSize = 5) {
    // Check global API cooldown — if active, skip this entire cycle
    if (apiCooldownUntil && Date.now() < apiCooldownUntil) {
        return;
    }
    apiCooldownUntil = null; // Cooldown expired, clear it

    const now = Date.now();

    // Find due PENDING jobs, sorted by nextRunAt (earliest first)
    const dueJobs = jobQueue
        .filter(j => j.status === 'PENDING' && j.nextRunAt.getTime() <= now)
        .sort((a, b) => a.nextRunAt - b.nextRunAt)
        .slice(0, batchSize);

    for (const job of dueJobs) {
        job.status = 'RUNNING';
        await executeJob(job);
    }
}

/**
 * Executes a single job by dispatching to the appropriate handler.
 */
async function executeJob(job) {
    const handler = JOB_HANDLERS[job.jobType];
    if (!handler) {
        removeJob(job.jobID);
        console.warn(`[JobQueue] Job #${job.jobID} permanently failed: Unknown job type "${job.jobType}". No handler registered.`);
        return;
    }

    try {
        console.log(`[JobQueue] Executing ${job.jobType} #${job.jobID} (attempt ${job.retries + 1}/${job.maxRetries})`);
        await handler(job.payload);
        removeJob(job.jobID);
        console.log(`[JobQueue] ${job.jobType} #${job.jobID} completed successfully.`);
    } catch (err) {
        handleJobFailure(job, err);
    }
}

// =============================================================================
// FAILURE HANDLING — Smart categorization + exponential backoff
// =============================================================================

function handleJobFailure(job, err) {
    const errorCode = err.response?.status?.toString() || null;
    const errorMessage = err.message || 'Unknown error';

    console.error(`[JobQueue] ${job.jobType} #${job.jobID} failed (attempt ${job.retries + 1}): ${errorMessage}`);

    // ── 429: Rate Limited ─────────────────────────────────────────────────
    // External API is telling us to slow down. Pause ALL jobs globally for
    // 15 minutes and put this specific job back in the queue.
    if (errorCode === '429') {
        apiCooldownUntil = Date.now() + 15 * 60 * 1000;
        console.warn(`[JobQueue] 429 Rate Limited! Global cooldown until ${new Date(apiCooldownUntil).toISOString()}`);

        job.status = 'PENDING';
        job.nextRunAt = new Date(apiCooldownUntil);
        job.lastError = 'Rate limited by external API. Global cooldown active.';
        job.errorCode = errorCode;
        return;
    }

    // ── 403: Forbidden / Private Profile ──────────────────────────────────
    // No amount of retrying will fix a private Steam profile. Discard job.
    if (errorCode === '403') {
        console.warn(`[JobQueue] Job #${job.jobID} permanently failed: Access denied (HTTP 403). The user's Steam profile may be private.`);
        removeJob(job.jobID);
        return;
    }

    // ── All other errors: Retry with exponential backoff ──────────────────
    const newRetries = job.retries + 1;
    if (newRetries >= job.maxRetries) {
        console.warn(`[JobQueue] Job #${job.jobID} permanently failed: Max retries (${job.maxRetries}) exceeded. Last error: ${errorMessage}`);
        removeJob(job.jobID);
        return;
    }

    // Backoff schedule: 5 minutes → 15 minutes → 60 minutes
    const backoffDelays = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000];
    const delayMs = backoffDelays[Math.min(newRetries - 1, backoffDelays.length - 1)];
    const nextRunAt = new Date(Date.now() + delayMs);

    console.log(`[JobQueue] Scheduling retry ${newRetries}/${job.maxRetries} for job #${job.jobID} at ${nextRunAt.toISOString()}`);

    job.status = 'PENDING';
    job.retries = newRetries;
    job.nextRunAt = nextRunAt;
    job.lastError = errorMessage;
    job.errorCode = errorCode;
}

// =============================================================================
// QUEUE HELPERS
// =============================================================================

/**
 * Removes a job from the in-memory queue by its ID.
 */
function removeJob(jobID) {
    const idx = jobQueue.findIndex(j => j.jobID === jobID);
    if (idx !== -1) {
        jobQueue.splice(idx, 1);
    }
}

// =============================================================================
// WORKER LIFECYCLE
// =============================================================================

/**
 * Starts the background worker timer.
 * Processes due jobs every 60 seconds.
 */
function startJobWorker() {
    workerInterval = setInterval(async () => {
        try {
            await processJobs(5);
        } catch (err) {
            console.error('[JobQueue] Worker cycle error:', err.message);
        }
    }, 60 * 1000);

    console.log('[JobQueue] In-memory job worker started (processing every 60s).');
}

module.exports = {
    enqueueJob,
    startJobWorker
};
