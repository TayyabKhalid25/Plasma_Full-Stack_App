const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isOnline } = require('../ws/presence');
const { fetchHallOfFame } = require('../utils/hallOfFameService');

const router = express.Router();

/**
 * GET /api/users/search
 * Searches for users by username (partial match). Excludes the authenticated user.
 *
 * @requires authenticateToken
 * @param {string} req.query.q - Search string
 * @returns {{ success: boolean, data: UserSearchInfo[] }}
 * @throws {500} Internal server error
 */
router.get('/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
        return res.json({ success: true, data: [] });
    }

    try {
        const result = await pool.query(`
            SELECT 
                u."plasmaUserID", 
                u."username", 
                p."avatarURL",
                p."isSteamProfilePrivate",
                fr."followID" IS NOT NULL AS "isRequested",
                fr."isMutual"
            FROM "users" u
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            LEFT JOIN "follow_relationships" fr ON u."plasmaUserID" = fr."followedID" AND fr."followerID" = $2
            WHERE u."username" ILIKE $1 AND u."plasmaUserID" != $2
            LIMIT 10
        `, [`%${q.trim()}%`, req.userId]);

        const mappedUsers = result.rows.map(row => {
            if (row.isSteamProfilePrivate) {
                row.steamProfilePrivateError = "User's profile is private";
            }
            delete row.isSteamProfilePrivate;
            return row;
        });

        res.json({ success: true, data: mappedUsers });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/users/friends
 * Returns the authenticated user's friends grouped by: requests, online, offline.
 * Migrated from the deprecated /api/friends endpoint.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, data: { requests: User[], online: User[], offline: User[] } }}
 */
router.get('/friends', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        const result = await pool.query(`
            SELECT DISTINCT ON (u."plasmaUserID")
                u."plasmaUserID", 
                u."username", 
                u."intent", 
                pr."avatarURL",
                fr."isMutual",
                fr."followerID",
                (SELECT g."title" 
                 FROM "library_entries" le 
                 JOIN "games" g ON le."appID" = g."appID" 
                 WHERE le."userID" = u."plasmaUserID" AND le."isCurrentlyPlaying" = TRUE 
                 LIMIT 1) as "playingGame"
            FROM "follow_relationships" fr
            JOIN "users" u ON (u."plasmaUserID" = fr."followedID" OR u."plasmaUserID" = fr."followerID")
            LEFT JOIN "profiles" pr ON u."plasmaUserID" = pr."plasmaUserID"
            WHERE (fr."followerID" = $1 OR fr."followedID" = $1)
              AND u."plasmaUserID" != $1
        `, [userId]);

        const friends = { requests: [], online: [], offline: [] };

        result.rows.forEach(row => {
            const userObj = { 
                id: row.plasmaUserID, 
                name: row.username, 
                intent: row.intent, 
                avatar: row.avatarURL,
                playingGame: row.playingGame 
            };
            if (!row.isMutual && row.followerID !== userId) {
                friends.requests.push(userObj);
            } else if (row.isMutual) {
                if (isOnline(row.plasmaUserID)) {
                    friends.online.push(userObj);
                } else {
                    friends.offline.push(userObj);
                }
            }
        });

        res.json({ success: true, data: friends });

    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/users/:userId
 * Retrieves another user's public profile, follow relationships, and Hall of Fame.
 *
 * @requires authenticateToken
 * @param {string} req.params.userId - UUID of the target user
 * @returns {{ success: boolean, data: UserProfileData }}
 * @throws {404} User not found
 * @throws {500} Internal server error
 */
router.get('/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const loggedInUserId = req.userId;

    try {
        const userResult = await pool.query(`
            SELECT 
                u."plasmaUserID", 
                u."username", 
                u."intent", 
                u."steamID64" IS NOT NULL AS "isSteamLinked",
                p."avatarURL", 
                p."bio", 
                p."totalPlasmaXP",
                p."steamPersonaName",
                p."steamProfileURL",
                p."lastLogoff",
                p."steamMemberSince",
                p."countryCode",
                p."isSteamProfilePrivate",
                (SELECT g."title" FROM "library_entries" le JOIN "games" g ON le."appID" = g."appID" WHERE le."userID" = u."plasmaUserID" AND le."isCurrentlyPlaying" = TRUE LIMIT 1) as "playingGame",
                (SELECT le."lastPlayedAt" FROM "library_entries" le WHERE le."userID" = u."plasmaUserID" AND le."isCurrentlyPlaying" = TRUE LIMIT 1) as "playingSince"
            FROM "users" u
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE u."plasmaUserID" = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = userResult.rows[0];

        if (user.isSteamProfilePrivate) {
            user.steamProfilePrivateError = "User's profile is private";
        }
        delete user.isSteamProfilePrivate;

        // Check mutual follow status
        const followCheck = await pool.query(`
            SELECT "isMutual" FROM "follow_relationships"
            WHERE "followerID" = $1 AND "followedID" = $2
        `, [loggedInUserId, userId]);

        const isFollowing = followCheck.rows.length > 0;
        const isMutual = isFollowing ? followCheck.rows[0].isMutual : false;

        // NEW: Check if THEY are following US (incoming request)
        const followerCheck = await pool.query(`
            SELECT 1 FROM "follow_relationships"
            WHERE "followerID" = $1 AND "followedID" = $2
        `, [userId, loggedInUserId]);
        const isFollower = followerCheck.rows.length > 0;

        // Fetch Hall of Fame
        const hallOfFame = await fetchHallOfFame(userId);

        res.json({
            success: true,
            data: {
                profile: {
                    ...user,
                    online: isOnline(userId)
                },
                isFollowing,
                isMutual,
                isFollower,
                hallOfFame: hallOfFame
            }
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * PUT /api/users/me/intent
 * Updates the user's current intent mode (e.g., COMPETITIVE, CHILL, OFFLINE).
 *
 * @requires authenticateToken
 * @param {string} req.body.intent - Intent mode
 * @returns {{ success: boolean, message: string, intent: string }}
 * @throws {400} Invalid intent mode
 * @throws {500} Internal server error
 */
router.put('/me/intent', authenticateToken, async (req, res) => {
    const { intent } = req.body;

    // Map frontend shorthand 'COMP' to DB value 'COMPETITIVE'
    let dbIntent = intent.toUpperCase();
    if (dbIntent === 'COMP') dbIntent = 'COMPETITIVE';

    const allowedIntents = ['COMPETITIVE', 'CHILL', 'OFFLINE'];
    if (!allowedIntents.includes(dbIntent)) {
        return res.status(400).json({ success: false, message: 'Invalid intent mode' });
    }

    try {
        await pool.query(`
            UPDATE "users" SET "intent" = $1 WHERE "plasmaUserID" = $2
        `, [dbIntent, req.userId]);

        res.json({ success: true, message: 'Intent updated successfully', intent: dbIntent });
    } catch (error) {
        console.error('Error updating intent:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * PUT /api/users/me/profile
 * Updates the user's customizable profile fields (username, bio, avatarURL).
 *
 * @requires authenticateToken
 * @param {string} [req.body.username] - New username
 * @param {string} [req.body.bio] - New bio
 * @param {string} [req.body.avatarURL] - New avatar URL
 * @returns {{ success: boolean, message: string }}
 * @throws {500} Internal server error
 */
router.put('/me/profile', authenticateToken, async (req, res) => {
    const { username, bio, avatarURL } = req.body;
    const userId = req.userId;

    try {
        // 1. Update users table (username, steamID64)
        if (username) {
            await pool.query(`
                UPDATE "users" 
                SET "username" = COALESCE($1, "username")
                WHERE "plasmaUserID" = $2
            `, [username, userId]);
        }

        // 2. Update bio and avatarURL in profiles table
        await pool.query(`
            UPDATE "profiles" 
            SET "bio" = COALESCE($1, "bio"),
                "avatarURL" = COALESCE($2, "avatarURL")
            WHERE "plasmaUserID" = $3
        `, [bio, avatarURL, userId]);

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * DELETE /api/users/me
 * Permanently deletes the user's account and associated data. (GDPR Right to be forgotten)
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, message: string }}
 * @throws {500} Internal server error
 */
router.delete('/me', authenticateToken, async (req, res) => {
    try {
        // Cascade delete will handle relationships in the DB if configured correctly
        await pool.query(`DELETE FROM "users" WHERE "plasmaUserID" = $1`, [req.userId]);
        res.json({ success: true, message: 'Account queued for deletion.' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});



/**
 * POST /api/users/:userId/follow
 * Follows a user. If the target user is already following the requestor, forms a mutual friendship.
 * Triggers appropriate notifications.
 *
 * @requires authenticateToken
 * @param {string} req.params.userId - UUID of the target user
 * @returns {{ success: boolean, message: string, isMutual: boolean }}
 * @throws {400} Cannot follow yourself or already following
 * @throws {404} User not found
 * @throws {500} Internal server error
 */
router.post('/:userId/follow', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const followerId = req.userId;

    if (userId === followerId) {
        return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    try {
        // Check if the target user exists
        const userCheck = await pool.query(`SELECT "plasmaUserID" FROM "users" WHERE "plasmaUserID" = $1`, [userId]);
        if (userCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        // Check if already following
        const existing = await pool.query(`SELECT "followID" FROM "follow_relationships" WHERE "followerID" = $1 AND "followedID" = $2`, [followerId, userId]);
        if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'Already following this user' });

        // Check if the other person is already following us
        const reverseFollow = await pool.query(`SELECT "followID" FROM "follow_relationships" WHERE "followerID" = $1 AND "followedID" = $2`, [userId, followerId]);
        const isMutual = reverseFollow.rows.length > 0;

        await pool.query(`
            INSERT INTO "follow_relationships" ("followerID", "followedID", "isMutual")
            VALUES ($1, $2, $3)
        `, [followerId, userId, isMutual]);

        if (isMutual) {
            // Update the reverse record as well
            await pool.query(`
                UPDATE "follow_relationships" SET "isMutual" = TRUE 
                WHERE "followerID" = $1 AND "followedID" = $2
            `, [userId, followerId]);

            // Notify: Friend Accepted
            await pool.query(`
                INSERT INTO "notifications" ("receiverID", "senderID", "notificationType", "message", "linkURI")
                VALUES ($1, $2, 'FRIEND_ACCEPTED', 'accepted your friend request!', $3)
            `, [userId, followerId, `/profile/${followerId}`]);
        } else {
            // Notify: Friend Request
            await pool.query(`
                INSERT INTO "notifications" ("receiverID", "senderID", "notificationType", "message", "linkURI")
                VALUES ($1, $2, 'FRIEND_REQUEST', 'sent you a friend request!', $3)
            `, [userId, followerId, `/profile/${followerId}`]);
        }

        res.json({ success: true, message: isMutual ? 'Friend request accepted!' : 'Friend request sent!', isMutual });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * DELETE /api/users/:userId/follow
 * Unfollows a user. If a mutual friendship existed, it is broken down to a one-way follow.
 *
 * @requires authenticateToken
 * @param {string} req.params.userId - UUID of the target user
 * @returns {{ success: boolean, message: string }}
 * @throws {500} Internal server error
 */
router.delete('/:userId/follow', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const followerId = req.userId;

    try {
        const result = await pool.query(`
            DELETE FROM "follow_relationships" 
            WHERE "followerID" = $1 AND "followedID" = $2
            RETURNING "isMutual"
        `, [followerId, userId]);

        if (result.rows.length > 0 && result.rows[0].isMutual) {
            // Break mutual tie
            await pool.query(`
                UPDATE "follow_relationships" SET "isMutual" = FALSE
                WHERE "followerID" = $1 AND "followedID" = $2
            `, [userId, followerId]);
        }

        res.json({ success: true, message: 'Unfollowed successfully' });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});



/**
 * GET /api/users/:userId/followers
 * Retrieves the list of users following the target user.
 *
 * @requires authenticateToken
 * @param {string} req.params.userId - UUID of the target user
 * @returns {{ success: boolean, data: FollowerInfo[] }}
 * @throws {500} Internal server error
 */
router.get('/:userId/followers', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT u."plasmaUserID", u."username", p."avatarURL", fr."isMutual"
            FROM "follow_relationships" fr
            JOIN "users" u ON fr."followerID" = u."plasmaUserID"
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE fr."followedID" = $1
        `, [userId]);

        const data = result.rows.map(row => ({
            ...row,
            online: isOnline(row.plasmaUserID)
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/users/:userId/following
 * Retrieves the list of users the target user is following.
 *
 * @requires authenticateToken
 * @param {string} req.params.userId - UUID of the target user
 * @returns {{ success: boolean, data: FollowerInfo[] }}
 * @throws {500} Internal server error
 */
router.get('/:userId/following', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT u."plasmaUserID", u."username", p."avatarURL", fr."isMutual"
            FROM "follow_relationships" fr
            JOIN "users" u ON fr."followedID" = u."plasmaUserID"
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            WHERE fr."followerID" = $1
        `, [userId]);

        const data = result.rows.map(row => ({
            ...row,
            online: isOnline(row.plasmaUserID)
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
