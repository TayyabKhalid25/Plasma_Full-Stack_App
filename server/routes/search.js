const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/search
 * Returns combined results for users and local games matching the query.
 *
 * @requires authenticateToken
 * @param {string} req.query.q - The search query string (min length 2)
 * @returns {{ success: boolean, data: { users: User[], games: Game[] } }}
 * @throws {500} Internal server error on DB failure
 */
router.get('/', authenticateToken, async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
        return res.json({ success: true, data: { users: [], games: [] } });
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

        res.json({
            success: true,
            data: {
                users: userResults.rows,
                games: gameResults.rows
            }
        });

    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
