// =============================================================================
// PRIVACY CHECK — Centralized Steam profile privacy enforcement
// =============================================================================
// Extracts the privacy-gating logic that was copy-pasted across achievements.js,
// library.js, and prestige.js. Checks if a target user's Steam profile is private
// and, if so, whether the requester is a mutual friend (who can bypass privacy).
//
// Returns true if access was DENIED (response already sent to client).
// Returns false if access is ALLOWED (caller should continue normally).
// =============================================================================

const { pool } = require('../config/dbConfig');

/**
 * Enforces Steam profile privacy for a target user.
 * If the target's profile is private and the requester is NOT a mutual friend,
 * sends a 403 response and returns true. Otherwise returns false.
 *
 * @param {string} requesterId - UUID of the authenticated user making the request.
 * @param {string} targetId    - UUID of the user whose data is being accessed.
 * @param {object} res         - Express response object (used to send 403 if denied).
 * @returns {Promise<boolean>} True if access was denied (response sent), false if OK.
 */
async function enforcePrivacy(requesterId, targetId, res) {
    // Users can always view their own data
    if (requesterId === targetId) return false;

    const result = await pool.query(`
        SELECT p."isSteamProfilePrivate", fr."isMutual"
        FROM "profiles" p
        LEFT JOIN "follow_relationships" fr ON (
            (fr."followerID" = $1 AND fr."followedID" = $2) OR
            (fr."followerID" = $2 AND fr."followedID" = $1)
        ) AND fr."isMutual" = TRUE
        WHERE p."plasmaUserID" = $2
    `, [requesterId, targetId]);

    if (result.rows.length > 0) {
        const { isSteamProfilePrivate, isMutual } = result.rows[0];
        if (isSteamProfilePrivate && !isMutual) {
            res.status(403).json({
                success: false,
                message: 'This user profile is private.',
                isPrivate: true
            });
            return true;
        }
    }

    return false;
}

module.exports = { enforcePrivacy };
