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
        // Ensure user exists
        const userExists = await pool.query('SELECT "plasmaUserID" FROM "users" WHERE "plasmaUserID" = $1', [userId]);
        if (userExists.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
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
// Returns all achievements for a game, indicating which ones the current user has unlocked
router.get('/game/:appID', authenticateToken, async (req, res) => {
    const { appID } = req.params;
    const userId = req.userId;

    try {
        // 1. Get Game Metadata
        const gameResult = await pool.query(`
            SELECT "appID", "title", "platform", "coverArtURL", "isManualEntry"
            FROM "games" WHERE "appID" = $1
        `, [appID]);

        if (gameResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Game not found' });
        }

        // 2. Get All Achievements for this game with user unlock status
        const achievementsResult = await pool.query(`
            SELECT 
                a."achievementID",
                a."title",
                a."description",
                a."proofUrl",
                a."rarityWeight",
                a."plasmaXP",
                ua."unlockedAt",
                CASE WHEN ua."achievementID" IS NOT NULL THEN TRUE ELSE FALSE END AS "isUnlocked"
            FROM "achievements" a
            LEFT JOIN "user_achievements" ua ON a."achievementID" = ua."achievementID" AND ua."userID" = $1
            WHERE a."appID" = $2
            ORDER BY a."plasmaXP" DESC, a."title" ASC
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
            SELECT 
                u."plasmaUserID" AS "friendID",
                u."username",
                p."avatarURL",
                a."achievementID",
                a."title" AS "achievementTitle",
                ua."unlockedAt"
            FROM "follow_relationships" fr
            JOIN "users" u ON (fr."followedID" = u."plasmaUserID" AND fr."followerID" = $1)
                           OR (fr."followerID" = u."plasmaUserID" AND fr."followedID" = $1)
            JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            JOIN "user_achievements" ua ON u."plasmaUserID" = ua."userID"
            JOIN "achievements" a ON ua."achievementID" = a."achievementID"
            WHERE fr."isMutual" = TRUE AND a."appID" = $2
            ORDER BY ua."unlockedAt" DESC
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

        res.json({ success: true, data: Object.values(friendsMap) });
    } catch (error) {
        console.error('Error fetching friends game achievements:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
