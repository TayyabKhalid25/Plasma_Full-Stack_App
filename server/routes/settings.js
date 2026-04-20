const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Settings table doesn't exist in schema yet, returning mock configuration
// GET /api/settings
router.get('/', authenticateToken, async (req, res) => {
    res.json({
        success: true,
        data: {
            notificationsEnabled: true,
            privacy: 'Public'
        }
    });
});

// PUT /api/settings
router.put('/', authenticateToken, async (req, res) => {
    // Stub for updating settings
    res.json({
        success: true,
        message: 'Settings updated'
    });
});

module.exports = router;
