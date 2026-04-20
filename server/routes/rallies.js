const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/rallies
// Query Params: ?view= (calendar, list)
router.get('/', authenticateToken, async (req, res) => {
    // Currently fetches all upcoming rallies
    // In the future, this can be scoped to just the user's friends/network
    
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
                u."plasmaUserID" AS "organizerID"
            FROM "rally_events" e
            JOIN "users" u ON e."organizerID" = u."plasmaUserID"
            WHERE e."scheduledStartUTC" > CURRENT_TIMESTAMP
            ORDER BY e."scheduledStartUTC" ASC
        `);

        // Get RSVPs for these events
        const rsvpsResult = await pool.query(`
            SELECT "eventID", "userID", "declaredRole", "status"
            FROM "rsvps"
            WHERE "status" = 'CONFIRMED'
        `);

        // Group RSVPs by event
        const events = result.rows.map(event => {
            const eventRsvps = rsvpsResult.rows.filter(r => r.eventID === event.eventID);
            return {
                ...event,
                currentAttendees: eventRsvps.length,
                rsvps: eventRsvps
            };
        });

        res.json({
            success: true,
            data: events
        });

    } catch (error) {
        console.error('Error fetching rallies:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
