const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Shared logic to fetch achievements grouped by game.
 * @param {string} userId 
 * @param {object} options - { type, orderBy, direction }
 * @returns {Promise<Array>} - Grouped achievements
 */
async function fetchUserAchievements(userId, options = {}) {
    const { type = 'all', orderBy = 'unlockedAt', direction = 'DESC' } = options;

    let platformFilter = '';
    if (type === 'steam') {
        platformFilter = `AND g."platform" = 'STEAM'`;
    } else if (type === 'manual') {
        platformFilter = `AND g."isManualEntry" = TRUE`;
    }

    // Validate and map sort fields to prevent SQL injection
    const validSortFields = {
        'unlockedAt': 'ua."unlockedAt"',
        'rarityWeight': 'a."rarityWeight"',
        'plasmaXP': 'a."plasmaXP"',
        'title': 'a."title"'
    };
    const sortField = validSortFields[orderBy] || 'ua."unlockedAt"';
    const sortDir = direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const gamesProgressResult = await pool.query(`
        SELECT 
            a."achievementID",
            a."title" AS "achievementTitle",
            a."description",
            a."proofUrl",
            a."rarityWeight",
            a."plasmaXP",
            ua."unlockedAt",
            g."appID",
            g."title" AS "gameTitle",
            g."platform",
            g."isManualEntry"
        FROM "user_achievements" ua
        JOIN "achievements" a ON ua."achievementID" = a."achievementID"
        JOIN "games" g ON a."appID" = g."appID"
        WHERE ua."userID" = $1 ${platformFilter}
        ORDER BY ${sortField} ${sortDir}
    `, [userId]);

    // Group the achievements by game for the frontend
    const gamesProgressMap = {};
    const gameOrder = []; // To preserve game order from the SQL results

    gamesProgressResult.rows.forEach(row => {
        if (!gamesProgressMap[row.appID]) {
            gameOrder.push(row.appID);
            gamesProgressMap[row.appID] = {
                appID: row.appID,
                gameTitle: row.gameTitle,
                platform: row.platform,
                isManualEntry: row.isManualEntry,
                totalPlasmaXP: 0,
                achievements: []
            };
        }
        gamesProgressMap[row.appID].totalPlasmaXP += row.plasmaXP;
        gamesProgressMap[row.appID].achievements.push({
            achievementID: row.achievementID,
            title: row.achievementTitle,
            description: row.description,
            proofUrl: row.proofUrl,
            rarityWeight: row.rarityWeight,
            plasmaXP: row.plasmaXP,
            globalPercentage: row.globalPercentage ?? null,
            unlockedAt: row.unlockedAt
        });
    });

    return gameOrder.map(appId => gamesProgressMap[appId]);
}

// GET /api/achievements
// Query Params: ?type= (steam, manual, all)
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { type = 'all', orderBy, direction } = req.query;

    try {
        // 1. Fetch Hall of Fame (isPinned = true)
        const hallOfFameResult = await pool.query(`
            SELECT 
                a."achievementID",
                a."appID",
                a."title" AS "achievementTitle",
                a."description",
                a."proofUrl",
                a."rarityWeight",
                a."plasmaXP",
                g."title" AS "gameTitle",
                g."coverArtURL"
            FROM "user_achievements" ua
            JOIN "achievements" a ON ua."achievementID" = a."achievementID"
            JOIN "games" g ON a."appID" = g."appID"
            WHERE ua."userID" = $1 AND ua."isPinned" = TRUE
            ORDER BY ua."unlockedAt" DESC
            LIMIT 5
        `, [userId]);

        // 2. Fetch games progress using shared function
        const gamesProgress = await fetchUserAchievements(userId, { type, orderBy, direction });

        res.json({
            success: true,
            data: {
                hallOfFame: hallOfFameResult.rows,
                gamesProgress: gamesProgress
            }
        });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/achievements/:userId
// Fetches achievements for a specific user (does NOT include Hall of Fame)
router.get('/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const { type = 'all', orderBy, direction } = req.query;

    try {
        // 1. Privacy Check
        if (userId !== req.userId) {
            const privacyCheck = await pool.query(`
                SELECT p."isSteamProfilePrivate", fr."isMutual"
                FROM "profiles" p
                LEFT JOIN "follow_relationships" fr ON (
                    (fr."followerID" = $1 AND fr."followedID" = $2) OR
                    (fr."followerID" = $2 AND fr."followedID" = $1)
                ) AND fr."isMutual" = TRUE
                WHERE p."plasmaUserID" = $2
            `, [req.userId, userId]);

            if (privacyCheck.rows.length > 0) {
                const { isSteamProfilePrivate, isMutual } = privacyCheck.rows[0];
                if (isSteamProfilePrivate && !isMutual) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'This user profile is private.', 
                        isPrivate: true 
                    });
                }
            }
        }

        const gamesProgress = await fetchUserAchievements(userId, { type, orderBy, direction });

        res.json({
            success: true,
            data: {
                gamesProgress: gamesProgress
            }
        });
    } catch (error) {
        console.error('Error fetching user achievements:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/achievements/game/:appID
// Returns all achievements for a game, indicating which ones the target user has unlocked
router.get('/game/:appID', authenticateToken, async (req, res) => {
    const { appID } = req.params;
    const userId = req.query.userId || req.userId;

    try {
        // 1. Privacy Check
        if (userId !== req.userId) {
            const privacyCheck = await pool.query(`
                SELECT p."isSteamProfilePrivate", fr."isMutual"
                FROM "profiles" p
                LEFT JOIN "follow_relationships" fr ON (
                    (fr."followerID" = $1 AND fr."followedID" = $2) OR
                    (fr."followerID" = $2 AND fr."followedID" = $1)
                ) AND fr."isMutual" = TRUE
                WHERE p."plasmaUserID" = $2
            `, [req.userId, userId]);

            if (privacyCheck.rows.length > 0) {
                const { isSteamProfilePrivate, isMutual } = privacyCheck.rows[0];
                if (isSteamProfilePrivate && !isMutual) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'This user profile is private.', 
                        isPrivate: true 
                    });
                }
            }
        }

        // 2. Get Game Metadata
        const gameResult = await pool.query(`
            SELECT "appID", "title", "platform", "coverArtURL", "isManualEntry"
            FROM "games" WHERE "appID" = $1
        `, [appID]);

        if (gameResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Game not found' });
        }

        // 2. Get All Achievements for this game with user unlock status
        const achievementsResult = await pool.query(`
            SELECT DISTINCT ON (a."achievementID")
                a."achievementID",
                a."title",
                a."description",
                a."rarityWeight",
                a."plasmaXP",
                a."globalPercentage",
                ua."unlockedAt",
                CASE WHEN ua."achievementID" IS NOT NULL THEN TRUE ELSE FALSE END AS "isUnlocked"
            FROM "achievements" a
            LEFT JOIN "user_achievements" ua ON a."achievementID" = ua."achievementID" AND ua."userID" = $1
            WHERE a."appID" = $2
            ORDER BY a."achievementID", ua."unlockedAt" DESC NULLS LAST, a."title" ASC
        `, [userId, appID]);

        res.json({ 
            success: true, 
            data: {
                game: gameResult.rows[0],
                achievements: achievementsResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching game achievements:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/achievements/game/:appID/friends
// Returns friends who have unlocked achievements in this game
router.get('/game/:appID/friends', authenticateToken, async (req, res) => {
    const { appID } = req.params;
    const userId = req.userId;

    try {
        // Fetch mutual friends' achievements for this game
        const result = await pool.query(`
            SELECT DISTINCT ON (u."plasmaUserID", a."achievementID")
                u."plasmaUserID" AS "friendID",
                u."username",
                p."avatarURL",
                a."achievementID",
                a."title" AS "achievementTitle",
                ua."unlockedAt"
            FROM "follow_relationships" fr
            JOIN "users" u ON (fr."followedID" = u."plasmaUserID" OR fr."followerID" = u."plasmaUserID")
            JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            JOIN "user_achievements" ua ON u."plasmaUserID" = ua."userID"
            JOIN "achievements" a ON ua."achievementID" = a."achievementID"
            WHERE (fr."followerID" = $1 OR fr."followedID" = $1)
              AND u."plasmaUserID" != $1
              AND fr."isMutual" = TRUE 
              AND a."appID" = $2
            ORDER BY u."plasmaUserID", a."achievementID", ua."unlockedAt" DESC
        `, [userId, appID]);

        // Group by friend
        const friendsMap = {};
        result.rows.forEach(row => {
            if (!friendsMap[row.friendID]) {
                friendsMap[row.friendID] = {
                    id: row.friendID,
                    username: row.username,
                    avatar: row.avatarURL,
                    unlockedCount: 0,
                    achievements: []
                };
            }
            friendsMap[row.friendID].unlockedCount++;
            friendsMap[row.friendID].achievements.push({
                id: row.achievementID,
                title: row.achievementTitle,
                unlockedAt: row.unlockedAt
            });
        });

        const friendsList = Object.values(friendsMap).map(f => {
            f.achievements.sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
            return f;
        });

        res.json({ success: true, data: friendsList });
    } catch (error) {
        console.error('Error fetching friends game achievements:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
