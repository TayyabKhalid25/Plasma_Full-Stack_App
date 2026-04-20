require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/dbConfig');

async function alterDatabase() {
    console.log('🔧 Starting Database Schema Migration...');

    try {
        console.log('Adding new tables (user_settings, post_reactions, notifications, push_subscriptions, direct_messages)...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "user_settings" (
                "plasmaUserID" UUID PRIMARY KEY REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
                "notificationsEnabled" BOOLEAN DEFAULT TRUE,
                "timezone" VARCHAR(100) DEFAULT 'UTC',
                "privacy" VARCHAR(50) DEFAULT 'Public',
                "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS "post_reactions" (
                "reactionID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "postID" UUID NOT NULL REFERENCES "posts"("postID") ON DELETE CASCADE,
                "userID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
                "reactionType" VARCHAR(50) DEFAULT 'LIKE',
                "timestampUTC" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE("postID", "userID")
            );

            CREATE TABLE IF NOT EXISTS "notifications" (
                "notificationID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "receiverID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
                "senderID" UUID REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
                "notificationType" VARCHAR(50) NOT NULL,
                "message" TEXT,
                "isRead" BOOLEAN DEFAULT FALSE,
                "sentAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS "push_subscriptions" (
                "subscriptionID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "userID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
                "endpoint" TEXT NOT NULL,
                "p256dh" TEXT NOT NULL,
                "auth" TEXT NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE("userID", "endpoint")
            );

            CREATE TABLE IF NOT EXISTS "direct_messages" (
                "messageID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "senderID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
                "receiverID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
                "content" TEXT,
                "isLobbyInvite" BOOLEAN DEFAULT FALSE,
                "lobbyLink" VARCHAR(255),
                "timestampUTC" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Database Migration Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

alterDatabase();
