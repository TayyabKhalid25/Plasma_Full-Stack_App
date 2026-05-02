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
                e."gameID",
                e."roles",
                g."title" AS "gameTitle",
                g."coverArtURL",
                u."username" AS "organizerName",
                u."plasmaUserID" AS "organizerID",
                (SELECT COUNT(*) FROM "rsvps" r WHERE r."eventID" = e."eventID" AND r."status" = 'CONFIRMED') AS "currentAttendees",
                (SELECT JSONB_OBJECT_AGG(COALESCE(r."declaredRole", 'Open Slots'), count_role) 
                 FROM (SELECT "declaredRole", COUNT(*) as count_role FROM "rsvps" WHERE "eventID" = e."eventID" AND "status" = 'CONFIRMED' GROUP BY "declaredRole") r
                ) AS "roleCounts",
                (SELECT COUNT(*) > 0 FROM "rsvps" r WHERE r."eventID" = e."eventID" AND r."userID" = $1) AS "hasRsvpd"
            FROM "rally_events" e
            JOIN "users" u ON e."organizerID" = u."plasmaUserID"
            LEFT JOIN "games" g ON e."gameID" = g."appID"
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
            LEFT JOIN "rsvps" r ON e."eventID" = r."eventID" AND r."userID" = $1
            WHERE e."scheduledStartUTC" > CURRENT_TIMESTAMP
              AND (e."organizerID" = $1 OR r."status" = 'CONFIRMED')
            ORDER BY e."scheduledStartUTC" ASC
            LIMIT 2
        `, [req.userId]);

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
    const { title, description, scheduledStartUTC, maxCapacity, requiredIntent, gameId, roles } = req.body;

    if (!title || !scheduledStartUTC || !maxCapacity) {
        return res.status(400).json({ success: false, message: 'title, scheduledStartUTC, and maxCapacity are required' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO "rally_events" ("organizerID", "title", "description", "scheduledStartUTC", "maxCapacity", "requiredIntent", "gameID", "roles")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [userId, title, description || null, scheduledStartUTC, maxCapacity, requiredIntent || 'CHILL', gameId || null, JSON.stringify(roles || [])]);

        const newRally = result.rows[0];

        // Auto-RSVP the creator if requested
        if (req.body.autoRSVP) {
            await pool.query(`
                INSERT INTO "rsvps" ("eventID", "userID", "status")
                VALUES ($1, $2, 'CONFIRMED')
                ON CONFLICT ("eventID", "userID") DO UPDATE SET "status" = 'CONFIRMED'
            `, [newRally.eventID, userId]);
        }

        res.status(201).json({ success: true, data: newRally });

    } catch (error) {
        console.error('Error creating rally:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/rallies/:eventId
router.get('/:eventId', authenticateToken, async (req, res) => {
    const { eventId } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                e."eventID", e."title", e."description", e."scheduledStartUTC", e."maxCapacity", e."requiredIntent", e."gameID", e."roles",
                g."title" AS "gameTitle", g."coverArtURL",
                u."username" AS "organizerName", u."plasmaUserID" AS "organizerID",
                (SELECT COUNT(*) FROM "rsvps" r WHERE r."eventID" = e."eventID" AND r."status" = 'CONFIRMED') AS "currentAttendees",
                (SELECT JSONB_OBJECT_AGG(COALESCE(r."declaredRole", 'Open Slots'), count_role) 
                 FROM (SELECT "declaredRole", COUNT(*) as count_role FROM "rsvps" WHERE "eventID" = e."eventID" AND "status" = 'CONFIRMED' GROUP BY "declaredRole") r
                ) AS "roleCounts"
            FROM "rally_events" e
            JOIN "users" u ON e."organizerID" = u."plasmaUserID"
            LEFT JOIN "games" g ON e."gameID" = g."appID"
            WHERE e."eventID" = $1
        `, [eventId]);
        
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Rally not found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/rallies/:eventId
router.put('/:eventId', authenticateToken, async (req, res) => {
    const { eventId } = req.params;
    const { title, description, scheduledStartUTC, maxCapacity, requiredIntent, gameId, roles } = req.body;
    try {
        const result = await pool.query(`
            UPDATE "rally_events"
            SET "title" = COALESCE($1, "title"),
                "description" = COALESCE($2, "description"),
                "scheduledStartUTC" = COALESCE($3, "scheduledStartUTC"),
                "maxCapacity" = COALESCE($4, "maxCapacity"),
                "requiredIntent" = COALESCE($5, "requiredIntent"),
                "gameID" = COALESCE($6, "gameID"),
                "roles" = COALESCE($7, "roles")
            WHERE "eventID" = $8 AND "organizerID" = $9
            RETURNING *
        `, [title, description, scheduledStartUTC, maxCapacity, requiredIntent, gameId, roles ? JSON.stringify(roles) : null, eventId, req.userId]);
        
        if (result.rows.length === 0) return res.status(403).json({ success: false, message: 'Not authorized or rally not found' });
        res.json({ success: true, message: 'Rally updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating rally:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/rallies/:eventId
router.delete('/:eventId', authenticateToken, async (req, res) => {
    const { eventId } = req.params;
    try {
        const result = await pool.query(`
            DELETE FROM "rally_events" WHERE "eventID" = $1 AND "organizerID" = $2
            RETURNING "eventID"
        `, [eventId, req.userId]);
        
        if (result.rows.length === 0) return res.status(403).json({ success: false, message: 'Not authorized or rally not found' });
        res.json({ success: true, message: 'Rally deleted successfully' });
    } catch (error) {
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

// GET /api/rallies/user/:userId
router.get('/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    
    try {
        if (req.userId !== userId) {
            // Mutual friend check
            const friendCheck = await pool.query(`
                SELECT "isMutual" FROM "follow_relationships"
                WHERE ("followerID" = $1 AND "followedID" = $2)
                   OR ("followerID" = $2 AND "followedID" = $1)
                LIMIT 1
            `, [req.userId, userId]);
            
            if (friendCheck.rows.length === 0 || !friendCheck.rows[0].isMutual) {
                return res.status(403).json({ success: false, message: 'Rallies are only visible to mutual friends' });
            }
        }

        const result = await pool.query(`
            SELECT 
                e."eventID", e."title", e."description", e."scheduledStartUTC", e."maxCapacity", e."requiredIntent", e."roles", e."gameID",
                g."title" AS "gameTitle", g."coverArtURL",
                (SELECT COUNT(*) FROM "rsvps" r WHERE r."eventID" = e."eventID" AND r."status" = 'CONFIRMED') AS "currentAttendees",
                (SELECT JSONB_OBJECT_AGG(COALESCE(r."declaredRole", 'Open Slots'), count_role) 
                 FROM (SELECT "declaredRole", COUNT(*) as count_role FROM "rsvps" WHERE "eventID" = e."eventID" AND "status" = 'CONFIRMED' GROUP BY "declaredRole") r
                ) AS "roleCounts"
            FROM "rally_events" e
            LEFT JOIN "games" g ON e."gameID" = g."appID"
            WHERE e."organizerID" = $1 AND e."scheduledStartUTC" > CURRENT_TIMESTAMP
            ORDER BY e."scheduledStartUTC" ASC
        `, [userId]);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching user rallies:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
