require('dotenv').config({ path: './server/.env' });
const { pool } = require('./config/dbConfig');

async function migrate() {
    try {
        console.log('Adding description and proofUrl to achievements...');
        await pool.query(`
            ALTER TABLE "achievements" 
            ADD COLUMN IF NOT EXISTS "description" TEXT,
            ADD COLUMN IF NOT EXISTS "proofUrl" TEXT
        `);
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
