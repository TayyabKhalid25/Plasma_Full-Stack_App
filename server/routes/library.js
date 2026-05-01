const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getSteamOwnedGames, getSteamPlayerSummaries, searchIgdbGames, fetchHighResCover } = require('../utils/externalApis');

const router = express.Router();

// POST /api/library/sync/steam (Unified Sync Endpoint)
router.post('/sync/steam', authenticateToken, async (req, res) => {
    try {
        // 1. Get user's steamId64
        const user = await pool.query('SELECT "steamID64" FROM "users" WHERE "plasmaUserID" = $1', [req.userId]);
        if (user.rows.length === 0 || !user.rows[0].steamID64) {
            return res.status(400).json({ success: false, message: 'Steam account not linked' });
        }
        const steamId = user.rows[0].steamID64;

        // 2. Fetch Player Summary (Profile Update)
        const summaries = await getSteamPlayerSummaries(steamId);
        if (summaries && summaries.length > 0) {
            const avatarURL = summaries[0].avatarfull;
            await pool.query('UPDATE "profiles" SET "avatarURL" = $1 WHERE "plasmaUserID" = $2', [avatarURL, req.userId]);
        }

        // 3. Fetch Owned Games (Library Sync)
        const games = await getSteamOwnedGames(steamId);
        
        let addedCount = 0;
        if (games && games.length > 0) {
            addedCount = games.length;

            const appIds = games.map(g => g.appid.toString());
            const titles = games.map(g => g.name);
            // Use Steam's official high-res grid CDN instead of IGDB, vastly faster and more reliable
            const coverArts = appIds.map(appId => `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`);

            // Batch insert missing games into the global games table
            await pool.query(`
                INSERT INTO "games" ("appID", "title", "platform", "coverArtURL")
                SELECT id, title, 'STEAM', cover
                FROM unnest($1::text[], $2::text[], $3::text[]) AS t(id, title, cover)
                ON CONFLICT ("appID") DO UPDATE SET
                    "coverArtURL" = EXCLUDED."coverArtURL"
            `, [appIds, titles, coverArts]);

            // Batch insert/update user library entries
            const userIds = Array(games.length).fill(req.userId);
            const hoursPlayed = games.map(g => (g.playtime_forever / 60).toFixed(2));

            await pool.query(`
                INSERT INTO "library_entries" ("userID", "appID", "hoursPlayed")
                SELECT uid, aid, hrs::numeric
                FROM unnest($1::uuid[], $2::text[], $3::text[]) AS t(uid, aid, hrs)
                ON CONFLICT ("userID", "appID") DO UPDATE SET
                    "hoursPlayed" = EXCLUDED."hoursPlayed"
            `, [userIds, appIds, hoursPlayed]);
        }

        res.json({ success: true, message: 'Steam library and profile synced successfully', syncedGames: addedCount });
    } catch (error) {
        console.error('Steam Sync Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to sync with Steam' });
    }
});

// GET /api/library/igdb/search
router.get('/igdb/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    
    if (!q) return res.status(400).json({ success: false, message: 'Query string required' });
    
    try {
        const results = await searchIgdbGames(q);
        res.json({
            success: true,
            data: results.map(game => ({
                id: `igdb_${game.id}`,
                title: game.name,
                coverArtURL: game.cover ? game.cover.url : null,
                url: game.url
            }))
        });
    } catch (error) {
        console.error('IGDB Search Route Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to search IGDB' });
    }
});

// POST /api/library/manual
router.post('/manual', authenticateToken, async (req, res) => {
    let { gameId, title, coverArtURL, isCurrentlyPlaying } = req.body;
    
    try {
        // Automatically find or generate a custom gameId if none is provided
        if (!gameId) {
            if (!title) return res.status(400).json({ success: false, message: 'Game ID or Title is required' });
            
            // Check if there's already a custom game with this exact title
            const existingTitleCheck = await pool.query(
                `SELECT "appID" FROM "games" WHERE "title" ILIKE $1 AND "isManualEntry" = TRUE`,
                [title.trim()]
            );
            
            if (existingTitleCheck.rows.length > 0) {
                gameId = existingTitleCheck.rows[0].appID;
            } else {
                gameId = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            }
        }

        // 1. Ensure game exists in 'games' table
        const gameCheck = await pool.query(`SELECT "appID" FROM "games" WHERE "appID" = $1`, [gameId]);
        if (gameCheck.rows.length === 0) {
            await pool.query(`
                INSERT INTO "games" ("appID", "title", "coverArtURL", "platform", "isManualEntry") 
                VALUES ($1, $2, $3, 'CUSTOM', TRUE)
            `, [gameId, title || 'Unknown Game', coverArtURL]);
        }
        
        // 2. Add to library_entries
        await pool.query(`
            INSERT INTO "library_entries" ("userID", "appID", "isCurrentlyPlaying", "lastPlayedAt")
            VALUES ($1, $2, COALESCE($3, FALSE), CURRENT_TIMESTAMP)
            ON CONFLICT ("userID", "appID") DO UPDATE SET
                "isCurrentlyPlaying" = EXCLUDED."isCurrentlyPlaying",
                "lastPlayedAt" = EXCLUDED."lastPlayedAt"
        `, [req.userId, gameId, isCurrentlyPlaying]);
        
        res.status(201).json({ success: true, message: 'Game added to library' });
    } catch (error) {
        console.error('Error adding game manually:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/library/:gameId
router.delete('/:gameId', authenticateToken, async (req, res) => {
    const { gameId } = req.params;
    
    try {
        const result = await pool.query(`
            DELETE FROM "library_entries" WHERE "userID" = $1 AND "appID" = $2
            RETURNING "entryID"
        `, [req.userId, gameId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Game not found in library' });
        }
        
        res.json({ success: true, message: 'Game removed from library' });
    } catch (error) {
        console.error('Error removing game:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/library/:gameId/status
router.put('/:gameId/status', authenticateToken, async (req, res) => {
    const { gameId } = req.params;
    const { isCurrentlyPlaying } = req.body;
    
    if (typeof isCurrentlyPlaying !== 'boolean') {
        return res.status(400).json({ success: false, message: 'isCurrentlyPlaying boolean flag is required' });
    }

    try {
        const result = await pool.query(`
            UPDATE "library_entries"
            SET 
                "isCurrentlyPlaying" = $1,
                "lastPlayedAt" = CURRENT_TIMESTAMP
            WHERE "userID" = $2 AND "appID" = $3
            RETURNING "appID", "isCurrentlyPlaying"
        `, [isCurrentlyPlaying, req.userId, gameId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Game not found in library' });
        }

        // Broadcast to Pulse if started playing
        if (isCurrentlyPlaying) {
            const gameCheck = await pool.query('SELECT "title" FROM "games" WHERE "appID" = $1', [gameId]);
            if (gameCheck.rows.length > 0) {
                const title = gameCheck.rows[0].title;
                const content = `Started playing ${title}`;
                
                await pool.query(`
                    INSERT INTO "posts" ("userID", "type", "content")
                    VALUES ($1, 'ACTIVITY_UPDATE', $2)
                `, [req.userId, content]);
            }
        }
        
        res.json({ success: true, message: 'Library entry updated successfully' });
    } catch (error) {
        console.error('Error updating game status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/library/user/:userId
router.get('/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT le."appID", le."hoursPlayed", le."isCurrentlyPlaying", le."lastPlayedAt",
                   g."title", g."platform", g."coverArtURL"
            FROM "library_entries" le
            JOIN "games" g ON le."appID" = g."appID"
            WHERE le."userID" = $1
            ORDER BY le."lastPlayedAt" DESC NULLS LAST
        `, [userId]);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching user library:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
