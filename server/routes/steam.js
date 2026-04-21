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

module.exports = router;
