const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/squad
 * Returns mutual friends who are currently online (intent != OFFLINE).
 * Uses DISTINCT ON to eliminate duplicates at the DB level.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, data: SquadMember[] }}
 */
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        const result = await pool.query(`
            SELECT DISTINCT ON (u."plasmaUserID")
                u."plasmaUserID", 
                u."username", 
                u."intent", 
                p."avatarURL"
            FROM "follow_relationships" fr
            JOIN "users" u ON (u."plasmaUserID" = fr."followedID" OR u."plasmaUserID" = fr."followerID")
            JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE (fr."followerID" = $1 OR fr."followedID" = $1)
              AND u."plasmaUserID" != $1
              AND fr."isMutual" = TRUE
              AND u."intent" != 'OFFLINE'
        `, [userId]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching squad:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;

