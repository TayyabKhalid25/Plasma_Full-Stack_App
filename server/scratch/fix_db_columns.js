const { pool } = require('../config/dbConfig');

async function fixColumns() {
    console.log('--- Starting Database Column & Enum Fix ---');
    try {
        // 1. Handle intent_mode enum
        console.log('Updating intent_mode enum and defaults...');
        try {
            // Add LFG if it doesn't exist
            await pool.query(`ALTER TYPE intent_mode ADD VALUE IF NOT EXISTS 'LFG'`);
        } catch (e) {
            // IF NOT EXISTS for ADD VALUE is only supported in PG 12+
            // If it fails, it might already exist
            console.log('Note: Attempted to add LFG to intent_mode (might already exist)');
        }

        // Update default for users table
        await pool.query(`ALTER TABLE "users" ALTER COLUMN "intent" SET DEFAULT 'CHILL'`);
        
        // Migrate existing OFFLINE users to CHILL
        await pool.query(`UPDATE "users" SET "intent" = 'CHILL' WHERE "intent" = 'OFFLINE'`);

        // 2. Add 'intent' to 'posts' table
        console.log('Adding "intent" column to "posts" table...');
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='intent') THEN
                    ALTER TABLE "posts" ADD COLUMN "intent" intent_mode DEFAULT 'CHILL';
                END IF;
            END $$;
        `);

        // 3. Add 'mediaURL' and 'parentMessageID' to 'direct_messages' table
        console.log('Adding "mediaURL" and "parentMessageID" columns to "direct_messages" table...');
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='direct_messages' AND column_name='mediaURL') THEN
                    ALTER TABLE "direct_messages" ADD COLUMN "mediaURL" TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='direct_messages' AND column_name='parentMessageID') THEN
                    ALTER TABLE "direct_messages" ADD COLUMN "parentMessageID" UUID REFERENCES "direct_messages"("messageID") ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        console.log('--- Database Column & Enum Fix Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('!!! Database Column Fix Failed !!!');
        console.error(err.message);
        process.exit(1);
    }
}

fixColumns();
