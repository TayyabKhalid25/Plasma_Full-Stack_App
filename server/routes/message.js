const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/messages
// Get all conversations for the current user
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        // Get all unique users the logged-in user has posted with (via comments on same posts)
        // Since there's no direct messages table, we use the follow_relationships 
        // to show conversation stubs with friends
        const result = await pool.query(`
            SELECT DISTINCT
                u."plasmaUserID" AS id,
                u."username" AS name,
                u."intent",
                pr."avatarURL" AS avatar
            FROM "follow_relationships" fr
            JOIN "users" u ON (
                CASE 
                    WHEN fr."followerID" = $1 THEN fr."followedID" = u."plasmaUserID"
                    ELSE fr."followerID" = u."plasmaUserID"
                END
            )
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
            WHERE (fr."followerID" = $1 OR fr."followedID" = $1)
              AND fr."isMutual" = TRUE
              AND u."plasmaUserID" != $1
        `, [userId]);

        res.json({ success: true, data: result.rows });

    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/messages/:friendId
// Get conversation with a specific friend
router.get('/:friendId', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { friendId } = req.params;

    try {
        // Get the friend's profile info
        const friendResult = await pool.query(`
            SELECT u."plasmaUserID", u."username", u."intent", pr."avatarURL"
            FROM "users" u
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
            WHERE u."plasmaUserID" = $1
        `, [friendId]);

        if (friendResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get comments made by both users (shared conversation via posts)
        const commentsResult = await pool.query(`
            SELECT 
                c."commentID" AS id,
                c."userID" AS sender,
                c."text",
                c."timestampUTC" AS time
            FROM "comments" c
            WHERE c."userID" IN ($1, $2)
            ORDER BY c."timestampUTC" ASC
            LIMIT 50
        `, [userId, friendId]);

        res.json({
            success: true,
            data: {
                friend: friendResult.rows[0],
                messages: commentsResult.rows
            }
        });

    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;