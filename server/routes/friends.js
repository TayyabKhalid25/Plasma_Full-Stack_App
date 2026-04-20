const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/friends
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        // Fetch all users we have a relationship with
        const result = await pool.query(`
            SELECT 
                u."plasmaUserID", 
                u."username", 
                u."intent", 
                p."avatarURL",
                fr."isMutual",
                fr."followerID"
            FROM "follow_relationships" fr
            JOIN "users" u ON (u."plasmaUserID" = fr."followedID" OR u."plasmaUserID" = fr."followerID")
            JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE (fr."followerID" = $1 OR fr."followedID" = $1)
              AND u."plasmaUserID" != $1
        `, [userId]);

        const friends = {
            requests: [],
            online: [],
            offline: []
        };

        result.rows.forEach(row => {
            const userObj = {
                id: row.plasmaUserID,
                name: row.username,
                intent: row.intent,
                avatar: row.avatarURL
            };

            if (!row.isMutual && row.followerID !== userId) {
                // Someone follows us, but we haven't followed back -> Request
                friends.requests.push(userObj);
            } else if (row.isMutual) {
                // Mutual follow -> Friend
                if (row.intent === 'OFFLINE') {
                    friends.offline.push(userObj);
                } else {
                    friends.online.push(userObj);
                }
            }
        });

        res.json({
            success: true,
            data: friends
        });

    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
