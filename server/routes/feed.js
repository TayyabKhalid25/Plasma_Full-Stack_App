const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/feed
// Query Params: ?filter= (all, friends, my-posts, comp, chill) &userId= (optional, for profile timeline)
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const filter = req.query.filter || 'all';
    const profileUserId = req.query.userId; // Optional: fetch posts for a specific user's profile

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
                u."intent",
                pr."avatarURL"
            FROM "posts" p
            JOIN "users" u ON p."userID" = u."plasmaUserID"
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
            WHERE p."isVisible" = TRUE
        `;

        const queryParams = [];
        let paramIndex = 1;

        // If a specific user's timeline is requested, filter by their userId
        if (profileUserId) {
            baseQuery += ` AND p."userID" = $${paramIndex}`;
            queryParams.push(profileUserId);
            paramIndex++;
        } else if (filter === 'my-posts') {
            baseQuery += ` AND p."userID" = $${paramIndex}`;
            queryParams.push(userId);
            paramIndex++;
        } else if (filter === 'comp') {
            baseQuery += ` AND u."intent" = 'COMPETITIVE'`;
        } else if (filter === 'chill') {
            baseQuery += ` AND u."intent" = 'CHILL'`;
        } else if (filter === 'friends') {
            baseQuery += ` AND p."userID" IN (SELECT "followedID" FROM "follow_relationships" WHERE "followerID" = $${paramIndex} AND "isMutual" = TRUE)`;
            queryParams.push(userId);
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

// POST /api/feed/posts
// Create a new post
router.post('/posts', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { content, mediaURL, type } = req.body;

    if (!content && !mediaURL) {
        return res.status(400).json({ success: false, message: 'Post must have content or media' });
    }

    const postType = type || 'MOMENT';
    const validTypes = ['MOMENT', 'ACHIEVEMENT_UNLOCK', 'ACTIVITY_UPDATE', 'RALLY_BROADCAST'];
    if (!validTypes.includes(postType)) {
        return res.status(400).json({ success: false, message: `Invalid post type. Must be one of: ${validTypes.join(', ')}` });
    }

    try {
        const result = await pool.query(`
            INSERT INTO "posts" ("userID", "type", "content", "mediaURL")
            VALUES ($1, $2, $3, $4)
            RETURNING "postID", "type", "content", "mediaURL", "timestampUTC"
        `, [userId, postType, content || null, mediaURL || null]);

        res.status(201).json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/feed/posts/:postId
// Delete a post (only own posts)
router.delete('/posts/:postId', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { postId } = req.params;

    try {
        const result = await pool.query(`
            DELETE FROM "posts" WHERE "postID" = $1 AND "userID" = $2
            RETURNING "postID"
        `, [postId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Post not found or not authorized' });
        }

        res.json({ success: true, message: 'Post deleted' });

    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
