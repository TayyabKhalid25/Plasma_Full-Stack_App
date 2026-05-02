const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/pulse/posts
router.post('/posts', authenticateToken, async (req, res) => {
    const { content } = req.body;
    const mediaURL = req.body.mediaURL || req.body.mediaUrl;

    try {
        // Fetch user's current intent
        const userRes = await pool.query('SELECT "intent" FROM "users" WHERE "plasmaUserID" = $1', [req.userId]);
        const currentIntent = userRes.rows[0]?.intent || 'CHILL';

        const result = await pool.query(`
            INSERT INTO "posts" ("userID", "type", "content", "mediaURL", "intent")
            VALUES ($1, 'MOMENT', $2, $3, $4)
            RETURNING "postID", "content", "mediaURL", "timestampUTC", "intent"
        `, [req.userId, content, mediaURL, currentIntent]);

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

// PUT /api/pulse/posts/:postId
router.put('/posts/:postId', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const mediaURL = req.body.mediaURL || req.body.mediaUrl;

    try {
        // Only allow updating own posts
        const result = await pool.query(`
            UPDATE "posts"
            SET "content" = COALESCE($1, "content"),
                "mediaURL" = COALESCE($2, "mediaURL")
            WHERE "postID" = $3 AND "userID" = $4
            RETURNING "postID", "content", "mediaURL", "timestampUTC"
        `, [content, mediaURL, postId, req.userId]);

        if (result.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Not authorized or post does not exist' });
        }
        res.json({ success: true, data: result.rows[0], message: 'Post updated successfully' });
    } catch (error) {
        console.error('Error updating post:', error);
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

            // Trigger Notification
            try {
                const postOwnerRes = await pool.query(`SELECT "userID" FROM "posts" WHERE "postID" = $1`, [postId]);
                if (postOwnerRes.rows.length > 0) {
                    const ownerId = postOwnerRes.rows[0].userID;
                    if (ownerId !== req.userId) {
                        await pool.query(`
                            INSERT INTO "notifications" ("receiverID", "senderID", "notificationType", "message", "linkURI")
                            VALUES ($1, $2, 'SYSTEM', $3, $4)
                        `, [ownerId, req.userId, `liked your post`, `/pulse`]);
                    }
                }
            } catch (notifErr) {}

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
            SELECT c."commentID", c."text", c."timestampUTC", u."username", u."plasmaUserID", pr."avatarURL"
            FROM "comments" c
            JOIN "users" u ON c."userID" = u."plasmaUserID"
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
            WHERE c."postID" = $1
            ORDER BY c."timestampUTC" ASC
        `, [postId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/pulse/posts/:postId
router.get('/posts/:postId', authenticateToken, async (req, res) => {
    const { postId } = req.params;

    try {
        const result = await pool.query(`
            SELECT p."postID", p."type", p."content", p."mediaURL", p."timestampUTC", p."intent",
                   u."username", u."plasmaUserID", pr."avatarURL",
                   (SELECT COUNT(*) FROM "comments" WHERE "postID" = p."postID") AS "commentCount",
                   (SELECT COUNT(*) FROM "post_reactions" WHERE "postID" = p."postID") AS "reactionCount",
                   (SELECT EXISTS (SELECT 1 FROM "post_reactions" WHERE "postID" = p."postID" AND "userID" = $2)) AS "hasReacted"
            FROM "posts" p
            JOIN "users" u ON p."userID" = u."plasmaUserID"
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
            WHERE p."postID" = $1 AND p."isVisible" = TRUE
        `, [postId, req.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching single post:', error);
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
            WITH inserted_comment AS (
                INSERT INTO "comments" ("postID", "userID", "text")
                VALUES ($1, $2, $3)
                RETURNING "commentID", "text", "timestampUTC", "userID"
            )
            SELECT ic.*, u."username", pr."avatarURL"
            FROM inserted_comment ic
            JOIN "users" u ON ic."userID" = u."plasmaUserID"
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
        `, [postId, req.userId, content]);

        const comment = result.rows[0];

        // Trigger Notification for post owner
        try {
            const postOwnerRes = await pool.query(`SELECT "userID" FROM "posts" WHERE "postID" = $1`, [postId]);
            if (postOwnerRes.rows.length > 0) {
                const ownerId = postOwnerRes.rows[0].userID;
                // Don't notify if commenting on own post
                if (ownerId !== req.userId) {
                    await pool.query(`
                        INSERT INTO "notifications" ("receiverID", "senderID", "notificationType", "message", "linkURI")
                        VALUES ($1, $2, 'SYSTEM', $3, $4)
                    `, [ownerId, req.userId, `commented on your post: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`, `/pulse`]);
                }
            }
        } catch (notifErr) {
            console.error("Failed to trigger comment notification:", notifErr);
        }

        res.status(201).json({ success: true, data: comment, message: 'Comment added' });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/pulse/user/:userId
router.get('/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;

    try {
        // Check if the requesting user is the same, or if they are mutual friends
        if (req.userId !== userId) {
            const friendCheck = await pool.query(`
                SELECT "isMutual" FROM "follow_relationships"
                WHERE ("followerID" = $1 AND "followedID" = $2)
                   OR ("followerID" = $2 AND "followedID" = $1)
                LIMIT 1
            `, [req.userId, userId]);

            if (friendCheck.rows.length === 0 || !friendCheck.rows[0].isMutual) {
                return res.status(403).json({ success: false, message: 'Pulse feed is only visible to mutual friends' });
            }
        }

        const result = await pool.query(`
            SELECT p."postID", p."type", p."content", p."mediaURL", p."timestampUTC", p."deepLinkURI", p."intent",
                   u."username", pr."avatarURL",
                   (SELECT COUNT(*) FROM "comments" WHERE "postID" = p."postID") AS "commentCount",
                   (SELECT COUNT(*) FROM "post_reactions" WHERE "postID" = p."postID") AS "reactionCount",
                   (SELECT EXISTS (SELECT 1 FROM "post_reactions" WHERE "postID" = p."postID" AND "userID" = $2)) AS "hasReacted"
            FROM "posts" p
            JOIN "users" u ON p."userID" = u."plasmaUserID"
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
            WHERE p."userID" = $1 AND p."isVisible" = TRUE
            ORDER BY p."timestampUTC" DESC
        `, [userId, req.userId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching user pulse:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/pulse/trending
// Calculates which games are "trending" based on mutual friends' current play status
router.get('/trending', authenticateToken, async (req, res) => {
    const myId = req.userId;
    try {
        const result = await pool.query(`
            WITH mutual_friends AS (
                SELECT DISTINCT
                    CASE 
                        WHEN "followerID" = $1 THEN "followedID"
                        ELSE "followerID"
                    END as "friendID"
                FROM "follow_relationships"
                WHERE ("followerID" = $1 OR "followedID" = $1)
                  AND "isMutual" = TRUE
            ),
            friend_activity AS (
                SELECT 
                    le."appID",
                    g."title",
                    COUNT(*) as "playingCount"
                FROM "library_entries" le
                JOIN mutual_friends mf ON le."userID" = mf."friendID"
                JOIN "games" g ON le."appID" = g."appID"
                WHERE le."isCurrentlyPlaying" = TRUE
                GROUP BY le."appID", g."title"
            )
            SELECT * FROM friend_activity
            ORDER BY "playingCount" DESC
            LIMIT 3
        `, [myId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching trending games:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
