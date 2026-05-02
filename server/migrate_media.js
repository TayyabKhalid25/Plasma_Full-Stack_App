require('dotenv').config();
const { pool } = require('./config/dbConfig');

async function migrate() {
    try {
        console.log('Running migration: Add mediaURL to direct_messages');
        await pool.query(`
            ALTER TABLE "direct_messages" 
            ADD COLUMN IF NOT EXISTS "mediaURL" TEXT;
        `);
        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
