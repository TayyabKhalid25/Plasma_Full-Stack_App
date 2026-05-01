const { pool } = require('./config/dbConfig');
require('dotenv').config();

async function check() {
    try {
        const result = await pool.query(`
            SELECT "userID", COUNT(*) as count, ARRAY_AGG("appID") as games
            FROM "library_entries"
            WHERE "isCurrentlyPlaying" = TRUE
            GROUP BY "userID"
            HAVING COUNT(*) > 1
        `);
        
        if (result.rows.length > 0) {
            console.log('Found users with multiple games playing:');
            console.table(result.rows);
        } else {
            console.log('No users found with multiple games playing. All good!');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
