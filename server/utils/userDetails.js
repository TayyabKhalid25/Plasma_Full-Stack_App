const { pool } = require('../config/dbConfig');

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

module.exports = { isFriend };