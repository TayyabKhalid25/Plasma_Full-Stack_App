const express = require('express');
const bcrypt = require('bcrypt');
const { jwt, authenticateToken } = require('../middleware/authMiddleware');
const { pool } = require('../config/dbConfig');
const router = express.Router();

// ==========================================
// NEW AUTHENTICATION SYSTEM (TRADITIONAL & UUID SCHEMA)
// ==========================================

// POST /api/auth/register
// Traditional Registration (Email, Username, Password, DOB)
router.post('/register', async (req, res) => {
    const { username, email, password, dateOfBirth } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
    }

    try {
        // 1. Check if user already exists (by email or username)
        const checkResult = await pool.query(
            `SELECT "plasmaUserID" FROM "users" WHERE "email" = $1 OR "username" = $2`,
            [email, username]
        );

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Email or Username already in use' });
        }

        // 2. Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Insert new user
        const insertResult = await pool.query(`
            INSERT INTO "users" ("username", "email", "passwordHash", "dateOfBirth", "intent")
            VALUES ($1, $2, $3, $4, 'OFFLINE')
            RETURNING "plasmaUserID", "username", "email"
        `, [username, email, passwordHash, dateOfBirth || null]);

        const user = insertResult.rows[0];

        // 4. Create blank profile
        await pool.query(`
            INSERT INTO "profiles" ("plasmaUserID", "bio", "avatarURL", "totalPlasmaXP")
            VALUES ($1, 'New to Plasma', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || $2, 0)
        `, [user.plasmaUserID, username]);

        // 5. Generate JWT
        const payload = { userId: user.plasmaUserID };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60d' });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/auth/login
// Traditional Login (Username/Email and Password)
router.post('/login', async (req, res) => {
    const { username, email, password } = req.body;
    const identifier = email || username;

    if (!identifier || !password) {
        return res.status(400).json({ success: false, message: 'Email/Username and password are required' });
    }

    try {
        // 1. Find user by email or username
        const result = await pool.query(`
            SELECT "plasmaUserID", "username", "email", "passwordHash", "intent"
            FROM "users"
            WHERE "email" = $1 OR "username" = $1
        `, [identifier]);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // 2. Verify password
        if (!user.passwordHash) {
             return res.status(401).json({ success: false, message: 'Account requires Steam login' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 3. Generate JWT
        const payload = { userId: user.plasmaUserID };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60d' });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user.plasmaUserID, username: user.username, email: user.email, intent: user.intent }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/auth/dev-login
// Development ONLY: Logs in or creates a user using just a username and steamID64.
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

// GET /api/auth/steam
// Redirects the browser to Valve's OpenID 2.0 endpoint
router.get('/steam', (req, res) => {
    // Stub for passport-steam integration
    // res.redirect('https://steamcommunity.com/openid/login?...');
    res.status(501).json({ success: false, message: 'Steam OpenID redirect unimplemented. Use /dev-login for now.' });
});

// GET /api/auth/steam/callback
// Valve redirects here after login to validate assertion, issue JWT
router.get('/steam/callback', (req, res) => {
    res.status(501).json({ success: false, message: 'Steam OpenID callback unimplemented.' });
});

// POST /api/auth/logout
// Clears session (client-side clears token, server could blacklist)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Logged out successfully. Please discard your token.' });
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