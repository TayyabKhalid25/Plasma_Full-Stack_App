const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getSteamPlayerSummaries, getSteamPlayerAchievements } = require('../utils/externalApis');
const { syncSteamLibrary, syncSteamAchievements, syncSteamProfile, getUserSteamId } = require('../utils/steamSyncService');
const { enqueueJob } = require('../utils/jobQueue');

const router = express.Router();

/**
 * GET /api/steam/friends/status
 * Fetches real-time Steam presence (online, in-game) for all mutual friends
 * who have linked their Steam accounts.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, data: SteamPlayerSummary[] }}
 * @throws {500} Internal server error
 */
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

/**
 * GET /api/steam/player/:steamId64
 * Fetches a single Steam player's summary (avatar, persona name, state).
 * Handles private profiles gracefully.
 *
 * @requires authenticateToken
 * @param {string} req.params.steamId64 - The SteamID64 of the player
 * @returns {{ success: boolean, data: SteamPlayerSummary }}
 * @throws {403} User's profile is private
 * @throws {404} Player not found on Steam
 * @throws {500} Internal server error
 */
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

/**
 * GET /api/steam/achievements/:appId
 * Fetches the authenticated user's Steam achievements for a specific game.
 *
 * @requires authenticateToken
 * @param {string} req.params.appId - The Steam AppID
 * @returns {{ success: boolean, data: Object }}
 * @throws {400} Steam not linked
 * @throws {403} User's profile is private
 * @throws {500} Internal server error
 */
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

/**
 * POST /api/steam/sync/achievements
 * Syncs Steam achievements for all games in the user's library into the DB.
 * Designed to be called by a cron job or manually.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, message: string, syncedAchievements: number, gamesProcessed: number, failedGames: string[] }}
 * @throws {400} Steam account not linked
 * @throws {403} User's profile is private
 * @throws {500} Failed to sync achievements
 */
router.post('/sync/achievements', authenticateToken, async (req, res) => {
    try {
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

/**
 * POST /api/steam/sync/library
 * Performs a unified sync of the user's Steam library.
 * Enqueues a background job for achievement sync.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, message: string, syncedGames: number, isPrivate: boolean }}
 * @throws {400} Steam account not linked
 * @throws {403} User's profile is private
 * @throws {500} Failed to sync with Steam
 */
router.post('/sync/library', authenticateToken, async (req, res) => {
    try {
        const result = await syncSteamLibrary(req.userId);

        // Enqueue background achievement sync (heavy task)
        await enqueueJob('STEAM_ACHIEVEMENT_SYNC', { userId: req.userId });

        res.json({
            success: true,
            message: result.isPrivate
                ? 'Library synced (Limited: Profile is Private)'
                : 'Steam library and profile synced successfully. Achievements are being updated in the background.',
            syncedGames: result.syncedGames,
            isPrivate: result.isPrivate
        });
    } catch (error) {
        if (error.response && error.response.status === 403) {
            return res.status(403).json({ success: false, message: "User's profile is private" });
        }
        if (error.message === 'Steam account not linked') {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Steam Library Sync Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to sync with Steam' });
    }
});

/**
 * POST /api/steam/sync/avatar-force
 * Overwrites the user's local profile avatar with their current Steam avatar.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, message: string, isPrivate: boolean }}
 * @throws {400} Steam account not linked
 * @throws {500} Failed to fetch Steam profile
 */
router.post('/sync/avatar-force', authenticateToken, async (req, res) => {
    try {
        // 1. Get user's steamId64
        const steamId = await getUserSteamId(req.userId);

        // 2. Run profile sync with forceAvatar = true
        const result = await syncSteamProfile(steamId, req.userId, true);

        if (!result.synced) {
            return res.status(500).json({ success: false, message: 'Failed to fetch Steam profile' });
        }

        res.json({
            success: true,
            message: 'Avatar updated from Steam successfully',
            isPrivate: result.isPrivate
        });
    } catch (error) {
        console.error('Steam Avatar Force Sync Error:', error.message);
        if (error.message === 'Steam account not linked') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
