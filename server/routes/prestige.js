const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const { enforcePrivacy } = require('../utils/privacyCheck');
const { fetchHallOfFame } = require('../utils/hallOfFameService');

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

    const hallOfFame = await fetchHallOfFame(userId);

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
        hallOfFame: hallOfFame
    };
}

/**
 * GET /api/prestige/me
 * Retrieves the authenticated user's prestige profile (level, rank, pinned achievements).
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, data: PrestigeProfile }}
 * @throws {500} Internal server error
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const data = await fetchPrestige(req.userId);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching prestige:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/prestige/:userId
 * Retrieves another user's prestige profile. Subject to privacy checks.
 *
 * @requires authenticateToken
 * @param {string} req.params.userId - UUID of the target user
 * @returns {{ success: boolean, data: PrestigeProfile }}
 * @throws {403} Access denied by privacy settings
 * @throws {500} Internal server error
 */
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Centralized privacy enforcement
        const denied = await enforcePrivacy(req.userId, userId, res);
        if (denied) return;

        const data = await fetchPrestige(userId);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching prestige:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * PUT /api/prestige/me/hall-of-fame
 * Updates the user's pinned achievements (Hall of Fame) up to a max of 5.
 *
 * @requires authenticateToken
 * @param {string[]} req.body.achievementIds - Array of up to 5 achievement IDs
 * @returns {{ success: boolean, message: string }}
 * @throws {400} Too many IDs provided
 * @throws {500} Internal server error
 */
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

/**
 * POST /api/prestige/milestones
 * Creates a custom manual milestone achievement for the user, granting them XP.
 *
 * @requires authenticateToken
 * @param {string} req.body.title - Milestone title
 * @param {string} [req.body.description] - Description of the milestone
 * @param {string} [req.body.gameId] - Optional associated game
 * @param {string} [req.body.proofUrl] - Optional URL proof
 * @returns {{ success: boolean, message: string, milestoneId: string }}
 * @throws {400} Title is required
 * @throws {500} Internal server error
 */
router.post('/milestones', authenticateToken, async (req, res) => {
    const { title, description, gameId, proofUrl } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    try {
        const result = await pool.query(`
            INSERT INTO "achievements" ("achievementID", "appID", "title", "description", "proofURL", "rarityWeight", "plasmaXP")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, 1.0, 100)
            RETURNING "achievementID"
        `, [gameId || 'custom_milestone', title, description, proofUrl || null]);

        await pool.query(`
            INSERT INTO "user_achievements" ("userID", "achievementID", "unlockedAt")
            VALUES ($1, $2, CURRENT_TIMESTAMP)
        `, [req.userId, result.rows[0].achievementID]);

        // ADD XP TO PROFILE
        await pool.query(`
            UPDATE "profiles" 
            SET "totalPlasmaXP" = "totalPlasmaXP" + 100
            WHERE "plasmaUserID" = $1
        `, [req.userId]);

        res.status(201).json({ success: true, message: 'Milestone recorded manually (+100 XP)', milestoneId: result.rows[0].achievementID });
    } catch (error) {
        console.error('Error creating milestone:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST /api/prestige/milestones/:milestoneId/endorse
 * Endorses another user's manual milestone (BR-3 stub).
 *
 * @requires authenticateToken
 * @param {string} req.params.milestoneId - UUID of the milestone
 * @returns {{ success: boolean, message: string }}
 */
router.post('/milestones/:milestoneId/endorse', authenticateToken, async (req, res) => {
    // Stub for peer endorsement logic BR-3
    res.json({ success: true, message: 'Endorsement recorded successfully' });
});

module.exports = router;
