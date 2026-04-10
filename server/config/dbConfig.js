const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config(); // Load environment variables from .env file

// Required for Node.js environments (not needed in Vercel Edge Runtime)
neonConfig.webSocketConstructor = ws;

// Create a connection pool using the Neon connection string
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
