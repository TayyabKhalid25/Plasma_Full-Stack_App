// =============================================================================
// ACTIVITY UTILITIES — Game session lifecycle management
// =============================================================================
// Manages the "currently playing" state of games in a user's library.
// Provides two helpers:
//   1. stopAllUserActivity()  — Stops ALL active games (used on disconnect/cleanup)
//   2. stopOtherGames()       — Stops all games EXCEPT one (used when starting a new game)
//
// Both calculate elapsed playtime from `lastPlayedAt` and accumulate it into
// `hoursPlayed` before clearing the `isCurrentlyPlaying` flag.
// =============================================================================

const { pool } = require('../config/dbConfig');

/**
 * Stops all active 'isCurrentlyPlaying' games for a specific user.
 * Calculates playtime based on 'lastPlayedAt' and adds it to total 'hoursPlayed'.
 *
 * @param {string} userId - The UUID of the user.
 */
async function stopAllUserActivity(userId) {
    try {
        console.log(`[Activity] Cleaning up stale activity for user ${userId}...`);
        
        const now = new Date();
        
        const activeSessions = await pool.query(
            'SELECT "appID", "lastPlayedAt" FROM "library_entries" WHERE "userID" = $1 AND "isCurrentlyPlaying" = TRUE',
            [userId]
        );

        if (activeSessions.rows.length === 0) {
            console.log(`[Activity] No active sessions found for user ${userId}.`);
            return;
        }

        for (const session of activeSessions.rows) {
            const start = new Date(session.lastPlayedAt);
            const durationHours = Math.max(0, (now - start) / (1000 * 60 * 60));

            await pool.query(`
                UPDATE "library_entries" 
                SET 
                    "isCurrentlyPlaying" = FALSE, 
                    "hoursPlayed" = "hoursPlayed" + $1,
                    "lastPlayedAt" = $2
                WHERE "userID" = $3 AND "appID" = $4
            `, [durationHours, now, userId, session.appID]);
            
            console.log(`[Activity] Stopped game ${session.appID} for user ${userId}. Added ${durationHours.toFixed(2)} hours.`);
        }
    } catch (err) {
        console.error(`[Activity] Failed to cleanup activity for user ${userId}:`, err);
    }
}

/**
 * Stops all active game sessions for a user EXCEPT the specified game.
 * Used when a user starts playing a new game — ensures only one game is
 * marked as "currently playing" at a time.
 *
 * @param {string} userId       - The UUID of the user.
 * @param {string} excludeAppId - The appID of the game to KEEP playing (skip it).
 */
async function stopOtherGames(userId, excludeAppId) {
    const now = new Date();

    const activeSessions = await pool.query(
        'SELECT "appID", "lastPlayedAt" FROM "library_entries" WHERE "userID" = $1 AND "isCurrentlyPlaying" = TRUE AND "appID" != $2',
        [userId, excludeAppId]
    );

    for (const session of activeSessions.rows) {
        const start = new Date(session.lastPlayedAt);
        const durationHours = Math.max(0, (now - start) / (1000 * 60 * 60));

        await pool.query(`
            UPDATE "library_entries" 
            SET 
                "isCurrentlyPlaying" = FALSE, 
                "hoursPlayed" = "hoursPlayed" + $1,
                "lastPlayedAt" = $2
            WHERE "userID" = $3 AND "appID" = $4
        `, [durationHours, now, userId, session.appID]);
    }
}

module.exports = { stopAllUserActivity, stopOtherGames };
