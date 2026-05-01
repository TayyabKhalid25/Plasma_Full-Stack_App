const { pool } = require('./config/dbConfig');
require('dotenv').config();

async function cleanup() {
    try {
        console.log('Cleaning up orphaned "Currently Playing" entries...');
        
        // Find users with multiple games playing
        const result = await pool.query(`
            SELECT "userID", ARRAY_AGG("appID") as games
            FROM "library_entries"
            WHERE "isCurrentlyPlaying" = TRUE
            GROUP BY "userID"
            HAVING COUNT(*) > 1
        `);
        
        for (const row of result.rows) {
            const userId = row.userID;
            const games = row.games;
            console.log(`Fixing user ${userId} with games: ${games.join(', ')}`);
            
            // Keep the most recently updated one, stop the others
            const sessions = await pool.query(`
                SELECT "appID", "lastPlayedAt" 
                FROM "library_entries" 
                WHERE "userID" = $1 AND "isCurrentlyPlaying" = TRUE
                ORDER BY "lastPlayedAt" DESC
            `, [userId]);
            
            const [latest, ...stale] = sessions.rows;
            console.log(`Keeping ${latest.appID} (last played ${latest.lastPlayedAt})`);
            
            for (const session of stale) {
                console.log(`Stopping stale game ${session.appID}...`);
                const now = new Date();
                const start = new Date(session.lastPlayedAt);
                const durationHours = Math.max(0, (now - start) / (1000 * 60 * 60));
                
                await pool.query(`
                    UPDATE "library_entries" 
                    SET "isCurrentlyPlaying" = FALSE, 
                        "hoursPlayed" = "hoursPlayed" + $1,
                        "lastPlayedAt" = $2
                    WHERE "userID" = $3 AND "appID" = $4
                `, [durationHours, now, userId, session.appID]);
            }
        }
        
        console.log('Cleanup complete!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanup();
