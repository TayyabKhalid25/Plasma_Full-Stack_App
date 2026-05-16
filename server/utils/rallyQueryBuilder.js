// =============================================================================
// RALLY QUERY BUILDER — Centralized enriched rally SELECT construction
// =============================================================================
// Builds the large enriched-rally query used across GET /, POST /, GET /:eventId,
// and PUT /:eventId. Rather than copy-pasting 30+ lines of SQL in each handler,
// callers use buildEnrichedRallyQuery() to get a { text, values } pair.
//
// Two modes:
//   - "list"   — returns all future rallies (for the calendar/list view)
//   - "detail" — returns a single rally by eventID (includes attendees, organizer avatar)
// =============================================================================

/**
 * Builds the enriched rally SELECT query.
 *
 * @param {"list"|"detail"} mode - "list" for all upcoming, "detail" for single rally
 * @param {string} userId       - The authenticated user's ID (for hasRsvpd check)
 * @param {string} [eventId]    - Required when mode is "detail"
 * @returns {{ text: string, values: any[] }}
 */
function buildEnrichedRallyQuery(mode, userId, eventId) {
    // Core columns shared by both modes
    const coreColumns = `
        e."eventID", e."title", e."description", e."scheduledStartUTC",
        e."maxCapacity", e."requiredIntent", e."gameID", e."roles",
        g."title" AS "gameTitle", g."coverArtURL",
        u."username" AS "organizerName", u."plasmaUserID" AS "organizerID",
        -- Subquery: total confirmed attendees
        (SELECT COUNT(*) FROM "rsvps" r WHERE r."eventID" = e."eventID" AND r."status" = 'CONFIRMED') AS "currentAttendees",
        -- Subquery: aggregates declared roles into a JSON map of Role -> Count
        (SELECT JSONB_OBJECT_AGG(COALESCE(r."declaredRole", 'Open Slots'), count_role) 
         FROM (SELECT "declaredRole", COUNT(*) as count_role FROM "rsvps" WHERE "eventID" = e."eventID" AND "status" = 'CONFIRMED' GROUP BY "declaredRole") r
        ) AS "roleCounts",
        -- Subquery: boolean indicating if the requesting user has RSVP'd
        (SELECT COUNT(*) > 0 FROM "rsvps" r WHERE r."eventID" = e."eventID" AND r."userID" = $1 AND r."status" = 'CONFIRMED') AS "hasRsvpd"
    `;

    // Detail mode adds organizer avatar, game platform, and inline attendees list
    const detailColumns = `,
        p."avatarURL" AS "organizerAvatar", g."platform",
        -- Subquery: array of all confirmed attendees with their profile details
        (SELECT JSONB_AGG(jsonb_build_object(
            'userID', r."userID",
            'username', ru."username",
            'avatarURL', rp."avatarURL",
            'role', r."declaredRole"
        )) FROM "rsvps" r 
        JOIN "users" ru ON r."userID" = ru."plasmaUserID"
        JOIN "profiles" rp ON r."userID" = rp."plasmaUserID"
        WHERE r."eventID" = e."eventID" AND r."status" = 'CONFIRMED') AS "attendees"
    `;

    const selectColumns = mode === 'detail'
        ? `${coreColumns}${detailColumns}`
        : coreColumns;

    // Detail mode joins profiles for organizer avatar
    const joins = mode === 'detail'
        ? `JOIN "users" u ON e."organizerID" = u."plasmaUserID"
           JOIN "profiles" p ON e."organizerID" = p."plasmaUserID"
           LEFT JOIN "games" g ON e."gameID" = g."appID"`
        : `JOIN "users" u ON e."organizerID" = u."plasmaUserID"
           LEFT JOIN "games" g ON e."gameID" = g."appID"`;

    if (mode === 'detail') {
        return {
            text: `SELECT ${selectColumns} FROM "rally_events" e ${joins} WHERE e."eventID" = $2`,
            values: [userId, eventId]
        };
    }

    // List mode: all future rallies
    return {
        text: `SELECT ${selectColumns} FROM "rally_events" e ${joins} WHERE e."scheduledStartUTC" > CURRENT_TIMESTAMP ORDER BY e."scheduledStartUTC" ASC`,
        values: [userId]
    };
}

module.exports = { buildEnrichedRallyQuery };
