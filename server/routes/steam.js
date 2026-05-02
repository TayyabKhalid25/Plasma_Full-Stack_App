const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getSteamPlayerSummaries, getSteamPlayerAchievements, getSteamOwnedGames } = require('../utils/externalApis');

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

        const processedSummaries = summaries.map(player => {
            if (player.communityvisibilitystate !== 3) {
                return {
                    steamid: player.steamid,
                    personaname: player.personaname,
                    avatarfull: player.avatarfull,
                    profileurl: player.profileurl,
                    error: "User's profile is private"
                };
            }
            return player;
        });

        res.json({ success: true, data: processedSummaries });
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

        const player = summaries[0];
        if (player.communityvisibilitystate !== 3) {
            return res.status(403).json({
                success: false,
                message: "User's profile is private",
                data: {
                    steamid: player.steamid,
                    personaname: player.personaname,
                    avatarfull: player.avatarfull,
                    profileurl: player.profileurl
                }
            });
        }

        res.json({
            success: true,
            data: player
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
        if (error.response && error.response.status === 403) {
            return res.status(403).json({ success: false, message: "User's profile is private" });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/steam/sync/achievements
// Syncs Steam achievements for all games in user's library into DB.
// Designed to be called by a cron job or manually.
router.post('/sync/achievements', authenticateToken, async (req, res) => {
    try {
        const { syncSteamAchievements } = require('../utils/steamSyncService');
        const result = await syncSteamAchievements(req.userId);

        if (result.failedGames && result.failedGames.length > 0) {
            // Check if the profile is private (403 errors on games)
            const privateProfileErrors = result.failedGames.filter(g => g.httpStatus === 403);
            if (privateProfileErrors.length > 0 && result.gamesProcessed === 0) {
                return res.status(403).json({ success: false, message: "User's profile is private" });
            }
        }

        res.json({
            success: true,
            message: `Synced ${result.totalSynced} achievements across ${result.gamesProcessed} games`,
            syncedAchievements: result.totalSynced,
            gamesProcessed: result.gamesProcessed,
            failedGames: result.failedGames ? result.failedGames.map(g => g.appId) : []
        });
    } catch (error) {
        console.error('Achievement Sync Error:', error);
        if (error.message === 'Steam account not linked') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to sync achievements' });
    }
});

// POST /api/steam/sync/library (Unified Library Sync)
// Migrated from /api/library/sync/steam
router.post('/sync/library', authenticateToken, async (req, res) => {
    try {
        // 1. Get user's steamId64
        const user = await pool.query('SELECT "steamID64" FROM "users" WHERE "plasmaUserID" = $1', [req.userId]);
        if (user.rows.length === 0 || !user.rows[0].steamID64) {
            return res.status(400).json({ success: false, message: 'Steam account not linked' });
        }
        const steamId = user.rows[0].steamID64;

        // 2. Fetch Player Summary (Profile Update)
        const summaries = await getSteamPlayerSummaries(steamId);
        if (summaries && summaries.length > 0) {
            const avatarURL = summaries[0].avatarfull;
            await pool.query('UPDATE "profiles" SET "avatarURL" = $1 WHERE "plasmaUserID" = $2', [avatarURL, req.userId]);
        }

        // 3. Fetch Owned Games (Library Sync)
        const games = await getSteamOwnedGames(steamId);

        let addedCount = 0;
        if (games && games.length > 0) {
            addedCount = games.length;

            const appIds = games.map(g => g.appid.toString());
            const titles = games.map(g => g.name);
            const coverArts = appIds.map(appId => `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`);

            // Batch insert missing games into the global games table
            await pool.query(`
                INSERT INTO "games" ("appID", "title", "platform", "coverArtURL")
                SELECT id, title, 'STEAM', cover
                FROM unnest($1::text[], $2::text[], $3::text[]) AS t(id, title, cover)
                ON CONFLICT ("appID") DO UPDATE SET
                    "coverArtURL" = EXCLUDED."coverArtURL"
            `, [appIds, titles, coverArts]);

            // Batch insert/update user library entries
            const userIds = Array(games.length).fill(req.userId);
            const hoursPlayed = games.map(g => (g.playtime_forever / 60).toFixed(2));

            await pool.query(`
                INSERT INTO "library_entries" ("userID", "appID", "hoursPlayed")
                SELECT uid, aid, hrs::numeric
                FROM unnest($1::uuid[], $2::text[], $3::text[]) AS t(uid, aid, hrs)
                ON CONFLICT ("userID", "appID") DO UPDATE SET
                    "hoursPlayed" = EXCLUDED."hoursPlayed"
            `, [userIds, appIds, hoursPlayed]);
        }

        res.json({ success: true, message: 'Steam library and profile synced successfully', syncedGames: addedCount });
    } catch (error) {
        if (error.response && error.response.status === 403) {
            return res.status(403).json({ success: false, message: "User's profile is private" });
        }
        console.error('Steam Library Sync Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to sync with Steam' });
    }
});

module.exports = router;
