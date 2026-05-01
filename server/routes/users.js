const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/users/search?q=
// Search for users by username
router.get('/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
        return res.json({ success: true, data: [] });
    }

    try {
        const result = await pool.query(`
            SELECT 
                u."plasmaUserID", 
                u."username", 
                p."avatarURL",
                fr."followID" IS NOT NULL AS "isRequested",
                fr."isMutual"
            FROM "users" u
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            LEFT JOIN "follow_relationships" fr ON u."plasmaUserID" = fr."followedID" AND fr."followerID" = $2
            WHERE u."username" ILIKE $1 AND u."plasmaUserID" != $2
            LIMIT 10
        `, [`%${q.trim()}%`, req.userId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/users/:userId
// Returns another user's public profile
router.get('/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const loggedInUserId = req.userId;

    try {
        const userResult = await pool.query(`
            SELECT 
                u."plasmaUserID", 
                u."username", 
                u."intent", 
                p."avatarURL", 
                p."bio", 
                p."totalPlasmaXP"
            FROM "users" u
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE u."plasmaUserID" = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = userResult.rows[0];

        // Check mutual follow status
        const followCheck = await pool.query(`
            SELECT "isMutual" FROM "follow_relationships"
            WHERE "followerID" = $1 AND "followedID" = $2
        `, [loggedInUserId, userId]);

        const isFollowing = followCheck.rows.length > 0;
        const isMutual = isFollowing ? followCheck.rows[0].isMutual : false;

        // Fetch Hall of Fame
        const hallOfFameResult = await pool.query(`
            SELECT 
                a."achievementID", a."title", a."rarityWeight", a."plasmaXP", g."coverArtURL"
            FROM "user_achievements" ua
            JOIN "achievements" a ON ua."achievementID" = a."achievementID"
            JOIN "games" g ON a."appID" = g."appID"
            WHERE ua."userID" = $1 AND ua."isPinned" = TRUE
            LIMIT 5
        `, [userId]);

        res.json({
            success: true,
            data: {
                profile: user,
                isFollowing,
                isMutual,
                hallOfFame: hallOfFameResult.rows
            }
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/users/me/intent
router.put('/me/intent', authenticateToken, async (req, res) => {
    const { intent } = req.body;
    const allowedIntents = ['COMPETITIVE', 'CHILL', 'OFFLINE', 'COMP']; 
    // The Postman spec mentioned "COMP", mapping it to "COMPETITIVE"
    
    let dbIntent = intent.toUpperCase();
    if (dbIntent === 'COMP') dbIntent = 'COMPETITIVE';

    if (!allowedIntents.includes(dbIntent)) {
        return res.status(400).json({ success: false, message: 'Invalid intent mode' });
    }

    try {
        await pool.query(`
            UPDATE "users" SET "intent" = $1 WHERE "plasmaUserID" = $2
        `, [dbIntent, req.userId]);

        res.json({ success: true, message: 'Intent updated successfully', intent: dbIntent });
    } catch (error) {
        console.error('Error updating intent:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/users/me/profile
// Sync with Postman: Update username, bio, and avatarURL
router.put('/me/profile', authenticateToken, async (req, res) => {
    const { username, bio, avatarURL } = req.body;
    const userId = req.userId;

    try {
        // 1. Update username if provided
        if (username) {
            await pool.query(`UPDATE "users" SET "username" = $1 WHERE "plasmaUserID" = $2`, [username, userId]);
        }

        // 2. Update bio and avatarURL in profiles table
        await pool.query(`
            UPDATE "profiles" 
            SET "bio" = COALESCE($1, "bio"),
                "avatarURL" = COALESCE($2, "avatarURL")
            WHERE "plasmaUserID" = $3
        `, [bio, avatarURL, userId]);

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/users/me -> GDPR Right to be forgotten
router.delete('/me', authenticateToken, async (req, res) => {
    try {
        // Cascade delete will handle relationships in the DB if configured correctly
        await pool.query(`DELETE FROM "users" WHERE "plasmaUserID" = $1`, [req.userId]);
        res.json({ success: true, message: 'Account queued for deletion.' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/users/:userId/follow
router.post('/:userId/follow', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const followerId = req.userId;

    if (userId === followerId) {
        return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    try {
        // Check if the target user exists
        const userCheck = await pool.query(`SELECT "plasmaUserID" FROM "users" WHERE "plasmaUserID" = $1`, [userId]);
        if (userCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        // Check if already following
        const existing = await pool.query(`SELECT "followID" FROM "follow_relationships" WHERE "followerID" = $1 AND "followedID" = $2`, [followerId, userId]);
        if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'Already following this user' });

        // Check if the other person is already following us
        const reverseFollow = await pool.query(`SELECT "followID" FROM "follow_relationships" WHERE "followerID" = $1 AND "followedID" = $2`, [userId, followerId]);
        const isMutual = reverseFollow.rows.length > 0;

        await pool.query(`
            INSERT INTO "follow_relationships" ("followerID", "followedID", "isMutual")
            VALUES ($1, $2, $3)
        `, [followerId, userId, isMutual]);

        if (isMutual) {
            // Update the reverse record as well
            await pool.query(`
                UPDATE "follow_relationships" SET "isMutual" = TRUE 
                WHERE "followerID" = $1 AND "followedID" = $2
            `, [userId, followerId]);
        }

        res.json({ success: true, message: 'Followed user successfully', isMutual });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/users/:userId/follow
router.delete('/:userId/follow', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const followerId = req.userId;

    try {
        const result = await pool.query(`
            DELETE FROM "follow_relationships" 
            WHERE "followerID" = $1 AND "followedID" = $2
            RETURNING "isMutual"
        `, [followerId, userId]);

        if (result.rows.length > 0 && result.rows[0].isMutual) {
            // Break mutual tie
            await pool.query(`
                UPDATE "follow_relationships" SET "isMutual" = FALSE
                WHERE "followerID" = $1 AND "followedID" = $2
            `, [userId, followerId]);
        }

        res.json({ success: true, message: 'Unfollowed successfully' });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

const { isOnline } = require('../ws/presence');

// GET /api/users/:userId/followers
router.get('/:userId/followers', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT u."plasmaUserID", u."username", p."avatarURL", fr."isMutual"
            FROM "follow_relationships" fr
            JOIN "users" u ON fr."followerID" = u."plasmaUserID"
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE fr."followedID" = $1
        `, [userId]);

        const data = result.rows.map(row => ({
            ...row,
            online: isOnline(row.plasmaUserID)
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/users/:userId/following
router.get('/:userId/following', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT u."plasmaUserID", u."username", p."avatarURL", fr."isMutual"
            FROM "follow_relationships" fr
            JOIN "users" u ON fr."followedID" = u."plasmaUserID"
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE fr."followerID" = $1
        `, [userId]);

        const data = result.rows.map(row => ({
            ...row,
            online: isOnline(row.plasmaUserID)
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
