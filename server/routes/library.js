const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/library/sync/steam
router.post('/sync/steam', authenticateToken, async (req, res) => {
    // Stub for Steam Sync API
    res.json({ success: true, message: 'Steam library synced successfully', addedCount: 0 });
});

// GET /api/library/igdb/search
router.get('/igdb/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    
    if (!q) return res.status(400).json({ success: false, message: 'Query string required' });
    
    // Stub for IGDB search
    res.json({
        success: true,
        data: [
            { id: 101, title: `${q} - IGDB Mock Result 1`, coverArtURL: 'https://via.placeholder.com/150' },
            { id: 102, title: `${q} - IGDB Mock Result 2`, coverArtURL: 'https://via.placeholder.com/150' }
        ]
    });
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
