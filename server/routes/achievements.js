const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const { enforcePrivacy } = require('../utils/privacyCheck');
const { fetchHallOfFame } = require('../utils/hallOfFameService');

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

    const achievementResult = await pool.query(`
        SELECT 
            a."achievementID",
            a."title",
            a."description",
            a."rarityWeight",
            a."plasmaXP",
            a."iconName",
            a."globalPercentage",
            a."appID",
            ua."unlockedAt",
            COALESCE(g."title", 'Unknown Game') AS "gameTitle",
            g."platform",
            g."isManualEntry"
        FROM "user_achievements" ua
        JOIN "achievements" a ON ua."achievementID" = a."achievementID"
        LEFT JOIN "games" g ON a."appID" = g."appID"
        WHERE ua."userID" = $1 ${platformFilter}
        ORDER BY ${sortField} ${sortDir}
    `, [userId]);

    const gamesProgressMap = {};
    const gameOrder = []; // To preserve game order from the SQL results

    achievementResult.rows.forEach(row => {
        const groupKey = row.appID || 'unknown';
        if (!gamesProgressMap[groupKey]) {
            gameOrder.push(groupKey);
            gamesProgressMap[groupKey] = {
                appID: row.appID || null,
                gameTitle: row.gameTitle || "Unknown Game",
                platform: row.platform,
                isManualEntry: row.isManualEntry,
                totalPlasmaXP: 0,
                achievements: []
            };
        }
        gamesProgressMap[groupKey].totalPlasmaXP += row.plasmaXP;
        gamesProgressMap[groupKey].achievements.push({
            achievementID: row.achievementID,
            title: row.title,
            description: row.description,
            rarityWeight: row.rarityWeight,
            plasmaXP: row.plasmaXP,
            iconName: row.iconName,
            globalPercentage: row.globalPercentage ?? null,
            unlockedAt: row.unlockedAt,
            gameTitle: row.gameTitle
        });
    });

    return gameOrder.map(key => gamesProgressMap[key]);
}

/**
 * GET /api/achievements
 * Fetches the authenticated user's achievements grouped by game,
 * along with their pinned Hall of Fame achievements.
 *
 * @requires authenticateToken
 * @param {string} [req.query.type='all'] - Filter by platform ('steam', 'manual', 'all')
 * @param {string} [req.query.orderBy='unlockedAt'] - Sorting field
 * @param {string} [req.query.direction='DESC'] - Sorting direction
 * @returns {{ success: boolean, data: { hallOfFame: Achievement[], gamesProgress: GameProgress[] } }}
 * @throws {500} Internal server error
 */
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { type = 'all', orderBy, direction } = req.query;

    try {
        // 1. Fetch Hall of Fame (isPinned = true)
        const hallOfFame = await fetchHallOfFame(userId);

        // 2. Fetch games progress using shared function
        const gamesProgress = await fetchUserAchievements(userId, { type, orderBy, direction });

        res.json({
            success: true,
            data: {
                hallOfFame: hallOfFame,
                gamesProgress: gamesProgress
            }
        });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/achievements/:userId
 * Fetches achievements for a specific user, subject to privacy checks.
 * Does not include Hall of Fame.
 *
 * @requires authenticateToken
 * @param {string} req.params.userId - UUID of the target user
 * @param {string} [req.query.type='all'] - Filter by platform ('steam', 'manual', 'all')
 * @param {string} [req.query.orderBy] - Sorting field
 * @param {string} [req.query.direction] - Sorting direction
 * @returns {{ success: boolean, data: { gamesProgress: GameProgress[] } }}
 * @throws {403} Access denied by privacy settings
 * @throws {500} Internal server error
 */
router.get('/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const { type = 'all', orderBy, direction } = req.query;

    try {
        // Centralized privacy enforcement
        const denied = await enforcePrivacy(req.userId, userId, res);
        if (denied) return;

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

/**
 * GET /api/achievements/game/:appID
 * Returns all achievements for a specific game, indicating which ones
 * the requesting user (or target user) has unlocked.
 *
 * @requires authenticateToken
 * @param {string} req.params.appID - App ID of the game
 * @param {string} [req.query.userId] - Optional UUID of target user (defaults to self)
 * @returns {{ success: boolean, data: { game: GameMetadata, achievements: AchievementStatus[] } }}
 * @throws {403} Access denied by privacy settings
 * @throws {500} Internal server error
 */
router.get('/game/:appID', authenticateToken, async (req, res) => {
    const { appID } = req.params;
    const userId = req.query.userId || req.userId;

    try {
        // Centralized privacy enforcement
        const denied = await enforcePrivacy(req.userId, userId, res);
        if (denied) return;

        // 2. Get Game Metadata
        const gameResult = await pool.query(`
            SELECT "appID", "title", "platform", "coverArtURL", "isManualEntry"
            FROM "games" WHERE "appID" = $1
        `, [appID]);

        const game = gameResult.rows.length > 0 
            ? gameResult.rows[0] 
            : { appID, title: 'Unknown Game', platform: 'Unknown', coverArtURL: null, isManualEntry: false };

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
                game: game,
                achievements: achievementsResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching game achievements:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/achievements/game/:appID/friends
 * Returns mutual friends who have unlocked achievements in a specific game.
 *
 * @requires authenticateToken
 * @param {string} req.params.appID - App ID of the game
 * @returns {{ success: boolean, data: FriendAchievementProgress[] }}
 * @throws {500} Internal server error
 */
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
                unlockedAt: row.unlockedAt === 'NULL' ? null : row.unlockedAt,
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
