const { pool } = require('./config/dbConfig');
require('dotenv').config();

async function migrate() {
    try {
        console.log('Adding intent column to posts table...');
        // We use TEXT for simplicity or we could use the same custom type if we knew its name.
        // The users table uses a custom type 'intent'. Let's check its name.
        const typeRes = await pool.query(`
            SELECT udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'intent'
        `);
        const typeName = typeRes.rows[0].udt_name;
        console.log(`Detected intent type name: ${typeName}`);

        await pool.query(`
            ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "intent" "${typeName}"
        `);
        
        // Populate existing posts with the user's current intent as a fallback
        await pool.query(`
            UPDATE "posts" p
            SET "intent" = u."intent"
            FROM "users" u
            WHERE p."userID" = u."plasmaUserID" AND p."intent" IS NULL
        `);

        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
