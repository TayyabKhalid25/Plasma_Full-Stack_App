const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/squad
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        // Squad = Mutual friends who are online (not offline)
        const result = await pool.query(`
            SELECT 
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

        // Remove duplicates if the query joins matched both sides
        const uniqueSquad = [];
        const seenIds = new Set();
        result.rows.forEach(row => {
            if (!seenIds.has(row.plasmaUserID)) {
                seenIds.add(row.plasmaUserID);
                uniqueSquad.push(row);
            }
        });

        res.json({
            success: true,
            data: uniqueSquad
        });

    } catch (error) {
        console.error('Error fetching squad:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
