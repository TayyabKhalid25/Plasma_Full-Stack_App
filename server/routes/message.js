const express = require('express');
const { authenticateToken, jwt } = require('../middleware/authMiddleware');
const { pool } = require('../config/dbConfig');
const router = express.Router();

// Send a message from senderId to receiverId
router.post('', authenticateToken, async (req, res) => {
    const { receiverId, message } = req.body;
    const senderId = req.userId;

    if (!senderId || !receiverId || !message) {
        return res.status(400).send({ success: false, message: 'Missing required fields: senderId, receiverId, or message' });
    }

    try {
        const check = await pool.query(`SELECT userid FROM users WHERE userid = $1`, [receiverId]);
        if (check.rows.length === 0) {
            return res.status(404).send({ success: false, message: 'User does not exist' });
        }
    } catch (error) {
        console.error('Error checking user existence:', error);
        return res.status(500).send({ success: false, message: 'Internal server error' });
    }

    try {
        await pool.query(`
            INSERT INTO notifications (senderid, receiverid, message, notificationtype)
            VALUES ($1, $2, $3, 'General')
        `, [senderId, receiverId, message]);

        res.send({ success: true, message: `Message sent from user ${senderId} to user ${receiverId}` });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;