const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                n."notificationID", n."notificationType", n."message", n."isRead", n."sentAt",
                u."plasmaUserID" AS "senderID", u."username" AS "senderName", 
                p."avatarURL" AS "senderAvatar"
            FROM "notifications" n
            LEFT JOIN "users" u ON n."senderID" = u."plasmaUserID"
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE n."receiverID" = $1
            ORDER BY n."sentAt" DESC
            LIMIT 50
        `, [req.userId]);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/notifications/:notificationId/read
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
    const { notificationId } = req.params;
    
    try {
        const result = await pool.query(`
            UPDATE "notifications"
            SET "isRead" = TRUE
            WHERE "notificationID" = $1 AND "receiverID" = $2
            RETURNING "notificationID"
        `, [notificationId, req.userId]);
        
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Notification not found' });
        
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
    try {
        await pool.query(`
            UPDATE "notifications"
            SET "isRead" = TRUE
            WHERE "receiverID" = $1 AND "isRead" = FALSE
        `, [req.userId]);
        
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/notifications/subscribe
// Register a Push API Subscription token (Service Worker)
router.post('/subscribe', authenticateToken, async (req, res) => {
    const { endpoint, keys } = req.body;
    
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return res.status(400).json({ success: false, message: 'Invalid subscription object' });
    }
    
    try {
        await pool.query(`
            INSERT INTO "push_subscriptions" ("userID", "endpoint", "p256dh", "auth")
            VALUES ($1, $2, $3, $4)
            ON CONFLICT ("userID", "endpoint") DO UPDATE SET
                "p256dh" = EXCLUDED."p256dh",
                "auth" = EXCLUDED."auth",
                "createdAt" = CURRENT_TIMESTAMP
        `, [req.userId, endpoint, keys.p256dh, keys.auth]);
        
        res.json({ success: true, message: 'Push subscription registered successfully' });
    } catch (error) {
        console.error('Error registering push subscription:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/notifications/subscribe
// Unregister a Push API token
router.delete('/subscribe', authenticateToken, async (req, res) => {
    const { endpoint } = req.body;
    
    if (!endpoint) return res.status(400).json({ success: false, message: 'Endpoint is required' });
    
    try {
        await pool.query(`
            DELETE FROM "push_subscriptions"
            WHERE "userID" = $1 AND "endpoint" = $2
        `, [req.userId, endpoint]);
        
        res.json({ success: true, message: 'Push subscription removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;