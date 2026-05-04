const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config(); // Load environment variables from .env file

// Required for Node.js environments (not needed in Vercel Edge Runtime)
neonConfig.webSocketConstructor = ws;

// Create a connection pool using the Neon connection string
// Explicit limits prevent connection exhaustion under high traffic.
// - max: Maximum simultaneous connections (Neon Free tier allows ~100; we cap at 20
//   so our app never monopolises the DB, and excess requests queue in-memory).
// - idleTimeoutMillis: Close connections unused for 30 seconds to free DB slots.
// - connectionTimeoutMillis: Fail fast (5s) if Neon is unreachable, instead of
//   hanging the request indefinitely.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 5000
});

// Function to verify the database connection on startup
const connectToDatabase = async () => {
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const client = await pool.connect();
            console.log('Connected to Neon PostgreSQL Database!');
            client.release();
            return; // Exit function on success
        } catch (err) {
            console.error(`Database connection attempt ${attempt} failed: ${err.message}`);
            if (attempt === maxRetries) throw err; // Re-throw if it's the last attempt
            
            console.log(`Retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

module.exports = { connectToDatabase, pool };
