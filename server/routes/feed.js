const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/feed
// Query Params: ?filter= (all, friends, my-posts, comp, chill)
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const filter = req.query.filter || 'all';

    try {
        let baseQuery = `
            SELECT 
                p."postID", 
                p."type", 
                p."content", 
                p."mediaURL", 
                p."timestampUTC", 
                p."isVisible",
                u."plasmaUserID", 
                u."username", 
                u."intent"
            FROM "posts" p
            JOIN "users" u ON p."userID" = u."plasmaUserID"
            WHERE p."isVisible" = TRUE
        `;

        const queryParams = [];

        // Apply filters based on frontend expectations
        if (filter === 'my-posts') {
            baseQuery += ` AND p."userID" = $1`;
            queryParams.push(userId);
        } else if (filter === 'comp') {
            baseQuery += ` AND u."intent" = 'COMPETITIVE'`;
        } else if (filter === 'chill') {
            baseQuery += ` AND u."intent" = 'CHILL'`;
        } else if (filter === 'friends') {
            // Simplified friends filter, assuming follow_relationships
            baseQuery += ` AND p."userID" IN (SELECT "followedID" FROM "follow_relationships" WHERE "followerID" = $1 AND "isMutual" = TRUE)`;
            queryParams.push(userId);
        }

        baseQuery += ` ORDER BY p."timestampUTC" DESC LIMIT 50`;

        const result = await pool.query(baseQuery, queryParams);

        // Optional: fetch comments and likes counts per post here

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
