// =============================================================================
// FRIENDSHIP UTILITIES — Centralized mutual-friend checks
// =============================================================================
// Single source of truth for determining if two users are mutual friends.
// Replaces scattered inline queries across message.js, pulse.js, rallies.js,
// and the now-deleted userDetails.js (which queried a non-existent table).
//
// The schema uses `follow_relationships` with `followerID`/`followedID` columns
// and an `isMutual` boolean flag. Two users are "friends" when at least one row
// in this table links them AND `isMutual = TRUE`.
// =============================================================================

const { pool } = require('../config/dbConfig');

/**
 * Checks whether two users are mutual friends.
 *
 * @param {string} userA - UUID of the first user.
 * @param {string} userB - UUID of the second user.
 * @returns {Promise<boolean>} True if a mutual follow relationship exists.
 */
async function checkMutualFriendship(userA, userB) {
    // Self-check: a user is always considered "friends" with themselves
    if (userA === userB) return true;

    const result = await pool.query(`
        SELECT 1 FROM "follow_relationships"
        WHERE (("followerID" = $1 AND "followedID" = $2)
            OR ("followerID" = $2 AND "followedID" = $1))
          AND "isMutual" = TRUE
        LIMIT 1
    `, [userA, userB]);

    return result.rows.length > 0;
}

module.exports = { checkMutualFriendship };
