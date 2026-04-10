const { pool } = require('../config/dbConfig');

async function getUserBaseStats(userId) {
    const baseStatsQuery = `
        SELECT
            (SELECT COUNT(DISTINCT movieid) FROM activity WHERE userid = $1) AS "uniqueMoviesWatched",
            (SELECT COUNT(movieid)          FROM activity WHERE userid = $1 AND islogged = true) AS "loggedMoviesCount",
            (SELECT COUNT(*)                FROM userlikedmovies WHERE userid = $1) AS "likedMoviesCount",
            (SELECT m.moviebackdroplink
             FROM userfavorites uf
             JOIN movies m ON uf.movieid = m.movieid
             WHERE uf.userid = $1
             ORDER BY uf.rank ASC
             LIMIT 1) AS "firstFavoriteBackdrop"
    `;

    try {
        const statsResult = await pool.query(baseStatsQuery, [userId]);
        const row = statsResult.rows[0] || {};
        return {
            uniqueMoviesWatched: parseInt(row.uniqueMoviesWatched) || 0,
            loggedMoviesCount: parseInt(row.loggedMoviesCount) || 0,
            likedMoviesCount: parseInt(row.likedMoviesCount) || 0,
            firstFavoriteBackdrop: row.firstFavoriteBackdrop || null
        };
    } catch (error) {
        console.error('Error fetching user stats:', error);
        throw error;
    }
}

async function isFriend(loggedInUserId, otherUserId) {
    // If same user, treat as self — always "friends"
    if (loggedInUserId === otherUserId) {
        return true;
    }

    // Ensure the smaller ID goes into user1id (schema constraint)
    const [u1, u2] = loggedInUserId < otherUserId
        ? [loggedInUserId, otherUserId]
        : [otherUserId, loggedInUserId];

    try {
        const result = await pool.query(`
            SELECT COUNT(*) AS cnt
            FROM friends
            WHERE user1id = $1
              AND user2id = $2
        `, [u1, u2]);

        return parseInt(result.rows[0].cnt) > 0;
    } catch (err) {
        console.error('isFriend error:', err);
        throw err;
    }
}

async function getFavMovieBg(userId) {
    try {
        const result = await pool.query(`
            SELECT m.moviebackdroplink AS "firstFavoriteBackdrop"
            FROM userfavorites uf
            JOIN movies m ON uf.movieid = m.movieid
            WHERE uf.userid = $1
            ORDER BY uf.rank ASC
            LIMIT 1
        `, [userId]);

        return result.rows[0]?.firstFavoriteBackdrop || null;
    } catch (error) {
        console.error('Error fetching favorite movie backdrop:', error);
        throw error;
    }
}

module.exports = { getUserBaseStats, isFriend, getFavMovieBg };