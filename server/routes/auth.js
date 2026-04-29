const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const { jwt, authenticateToken } = require('../middleware/authMiddleware');
const { pool } = require('../config/dbConfig');
const router = express.Router();

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new SteamStrategy({
    returnURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/steam/callback`,
    realm: `${process.env.BACKEND_URL || 'http://localhost:5000'}/`,
    apiKey: process.env.STEAM_API_KEY || 'STUB'
  },
  function(identifier, profile, done) {
    process.nextTick(function () {
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));

// ==========================================
// NEW AUTHENTICATION SYSTEM (TRADITIONAL & UUID SCHEMA)
// ==========================================

// POST /api/auth/register
// Traditional Registration (requires pre-validated Steam Token)
router.post('/register', async (req, res) => {
    const { username, email, password, dateOfBirth, steamToken } = req.body;

    if (!username || !email || !password || !steamToken) {
        return res.status(400).json({ success: false, message: 'Username, email, password, and Steam linking are required' });
    }

    let steamID64;
    try {
        const decoded = jwt.verify(steamToken, process.env.JWT_SECRET);
        if (!decoded.isRegistration) throw new Error('Invalid token');
        steamID64 = decoded.steamID64;
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired Steam linking session' });
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

        // 3. Insert new user with SteamID linked
        const insertResult = await pool.query(`
            INSERT INTO "users" ("steamID64", "username", "email", "passwordHash", "dateOfBirth", "intent")
            VALUES ($1, $2, $3, $4, $5, 'OFFLINE')
            RETURNING "plasmaUserID", "username", "email"
        `, [steamID64, username, email, passwordHash, dateOfBirth || null]);

        const user = insertResult.rows[0];

        // 4. Create blank profile using Steam avatar if possible, or placeholder
        await pool.query(`
            INSERT INTO "profiles" ("plasmaUserID", "bio", "avatarURL", "totalPlasmaXP")
            VALUES ($1, 'New to Plasma', '', 0)
        `, [user.plasmaUserID]);

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
            return res.status(404).json({ success: false, message: 'Account not found. Please check your username or email.' });
        }

        const user = result.rows[0];

        // 2. Verify password
        if (!user.passwordHash) {
             return res.status(401).json({ success: false, message: 'This account requires Steam login. Please login via Steam.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
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
router.get('/steam', passport.authenticate('steam', { failureRedirect: '/' }));

// GET /api/auth/steam/callback
// Valve redirects here after login to validate assertion, issue JWT
router.get('/steam/callback', passport.authenticate('steam', { failureRedirect: '/' }), async (req, res) => {
    try {
        const steamID64 = req.user._json.steamid;
        const avatarURL = req.user._json.avatarfull;

        // Check if user exists
        const result = await pool.query('SELECT "plasmaUserID" FROM "users" WHERE "steamID64" = $1', [steamID64]);
        
        if (result.rows.length > 0) {
            // Already registered, automatically log them in
            const payload = { userId: result.rows[0].plasmaUserID };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60d' });
            
            // Redirect to frontend dashboard or login success page with token
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?token=${token}`);
        } else {
            // New user, needs full registration
            const tempToken = jwt.sign({ steamID64, avatarURL, isRegistration: true }, process.env.JWT_SECRET, { expiresIn: '15m' });
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/sign-up?steamToken=${tempToken}`);
        }
    } catch (err) {
        console.error('Steam Auth Error:', err);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
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