const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isOnline } = require('../ws/presence');
const { checkMutualFriendship } = require('../utils/friendshipUtils');

const router = express.Router();

/**
 * POST /api/pulse/posts
 * Creates a new MOMENT post for the authenticated user.
 *
 * @requires authenticateToken
 * @param {string} req.body.content - Text content of the post
 * @param {string} [req.body.mediaURL] - Optional media attachment
 * @returns {{ success: boolean, data: Post, message: string }}
 * @throws {500} Internal server error on DB failure
 */
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

/**
 * DELETE /api/pulse/posts/:postId
 * Deletes a post if the authenticated user is the author.
 *
 * @requires authenticateToken
 * @param {string} req.params.postId - UUID of the post to delete
 * @returns {{ success: boolean, message: string }}
 * @throws {403} Not authorized or post does not exist
 * @throws {500} Internal server error
 */
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

/**
 * PUT /api/pulse/posts/:postId
 * Updates the content or media of an existing post authored by the user.
 *
 * @requires authenticateToken
 * @param {string} req.params.postId - UUID of the post
 * @param {string} [req.body.content] - New text content
 * @param {string} [req.body.mediaURL] - New media attachment
 * @returns {{ success: boolean, data: Post, message: string }}
 * @throws {403} Not authorized or post does not exist
 * @throws {500} Internal server error
 */
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

/**
 * POST /api/pulse/posts/:postId/react
 * Toggles a reaction (e.g., LIKE) on a post. If adding, triggers a notification.
 *
 * @requires authenticateToken
 * @param {string} req.params.postId - UUID of the post
 * @param {string} [req.body.reactionType='LIKE'] - Type of reaction
 * @returns {{ success: boolean, message: string }}
 * @throws {500} Internal server error
 */
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
            } catch (notifErr) {
                console.error("Failed to trigger reaction notification:", notifErr.message);
            }

            res.json({ success: true, message: 'Reaction added' });
        }
    } catch (error) {
        console.error('Error reacting to post:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/pulse/posts/:postId/comments
 * Retrieves all comments for a specific post, including nested parent comments.
 *
 * @requires authenticateToken
 * @param {string} req.params.postId - UUID of the post
 * @returns {{ success: boolean, data: Comment[] }}
 * @throws {500} Internal server error
 */
router.get('/posts/:postId/comments', authenticateToken, async (req, res) => {
    const { postId } = req.params;

    try {
        const result = await pool.query(`
            SELECT 
                c."commentID", c."text", c."timestampUTC", c."parentCommentID",
                u."username", u."plasmaUserID", pr."avatarURL",
                pc."text" AS "parentText", pu."username" AS "parentUsername"
            FROM "comments" c
            JOIN "users" u ON c."userID" = u."plasmaUserID"
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
            LEFT JOIN "comments" pc ON c."parentCommentID" = pc."commentID"
            LEFT JOIN "users" pu ON pc."userID" = pu."plasmaUserID"
            WHERE c."postID" = $1
            ORDER BY c."timestampUTC" ASC
        `, [postId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/pulse/posts/:postId
 * Fetches a single post by ID with engagement metrics and author info.
 *
 * @requires authenticateToken
 * @param {string} req.params.postId - UUID of the post
 * @returns {{ success: boolean, data: Post }}
 * @throws {404} Post not found
 * @throws {500} Internal server error
 */
router.get('/posts/:postId', authenticateToken, async (req, res) => {
    const { postId } = req.params;

    try {
        const result = await pool.query(`
            SELECT p."postID", p."type", p."content", p."mediaURL", p."timestampUTC", p."deepLinkURI", p."intent",
                   u."username", u."plasmaUserID", pr."avatarURL",
                   -- Subqueries for engagement metrics
                   (SELECT COUNT(*) FROM "comments" WHERE "postID" = p."postID") AS "commentCount",
                   (SELECT COUNT(*) FROM "post_reactions" WHERE "postID" = p."postID") AS "reactionCount",
                   -- Determines if the requesting user has already reacted to this post
                   (SELECT EXISTS (SELECT 1 FROM "post_reactions" WHERE "postID" = p."postID" AND "userID" = $2)) AS "hasReacted"
            FROM "posts" p
            -- Attach author identity
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

/**
 * POST /api/pulse/posts/:postId/comments
 * Adds a comment to a post and notifies the post owner.
 *
 * @requires authenticateToken
 * @param {string} req.params.postId - UUID of the post
 * @param {string} req.body.content - Comment text
 * @param {string} [req.body.parentCommentID] - UUID of parent comment if replying
 * @returns {{ success: boolean, data: Comment, message: string }}
 * @throws {400} Content is required
 * @throws {500} Internal server error
 */
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const { content, parentCommentID } = req.body;

    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

    try {
        const result = await pool.query(`
            WITH inserted_comment AS (
                INSERT INTO "comments" ("postID", "userID", "text", "parentCommentID")
                VALUES ($1, $2, $3, $4)
                RETURNING "commentID", "text", "timestampUTC", "userID", "parentCommentID"
            )
            SELECT 
                ic.*, u."username", pr."avatarURL",
                pc."text" AS "parentText", pu."username" AS "parentUsername"
            FROM inserted_comment ic
            JOIN "users" u ON ic."userID" = u."plasmaUserID"
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
            LEFT JOIN "comments" pc ON ic."parentCommentID" = pc."commentID"
            LEFT JOIN "users" pu ON pc."userID" = pu."plasmaUserID"
        `, [postId, req.userId, content, parentCommentID]);

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

/**
 * GET /api/pulse/user/:userId
 * Retrieves the timeline of posts for a specific user.
 * Access is restricted to mutual friends unless viewing one's own profile.
 *
 * @requires authenticateToken
 * @param {string} req.params.userId - UUID of the user whose pulse feed to view
 * @returns {{ success: boolean, data: Post[] }}
 * @throws {403} Pulse feed is only visible to mutual friends
 * @throws {500} Internal server error
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;

    try {
        // Only mutual friends can view each other's pulse feed
        if (req.userId !== userId) {
            const isMutual = await checkMutualFriendship(req.userId, userId);
            if (!isMutual) {
                return res.status(403).json({ success: false, message: 'Pulse feed is only visible to mutual friends' });
            }
        }

        const result = await pool.query(`
            SELECT p."postID", p."type", p."content", p."mediaURL", p."timestampUTC", p."deepLinkURI", p."intent",
                   u."username", u."plasmaUserID", pr."avatarURL",
                   -- Subqueries for engagement metrics
                   (SELECT COUNT(*) FROM "comments" WHERE "postID" = p."postID") AS "commentCount",
                   (SELECT COUNT(*) FROM "post_reactions" WHERE "postID" = p."postID") AS "reactionCount",
                   -- Determines if the requesting user has already reacted to this post
                   (SELECT EXISTS (SELECT 1 FROM "post_reactions" WHERE "postID" = p."postID" AND "userID" = $2)) AS "hasReacted"
            FROM "posts" p
            -- Attach author identity
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

/**
 * GET /api/pulse/trending
 * Returns the top 3 games currently being played by the user's mutual friends who are online.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, data: TrendingGame[] }}
 * @throws {500} Internal server error
 */
router.get('/trending', authenticateToken, async (req, res) => {
    const myId = req.userId;
    try {
        // 1. Fetch all mutual friends currently "playing" a game according to the DB
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
            )
            SELECT 
                le."appID",
                le."userID",
                g."title"
            FROM "library_entries" le
            JOIN mutual_friends mf ON le."userID" = mf."friendID"
            JOIN "games" g ON le."appID" = g."appID"
            WHERE le."isCurrentlyPlaying" = TRUE
        `, [myId]);

        // 2. Filter the results in memory to only include friends who are actually online
        const onlinePlayingData = result.rows.filter(row => isOnline(row.userID));

        // 3. Aggregate the counts by appID/title
        const gameCounts = {};
        onlinePlayingData.forEach(row => {
            if (!gameCounts[row.appID]) {
                gameCounts[row.appID] = {
                    appID: row.appID,
                    title: row.title,
                    playingCount: 0
                };
            }
            gameCounts[row.appID].playingCount += 1;
        });

        // 4. Sort by count and take top 3
        const trending = Object.values(gameCounts)
            .sort((a, b) => b.playingCount - a.playingCount)
            .slice(0, 3);

        res.json({ success: true, data: trending });
    } catch (error) {
        console.error('Error fetching trending games:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
