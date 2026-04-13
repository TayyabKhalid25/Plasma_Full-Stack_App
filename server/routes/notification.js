const express = require('express');
const { authenticateToken, jwt } = require('../middleware/authMiddleware');
const { pool } = require('../config/dbConfig');
const router = express.Router();

// Get all notifications of current user
router.get('/user', authenticateToken, async (req, res) => {
    const userId = req.userId;
    try {
        const result = await pool.query(`
            SELECT
                n.notificationid AS "NotificationID",
                n.senderid AS "SenderID",
                u.username AS "Username",
                n.receiverid AS "ReceiverID",
                n.message AS "Message",
                n.notificationtype AS "NotificationType",
                n.sentat AS "SentAt"
            FROM notifications n
            JOIN users u ON n.senderid = u.userid
            WHERE n.receiverid = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).send({ success: false, message: 'No requests found for this user' });
        }
        res.send({ success: true, requests: result.rows });
    } catch (error) {
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
});

// Accept a notification by notificationId
router.post('/accept/:notiID', authenticateToken, async (req, res) => {
    const notificationId = parseInt(req.params.notiID, 10);

    if (isNaN(notificationId)) {
        return res.status(400).send({ success: false, message: 'Invalid notification ID' });
    }

    try {
        const result = await pool.query(`
            SELECT
                n.notificationid AS "NotificationID",
                n.senderid AS "SenderID",
                u.username AS "SenderName",
                n.receiverid AS "ReceiverID",
                u1.username AS "ReceiverName",
                n.message AS "Message",
                n.notificationtype AS "NotificationType",
                n.sentat AS "SentAt"
            FROM notifications n
            JOIN users u  ON n.senderid = u.userid
            JOIN users u1 ON n.receiverid = u1.userid
            WHERE n.notificationid = $1
        `, [notificationId]);

        if (result.rows.length === 0) {
            return res.status(404).send({ success: false, message: 'Notification not found' });
        }
        const notification = result.rows[0];

        if (notification.NotificationType === 'General') {
            return res.status(400).send({ success: false, message: 'Cannot accept a general notification' });
        }
        if (notification.ReceiverID !== req.userId) {
            return res.status(403).send({ success: false, message: 'You are not authorized to accept this notification' });
        }

        // Delete the notification
        await pool.query(`DELETE FROM notifications WHERE notificationid = $1`, [notification.NotificationID]);

        let messageSender;

        if (notification.NotificationType === 'FriendReq') {
            const [u1, u2] = notification.ReceiverID < notification.SenderID
                ? [notification.ReceiverID, notification.SenderID]
                : [notification.SenderID, notification.ReceiverID];

            await pool.query(`INSERT INTO friends (user1id, user2id) VALUES ($1, $2)`, [u1, u2]);
            messageSender = `User ${notification.ReceiverName} accepted your friend request!`;
            console.log(`Accepted friend request from user ${notification.SenderName}`);
        } else {
            // Delete any pending role requests for this sender
            await pool.query(`
                DELETE FROM notifications
                WHERE notificationtype IN ('AdminReq', 'CriticReq') AND senderid = $1
            `, [notification.SenderID]);

            let adminMessage;

            if (notification.NotificationType === 'AdminReq') {
                await pool.query(`UPDATE users SET usertype = 'Admin' WHERE userid = $1`, [notification.SenderID]);
                messageSender = `You have been promoted to Admin by user ${notification.ReceiverName}`;
                adminMessage = `User ${notification.SenderName} has been promoted to Admin!`;
            } else if (notification.NotificationType === 'CriticReq') {
                await pool.query(`UPDATE users SET usertype = 'Critic' WHERE userid = $1`, [notification.SenderID]);
                messageSender = `You have been promoted to Critic by user ${notification.ReceiverName}`;
                adminMessage = `User ${notification.SenderName} has been promoted to Critic!`;
            }

            // Notify all other admins
            const adminsResult = await pool.query(`
                SELECT userid AS "UserID"
                FROM users
                WHERE usertype = 'Admin' AND userid NOT IN ($1, $2)
            `, [notification.ReceiverID, notification.SenderID]);

            for (const admin of adminsResult.rows) {
                await pool.query(`
                    INSERT INTO notifications (senderid, receiverid, notificationtype, message)
                    VALUES ($1, $2, 'General', $3)
                `, [notification.ReceiverID, admin.UserID, adminMessage]);
            }

            console.log(`Accepted adminreq/criticreq from user ${notification.SenderName}`);
        }

        // Notify the original sender of the notification
        await pool.query(`
            INSERT INTO notifications (senderid, receiverid, notificationtype, message)
            VALUES ($1, $2, 'General', $3)
        `, [notification.ReceiverID, notification.SenderID, messageSender]);

        res.send({ success: true, message: 'Accepted notification', notification });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
});

// Reject a notification by notificationId
router.post('/reject/:notiID', authenticateToken, async (req, res) => {
    const notificationId = parseInt(req.params.notiID, 10);

    if (isNaN(notificationId)) {
        return res.status(400).send({ success: false, message: 'Invalid notification ID' });
    }

    try {
        const result = await pool.query(`
            SELECT
                n.notificationid AS "NotificationID",
                n.senderid AS "SenderID",
                u.username AS "SenderName",
                n.receiverid AS "ReceiverID",
                u1.username AS "ReceiverName",
                n.message AS "Message",
                n.notificationtype AS "NotificationType",
                n.sentat AS "SentAt"
            FROM notifications n
            JOIN users u  ON n.senderid = u.userid
            JOIN users u1 ON n.receiverid = u1.userid
            WHERE n.notificationid = $1
        `, [notificationId]);

        if (result.rows.length === 0) {
            return res.status(404).send({ success: false, message: 'Notification not found' });
        }
        const notification = result.rows[0];

        if (notification.NotificationType === 'General') {
            return res.status(400).send({ success: false, message: 'Cannot reject a general notification' });
        }
        if (notification.ReceiverID !== req.userId) {
            return res.status(403).send({ success: false, message: 'You are not authorized to reject this notification' });
        }

        await pool.query(`DELETE FROM notifications WHERE notificationid = $1`, [notification.NotificationID]);

        let messageSender;

        if (notification.NotificationType === 'FriendReq') {
            messageSender = `User ${notification.ReceiverName} rejected your friend request!`;
            console.log(`Rejected friend request from user ${notification.SenderName}`);
        } else {
            await pool.query(`
                DELETE FROM notifications
                WHERE notificationtype IN ('AdminReq', 'CriticReq') AND senderid = $1
            `, [notification.SenderID]);

            let adminMessage;

            if (notification.NotificationType === 'AdminReq') {
                messageSender = `You have been rejected the status of Admin by user ${notification.ReceiverName}`;
                adminMessage = `User ${notification.SenderName} has been rejected the status of Admin!`;
            } else if (notification.NotificationType === 'CriticReq') {
                messageSender = `You have been rejected the status of Critic by user ${notification.ReceiverName}`;
                adminMessage = `User ${notification.SenderName} has been rejected the status of Critic!`;
            }

            // Notify all other admins
            const adminsResult = await pool.query(`
                SELECT userid AS "UserID" FROM users WHERE usertype = 'Admin' AND userid != $1
            `, [notification.ReceiverID]);

            for (const admin of adminsResult.rows) {
                await pool.query(`
                    INSERT INTO notifications (senderid, receiverid, notificationtype, message)
                    VALUES ($1, $2, 'General', $3)
                `, [notification.ReceiverID, admin.UserID, adminMessage]);
            }

            console.log(`Rejected adminreq/criticreq from user ${notification.SenderName}`);
        }

        await pool.query(`
            INSERT INTO notifications (senderid, receiverid, notificationtype, message)
            VALUES ($1, $2, 'General', $3)
        `, [notification.ReceiverID, notification.SenderID, messageSender]);

        res.send({ success: true, message: 'Rejected notification', notification });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
});

// Close a notification by notificationId
router.delete('/close/:notiID', authenticateToken, async (req, res) => {
    const notificationId = parseInt(req.params.notiID, 10);

    if (isNaN(notificationId)) {
        return res.status(400).send({ success: false, message: 'Invalid notification ID' });
    }

    try {
        const result = await pool.query(`
            SELECT notificationid AS "NotificationID", receiverid AS "ReceiverID"
            FROM notifications WHERE notificationid = $1
        `, [notificationId]);

        if (result.rows.length === 0) {
            return res.status(404).send({ success: false, message: 'Notification not found' });
        }
        if (result.rows[0].ReceiverID !== req.userId) {
            return res.status(403).send({ success: false, message: 'You are not authorized to close this notification' });
        }

        await pool.query(`DELETE FROM notifications WHERE notificationid = $1`, [notificationId]);

        console.log(`Closed notification with ID: ${notificationId}`);
        res.send({ success: true, message: `Closed notification with ID: ${notificationId}` });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;