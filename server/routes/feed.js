const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/feed
 * Returns the social feed filtered by intent, user, or relationship scope.
 *
 * @requires authenticateToken
 * @query {string} [filter=all]  - One of: all, friends, my-posts, comp, chill
 * @query {string} [intent]      - Independent intent filter (CHILL, COMP, COMPETITIVE)
 * @query {string} [userId]      - Optional target user ID for profile timeline view
 * @returns {{ success: boolean, data: Post[] }}
 */
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const filter = req.query.filter || 'all';
    const intentFilter = req.query.intent;
    const profileUserId = req.query.userId !== 'undefined' ? req.query.userId : null;

    try {
        let baseQuery = `
            SELECT 
                p."postID", 
                p."type", 
                p."content", 
                p."mediaURL", 
                p."timestampUTC", 
                p."isVisible",
                p."intent",
                p."deepLinkURI",
                u."plasmaUserID", 
                u."username", 
                pr."avatarURL",
                (SELECT COUNT(*) FROM "comments" WHERE "postID" = p."postID") AS "commentCount",
                (SELECT COUNT(*) FROM "post_reactions" WHERE "postID" = p."postID") AS "reactionCount",
                -- Determines if the requesting user has already reacted to this post
                (SELECT EXISTS (SELECT 1 FROM "post_reactions" WHERE "postID" = p."postID" AND "userID" = $1)) AS "hasReacted"
            FROM "posts" p
            JOIN "users" u ON p."userID" = u."plasmaUserID"
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
            WHERE p."isVisible" = TRUE
        `;

        const queryParams = [userId];
        let paramIndex = 2;

        if (profileUserId) {
            baseQuery += ` AND p."userID" = $${paramIndex}`;
            queryParams.push(profileUserId);
            paramIndex++;
        } else if (filter === 'my-posts') {
            baseQuery += ` AND p."userID" = $${paramIndex}`;
            queryParams.push(userId);
            paramIndex++;
        } else if (filter === 'comp') {
            baseQuery += ` AND p."intent" = 'COMPETITIVE'`;
        } else if (filter === 'chill') {
            baseQuery += ` AND p."intent" = 'CHILL'`;
        } else if (filter === 'friends') {
            baseQuery += ` AND p."userID" IN (SELECT "followedID" FROM "follow_relationships" WHERE "followerID" = $${paramIndex} AND "isMutual" = TRUE)`;
            queryParams.push(userId);
            paramIndex++;
        }
        
        // Apply independent intent filter if provided
        if (intentFilter) {
            let dbIntent = intentFilter.toUpperCase();
            if (dbIntent === 'COMP') dbIntent = 'COMPETITIVE';
            baseQuery += ` AND p."intent" = $${paramIndex}`;
            queryParams.push(dbIntent);
            paramIndex++;
        }

        baseQuery += ` ORDER BY p."timestampUTC" DESC LIMIT 50`;

        const result = await pool.query(baseQuery, queryParams);

        res.json({ success: true, data: result.rows });

    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// NOTE: Post creation (POST) and deletion (DELETE) are handled by
// the /api/pulse/posts endpoints. See routes/pulse.js.

module.exports = router;
