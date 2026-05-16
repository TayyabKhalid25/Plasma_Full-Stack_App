const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/settings
 * Fetches the user's application settings. Returns defaults if not explicitly set.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, data: { notificationsEnabled: boolean, timezone: string, privacy: string } }}
 * @throws {500} Internal server error on DB failure
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT "notificationsEnabled", "timezone", "privacy"
            FROM "user_settings"
            WHERE "plasmaUserID" = $1
        `, [req.userId]);
        
        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: { notificationsEnabled: true, timezone: 'UTC', privacy: 'Public' } // Defaults
            });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * PUT /api/settings
 * Updates the user's application settings using an upsert operation.
 *
 * @requires authenticateToken
 * @param {boolean} req.body.notificationsEnabled - Toggle for push/email notifications
 * @param {string} [req.body.timezone] - User's preferred timezone (default 'UTC')
 * @param {string} [req.body.privacy] - Profile privacy level (default 'Public')
 * @returns {{ success: boolean, message: string, data: Object }}
 * @throws {500} Internal server error on DB failure
 */
router.put('/', authenticateToken, async (req, res) => {
    const { notificationsEnabled, timezone, privacy } = req.body;
    
    try {
        // Upsert settings
        const result = await pool.query(`
            INSERT INTO "user_settings" ("plasmaUserID", "notificationsEnabled", "timezone", "privacy")
            VALUES ($1, $2, COALESCE($3, 'UTC'), COALESCE($4, 'Public'))
            ON CONFLICT ("plasmaUserID") DO UPDATE SET
                "notificationsEnabled" = EXCLUDED."notificationsEnabled",
                "timezone" = EXCLUDED."timezone",
                "privacy" = EXCLUDED."privacy",
                "updatedAt" = CURRENT_TIMESTAMP
            RETURNING "notificationsEnabled", "timezone", "privacy"
        `, [req.userId, notificationsEnabled, timezone, privacy]);
        
        res.json({ success: true, message: 'Settings updated', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
