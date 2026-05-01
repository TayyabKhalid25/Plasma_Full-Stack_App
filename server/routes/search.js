const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const { searchIgdbGames } = require('../utils/externalApis');

const router = express.Router();

// GET /api/search
// Returns combined results for users, local games, and global (IGDB) games
router.get('/', authenticateToken, async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
        return res.json({ success: true, data: { users: [], games: [], igdb: [] } });
    }

    const searchQuery = q.trim();
    const dbQuery = `%${searchQuery}%`;

    try {
        // 1. Search Users
        const userResults = await pool.query(`
            SELECT 
                u."plasmaUserID" AS id, 
                u."username", 
                p."avatarURL"
            FROM "users" u
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE u."username" ILIKE $1
            LIMIT 5
        `, [dbQuery]);

        // 2. Search Local Games (Already in our DB)
        const gameResults = await pool.query(`
            SELECT 
                "appID" AS id, 
                "title", 
                "coverArtURL", 
                "platform"
            FROM "games"
            WHERE "title" ILIKE $1
            LIMIT 5
        `, [dbQuery]);

        // 3. Search IGDB (External)
        let igdbResults = [];
        try {
            igdbResults = await searchIgdbGames(searchQuery);
        } catch (igdbErr) {
            console.error('IGDB search failed in global search:', igdbErr.message);
        }

        res.json({
            success: true,
            data: {
                users: userResults.rows,
                games: gameResults.rows,
                igdb: igdbResults
            }
        });

    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
