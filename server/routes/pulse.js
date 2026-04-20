const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/pulse/posts
router.post('/posts', authenticateToken, async (req, res) => {
    const { content, mediaUrl } = req.body;
    
    try {
        const result = await pool.query(`
            INSERT INTO "posts" ("userID", "type", "content", "mediaURL")
            VALUES ($1, 'MOMENT', $2, $3)
            RETURNING "postID", "content", "timestampUTC"
        `, [req.userId, content, mediaUrl]);
        
        res.status(201).json({ success: true, data: result.rows[0], message: 'Post created successfully' });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/pulse/posts/:postId
router.delete('/posts/:postId', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    
    try {
        // Only allow deleting own posts
        const result = await pool.query(`
            DELETE FROM "posts" WHERE "postID" = $1 AND "userID" = $2
            RETURNING "postID"
        `, [postId, req.userId]);
        
        if (result.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Not authorized or post does not exist' });
        }
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/pulse/posts/:postId/react
router.post('/posts/:postId/react', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const { reactionType = 'LIKE' } = req.body;
    
    try {
        // Toggle reaction
        const existing = await pool.query(`
            SELECT "reactionID" FROM "post_reactions"
            WHERE "postID" = $1 AND "userID" = $2
        `, [postId, req.userId]);
        
        if (existing.rows.length > 0) {
            await pool.query(`DELETE FROM "post_reactions" WHERE "reactionID" = $1`, [existing.rows[0].reactionID]);
            res.json({ success: true, message: 'Reaction removed' });
        } else {
            await pool.query(`
                INSERT INTO "post_reactions" ("postID", "userID", "reactionType")
                VALUES ($1, $2, $3)
            `, [postId, req.userId, reactionType]);
            res.json({ success: true, message: 'Reaction added' });
        }
    } catch (error) {
        console.error('Error reacting to post:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/pulse/posts/:postId/comments
router.get('/posts/:postId/comments', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT c."commentID", c."text", c."timestampUTC", u."username", u."plasmaUserID"
            FROM "comments" c
            JOIN "users" u ON c."userID" = u."plasmaUserID"
            WHERE c."postID" = $1
            ORDER BY c."timestampUTC" ASC
        `, [postId]);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/pulse/posts/:postId/comments
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    
    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });
    
    try {
        const result = await pool.query(`
            INSERT INTO "comments" ("postID", "userID", "text")
            VALUES ($1, $2, $3)
            RETURNING "commentID", "text", "timestampUTC"
        `, [postId, req.userId, content]);
        
        res.status(201).json({ success: true, data: result.rows[0], message: 'Comment added' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
