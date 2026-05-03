const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const userId = '00000000-0000-0000-0000-000000000001'; // Dummy or real if known
    // Let's just try to get ANY user ID first
    const userRes = await pool.query('SELECT "plasmaUserID" FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found');
      return;
    }
    const realUserId = userRes.rows[0].plasmaUserID;
    console.log('Testing with userId:', realUserId);

    const query = `
        SELECT 
            a."achievementID",
            a."title",
            a."description",
            a."rarityWeight",
            a."plasmaXP",
            a."globalPercentage",
            a."appID",
            ua."unlockedAt",
            COALESCE(g."title", 'Unknown Game') AS "gameTitle",
            g."platform",
            g."isManualEntry"
        FROM "user_achievements" ua
        JOIN "achievements" a ON ua."achievementID" = a."achievementID"
        LEFT JOIN "games" g ON a."appID" = g."appID"
        WHERE ua."userID" = $1
        ORDER BY ua."unlockedAt" DESC
    `;
    const res = await pool.query(query, [realUserId]);
    console.log('Results count:', res.rows.length);
    if (res.rows.length > 0) {
      console.log('First row sample:', JSON.stringify(res.rows[0], null, 2));
    }
  } catch (err) {
    console.error('DATABASE ERROR:', err);
  } finally {
    await pool.end();
  }
}

test();
