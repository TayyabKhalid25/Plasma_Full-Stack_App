const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getSteamPlayerSummaries, getSteamPlayerAchievements } = require('../utils/externalApis');

const router = express.Router();

// GET /api/steam/friends/status
router.get('/friends/status', authenticateToken, async (req, res) => {
    try {
        // Find steamID64 of friends
        const result = await pool.query(`
            SELECT u."steamID64"
            FROM "follow_relationships" fr
            JOIN "users" u ON fr."followedID" = u."plasmaUserID"
            WHERE fr."followerID" = $1 AND fr."isMutual" = TRUE AND u."steamID64" IS NOT NULL
        `, [req.userId]);
        
        const steamIds = result.rows.map(r => r.steamID64).join(',');
        if (!steamIds) return res.json({ success: true, data: [] });
        
        const summaries = await getSteamPlayerSummaries(steamIds);
        res.json({ success: true, data: summaries });
    } catch (error) {
        console.error('Error fetching steam statuses:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/steam/player/:steamId64
router.get('/player/:steamId64', authenticateToken, async (req, res) => {
    const { steamId64 } = req.params;
    
    try {
        const summaries = await getSteamPlayerSummaries(steamId64);
        if (!summaries || summaries.length === 0) {
            return res.status(404).json({ success: false, message: 'Player not found on Steam' });
        }
        res.json({
            success: true,
            data: summaries[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/steam/achievements/:appId
router.get('/achievements/:appId', authenticateToken, async (req, res) => {
    const { appId } = req.params;
    
    try {
        // Fetch user's steamId64
        const user = await pool.query('SELECT "steamID64" FROM "users" WHERE "plasmaUserID" = $1', [req.userId]);
        if (user.rows.length === 0 || !user.rows[0].steamID64) {
            return res.status(400).json({ success: false, message: 'Steam not linked' });
        }
        
        const steamId64 = user.rows[0].steamID64;
        const achievements = await getSteamPlayerAchievements(steamId64, appId);
        
        res.json({
            success: true,
            data: achievements
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/steam/sync/achievements
// Syncs Steam achievements for all games in user's library into DB.
// Designed to be called by a cron job or manually.
router.post('/sync/achievements', authenticateToken, async (req, res) => {
    try {
        // 1. Get user's steamID64
        const user = await pool.query('SELECT "steamID64" FROM "users" WHERE "plasmaUserID" = $1', [req.userId]);
        if (user.rows.length === 0 || !user.rows[0].steamID64) {
            return res.status(400).json({ success: false, message: 'Steam account not linked' });
        }
        const steamId = user.rows[0].steamID64;

        // 2. Get all STEAM games in this user's library
        const libraryResult = await pool.query(`
            SELECT g."appID" FROM "library_entries" le
            JOIN "games" g ON le."appID" = g."appID"
            WHERE le."userID" = $1 AND g."platform" = 'STEAM'
        `, [req.userId]);

        let totalSynced = 0;
        let gamesProcessed = 0;

        let newAchievements = [];
        let newUserAchievements = [];
        let failedGames = [];

        // Note: we run Steam API requests sequentially to avoid rate limiting
        for (const row of libraryResult.rows) {
            const appId = row.appID;
            try {
                const achievementData = await getSteamPlayerAchievements(steamId, appId);
                if (!achievementData || !achievementData.achievements) continue;

                gamesProcessed++; // The game successfully returned an achievement schema

                for (const ach of achievementData.achievements) {
                    if (ach.achieved !== 1) continue; // Skip unachieved

                    const achievementID = `steam_${appId}_${ach.apiname}`;
                    const unlockedAt = ach.unlocktime || Math.floor(Date.now() / 1000);
                    const title = ach.name || ach.apiname;

                    newAchievements.push({ achievementID, appId, title });
                    newUserAchievements.push({ userID: req.userId, achievementID, unlockedAt });
                    totalSynced++;
                }
            } catch (gameErr) {
                // Steam returns 400 Bad Request if the app doesn't support stats/achievements
                if (gameErr.response && gameErr.response.status === 400) {
                    continue;
                }
                // Capture detailed failure info for diagnostics and retry decisions
                failedGames.push({
                    appId,
                    reason: gameErr.message || 'Unknown error',
                    httpStatus: gameErr.response?.status || null
                });
                console.warn(`[Steam] Achievement sync failed for appId ${appId}: HTTP ${gameErr.response?.status || 'N/A'} — ${gameErr.message}`);
            }
        }

        // Execute bulk inserts if any achievements were found
        if (newAchievements.length > 0) {
            const achIds = newAchievements.map(a => a.achievementID);
            const appIds = newAchievements.map(a => a.appId);
            const titles = newAchievements.map(a => a.title);

            await pool.query(`
                INSERT INTO "achievements" ("achievementID", "appID", "title", "rarityWeight", "plasmaXP")
                SELECT id, app, title, 1.0, 25
                FROM unnest($1::text[], $2::text[], $3::text[]) AS t(id, app, title)
                ON CONFLICT ("achievementID") DO NOTHING
            `, [achIds, appIds, titles]);

            const userIds = newUserAchievements.map(a => a.userID);
            const uAchIds = newUserAchievements.map(a => a.achievementID);
            const unlockedAts = newUserAchievements.map(a => a.unlockedAt);

            await pool.query(`
                INSERT INTO "user_achievements" ("userID", "achievementID", "unlockedAt")
                SELECT uid, aid, to_timestamp(ts)
                FROM unnest($1::uuid[], $2::text[], $3::bigint[]) AS t(uid, aid, ts)
                ON CONFLICT ("userID", "achievementID") DO NOTHING
            `, [userIds, uAchIds, unlockedAts]);
        }

        // Update profile XP
        const xpResult = await pool.query(`
            SELECT COALESCE(SUM(a."plasmaXP"), 0) as "totalXP"
            FROM "user_achievements" ua
            JOIN "achievements" a ON ua."achievementID" = a."achievementID"
            WHERE ua."userID" = $1
        `, [req.userId]);
        
        await pool.query(`
            UPDATE "profiles" SET "totalPlasmaXP" = $1 WHERE "plasmaUserID" = $2
        `, [parseInt(xpResult.rows[0].totalXP) || 0, req.userId]);

        // Enqueue background retries for games that failed due to transient errors
        // (skip 403 = private profile — retrying won't help)
        const retryableGames = failedGames
            .filter(g => g.httpStatus !== 403)
            .map(g => g.appId);

        if (retryableGames.length > 0) {
            const { enqueueJob } = require('../utils/jobQueue');
            await enqueueJob('STEAM_ACHIEVEMENT_RETRY', {
                userId: req.userId,
                appIds: retryableGames
            }, 5 * 60 * 1000); // Retry in 5 minutes
            console.log(`[Steam] Enqueued retry for ${retryableGames.length} failed games.`);
        }

        // Check if the profile is private (403 errors on games)
        const privateProfileErrors = failedGames.filter(g => g.httpStatus === 403);
        if (privateProfileErrors.length > 0 && gamesProcessed === 0) {
            return res.status(403).json({ success: false, message: "User's profile is private" });
        }

        res.json({
            success: true,
            message: `Synced ${totalSynced} achievements across ${gamesProcessed} games`,
            syncedAchievements: totalSynced,
            gamesProcessed,
            failedGames: failedGames.map(g => g.appId),
            retriesEnqueued: retryableGames.length
        });
    } catch (error) {
        console.error('Achievement Sync Error:', error);
        res.status(500).json({ success: false, message: 'Failed to sync achievements' });
    }
});

module.exports = router;
