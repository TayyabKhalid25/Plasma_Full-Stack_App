const express = require('express');
const { jwt, authenticateToken } = require('../middleware/authMiddleware');
const { pool } = require('../config/dbConfig');
const router = express.Router();

// ==========================================
// NEW AUTHENTICATION SYSTEM (UUID SCHEMA)
// ==========================================

// POST /api/auth/dev-login
// Development ONLY: Logs in or creates a user using just a username and steamID64.
// Since the new schema has no passwords, this bypasses Steam OpenID for testing.
router.post('/dev-login', async (req, res) => {
    const { username, steamID64 } = req.body;

    if (!username || !steamID64) {
        return res.status(400).json({ success: false, message: 'username and steamID64 are required' });
    }

    try {
        // 1. Check if user exists
        let result = await pool.query(`
            SELECT "plasmaUserID", "username", "intent"
            FROM "users"
            WHERE "steamID64" = $1
        `, [steamID64]);

        let user;

        if (result.rows.length > 0) {
            user = result.rows[0];
        } else {
            // 2. Create user if they don't exist
            const insertResult = await pool.query(`
                INSERT INTO "users" ("steamID64", "username", "intent")
                VALUES ($1, $2, 'OFFLINE')
                RETURNING "plasmaUserID", "username", "intent"
            `, [steamID64, username]);
            user = insertResult.rows[0];

            // 3. Create a blank profile for the new user
            await pool.query(`
                INSERT INTO "profiles" ("plasmaUserID", "bio", "avatarURL", "totalPlasmaXP")
                VALUES ($1, 'New to Plasma', '', 0)
            `, [user.plasmaUserID]);
        }

        // 4. Generate JWT with the UUID
        const payload = { userId: user.plasmaUserID }; // This MUST be the UUID
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60d' });

        res.json({
            success: true,
            message: 'Dev authentication successful',
            token,
            user
        });

    } catch (err) {
        console.error('Error during dev-login:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/auth/me
// Returns the currently authenticated user's profile (Required by frontend api.js)
router.get('/me', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        const result = await pool.query(`
            SELECT 
                u."plasmaUserID" AS id, 
                u."username" AS name, 
                u."intent",
                u."steamID64",
                p."avatarURL" AS avatar,
                p."bio",
                p."totalPlasmaXP"
            FROM "users" u
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE u."plasmaUserID" = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Error fetching current user:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Route to Verify JWT token validity
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Token is valid' });
});

module.exports = router;