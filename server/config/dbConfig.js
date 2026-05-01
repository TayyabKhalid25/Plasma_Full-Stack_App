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
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

// Function to verify the database connection on startup
const connectToDatabase = async () => {
    try {
        const client = await pool.connect();
        console.log('Connected to Neon PostgreSQL Database!');
        client.release();
    } catch (err) {
        console.error('Database connection failed:', err.message);
        throw err;
    }
};

module.exports = { connectToDatabase, pool };
