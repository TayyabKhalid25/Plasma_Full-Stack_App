const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/leaderboard
// Query Params: ?scope= (global, friends)
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const scope = req.query.scope || 'friends';

    try {
        let query = '';
        let queryParams = [];

        if (scope === 'global') {
            query = `
                WITH ranked_profiles AS (
                    SELECT
                        p."plasmaUserID",
                        p."avatarURL",
                        p."totalPlasmaXP",
                        RANK() OVER (ORDER BY p."totalPlasmaXP" DESC NULLS LAST) AS "globalRank"
                    FROM "profiles" p
                )
                SELECT
                    u."plasmaUserID",
                    u."username",
                    u."intent",
                    rp."avatarURL",
                    rp."totalPlasmaXP",
                    rp."globalRank"
                FROM "users" u
                JOIN ranked_profiles rp ON u."plasmaUserID" = rp."plasmaUserID"
                ORDER BY rp."totalPlasmaXP" DESC NULLS LAST
                LIMIT 100
            `;
        } else {
            // Friends scope
            query = `
                WITH ranked_profiles AS (
                    SELECT
                        p."plasmaUserID",
                        p."avatarURL",
                        p."totalPlasmaXP",
                        RANK() OVER (ORDER BY p."totalPlasmaXP" DESC NULLS LAST) AS "globalRank"
                    FROM "profiles" p
                )
                SELECT
                    u."plasmaUserID",
                    u."username",
                    u."intent",
                    rp."avatarURL",
                    rp."totalPlasmaXP",
                    rp."globalRank"
                FROM "users" u
                JOIN ranked_profiles rp ON u."plasmaUserID" = rp."plasmaUserID"
                WHERE u."plasmaUserID" IN (
                    SELECT "followedID" FROM "follow_relationships" WHERE "followerID" = $1 AND "isMutual" = TRUE
                    UNION
                    SELECT $1::uuid
                )
                ORDER BY rp."totalPlasmaXP" DESC NULLS LAST
            `;
            queryParams = [userId];
        }

        const result = await pool.query(query, queryParams);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
