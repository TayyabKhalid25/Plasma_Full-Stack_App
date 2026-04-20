require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/dbConfig');

async function alterDatabase() {
    console.log('🔧 Starting Database Schema Migration...');

    try {
        console.log('Dropping NOT NULL constraint on steamID64...');
        await pool.query(`ALTER TABLE "users" ALTER COLUMN "steamID64" DROP NOT NULL;`);

        console.log('Adding new columns (email, passwordHash, dateOfBirth)...');
        await pool.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "email" VARCHAR(255) UNIQUE,
            ADD COLUMN IF NOT EXISTS "passwordHash" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE;
        `);

        console.log('Ensuring username is UNIQUE...');
        try {
            await pool.query(`ALTER TABLE "users" ADD CONSTRAINT users_username_key UNIQUE ("username");`);
        } catch (e) {
            // Might already exist or fail if duplicates exist. Ignore if it already exists.
            console.log('Unique constraint on username already exists or failed:', e.message);
        }

        console.log('✅ Database Migration Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

alterDatabase();
