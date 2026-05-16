const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isOnline } = require('../ws/presence');
const { getSteamPlayerSummaries } = require('../utils/externalApis');
const { checkMutualFriendship } = require('../utils/friendshipUtils');
const { buildEnrichedRallyQuery } = require('../utils/rallyQueryBuilder');

const router = express.Router();

/**
 * GET /api/rallies
 * Retrieves a list of all future rallies.
 *
 * @requires authenticateToken
 * @param {string} [req.query.view] - View mode ('calendar' or 'list')
 * @returns {{ success: boolean, data: RallyEvent[] }}
 * @throws {500} Internal server error on DB failure
 */
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        const query = buildEnrichedRallyQuery('list', userId);
        const result = await pool.query(query.text, query.values);

        res.json({ success: true, data: result.rows });

    } catch (error) {
        console.error('Error fetching rallies:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/rallies/upcoming
 * Returns the next 2 upcoming rallies for the right-rail widget on the dashboard.
 * Includes rallies the user is organizing or has confirmed RSVP for.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, data: RallyEvent[] }}
 * @throws {500} Internal server error on DB failure
 */
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

/**
 * POST /api/rallies
 * Creates a new rally event and broadcasts a post to the feed.
 *
 * @requires authenticateToken
 * @param {string} req.body.title - Title of the rally
 * @param {string} [req.body.description] - Rally description
 * @param {string} req.body.scheduledStartUTC - UTC timestamp of start time
 * @param {number} req.body.maxCapacity - Max attendees allowed
 * @param {string} [req.body.requiredIntent='CHILL'] - Intent tag
 * @param {string} [req.body.gameId] - App ID of the game
 * @param {Object[]} [req.body.roles] - Array of role definitions
 * @returns {{ success: boolean, data: RallyEvent }}
 * @throws {400} Missing required fields
 * @throws {500} Internal server error on DB failure
 */
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

        // Fetch game title for the post
        let gameTitle = "";
        if (gameId) {
            const gameRes = await pool.query('SELECT "title" FROM "games" WHERE "appID" = $1', [gameId]);
            gameTitle = gameRes.rows[0]?.title || "";
        }

        // Create a RALLY_BROADCAST post
        const formattedDate = new Date(newRally.scheduledStartUTC).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const postContent = `Just organized a rally for ${gameTitle || title} on ${formattedDate}! ${description || ""}`;

        await pool.query(`
            INSERT INTO "posts" ("userID", "type", "content", "deepLinkURI", "intent")
            VALUES ($1, 'RALLY_BROADCAST', $2, $3, $4)
        `, [userId, postContent, `/rallies`, requiredIntent || 'CHILL']);


        // Fetch the enriched rally object to return (consistent with GET /api/rallies)
        const enrichedQuery = buildEnrichedRallyQuery('detail', userId, newRally.eventID);
        const enrichedResult = await pool.query(enrichedQuery.text, enrichedQuery.values);

        res.status(201).json({ success: true, data: enrichedResult.rows[0] });

    } catch (error) {
        console.error('Error creating rally:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/rallies/:eventId
 * Retrieves detailed information about a specific rally, including attendees
 * and real-time Steam presence (if applicable).
 *
 * @requires authenticateToken
 * @param {string} req.params.eventId - UUID of the rally
 * @returns {{ success: boolean, data: RallyEvent }}
 * @throws {400} Invalid Event ID format
 * @throws {404} Rally not found
 * @throws {500} Internal server error on DB failure
 */
router.get('/:eventId', authenticateToken, async (req, res) => {
    const { eventId } = req.params;

    // Gracefully handle undefined or bad formatting from frontend mis-renders
    if (!eventId || eventId === 'undefined') {
        return res.status(400).json({ success: false, message: 'Invalid Event ID provided' });
    }

    try {
        const result = await pool.query(`
            SELECT 
                e."eventID", e."title", e."description", e."scheduledStartUTC", e."maxCapacity", e."requiredIntent", e."gameID", e."roles",
                g."title" AS "gameTitle", g."coverArtURL", g."platform",
                u."username" AS "organizerName", u."plasmaUserID" AS "organizerID", p."avatarURL" AS "organizerAvatar",
                (SELECT COUNT(*) FROM "rsvps" r WHERE r."eventID" = e."eventID" AND r."status" = 'CONFIRMED') AS "currentAttendees",
                (SELECT JSONB_OBJECT_AGG(COALESCE(r."declaredRole", 'Open Slots'), count_role) 
                 FROM (SELECT "declaredRole", COUNT(*) as count_role FROM "rsvps" WHERE "eventID" = e."eventID" AND "status" = 'CONFIRMED' GROUP BY "declaredRole") r
                ) AS "roleCounts",
                (SELECT COUNT(*) > 0 FROM "rsvps" r WHERE r."eventID" = e."eventID" AND r."userID" = $1 AND r."status" = 'CONFIRMED') AS "hasRsvpd"
            FROM "rally_events" e
            JOIN "users" u ON e."organizerID" = u."plasmaUserID"
            JOIN "profiles" p ON e."organizerID" = p."plasmaUserID"
            LEFT JOIN "games" g ON e."gameID" = g."appID"
            WHERE e."eventID" = $2
        `, [req.userId, eventId]);

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Rally not found' });
        
        const rally = result.rows[0];

        // Fetch attendees with their steamID64 for presence check
        const attendeesRes = await pool.query(`
            SELECT r."userID", r."declaredRole" as "role", u."username", u."steamID64", p."avatarURL"
            FROM "rsvps" r
            JOIN "users" u ON r."userID" = u."plasmaUserID"
            JOIN "profiles" p ON r."userID" = p."plasmaUserID"
            WHERE r."eventID" = $1 AND r."status" = 'CONFIRMED'
        `, [eventId]);

        const attendees = attendeesRes.rows;
        
        // Batch fetch Steam summaries only if rally game is a Steam game
        const isSteamGame = rally.platform === 'STEAM';
        const steamIds = attendees.filter(a => a.steamID64).map(a => a.steamID64).join(',');
        let steamPlayers = [];
        if (isSteamGame && steamIds) {
            try {
                steamPlayers = await getSteamPlayerSummaries(steamIds);
            } catch (err) {
                console.error("Steam summary fetch failed for rally", err);
            }
        }

        // Enrich attendees with real-time status
        const enrichedAttendees = attendees.map(att => {
            const online = isOnline(att.userID);
            const steamPlayer = steamPlayers.find(p => p.steamid === att.steamID64);
            
            let status = "OFFLINE";
            
            // Only assign IN-GAME if we can verify it via Steam for Steam games
            if (isSteamGame && steamPlayer && steamPlayer.gameid && String(steamPlayer.gameid) === String(rally.gameID)) {
                status = "IN-GAME";
            } else if (online) {
                status = "ONLINE";
            }

            return {
                userID: att.userID,
                username: att.username,
                avatarURL: att.avatarURL,
                role: att.role,
                status: status
            };
        });

        rally.attendees = enrichedAttendees;

        res.json({ success: true, data: rally });

    } catch (error) {
        console.error('Error fetching rally details:', error);

        // 22P02 is the specific Postgres error code for "invalid input syntax for type uuid"
        if (error.code === '22P02') {
            return res.status(400).json({ success: false, message: 'Invalid Event ID format' });
        }

        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * PUT /api/rallies/:eventId
 * Updates an existing rally. If capacity is reduced or roles removed, kicks excess attendees.
 *
 * @requires authenticateToken
 * @param {string} req.params.eventId - UUID of the rally
 * @returns {{ success: boolean, message: string, data: RallyEvent }}
 * @throws {403} Not authorized (not organizer)
 * @throws {404} Rally not found
 * @throws {500} Internal server error on DB failure
 */
router.put('/:eventId', authenticateToken, async (req, res) => {
    const { eventId } = req.params;
    const { title, description, scheduledStartUTC, maxCapacity, requiredIntent, gameId, roles } = req.body;
    
    try {
        // 1. Fetch current state and attendees before update
        const oldRallyRes = await pool.query('SELECT * FROM "rally_events" WHERE "eventID" = $1', [eventId]);
        if (oldRallyRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Rally not found' });
        const oldRally = oldRallyRes.rows[0];

        if (oldRally.organizerID !== req.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this rally' });
        }

        const rsvpsRes = await pool.query(`
            SELECT r.*, u."username" 
            FROM "rsvps" r 
            JOIN "users" u ON r."userID" = u."plasmaUserID"
            WHERE r."eventID" = $1 AND r."status" = 'CONFIRMED'
        `, [eventId]);
        const currentRsvps = rsvpsRes.rows;

        // 2. Perform the update
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

        const updatedRally = result.rows[0];
        const newRoles = updatedRally.roles || [];
        const newMaxCap = updatedRally.maxCapacity;

        // 3. Logic to kick people
        let kickedUserIDs = new Set();
        
        // A. Kick people whose roles are gone
        for (const rsvp of currentRsvps) {
            if (rsvp.userID === req.userId) continue; // Organizer stays
            
            if (rsvp.declaredRole && rsvp.declaredRole !== 'Open Slots') {
                const roleStillExists = newRoles.some(r => r.name === rsvp.declaredRole);
                if (!roleStillExists) {
                    kickedUserIDs.add(rsvp.userID);
                }
            }
        }

        // B. Handle capacity overflow (after role-based kicks)
        let remainingAttendees = currentRsvps.filter(r => !kickedUserIDs.has(r.userID));
        if (remainingAttendees.length > newMaxCap) {
            // Kick random people (excluding organizer) until we hit capacity
            let candidates = remainingAttendees.filter(r => r.userID !== req.userId);
            // Shuffle candidates
            candidates.sort(() => Math.random() - 0.5);
            
            const numToKick = remainingAttendees.length - newMaxCap;
            for (let i = 0; i < numToKick && i < candidates.length; i++) {
                kickedUserIDs.add(candidates[i].userID);
            }
        }

        // 4. Update kicked users in DB
        if (kickedUserIDs.size > 0) {
            const kickedArray = Array.from(kickedUserIDs);
            await pool.query(`
                UPDATE "rsvps" 
                SET "status" = 'DECLINED'
                WHERE "eventID" = $1 AND "userID" = ANY($2)
            `, [eventId, kickedArray]);

            // Notify them
            const notifyPromises = kickedArray.map(uid => {
                return pool.query(`
                    INSERT INTO "notifications" ("receiverID", "senderID", "notificationType", "message", "linkURI")
                    VALUES ($1, $2, 'RALLY_CHANGED', $3, $4)
                `, [uid, req.userId, `You've been unceremoniously kicked from "${updatedRally.title}" because the organizer has no tact and changed the plan mid-way. Honestly, you're better off.`, `/rallies`]);
            });
            await Promise.all(notifyPromises);
        }

        // 5. Update the associated post
        let gameTitle = "";
        if (updatedRally.gameID) {
            const gameRes = await pool.query('SELECT "title" FROM "games" WHERE "appID" = $1', [updatedRally.gameID]);
            gameTitle = gameRes.rows[0]?.title || "";
        }
        const formattedDate = new Date(updatedRally.scheduledStartUTC).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const postContent = `Updated rally for ${gameTitle || updatedRally.title} on ${formattedDate}! ${updatedRally.description || ""}`;

        await pool.query(`
            UPDATE "posts" 
            SET "content" = $1, "intent" = $2
            WHERE "deepLinkURI" = $3 AND "userID" = $4
        `, [postContent, updatedRally.requiredIntent, `/rallies`, req.userId]);

        // 6. Fetch the enriched rally object to return (with profiles join for avatars)
        const enrichedQuery = buildEnrichedRallyQuery('detail', req.userId, updatedRally.eventID);
        const enrichedResult = await pool.query(enrichedQuery.text, enrichedQuery.values);

        res.json({ success: true, message: 'Rally updated and roster managed.', data: enrichedResult.rows[0] });
    } catch (error) {
        console.error('Error updating rally:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/rallies/:eventId
router.delete('/:eventId', authenticateToken, async (req, res) => {
    const { eventId } = req.params;
    try {
        // 1. Get all confirmed RSVPs before deleting the rally (to send notifications)
        const rsvps = await pool.query(`
            SELECT "userID" FROM "rsvps" WHERE "eventID" = $1 AND "status" = 'CONFIRMED' AND "userID" != $2
        `, [eventId, req.userId]);

        // 2. Delete the rally
        const result = await pool.query(`
            DELETE FROM "rally_events" WHERE "eventID" = $1 AND "organizerID" = $2
            RETURNING "title"
        `, [eventId, req.userId]);

        if (result.rows.length === 0) return res.status(403).json({ success: false, message: 'Not authorized or rally not found' });
        const rallyTitle = result.rows[0].title;

        // 3. Delete the associated post
        await pool.query(`
            DELETE FROM "posts" WHERE "deepLinkURI" = $1 AND "userID" = $2
        `, [`/rallies`, req.userId]);

        // 4. Notify everyone who RSVP'd
        if (rsvps.rows.length > 0) {
            const notificationQueries = rsvps.rows.map(row => {
                return pool.query(`
                    INSERT INTO "notifications" ("receiverID", "senderID", "notificationType", "message", "linkURI")
                    VALUES ($1, $2, 'RALLY_CANCELLED', $3, $4)
                `, [row.userID, req.userId, `The rally "${rallyTitle}" has been cancelled by the organizer.`, `/rallies`]);
            });
            await Promise.all(notificationQueries);
        }

        res.json({ success: true, message: 'Rally deleted successfully and attendees notified' });
    } catch (error) {
        console.error('Error deleting rally:', error);
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

// POST /api/rallies/:eventId/kick/:targetUserId
// Kick an attendee (Organizer only)
router.post('/:eventId/kick/:targetUserId', authenticateToken, async (req, res) => {
    const { eventId, targetUserId } = req.params;
    const organizerId = req.userId;

    try {
        // 1. Verify rally exists and requester is organizer
        const rallyRes = await pool.query('SELECT "title", "organizerID" FROM "rally_events" WHERE "eventID" = $1', [eventId]);
        if (rallyRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Rally not found' });
        
        const rally = rallyRes.rows[0];
        if (rally.organizerID !== organizerId) {
            return res.status(403).json({ success: false, message: 'Only the organizer can kick members' });
        }

        if (targetUserId === organizerId) {
            return res.status(400).json({ success: false, message: 'You cannot kick yourself' });
        }

        // 2. Update RSVP status
        const updateRes = await pool.query(`
            UPDATE "rsvps" 
            SET "status" = 'DECLINED'
            WHERE "eventID" = $1 AND "userID" = $2 AND "status" = 'CONFIRMED'
            RETURNING *
        `, [eventId, targetUserId]);

        if (updateRes.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'User is not a confirmed attendee of this rally' });
        }

        // 3. Notify the kicked user
        await pool.query(`
            INSERT INTO "notifications" ("receiverID", "senderID", "notificationType", "message", "linkURI")
            VALUES ($1, $2, 'RALLY_REMOVED', $3, $4)
        `, [targetUserId, organizerId, `You've been unceremoniously evicted from "${rally.title}". The organizer probably couldn't handle your raw power. Honestly, they did you a favor.`, `/rallies`]);

        res.json({ success: true, message: 'Attendee kicked successfully' });
    } catch (error) {
        console.error('Error kicking attendee:', error);
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
            const isMutual = await checkMutualFriendship(req.userId, userId);
            if (!isMutual) {
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
            LEFT JOIN "rsvps" r2 ON e."eventID" = r2."eventID" AND r2."userID" = $1
            WHERE (e."organizerID" = $1 OR r2."status" = 'CONFIRMED') 
              AND e."scheduledStartUTC" > CURRENT_TIMESTAMP
            GROUP BY e."eventID", g."appID"
            ORDER BY e."scheduledStartUTC" ASC
        `, [userId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching user rallies:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
