const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper to fetch prestige
async function fetchPrestige(userId) {
    const profile = await pool.query(`SELECT "totalPlasmaXP" FROM "profiles" WHERE "plasmaUserID" = $1`, [userId]);
    const totalPlasmaXP = profile.rows.length > 0 ? parseInt(profile.rows[0].totalPlasmaXP) || 0 : 0;

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
    
    return {
        totalPlasmaXP: totalPlasmaXP,
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
        const data = await fetchPrestige(req.params.userId);
        
        // Ensure user exists
        const userExists = await pool.query('SELECT "plasmaUserID" FROM "users" WHERE "plasmaUserID" = $1', [req.params.userId]);
        if (userExists.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        
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
                WHERE "userID" = $1 AND "achievementID" = ANY($2::uuid[])
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
    const { title, description, category } = req.body;
    
    // Stub for manual milestone creation
    try {
        const result = await pool.query(`
            INSERT INTO "achievements" ("achievementID", "appID", "title", "rarityWeight", "plasmaXP")
            VALUES ($1, 'custom_milestone', $2, 1.0, 50)
            RETURNING "achievementID"
        `, [`milestone_${Date.now()}`, title]);
        
        await pool.query(`
            INSERT INTO "user_achievements" ("userID", "achievementID", "unlockedAt")
            VALUES ($1, $2, CURRENT_TIMESTAMP)
        `, [req.userId, result.rows[0].achievementID]);
        
        res.status(201).json({ success: true, message: 'Milestone recorded manually' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/prestige/milestones/:milestoneId/endorse
router.post('/milestones/:milestoneId/endorse', authenticateToken, async (req, res) => {
    // Stub for peer endorsement logic BR-3
    res.json({ success: true, message: 'Endorsement recorded successfully' });
});

module.exports = router;
