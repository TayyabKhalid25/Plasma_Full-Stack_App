const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const axios = require('axios');

const router = express.Router();

// Utility for fetching Steam API Key (Replace with your actual dotenv fetch in prod)
const STEAM_API_KEY = process.env.STEAM_API_KEY || 'STUB_API_KEY';

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
        
        /* Stub API call
        const steamResponse = await axios.get(\`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=\${STEAM_API_KEY}&steamids=\${steamIds}\`);
        return res.json({ success: true, data: steamResponse.data.response.players });
        */
        
        // Mock response
        res.json({ success: true, data: [{ steamid: steamIds.split(',')[0], personastate: 1, gameextrainfo: 'Valorant' }] });
    } catch (error) {
        console.error('Error fetching steam statuses:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/steam/player/:steamId64
router.get('/player/:steamId64', authenticateToken, async (req, res) => {
    const { steamId64 } = req.params;
    
    try {
        // Mock response
        res.json({
            success: true,
            data: {
                steamid: steamId64,
                personaname: 'PlasmaUser123',
                avatarfull: 'https://via.placeholder.com/150'
            }
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
        
        // Mock parsing steam achievements
        res.json({
            success: true,
            data: {
                gameName: 'Sample Game',
                achievements: [
                    { apiname: 'ACH_1', achieved: 1 },
                    { apiname: 'ACH_2', achieved: 0 }
                ]
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
