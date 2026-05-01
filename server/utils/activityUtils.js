const { pool } = require('../config/dbConfig');

/**
 * Stops all active 'isCurrentlyPlaying' games for a specific user.
 * Calculates playtime based on 'lastPlayedAt' and adds it to total 'hoursPlayed'.
 * @param {string} userId - The UUID of the user
 */
async function stopAllUserActivity(userId) {
    try {
        console.log(`[Activity] Cleaning up stale activity for user ${userId}...`);
        
        const now = new Date();
        
        // 1. Fetch all active sessions
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

        // 2. Broadcast status update if needed (optional, handled by socket disconnection usually)
    } catch (err) {
        console.error(`[Activity] Failed to cleanup activity for user ${userId}:`, err);
    }
}

module.exports = { stopAllUserActivity };
