require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/dbConfig');

async function seedDatabase() {
    console.log('🌱 Starting Database Seeding...');

    try {
        // 1. Clear Existing Data (Cascade deletes related data)
        console.log('🧹 Clearing existing data...');
        await pool.query(`
            TRUNCATE TABLE "users", "profiles", "follow_relationships", 
            "games", "library_entries", "achievements", "user_achievements", 
            "posts", "rally_events", "rsvps" RESTART IDENTITY CASCADE;
        `);

        // 2. Insert Users
        console.log('👤 Inserting Users...');
        const usersResult = await pool.query(`
            INSERT INTO "users" ("steamID64", "username", "intent") VALUES 
            ('76561198000000001', 'Wahaj', 'COMPETITIVE'),
            ('76561198000000002', 'Ahmed', 'CHILL'),
            ('76561198000000003', 'Sarah', 'COMPETITIVE'),
            ('76561198000000004', 'Ali', 'OFFLINE'),
            ('76561198000000005', 'Omar', 'OFFLINE')
            RETURNING "plasmaUserID", "username";
        `);

        const users = {};
        usersResult.rows.forEach(u => users[u.username] = u.plasmaUserID);

        // 3. Insert Profiles
        console.log('🖼️ Inserting Profiles...');
        const profileQuery = `
            INSERT INTO "profiles" ("plasmaUserID", "avatarURL", "totalPlasmaXP", "globalRank") VALUES
            ($1, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me', 12450, 42),
            ($2, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', 15200, 1),
            ($3, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 14800, 2),
            ($4, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali', 5000, 100),
            ($5, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar', 3000, 500)
        `;
        await pool.query(profileQuery, [users['Wahaj'], users['Ahmed'], users['Sarah'], users['Ali'], users['Omar']]);

        // 4. Insert Games
        console.log('🎮 Inserting Games...');
        await pool.query(`
            INSERT INTO "games" ("appID", "title", "platform", "coverArtURL") VALUES
            ('valorant', 'Valorant', 'RIOT', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop'),
            ('cs2', 'Counter-Strike 2', 'STEAM', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165&auto=format&fit=crop'),
            ('helldivers2', 'Helldivers 2', 'STEAM', 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=2119&auto=format&fit=crop')
        `);

        // 5. Insert Library Entries (Wahaj plays Valorant & CS2)
        console.log('📚 Inserting Library Entries...');
        await pool.query(`
            INSERT INTO "library_entries" ("userID", "appID", "hoursPlayed", "isCurrentlyPlaying") VALUES
            ($1, 'valorant', 342.5, true),
            ($1, 'cs2', 120.0, false),
            ($2, 'valorant', 500.0, true)
        `, [users['Wahaj'], users['Ahmed']]);

        // 6. Insert Follow Relationships (Everyone is mutual friends with Wahaj)
        console.log('🤝 Inserting Friends...');
        await pool.query(`
            INSERT INTO "follow_relationships" ("followerID", "followedID", "isMutual") VALUES
            ($1, $2, true), ($2, $1, true),
            ($1, $3, true), ($3, $1, true),
            ($1, $4, true), ($4, $1, true)
        `, [users['Wahaj'], users['Ahmed'], users['Sarah'], users['Ali']]);

        // 7. Insert Posts
        console.log('📝 Inserting Posts...');
        await pool.query(`
            INSERT INTO "posts" ("userID", "type", "content", "mediaURL") VALUES
            ($1, 'ACTIVITY_UPDATE', 'Ranked grind tonight who is in? 🎮', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070'),
            ($2, 'MOMENT', 'Finally hit Diamond! Let us go 💎', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165')
        `, [users['Ahmed'], users['Ali']]);

        // 8. Insert Rallies
        console.log('📅 Inserting Rallies...');
        await pool.query(`
            INSERT INTO "rally_events" ("organizerID", "title", "scheduledStartUTC", "maxCapacity", "requiredIntent") VALUES
            ($1, 'Friday Night Ranked', NOW() + INTERVAL '1 day', 5, 'COMPETITIVE'),
            ($2, 'Sunday Chill Custom Games', NOW() + INTERVAL '3 days', 10, 'CHILL')
        `, [users['Sarah'], users['Wahaj']]);

        console.log('✅ Database Seeding Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedDatabase();
