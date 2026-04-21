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
        for (const game of games) {
            const appId = game.appid.toString();
            // Check if game exists in our global DB
            const gameCheck = await pool.query('SELECT "appID" FROM "games" WHERE "appID" = $1', [appId]);
            if (gameCheck.rows.length === 0) {
                // Upscale art using IGDB Double-Lookup
                let coverArt = null;
                if (game.img_icon_url) {
                    coverArt = `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${game.img_icon_url}.jpg`;
                }
                const highResCover = await fetchHighResCover(appId);
                if (highResCover) coverArt = highResCover;

                await pool.query(`
                    INSERT INTO "games" ("appID", "title", "platform", "coverArtURL")
                    VALUES ($1, $2, 'STEAM', $3)
                `, [appId, game.name, coverArt]);
            }

            // Upsert into library_entries
            const playtimeHours = (game.playtime_forever / 60).toFixed(2);
            await pool.query(`
                INSERT INTO "library_entries" ("userID", "appID", "hoursPlayed")
                VALUES ($1, $2, $3)
                ON CONFLICT ("userID", "appID") DO UPDATE SET
                    "hoursPlayed" = EXCLUDED."hoursPlayed"
            `, [req.userId, appId, playtimeHours]);
            addedCount++;
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
    const { gameId, title, coverArtURL, playStatus, rating, notes } = req.body;
    
    try {
        // 1. Ensure game exists in 'games' table
        const gameCheck = await pool.query(`SELECT "appID" FROM "games" WHERE "appID" = $1`, [gameId]);
        if (gameCheck.rows.length === 0) {
            await pool.query(`
                INSERT INTO "games" ("appID", "title", "coverArtURL") 
                VALUES ($1, $2, $3)
            `, [gameId, title || 'Unknown Game', coverArtURL]);
        }
        
        // 2. Add to library_entries
        await pool.query(`
            INSERT INTO "library_entries" ("userID", "appID", "playStatus", "rating", "notes")
            VALUES ($1, $2, COALESCE($3, 'WANT_TO_PLAY'), $4, $5)
            ON CONFLICT ("userID", "appID") DO UPDATE SET
                "playStatus" = EXCLUDED."playStatus",
                "rating" = EXCLUDED."rating",
                "notes" = EXCLUDED."notes",
                "lastPlayedUTC" = CURRENT_TIMESTAMP
        `, [req.userId, gameId, playStatus, rating, notes]);
        
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
    const { playStatus, rating, notes } = req.body;
    
    try {
        const result = await pool.query(`
            UPDATE "library_entries"
            SET 
                "playStatus" = COALESCE($1, "playStatus"),
                "rating" = COALESCE($2, "rating"),
                "notes" = COALESCE($3, "notes"),
                "lastPlayedUTC" = CURRENT_TIMESTAMP
            WHERE "userID" = $4 AND "appID" = $5
            RETURNING "appID", "playStatus"
        `, [playStatus, rating, notes, req.userId, gameId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Game not found in library' });
        }
        
        res.json({ success: true, message: 'Library entry updated successfully' });
    } catch (error) {
        console.error('Error updating game status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
