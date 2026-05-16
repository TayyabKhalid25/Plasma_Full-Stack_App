// =============================================================================
// HALL OF FAME SERVICE — Centralized pinned achievements query
// =============================================================================
// Fetches a user's "Hall of Fame" — up to 5 achievements that the user has
// pinned (isPinned = TRUE). This query was duplicated across users.js,
// achievements.js, and prestige.js with minor column variations.
//
// Returns ALL commonly used columns so each route can use what it needs.
// =============================================================================

const { pool } = require('../config/dbConfig');

/**
 * Fetches a user's pinned achievements (Hall of Fame).
 *
 * @param {string} userId - UUID of the user
 * @returns {Promise<Array>} Array of pinned achievement objects
 */
async function fetchHallOfFame(userId) {
    const result = await pool.query(`
        SELECT 
            a."achievementID",
            a."appID",
            a."title",
            a."description",
            a."rarityWeight",
            a."plasmaXP",
            a."iconName",
            ua."unlockedAt",
            COALESCE(g."title", 'Unknown Game') AS "gameTitle",
            g."coverArtURL"
        FROM "user_achievements" ua
        JOIN "achievements" a ON ua."achievementID" = a."achievementID"
        LEFT JOIN "games" g ON a."appID" = g."appID"
        WHERE ua."userID" = $1 AND ua."isPinned" = TRUE
        ORDER BY ua."unlockedAt" DESC
        LIMIT 5
    `, [userId]);

    return result.rows;
}

module.exports = { fetchHallOfFame };
