const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/achievements
// Query Params: ?type= (steam, manual, all)
router.get('/', authenticateToken, async (req, res) => {
    // Note: Assuming authenticateToken puts the new UUID 'plasmaUserID' into req.userId
    const userId = req.userId; 
    const type = req.query.type || 'all';

    try {
        // 1. Fetch Hall of Fame (isPinned = true)
        const hallOfFameResult = await pool.query(`
            SELECT 
                a."achievementID",
                a."title" AS "achievementTitle",
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

        // 2. Fetch games progress
        let platformFilter = '';
        if (type === 'steam') {
            platformFilter = `AND g."platform" = 'STEAM'`;
        } else if (type === 'manual') {
            platformFilter = `AND g."isManualEntry" = TRUE`;
        }

        const gamesProgressResult = await pool.query(`
            SELECT 
                a."achievementID",
                a."title" AS "achievementTitle",
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
            ORDER BY ua."unlockedAt" DESC
        `, [userId]);

        // Group the achievements by game for the frontend
        const gamesProgressMap = {};
        gamesProgressResult.rows.forEach(row => {
            if (!gamesProgressMap[row.appID]) {
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
                rarityWeight: row.rarityWeight,
                plasmaXP: row.plasmaXP,
                unlockedAt: row.unlockedAt
            });
        });

        const gamesProgress = Object.values(gamesProgressMap);

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

module.exports = router;
