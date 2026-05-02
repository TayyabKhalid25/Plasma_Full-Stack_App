const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper to fetch prestige
async function fetchPrestige(userId) {
    const profile = await pool.query(`
        SELECT q."totalPlasmaXP", q."globalRank"
        FROM (
            SELECT
                p."plasmaUserID",
                p."totalPlasmaXP",
                RANK() OVER (ORDER BY p."totalPlasmaXP" DESC NULLS LAST) AS "globalRank"
            FROM "profiles" p
        ) q
        WHERE q."plasmaUserID" = $1
    `, [userId]);
    const totalPlasmaXP = profile.rows.length > 0 ? parseInt(profile.rows[0].totalPlasmaXP) || 0 : 0;
    const globalRank = profile.rows.length > 0 ? profile.rows[0].globalRank : null;

    const summary = await pool.query(`
        SELECT COUNT(*) as "earned"
        FROM "user_achievements" ua
        WHERE ua."userID" = $1
    `, [userId]);

    const hallOfFame = await pool.query(`
        SELECT a."achievementID", a."title", a."plasmaXP", a."rarityWeight"
        FROM "user_achievements" ua
        JOIN "achievements" a ON ua."achievementID" = a."achievementID"
        WHERE ua."userID" = $1 AND ua."isPinned" = TRUE
    `, [userId]);

    // Level Calculation (1000 XP per level)
    const level = Math.floor(totalPlasmaXP / 1000) + 1;
    const nextLevelXP = level * 1000;
    const currentLevelStartXP = (level - 1) * 1000;
    const progressXP = totalPlasmaXP - currentLevelStartXP;
    const progressPercentage = Math.min(Math.floor((progressXP / 1000) * 100), 100);

    return {
        totalPlasmaXP: totalPlasmaXP,
        globalRank: globalRank,
        level: level,
        nextLevelXP: nextLevelXP,
        progressPercentage: progressPercentage,
        unlockedCount: parseInt(summary.rows[0].earned) || 0,
        hallOfFame: hallOfFame.rows
    };
}

// GET /api/prestige/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const data = await fetchPrestige(req.userId);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching prestige:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/prestige/:userId
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        // Ensure user exists
        const userExists = await pool.query('SELECT "plasmaUserID" FROM "users" WHERE "plasmaUserID" = $1', [req.params.userId]);
        if (userExists.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        const data = await fetchPrestige(req.params.userId);

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/prestige/me/hall-of-fame
router.put('/me/hall-of-fame', authenticateToken, async (req, res) => {
    const { achievementIds } = req.body; // Array of IDs up to 5

    if (!Array.isArray(achievementIds) || achievementIds.length > 5) {
        return res.status(400).json({ success: false, message: 'Provide an array of up to 5 achievement IDs' });
    }

    try {
        // Reset all pins
        await pool.query(`UPDATE "user_achievements" SET "isPinned" = FALSE WHERE "userID" = $1`, [req.userId]);

        // Set new pins
        if (achievementIds.length > 0) {
            await pool.query(`
                UPDATE "user_achievements" SET "isPinned" = TRUE 
                WHERE "userID" = $1 AND "achievementID" = ANY($2::text[])
            `, [req.userId, achievementIds]);
        }

        res.json({ success: true, message: 'Hall of Fame updated successfully' });
    } catch (error) {
        console.error('Error updating hall of fame:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/prestige/milestones
router.post('/milestones', authenticateToken, async (req, res) => {
    const { title, description, gameId, proofUrl } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    try {
        const result = await pool.query(`
            INSERT INTO "achievements" ("achievementID", "appID", "title", "description", "proofUrl", "rarityWeight", "plasmaXP")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, 1.0, 50)
            RETURNING "achievementID"
        `, [gameId || 'custom_milestone', title, description, proofUrl]);

        await pool.query(`
            INSERT INTO "user_achievements" ("userID", "achievementID", "unlockedAt")
            VALUES ($1, $2, CURRENT_TIMESTAMP)
        `, [req.userId, result.rows[0].achievementID]);

        // ADD XP TO PROFILE
        await pool.query(`
            UPDATE "profiles" 
            SET "totalPlasmaXP" = "totalPlasmaXP" + 50 
            WHERE "plasmaUserID" = $1
        `, [req.userId]);

        res.status(201).json({ success: true, message: 'Milestone recorded manually (+50 XP)', milestoneId: result.rows[0].achievementID });
    } catch (error) {
        console.error('Error creating milestone:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/prestige/milestones/:milestoneId/endorse
router.post('/milestones/:milestoneId/endorse', authenticateToken, async (req, res) => {
    // Stub for peer endorsement logic BR-3
    res.json({ success: true, message: 'Endorsement recorded successfully' });
});

module.exports = router;
