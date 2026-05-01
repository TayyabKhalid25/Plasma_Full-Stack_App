const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/games
// Query Params: ?filter= (all, playing, steam, non-steam) & ?q=search
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const filter = req.query.filter || 'all';
    const searchQuery = req.query.q || '';

    try {
        let baseQuery = `
            SELECT 
                g."appID", 
                g."title", 
                g."platform", 
                g."coverArtURL", 
                l."hoursPlayed", 
                l."isCurrentlyPlaying", 
                l."lastPlayedAt"
            FROM "library_entries" l
            JOIN "games" g ON l."appID" = g."appID"
            WHERE l."userID" = $1
        `;
        
        const queryParams = [userId];
        let paramIndex = 2;

        if (filter === 'playing') {
            baseQuery += ` AND l."isCurrentlyPlaying" = TRUE`;
        } else if (filter === 'steam') {
            baseQuery += ` AND g."platform" = 'STEAM'`;
        } else if (filter === 'non-steam') {
            baseQuery += ` AND g."platform" != 'STEAM'`;
        }

        if (searchQuery) {
            baseQuery += ` AND g."title" ILIKE $${paramIndex}`;
            queryParams.push(`%${searchQuery}%`);
        }

        baseQuery += ` ORDER BY l."lastPlayedAt" DESC NULLS LAST`;

        const result = await pool.query(baseQuery, queryParams);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching games library:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/games/trending
// Returns games currently being played, grouped and ordered by number of people playing
router.get('/trending', authenticateToken, async (req, res) => {
    try {
        const trendingQuery = `
            SELECT 
                g."appID",
                g."title",
                g."platform",
                g."coverArtURL",
                COUNT(l."userID") AS "currentlyPlayingCount"
            FROM "library_entries" l
            JOIN "games" g ON l."appID" = g."appID"
            WHERE l."isCurrentlyPlaying" = TRUE
            GROUP BY g."appID", g."title", g."platform", g."coverArtURL"
            ORDER BY "currentlyPlayingCount" DESC, g."title" ASC
        `;
        const result = await pool.query(trendingQuery);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching trending games:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;