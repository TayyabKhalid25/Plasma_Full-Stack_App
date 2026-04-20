const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/rallies
// Query Params: ?view= (calendar, list)
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        const result = await pool.query(`
            SELECT 
                e."eventID", 
                e."title", 
                e."description", 
                e."scheduledStartUTC", 
                e."maxCapacity", 
                e."requiredIntent",
                u."username" AS "organizerName",
                u."plasmaUserID" AS "organizerID",
                (SELECT COUNT(*) FROM "rsvps" r WHERE r."eventID" = e."eventID" AND r."status" = 'CONFIRMED') AS "currentAttendees",
                (SELECT COUNT(*) > 0 FROM "rsvps" r WHERE r."eventID" = e."eventID" AND r."userID" = $1) AS "hasRsvpd"
            FROM "rally_events" e
            JOIN "users" u ON e."organizerID" = u."plasmaUserID"
            WHERE e."scheduledStartUTC" > CURRENT_TIMESTAMP
            ORDER BY e."scheduledStartUTC" ASC
        `, [userId]);

        res.json({ success: true, data: result.rows });

    } catch (error) {
        console.error('Error fetching rallies:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/rallies/upcoming
// Returns the next 2 upcoming rallies for the right-rail widget
router.get('/upcoming', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                e."eventID",
                e."title", 
                e."scheduledStartUTC",
                e."requiredIntent"
            FROM "rally_events" e
            WHERE e."scheduledStartUTC" > CURRENT_TIMESTAMP
            ORDER BY e."scheduledStartUTC" ASC
            LIMIT 2
        `);

        res.json({ success: true, data: result.rows });

    } catch (error) {
        console.error('Error fetching upcoming rallies:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/rallies
// Create a new rally event
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { title, description, scheduledStartUTC, maxCapacity, requiredIntent } = req.body;

    if (!title || !scheduledStartUTC || !maxCapacity) {
        return res.status(400).json({ success: false, message: 'title, scheduledStartUTC, and maxCapacity are required' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO "rally_events" ("organizerID", "title", "description", "scheduledStartUTC", "maxCapacity", "requiredIntent")
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [userId, title, description || null, scheduledStartUTC, maxCapacity, requiredIntent || 'CHILL']);

        res.status(201).json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Error creating rally:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/rallies/:eventId/rsvp
// RSVP to a rally
router.post('/:eventId/rsvp', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { eventId } = req.params;
    const { declaredRole } = req.body;

    try {
        // Check event exists and has capacity
        const eventResult = await pool.query(`
            SELECT e."eventID", e."maxCapacity",
                   (SELECT COUNT(*) FROM "rsvps" r WHERE r."eventID" = e."eventID" AND r."status" = 'CONFIRMED') AS "currentCount"
            FROM "rally_events" e WHERE e."eventID" = $1
        `, [eventId]);

        if (eventResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Rally not found' });
        }

        const event = eventResult.rows[0];
        if (parseInt(event.currentCount) >= event.maxCapacity) {
            return res.status(400).json({ success: false, message: 'Rally is full' });
        }

        // Upsert RSVP
        const result = await pool.query(`
            INSERT INTO "rsvps" ("eventID", "userID", "declaredRole", "status")
            VALUES ($1, $2, $3, 'CONFIRMED')
            ON CONFLICT ("eventID", "userID") DO UPDATE SET "status" = 'CONFIRMED', "declaredRole" = $3
            RETURNING *
        `, [eventId, userId, declaredRole || null]);

        res.status(201).json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Error RSVPing to rally:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/rallies/:eventId/rsvp
// Cancel an RSVP
router.delete('/:eventId/rsvp', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { eventId } = req.params;

    try {
        const result = await pool.query(`
            UPDATE "rsvps" SET "status" = 'DECLINED'
            WHERE "eventID" = $1 AND "userID" = $2
            RETURNING *
        `, [eventId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'RSVP not found' });
        }

        res.json({ success: true, message: 'RSVP cancelled' });

    } catch (error) {
        console.error('Error cancelling RSVP:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
