const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const { jwt, authenticateToken } = require('../middleware/authMiddleware');
const { pool } = require('../config/dbConfig');
const { syncSteamLibrary, syncSteamAchievements } = require('../utils/steamSyncService');
const { enqueueJob } = require('../utils/jobQueue');

const router = express.Router();

// Passport serialization
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Configure Steam Strategy
passport.use(new SteamStrategy({
    returnURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/steam/callback`,
    realm: `${process.env.BACKEND_URL || 'http://localhost:5000'}/`,
    apiKey: process.env.STEAM_API_KEY || 'MISSING'
}, (identifier, profile, done) => {
    process.nextTick(() => {
        profile.identifier = identifier;
        return done(null, profile);
    });
}));

// ==========================================
// NEW AUTHENTICATION SYSTEM (TRADITIONAL & UUID SCHEMA)
// ==========================================

/**
 * POST /api/auth/register
 * Traditional Registration requiring a pre-validated Steam Token.
 * Creates user and profile, then initiates background Steam syncs.
 *
 * @param {string} req.body.username - Desired username
 * @param {string} req.body.email - Valid email address
 * @param {string} req.body.password - Raw password
 * @param {string} [req.body.dateOfBirth] - User DOB
 * @param {string} req.body.steamToken - JWT linking token from Steam Auth
 * @returns {{ success: boolean, message: string, token: string, user: Object }}
 * @throws {400} Missing fields
 * @throws {401} Invalid or expired Steam linking session
 * @throws {409} Email or Username already in use
 * @throws {500} Internal server error
 */
router.post('/register', async (req, res) => {
    const { username, email, password, dateOfBirth, steamToken } = req.body;

    if (!username || !email || !password || !steamToken) {
        return res.status(400).json({ success: false, message: 'Username, email, password, and Steam linking are required' });
    }

    let steamID64;
    let steamAvatarURL = '';
    try {
        const decoded = jwt.verify(steamToken, process.env.JWT_SECRET);
        if (!decoded.isRegistration) {
            throw new Error('Token is not for registration');
        }
        steamID64 = decoded.steamID64;
        steamAvatarURL = decoded.avatarURL || '';
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired Steam linking session' });
    }

    try {
        // 1. Check if user already exists
        const checkResult = await pool.query(
            'SELECT "plasmaUserID" FROM "users" WHERE "email" = $1 OR "username" = $2',
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
            INSERT INTO "users" ("steamID64", "username", "email", "passwordHash", "dateOfBirth", "intent")
            VALUES ($1, $2, $3, $4, $5, 'OFFLINE')
            RETURNING "plasmaUserID", "username", "email"
        `, [steamID64, username, email, passwordHash, dateOfBirth || null]);

        const user = insertResult.rows[0];

        // 4. Create profile
        await pool.query(`
            INSERT INTO "profiles" ("plasmaUserID", "bio", "avatarURL", "totalPlasmaXP")
            VALUES ($1, 'New to Plasma', $2, 0)
        `, [user.plasmaUserID, steamAvatarURL]);

        // 5. Generate JWT
        const payload = { userId: user.plasmaUserID };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60d' });

        // 6. Trigger background Steam sync
        await enqueueJob('STEAM_LIBRARY_SYNC', { userId: user.plasmaUserID });
        await enqueueJob('STEAM_ACHIEVEMENT_SYNC', { userId: user.plasmaUserID });

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: { ...user, isSteamLinked: true }
        });
    } catch (err) {
        console.error('[Auth] Registration error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST /api/auth/login
 * Traditional Login using Username or Email and Password.
 * Generates JWT and triggers background sync.
 *
 * @param {string} req.body.username - Username (optional if email provided)
 * @param {string} req.body.email - Email (optional if username provided)
 * @param {string} req.body.password - Raw password
 * @returns {{ success: boolean, message: string, token: string, user: Object }}
 * @throws {400} Email/Username and password required
 * @throws {401} Incorrect password or Steam-only account
 * @throws {404} Account not found
 * @throws {500} Internal server error
 */
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

        // 4. Trigger background sync
        await enqueueJob('STEAM_LIBRARY_SYNC', { userId: user.plasmaUserID });
        await enqueueJob('STEAM_ACHIEVEMENT_SYNC', { userId: user.plasmaUserID });

        return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: { 
                id: user.plasmaUserID, 
                username: user.username, 
                email: user.email, 
                intent: user.intent, 
                isSteamLinked: true 
            }
        });

    } catch (err) {
        console.error('[Auth] Login error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/*
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

        // 4. Generate JWT
        const payload = { userId: user.plasmaUserID };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60d' });

        // 5. Trigger background sync
        await enqueueJob('STEAM_LIBRARY_SYNC', { userId: user.plasmaUserID });
        await enqueueJob('STEAM_ACHIEVEMENT_SYNC', { userId: user.plasmaUserID });

        return res.json({
            success: true,
            message: 'Dev authentication successful',
            token,
            user: { ...user, isSteamLinked: true }
        });

    } catch (err) {
        console.error('[Auth] Dev-login error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
*/

/**
 * GET /api/auth/steam
 * Redirects the browser to Valve's OpenID 2.0 endpoint for Steam Login/Link.
 *
 * @returns {void} Redirects browser
 * @throws {503} Missing or invalid STEAM_API_KEY
 */
router.get('/steam', (req, res, next) => {
    if (!process.env.STEAM_API_KEY || process.env.STEAM_API_KEY === 'YOUR_STEAM_API_KEY_HERE' || process.env.STEAM_API_KEY === 'MISSING') {
        return res.status(503).json({ 
            success: false, 
            message: 'Steam login failed: STEAM_API_KEY is missing or invalid.' 
        });
    }
    next();
}, passport.authenticate('steam', { failureRedirect: '/' }));

/**
 * GET /api/auth/steam/callback
 * Valve redirects here after OpenID login. Issues JWT if existing user,
 * or redirect token for registration if new user.
 *
 * @returns {void} Redirects to frontend with token or error
 * @throws {503} Missing or invalid STEAM_API_KEY
 */
router.get('/steam/callback', (req, res, next) => {
    if (!process.env.STEAM_API_KEY || process.env.STEAM_API_KEY === 'YOUR_STEAM_API_KEY_HERE' || process.env.STEAM_API_KEY === 'MISSING') {
        return res.status(503).json({ 
            success: false, 
            message: 'Steam login callback failed: STEAM_API_KEY is missing or invalid.' 
        });
    }
    next();
}, passport.authenticate('steam', { failureRedirect: '/' }), async (req, res) => {
    try {
        const steamID64 = req.user._json.steamid;
        const avatarURL = req.user._json.avatarfull;

        // Check if user exists
        const result = await pool.query('SELECT "plasmaUserID" FROM "users" WHERE "steamID64" = $1', [steamID64]);
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        if (result.rows.length > 0) {
            // Already registered, automatically log them in
            const userId = result.rows[0].plasmaUserID;
            const payload = { userId };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60d' });
            
            // Trigger background sync for returning user
            await enqueueJob('STEAM_LIBRARY_SYNC', { userId });
            await enqueueJob('STEAM_ACHIEVEMENT_SYNC', { userId });

            // Redirect to frontend dashboard or login success page with token
            return res.redirect(`${frontendUrl}/login?token=${token}`);
        } else {
            // New user, needs full registration
            const tempToken = jwt.sign({ steamID64, avatarURL, isRegistration: true }, process.env.JWT_SECRET, { expiresIn: '15m' });
            return res.redirect(`${frontendUrl}/sign-up?steamToken=${tempToken}`);
        }
    } catch (err) {
        console.error('[Auth] Steam Auth Error:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
});

/**
 * POST /api/auth/logout
 * Logs out the user. Primarily handled client-side by discarding JWT.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, message: string }}
 */
router.post('/logout', authenticateToken, (req, res) => {
    return res.json({ success: true, message: 'Logged out successfully. Please discard your token.' });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile and account settings.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, data: UserProfile }}
 * @throws {404} User not found
 * @throws {500} Internal server error
 */
router.get('/me', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        const result = await pool.query(`
            SELECT 
                u."plasmaUserID", 
                u."plasmaUserID" AS id, 
                u."username" AS username,
                u."username" AS name, 
                u."email",
                u."intent",
                u."steamID64" IS NOT NULL AS "isSteamLinked",
                p."avatarURL" AS avatar,
                p."bio",
                p."totalPlasmaXP",
                p."steamPersonaName",
                p."steamProfileURL",
                p."lastLogoff",
                p."steamMemberSince",
                p."countryCode"
            FROM "users" u
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE u."plasmaUserID" = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error('[Auth] Error fetching current user:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/auth/verify
 * Verifies JWT token validity.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, message: string }}
 */
router.get('/verify', authenticateToken, (req, res) => {
    return res.json({ success: true, message: 'Token is valid' });
});

/**
 * PUT /api/auth/change-password
 * Changes the user's password given their current password.
 *
 * @requires authenticateToken
 * @param {string} req.body.currentPassword - Current valid password
 * @param {string} req.body.newPassword - New desired password
 * @returns {{ success: boolean, message: string }}
 * @throws {400} Current and new passwords are required, or Steam-only account
 * @throws {401} Current password incorrect
 * @throws {404} User not found
 * @throws {500} Internal server error
 */
router.put('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    try {
        // 1. Fetch current user's password hash
        const result = await pool.query('SELECT "passwordHash" FROM "users" WHERE "plasmaUserID" = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = result.rows[0];

        // 2. Check if the user even has a password
        if (!user.passwordHash) {
            return res.status(400).json({ 
                success: false, 
                message: 'This account does not have a password set (Steam-only).' 
            });
        }

        // 3. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // 4. Hash new password and update
        const saltRounds = 10;
        const newHash = await bcrypt.hash(newPassword, saltRounds);

        await pool.query('UPDATE "users" SET "passwordHash" = $1 WHERE "plasmaUserID" = $2', [newHash, userId]);

        return res.json({ success: true, message: 'Password updated successfully' });

    } catch (err) {
        console.error('[Auth] Error changing password:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;