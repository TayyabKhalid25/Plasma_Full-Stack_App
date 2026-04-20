const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/users/me/profile
// Get full profile of the currently logged-in user
router.get('/me/profile', authenticateToken, async (req, res) => {
    const userId = req.userId;
    try {
        const result = await pool.query(`
            SELECT 
                u."plasmaUserID", u."username", u."email", u."intent",
                u."steamID64", u."createdAt",
                p."bio", p."avatarURL", p."totalPlasmaXP", p."globalRank"
            FROM "users" u
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE u."plasmaUserID" = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/users/me/intent
// Update the current user's intent (COMPETITIVE, CHILL, OFFLINE)
router.put('/me/intent', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { intent } = req.body;

    const validIntents = ['COMPETITIVE', 'CHILL', 'OFFLINE'];
    if (!intent || !validIntents.includes(intent)) {
        return res.status(400).json({ success: false, message: `Invalid intent. Must be one of: ${validIntents.join(', ')}` });
    }

    try {
        await pool.query(`
            UPDATE "users" SET "intent" = $1 WHERE "plasmaUserID" = $2
        `, [intent, userId]);

        res.json({ success: true, message: `Intent updated to ${intent}` });
    } catch (error) {
        console.error('Error updating intent:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/users/me/profile
// Update the current user's profile fields (username, bio, avatar)
router.put('/me/profile', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { username, bio, avatarURL } = req.body;

    try {
        if (username) {
            await pool.query(`UPDATE "users" SET "username" = $1 WHERE "plasmaUserID" = $2`, [username, userId]);
        }

        if (bio !== undefined || avatarURL !== undefined) {
            const fields = [];
            const values = [userId];
            let idx = 2;
            if (bio !== undefined) { fields.push(`"bio" = $${idx++}`); values.push(bio); }
            if (avatarURL !== undefined) { fields.push(`"avatarURL" = $${idx++}`); values.push(avatarURL); }

            if (fields.length > 0) {
                await pool.query(`UPDATE "profiles" SET ${fields.join(', ')} WHERE "plasmaUserID" = $1`, values);
            }
        }

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/users/search
// Search for users by username. Query: ?q=searchTerm
router.get('/search', async (req, res) => {
    const searchQuery = req.query.q || '';

    if (!searchQuery || searchQuery.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    try {
        const result = await pool.query(`
            SELECT 
                u."plasmaUserID", u."username", u."intent",
                p."avatarURL", p."totalPlasmaXP"
            FROM "users" u
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE u."username" ILIKE $1
            LIMIT 10
        `, [`%${searchQuery}%`]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/users/:userId
// Get a public profile by userId
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(`
            SELECT 
                u."plasmaUserID", u."username", u."intent",
                p."bio", p."avatarURL", p."totalPlasmaXP", p."globalRank"
            FROM "users" u
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE u."plasmaUserID" = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
