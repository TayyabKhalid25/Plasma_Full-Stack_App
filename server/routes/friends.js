const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/friends
// Returns friends grouped by: requests, online, offline
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        const result = await pool.query(`
            SELECT 
                u."plasmaUserID", 
                u."username", 
                u."intent", 
                pr."avatarURL",
                fr."isMutual",
                fr."followerID"
            FROM "follow_relationships" fr
            JOIN "users" u ON (u."plasmaUserID" = fr."followedID" OR u."plasmaUserID" = fr."followerID")
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
            WHERE (fr."followerID" = $1 OR fr."followedID" = $1)
              AND u."plasmaUserID" != $1
        `, [userId]);

        const friends = { requests: [], online: [], offline: [] };
        const seen = new Set();

        result.rows.forEach(row => {
            if (seen.has(row.plasmaUserID)) return;
            seen.add(row.plasmaUserID);

            const userObj = { id: row.plasmaUserID, name: row.username, intent: row.intent, avatar: row.avatarURL };
            if (!row.isMutual && row.followerID !== userId) {
                friends.requests.push(userObj);
            } else if (row.isMutual) {
                if (row.intent === 'OFFLINE') {
                    friends.offline.push(userObj);
                } else {
                    friends.online.push(userObj);
                }
            }
        });

        res.json({ success: true, data: friends });

    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/friends/request/:userId
// Send a follow/friend request to a user
router.post('/request/:targetUserId', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { targetUserId } = req.params;

    if (userId === targetUserId) {
        return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    try {
        // Check if target user exists
        const userCheck = await pool.query(`SELECT "plasmaUserID" FROM "users" WHERE "plasmaUserID" = $1`, [targetUserId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if already following
        const existingFollow = await pool.query(`
            SELECT "followID" FROM "follow_relationships" WHERE "followerID" = $1 AND "followedID" = $2
        `, [userId, targetUserId]);

        if (existingFollow.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Already following this user' });
        }

        // Check if the target already follows us (if so, make it mutual)
        const reverseFollow = await pool.query(`
            SELECT "followID" FROM "follow_relationships" WHERE "followerID" = $1 AND "followedID" = $2
        `, [targetUserId, userId]);

        const isMutual = reverseFollow.rows.length > 0;

        // Insert follow relationship
        await pool.query(`
            INSERT INTO "follow_relationships" ("followerID", "followedID", "isMutual")
            VALUES ($1, $2, $3)
        `, [userId, targetUserId, isMutual]);

        // If mutual, update the reverse relationship too
        if (isMutual) {
            await pool.query(`
                UPDATE "follow_relationships" SET "isMutual" = TRUE
                WHERE "followerID" = $1 AND "followedID" = $2
            `, [targetUserId, userId]);
        }

        // Create a notification for the target user
        await pool.query(`
            INSERT INTO "notifications" ("receiverID", "senderID", "notificationType", "message", "isRead")
            VALUES ($1, $2, $3, $4, FALSE)
        `, [
            targetUserId, 
            userId, 
            'FRIEND_REQUEST', 
            isMutual ? 'accepted your friend request!' : 'sent you a friend request.'
        ]);

        res.status(201).json({ success: true, message: isMutual ? 'Now mutual friends!' : 'Follow request sent' });

    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/friends/:targetUserId
// Unfollow / remove a friend
router.delete('/:targetUserId', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { targetUserId } = req.params;

    try {
        // Remove follow
        await pool.query(`
            DELETE FROM "follow_relationships" WHERE "followerID" = $1 AND "followedID" = $2
        `, [userId, targetUserId]);

        // If there was a mutual, remove mutual status from the other side too
        await pool.query(`
            UPDATE "follow_relationships" SET "isMutual" = FALSE
            WHERE "followerID" = $1 AND "followedID" = $2
        `, [targetUserId, userId]);

        res.json({ success: true, message: 'Unfollowed successfully' });

    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
