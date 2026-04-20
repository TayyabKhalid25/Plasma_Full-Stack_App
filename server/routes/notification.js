const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/notifications
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const filter = req.query.filter || 'all';

    try {
        const friendReqResult = await pool.query(`
            SELECT 
                fr."followID" AS id,
                'friend_request' AS type,
                u."username" AS "senderName",
                u."plasmaUserID" AS "fromUserId",
                pr."avatarURL" AS avatar,
                fr."followedAt" AS time,
                FALSE AS read
            FROM "follow_relationships" fr
            JOIN "users" u ON fr."followerID" = u."plasmaUserID"
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
            WHERE fr."followedID" = $1 AND fr."isMutual" = FALSE
        `, [userId]);

        const rallyResult = await pool.query(`
            SELECT 
                r."rsvpID" AS id,
                'rally' AS type,
                e."title" AS "eventTitle",
                e."eventID" AS "eventId",
                e."scheduledStartUTC" AS time,
                NULL AS avatar,
                FALSE AS read
            FROM "rsvps" r
            JOIN "rally_events" e ON r."eventID" = e."eventID"
            WHERE r."userID" = $1 
              AND r."status" = 'CONFIRMED'
              AND e."scheduledStartUTC" BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
        `, [userId]);

        const achievementResult = await pool.query(`
            SELECT 
                ua."claimID" AS id,
                'achievement' AS type,
                a."title" AS "achievementTitle",
                NULL AS avatar,
                ua."unlockedAt" AS time,
                FALSE AS read
            FROM "user_achievements" ua
            JOIN "achievements" a ON ua."achievementID" = a."achievementID"
            WHERE ua."userID" = $1
            ORDER BY ua."unlockedAt" DESC
            LIMIT 5
        `, [userId]);

        let notifications = [
            ...friendReqResult.rows.map(r => ({ ...r, title: `${r.senderName} sent you a friend request` })),
            ...rallyResult.rows.map(r => ({ ...r, title: `${r.eventTitle} starts soon!` })),
            ...achievementResult.rows.map(r => ({ ...r, title: `You unlocked: ${r.achievementTitle}` }))
        ];

        if (filter !== 'all') {
            notifications = notifications.filter(n => n.type === filter);
        }

        notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json({ success: true, data: notifications });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;