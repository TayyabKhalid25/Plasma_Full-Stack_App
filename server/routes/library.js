const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const { searchIgdbGames, fetchHighResCover, getIgdbGameById } = require('../utils/externalApis');

const router = express.Router();

// GET /api/library
// Get current user's library
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT le."appID" AS "gameID", le."hoursPlayed", le."isCurrentlyPlaying", 
                   g."title", g."platform", g."coverArtURL"
            FROM "library_entries" le
            JOIN "games" g ON le."appID" = g."appID"
            WHERE le."userID" = $1
            ORDER BY g."title" ASC
        `, [req.userId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching library:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
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
                releaseDate: game.releaseDate || null,
                url: game.url
            }))
        });
    } catch (error) {
        console.error('IGDB Search Route Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to search IGDB' });
    }
});

// GET /api/library/igdb/:id
router.get('/igdb/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const game = await getIgdbGameById(id);
        if (!game) return res.status(404).json({ success: false, message: 'Game not found in IGDB' });
        res.json({ success: true, data: game });
    } catch (error) {
        console.error('IGDB Detail Route Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch IGDB details' });
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
            // If no cover art provided by the user, attempt to fetch one from IGDB
            if (!coverArtURL && title) {
                try {
                    const igdbResults = await searchIgdbGames(title);
                    if (igdbResults.length > 0 && igdbResults[0].cover && igdbResults[0].cover.url) {
                        coverArtURL = igdbResults[0].cover.url;
                        console.log(`[Library] Auto-fetched IGDB cover art for "${title}"`);
                    }
                } catch (igdbErr) {
                    console.warn(`[Library] IGDB cover lookup failed for "${title}", continuing without cover:`, igdbErr.message);
                }
            }
            await pool.query(`
                INSERT INTO "games" ("appID", "title", "coverArtURL", "platform", "isManualEntry") 
                VALUES ($1, $2, $3, 'NON_STEAM', TRUE)
            `, [gameId, title || 'Unknown Game', coverArtURL]);
        }

        // 2. Add to library_entries
        // If starting to play, stop others first
        if (isCurrentlyPlaying) {
            const now = new Date();
            const otherPlaying = await pool.query(
                'SELECT "appID", "lastPlayedAt" FROM "library_entries" WHERE "userID" = $1 AND "isCurrentlyPlaying" = TRUE AND "appID" != $2',
                [req.userId, gameId]
            );

            for (const other of otherPlaying.rows) {
                const start = new Date(other.lastPlayedAt);
                const durationHours = Math.max(0, (now - start) / (1000 * 60 * 60));
                await pool.query(`
                    UPDATE "library_entries" 
                    SET "isCurrentlyPlaying" = FALSE, "hoursPlayed" = "hoursPlayed" + $1, "lastPlayedAt" = $2
                    WHERE "userID" = $3 AND "appID" = $4
                `, [durationHours, now, req.userId, other.appID]);
            }
        }

        await pool.query(`
            INSERT INTO "library_entries" ("userID", "appID", "isCurrentlyPlaying", "lastPlayedAt")
            VALUES ($1, $2, COALESCE($3, FALSE), CASE WHEN $3 = TRUE THEN CURRENT_TIMESTAMP ELSE NULL END)
            ON CONFLICT ("userID", "appID") DO UPDATE SET
                "isCurrentlyPlaying" = EXCLUDED."isCurrentlyPlaying",
                "lastPlayedAt" = CASE 
                    WHEN EXCLUDED."isCurrentlyPlaying" = TRUE THEN CURRENT_TIMESTAMP 
                    ELSE "library_entries"."lastPlayedAt" 
                END
        `, [req.userId, gameId, isCurrentlyPlaying]);

        res.status(201).json({ success: true, message: 'Game added to library' });
    } catch (error) {
        console.error('Error adding game manually:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/library/:gameId
router.get('/:gameId', authenticateToken, async (req, res) => {
    const { gameId } = req.params;

    try {
        const result = await pool.query(`
            SELECT 
                le."appID", 
                le."hoursPlayed", 
                le."isCurrentlyPlaying", 
                le."lastPlayedAt",
                g."title", 
                g."platform", 
                g."coverArtURL"
            FROM "library_entries" le
            JOIN "games" g ON le."appID" = g."appID"
            WHERE le."userID" = $1 AND le."appID" = $2
        `, [req.userId, gameId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Game not found in library' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching game details:', error);
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
        // 1. Get current status of the game
        const currentStatusResult = await pool.query(
            'SELECT "isCurrentlyPlaying", "lastPlayedAt" FROM "library_entries" WHERE "userID" = $1 AND "appID" = $2',
            [req.userId, gameId]
        );

        if (currentStatusResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Game not found in library' });
        }

        const wasPlaying = currentStatusResult.rows[0].isCurrentlyPlaying;
        const lastAt = currentStatusResult.rows[0].lastPlayedAt;
        const now = new Date();

        // 2. Logic for starting/stopping and calculating playtime
        if (isCurrentlyPlaying && !wasPlaying) {
            // STARTING TO PLAY
            // Aggressively stop ALL other games that might be marked as playing for this user
            const activeSessions = await pool.query(
                'SELECT "appID", "lastPlayedAt" FROM "library_entries" WHERE "userID" = $1 AND "isCurrentlyPlaying" = TRUE',
                [req.userId]
            );

            for (const session of activeSessions.rows) {
                const start = new Date(session.lastPlayedAt);
                const durationHours = Math.max(0, (now - start) / (1000 * 60 * 60));

                await pool.query(`
                    UPDATE "library_entries" 
                    SET 
                        "isCurrentlyPlaying" = FALSE, 
                        "hoursPlayed" = "hoursPlayed" + $1,
                        "lastPlayedAt" = $2
                    WHERE "userID" = $3 AND "appID" = $4
                `, [durationHours, now, req.userId, session.appID]);
            }

            // Start this game
            await pool.query(`
                UPDATE "library_entries"
                SET "isCurrentlyPlaying" = TRUE, "lastPlayedAt" = $1
                WHERE "userID" = $2 AND "appID" = $3
            `, [now, req.userId, gameId]);

        } else if (!isCurrentlyPlaying && wasPlaying) {
            // STOPPING PLAY
            const start = new Date(lastAt);
            const durationHours = Math.max(0, (now - start) / (1000 * 60 * 60));

            await pool.query(`
                UPDATE "library_entries"
                SET 
                    "isCurrentlyPlaying" = FALSE,
                    "hoursPlayed" = "hoursPlayed" + $1,
                    "lastPlayedAt" = $2
                WHERE "userID" = $3 AND "appID" = $4
            `, [durationHours, now, req.userId, gameId]);
        }

        // 3. Broadcast to Pulse if started playing
        if (isCurrentlyPlaying && !wasPlaying) {
            const gameCheck = await pool.query('SELECT "title", "platform" FROM "games" WHERE "appID" = $1', [gameId]);
            if (gameCheck.rows.length > 0) {
                const platform = gameCheck.rows[0].platform;
                const content = `Started playing ${title}`;
                const deepLinkURI = platform === 'STEAM' ? `steam://run/${gameId}` : null;

                await pool.query(`
                    INSERT INTO "posts" ("userID", "type", "content", "intent", "deepLinkURI")
                    VALUES ($1, 'ACTIVITY_UPDATE', $2, (SELECT "intent" FROM "users" WHERE "plasmaUserID" = $1), $3)
                `, [req.userId, content, deepLinkURI]);
            }
        }

        res.json({ success: true, message: 'Library entry updated and playtime tracked successfully' });
    } catch (error) {
        console.error('Error updating game status/playtime:', error);
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
