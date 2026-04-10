const express = require('express');
const { authenticateToken, jwt } = require('../middleware/authMiddleware');
const { getUserBaseStats, isFriend, getFavMovieBg } = require('../utils/userDetails');
const { processMoviesWithDirectors } = require('../utils/processMovies');
const { pool } = require('../config/dbConfig');
const router = express.Router();

// Send Friend Request (Requires JWT token with userid)
router.post('/friendRequest', authenticateToken, async (req, res) => {
    const { userId, message } = req.body;
    const loggedInUserId = req.userId;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    if (loggedInUserId === userId) {
        return res.status(400).json({ success: false, message: 'You cannot send a friend request to yourself' });
    }

    try {
        const userCheckResult = await pool.query(`
            SELECT userid FROM users WHERE userid = $1
        `, [userId]);

        if (userCheckResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (await isFriend(loggedInUserId, userId)) {
            return res.status(400).json({ success: false, message: 'You are already friends with this user' });
        }

        const checkResult = await pool.query(`
            SELECT notificationid FROM notifications
            WHERE senderid = $1 AND receiverid = $2 AND notificationtype = 'FriendReq'
        `, [loggedInUserId, userId]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Friend request already sent' });
        }

        await pool.query(`
            INSERT INTO notifications (senderid, receiverid, message, notificationtype)
            VALUES ($1, $2, $3, 'FriendReq')
        `, [loggedInUserId, userId, message || `User ${loggedInUserId} sent you a friend request`]);

        res.status(200).json({ success: true, message: 'Friend request sent successfully' });
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Remove Friend (Requires JWT token with userid)
router.delete('/removeFriend', authenticateToken, async (req, res) => {
    const { userId } = req.body;
    const loggedInUserId = req.userId;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    if (loggedInUserId === userId) {
        return res.status(400).json({ success: false, message: 'You cannot unfriend yourself' });
    }

    try {
        const userCheckResult = await pool.query(`
            SELECT userid FROM users WHERE userid = $1
        `, [userId]);

        if (userCheckResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!(await isFriend(loggedInUserId, userId))) {
            return res.status(400).json({ success: false, message: 'You are not friends with this user' });
        }

        const [u1, u2] = loggedInUserId < userId
            ? [loggedInUserId, userId]
            : [userId, loggedInUserId];

        await pool.query(`
            DELETE FROM friends WHERE user1id = $1 AND user2id = $2
        `, [u1, u2]);

        const nameResult = await pool.query(`
            SELECT username AS "Username" FROM users WHERE userid = $1
        `, [loggedInUserId]);

        const msgText = `User ${nameResult.rows[0].Username} has removed you from their friends list`;

        await pool.query(`
            INSERT INTO notifications (senderid, receiverid, message, notificationtype)
            VALUES ($1, $2, $3, 'General')
        `, [loggedInUserId, userId, msgText]);

        res.status(200).json({ success: true, message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get total page# of all users (ranked by activity)
router.get('/pageCount', async (req, res) => {
    const pageSize = 25;

    try {
        const result = await pool.query(`
            SELECT COUNT(*) AS count FROM users
        `);
        const totalCount = parseInt(result.rows[0].count);
        const totalPages = Math.ceil(totalCount / pageSize);

        res.json({ success: true, totalPages });
    } catch (error) {
        console.error('Error fetching total user page count:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get paginated users ranked by logged movies
router.get('/page', async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 25;
    const offset = (page - 1) * pageSize;

    if (page < 1) {
        return res.status(400).json({ success: false, message: 'Page number must be >= 1' });
    }

    try {
        const result = await pool.query(`
            SELECT
                u.userid    AS "UserID",
                u.fullname  AS "FullName",
                u.username  AS "Username",
                u.gender    AS "Gender",
                u.usertype  AS "UserType",
                u.privacy   AS "Privacy",
                COUNT(a.activityid) AS "ActivitiesCount",
                (SELECT COUNT(movieid) FROM activity WHERE userid = u.userid AND islogged = true) AS "loggedMoviesCount"
            FROM users u
            JOIN activity a ON u.userid = a.userid
            GROUP BY u.userid, u.fullname, u.username, u.gender, u.usertype, u.privacy
            ORDER BY COUNT(a.islogged) DESC
            LIMIT $1 OFFSET $2
        `, [pageSize, offset]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No users found for the given page' });
        }

        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('Error fetching paginated users:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Search users by username or fullname
router.get('/search/:string', async (req, res) => {
    const searchString = req.params.string;

    try {
        const result = await pool.query(`
            SELECT
                u.userid   AS "UserID",
                u.fullname AS "FullName",
                u.username AS "Username",
                u.gender   AS "Gender",
                u.usertype AS "UserType",
                u.privacy  AS "Privacy"
            FROM users u
            JOIN activity a ON u.userid = a.userid
            WHERE u.fullname ILIKE $1 OR u.username ILIKE $1
            GROUP BY u.userid, u.fullname, u.username, u.gender, u.usertype, u.privacy
            ORDER BY COUNT(a.islogged) DESC
            LIMIT 10
        `, [`%${searchString}%`]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No users found' });
        }

        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get user profile (logged out) — only basic stats for private accounts
router.get('/public/:userid', async (req, res) => {
    const userId = parseInt(req.params.userid, 10);

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    try {
        const result = await pool.query(`
            SELECT
                fullname AS "FullName", username AS "Username", email AS "Email",
                gender AS "Gender", dateofbirth AS "DateOfBirth", bio AS "Bio",
                usertype AS "UserType", privacy AS "Privacy"
            FROM users WHERE userid = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = result.rows[0];
        const basicDetails = await getUserBaseStats(userId);

        return res.status(200).json({ success: true, user, basicDetails });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get user profile (logged in)
router.get('/logged/:userid', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.userid, 10);

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    const loggedInUserId = req.userId;

    try {
        const result = await pool.query(`
            SELECT
                fullname AS "FullName", username AS "Username", email AS "Email",
                gender AS "Gender", dateofbirth AS "DateOfBirth", bio AS "Bio",
                usertype AS "UserType", privacy AS "Privacy"
            FROM users WHERE userid = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = result.rows[0];
        const basicDetails = await getUserBaseStats(userId);

        return res.status(200).json({ success: true, user, basicDetails });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get friends list (public ver.)
router.get('/public/friends/:userid', async (req, res) => {
    const userId = parseInt(req.params.userid, 10);
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    try {
        const privacyRes = await pool.query(`
            SELECT privacy AS "Privacy" FROM users WHERE userid = $1
        `, [userId]);

        if (privacyRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (privacyRes.rows[0].Privacy !== 'Public') {
            return res.status(403).json({ success: false, message: 'User profile is private' });
        }

        const friendsRes = await pool.query(`
            SELECT userid AS "UserID", fullname AS "FullName", username AS "Username",
                   gender AS "Gender", bio AS "Bio", usertype AS "UserType", privacy AS "Privacy"
            FROM users
            WHERE userid IN (
                SELECT user2id FROM friends WHERE user1id = $1
                UNION
                SELECT user1id FROM friends WHERE user2id = $1
            )
        `, [userId]);

        return res.status(200).json({ success: true, friends: friendsRes.rows });
    } catch (error) {
        console.error('Error fetching friends list:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get friends list (logged in ver.)
router.get('/friends/:userid', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.userid, 10);
    const loggedInUserId = req.userId;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    try {
        const privacyRes = await pool.query(`
            SELECT privacy AS "Privacy" FROM users WHERE userid = $1
        `, [userId]);

        if (privacyRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (privacyRes.rows[0].Privacy === 'Public' || await isFriend(loggedInUserId, userId)) {
            const friendsRes = await pool.query(`
                SELECT userid AS "UserID", fullname AS "FullName", username AS "Username",
                       gender AS "Gender", bio AS "Bio", usertype AS "UserType", privacy AS "Privacy"
                FROM users
                WHERE userid IN (
                    SELECT user2id FROM friends WHERE user1id = $1
                    UNION
                    SELECT user1id FROM friends WHERE user2id = $1
                )
            `, [userId]);

            return res.status(200).json({ success: true, friends: friendsRes.rows });
        } else {
            return res.status(403).json({ success: false, message: 'User profile is private' });
        }
    } catch (error) {
        console.error('Error fetching friends list:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get user's liked movies (public ver.)
router.get('/likedMovies/public/:userid', async (req, res) => {
    let { userid } = req.params;
    userid = parseInt(userid, 10);

    if (!userid || isNaN(userid)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    try {
        const userRes = await pool.query(`
            SELECT privacy AS "Privacy", username AS "Username" FROM users WHERE userid = $1
        `, [userid]);

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userRes.rows[0].Privacy !== 'Public') {
            return res.status(403).json({ success: false, message: 'User profile is private' });
        }

        const favMovieBg = await getFavMovieBg(userid);

        const likedMovieRes = await pool.query(`
            SELECT m.movieid AS "MovieID", m.title AS "Title", m.movieposterlink AS "MoviePosterLink"
            FROM userlikedmovies ulm
            JOIN movies m ON ulm.movieid = m.movieid
            WHERE ulm.userid = $1
        `, [userid]);

        const movies = await processMoviesWithDirectors(likedMovieRes.rows);
        return res.status(200).json({ success: true, username: userRes.rows[0].Username, favMovieBg, likedMovies: movies });
    } catch (error) {
        console.error('Error fetching public liked movies:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get user's liked movies (logged in ver.)
router.get('/likedMovies/:userid', authenticateToken, async (req, res) => {
    let { userid } = req.params;
    userid = parseInt(userid, 10);
    const currentUserId = req.userId;

    if (!userid || isNaN(userid)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    try {
        const userRes = await pool.query(`
            SELECT privacy AS "Privacy", username AS "Username" FROM users WHERE userid = $1
        `, [userid]);

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userRes.rows[0].Privacy !== 'Public' && !await isFriend(currentUserId, userid)) {
            return res.status(403).json({ success: false, message: 'User profile is private' });
        }

        const favMovieBg = await getFavMovieBg(userid);

        const likedMovieRes = await pool.query(`
            SELECT m.movieid AS "MovieID", m.title AS "Title", m.movieposterlink AS "MoviePosterLink"
            FROM userlikedmovies ulm
            JOIN movies m ON ulm.movieid = m.movieid
            WHERE ulm.userid = $1
        `, [userid]);

        const movies = await processMoviesWithDirectors(likedMovieRes.rows);
        return res.status(200).json({ success: true, username: userRes.rows[0].Username, favMovieBg, likedMovies: movies });
    } catch (error) {
        console.error('Error fetching liked movies:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get user's logged movies (public ver.)
router.get('/loggedMovies/public/:userid', async (req, res) => {
    let { userid } = req.params;
    userid = parseInt(userid, 10);

    if (!userid || isNaN(userid)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    try {
        const userRes = await pool.query(`
            SELECT privacy AS "Privacy", username AS "Username" FROM users WHERE userid = $1
        `, [userid]);

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userRes.rows[0].Privacy !== 'Public') {
            return res.status(403).json({ success: false, message: 'User profile is private' });
        }

        const favMovieBg = await getFavMovieBg(userid);

        const loggedMoviesRes = await pool.query(`
            SELECT
                m.movieid AS "MovieID", m.title AS "Title", m.movieposterlink AS "MoviePosterLink",
                a.activitydatetime AS "AddedAt", a.review AS "Review", a.ratings AS "Ratings"
            FROM activity a
            JOIN movies m ON a.movieid = m.movieid
            WHERE a.userid = $1 AND a.islogged = true
            ORDER BY a.activitydatetime DESC
        `, [userid]);

        const movies = await processMoviesWithDirectors(loggedMoviesRes.rows);
        return res.status(200).json({ success: true, username: userRes.rows[0].Username, favMovieBg, loggedMovies: movies });
    } catch (error) {
        console.error('Error fetching public loggedMovies:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get user's logged movies (logged in ver.)
router.get('/loggedMovies/:userid', authenticateToken, async (req, res) => {
    let { userid } = req.params;
    userid = parseInt(userid, 10);
    const currentUserId = req.userId;

    if (!userid || isNaN(userid)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    try {
        const userRes = await pool.query(`
            SELECT privacy AS "Privacy", username AS "Username" FROM users WHERE userid = $1
        `, [userid]);

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userRes.rows[0].Privacy !== 'Public' && !await isFriend(currentUserId, userid)) {
            return res.status(403).json({ success: false, message: 'User profile is private' });
        }

        const favMovieBg = await getFavMovieBg(userid);

        const loggedMoviesRes = await pool.query(`
            SELECT
                m.movieid AS "MovieID", m.title AS "Title", m.movieposterlink AS "MoviePosterLink",
                a.activitydatetime AS "AddedAt", a.review AS "Review", a.ratings AS "Ratings"
            FROM activity a
            JOIN movies m ON a.movieid = m.movieid
            WHERE a.userid = $1 AND a.islogged = true
            ORDER BY a.activitydatetime DESC
        `, [userid]);

        const movies = await processMoviesWithDirectors(loggedMoviesRes.rows);
        return res.status(200).json({ success: true, username: userRes.rows[0].Username, favMovieBg, loggedMovies: movies });
    } catch (error) {
        console.error('Error fetching loggedMovies:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get user's watched movies (public ver.)
router.get('/watchedMovies/public/:userid', async (req, res) => {
    let { userid } = req.params;
    userid = parseInt(userid, 10);

    if (!userid || isNaN(userid)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    try {
        const userRes = await pool.query(`
            SELECT privacy AS "Privacy", username AS "Username" FROM users WHERE userid = $1
        `, [userid]);

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userRes.rows[0].Privacy !== 'Public') {
            return res.status(403).json({ success: false, message: 'User profile is private' });
        }

        const favMovieBg = await getFavMovieBg(userid);

        const watchedMoviesRes = await pool.query(`
            SELECT
                m.movieid AS "MovieID", m.title AS "Title", m.movieposterlink AS "MoviePosterLink",
                MAX(a.activitydatetime) AS "AddedAt"
            FROM activity a
            JOIN movies m ON a.movieid = m.movieid
            WHERE a.userid = $1
            GROUP BY m.movieid, m.title, m.movieposterlink
            ORDER BY "AddedAt" DESC
        `, [userid]);

        const movies = await processMoviesWithDirectors(watchedMoviesRes.rows);
        return res.status(200).json({ success: true, username: userRes.rows[0].Username, favMovieBg, watchedMovies: movies });
    } catch (error) {
        console.error('Error fetching public watchedMovies:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get user's watched movies (logged in ver.)
router.get('/watchedMovies/:userid', authenticateToken, async (req, res) => {
    let { userid } = req.params;
    userid = parseInt(userid, 10);
    const currentUserId = req.userId;

    if (!userid || isNaN(userid)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    try {
        const userRes = await pool.query(`
            SELECT privacy AS "Privacy", username AS "Username" FROM users WHERE userid = $1
        `, [userid]);

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userRes.rows[0].Privacy !== 'Public' && !await isFriend(currentUserId, userid)) {
            return res.status(403).json({ success: false, message: 'User profile is private' });
        }

        const favMovieBg = await getFavMovieBg(userid);

        const watchedMoviesRes = await pool.query(`
            SELECT
                m.movieid AS "MovieID", m.title AS "Title", m.movieposterlink AS "MoviePosterLink",
                MAX(a.activitydatetime) AS "AddedAt"
            FROM activity a
            JOIN movies m ON a.movieid = m.movieid
            WHERE a.userid = $1
            GROUP BY m.movieid, m.title, m.movieposterlink
            ORDER BY "AddedAt" DESC
        `, [userid]);

        const movies = await processMoviesWithDirectors(watchedMoviesRes.rows);
        return res.status(200).json({ success: true, username: userRes.rows[0].Username, favMovieBg, watchedMovies: movies });
    } catch (error) {
        console.error('Error fetching watchedMovies:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update user profile (Requires JWT token with userid)
router.put('/', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { FullName, Username, Email, Bio, Privacy, Gender, DateOfBirth } = req.body;

    const allowedPrivacy = ['Public', 'Private'];
    if (Privacy && !allowedPrivacy.includes(Privacy)) {
        return res.status(400).json({ success: false, message: 'Invalid privacy value' });
    }

    const allowedGender = ['Male', 'Female', 'Other'];
    if (Gender && !allowedGender.includes(Gender)) {
        return res.status(400).json({ success: false, message: 'Invalid Gender Value' });
    }

    // Build dynamic SET clause with positional params
    const fields = [];
    const values = [userId]; // $1 = userId
    let idx = 2;

    if (FullName !== undefined) { fields.push(`fullname = $${idx++}`); values.push(FullName); }
    if (Username !== undefined) { fields.push(`username = $${idx++}`); values.push(Username); }
    if (Email !== undefined) { fields.push(`email = $${idx++}`); values.push(Email); }
    if (Bio !== undefined) { fields.push(`bio = $${idx++}`); values.push(Bio); }
    if (Privacy !== undefined) { fields.push(`privacy = $${idx++}`); values.push(Privacy); }
    if (Gender !== undefined) { fields.push(`gender = $${idx++}`); values.push(Gender); }
    if (DateOfBirth !== undefined) { fields.push(`dateofbirth = $${idx++}`); values.push(DateOfBirth); }

    if (fields.length === 0) {
        return res.status(400).json({ success: false, message: 'No profile fields provided to update' });
    }

    try {
        const result = await pool.query(`
            UPDATE users
            SET ${fields.join(', ')}
            WHERE userid = $1
            RETURNING
                fullname AS "FullName", username AS "Username", email AS "Email",
                gender AS "Gender", dateofbirth AS "DateOfBirth", bio AS "Bio",
                usertype AS "UserType", privacy AS "Privacy"
        `, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Insertion Failed' });
        }

        return res.status(200).json({ success: true, message: 'Profile updated successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Edit Favorite Movies (Requires JWT token with userid)
router.put('/favoriteMovies', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { movieId, rank } = req.body;

    if (!movieId || isNaN(movieId)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing movieId' });
    }
    if (!rank || isNaN(rank) || rank < 1 || rank > 4) {
        return res.status(400).json({ success: false, message: 'Invalid or missing rank' });
    }

    try {
        const checkResult = await pool.query(`
            SELECT rank AS "Rank" FROM userfavorites WHERE userid = $1 AND movieid = $2
        `, [userId, movieId]);

        if (checkResult.rows.length > 0) {
            if (checkResult.rows[0].Rank === rank) {
                return res.status(200).json({ success: true, message: 'Movie already exists in favorites with the same rank' });
            }
            await pool.query(`DELETE FROM userfavorites WHERE userid = $1 AND movieid = $2`, [userId, movieId]);
        }

        const checkRankResult = await pool.query(`
            SELECT userid FROM userfavorites WHERE userid = $1 AND rank = $2
        `, [userId, rank]);

        if (checkRankResult.rows.length > 0) {
            await pool.query(`DELETE FROM userfavorites WHERE userid = $1 AND rank = $2`, [userId, rank]);
        }

        const result = await pool.query(`
            INSERT INTO userfavorites (userid, movieid, rank) VALUES ($1, $2, $3)
        `, [userId, movieId, rank]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Insertion Failed' });
        }

        return res.status(200).json({ success: true, message: 'Movie added to favorites' });
    } catch (error) {
        console.error('Error updating favorite movies:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Request User Type Change (Requires JWT token with userid)
router.put('/userType', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { userType, message } = req.body;

    const allowedUserTypes = ['Admin', 'User', 'Critic'];
    if (!userType || !allowedUserTypes.includes(userType)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing new user type' });
    }

    try {
        const userResult = await pool.query(`
            SELECT usertype AS "UserType", username AS "Username" FROM users WHERE userid = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const currentType = userResult.rows[0].UserType;

        if (currentType === userType) {
            return res.status(400).json({ success: false, message: 'You already have this user type' });
        }

        const rank = { 'User': 1, 'Critic': 2, 'Admin': 3 };

        if (rank[userType] > rank[currentType]) {
            const notiType = userType === 'Admin' ? 'AdminReq' : 'CriticReq';
            const deleteNoti = userType === 'Admin' ? 'CriticReq' : 'AdminReq';

            const existingReqResult = await pool.query(`
                SELECT COUNT(*) AS count
                FROM notifications
                WHERE senderid = $1 AND notificationtype = $2
            `, [userId, notiType]);

            if (parseInt(existingReqResult.rows[0].count) > 0) {
                return res.status(400).json({ success: false, message: 'You already have a pending request for this user type' });
            }

            if (userType === 'Admin') {
                await pool.query(`
                    DELETE FROM notifications WHERE senderid = $1 AND notificationtype = $2
                `, [userId, deleteNoti]);
            }

            await pool.query(`
                INSERT INTO notifications (senderid, receiverid, notificationtype, message)
                SELECT $1, u.userid, $2, $3
                FROM users u
                WHERE u.usertype = 'Admin'
            `, [userId, notiType, message || `User ${userResult.rows[0].Username} requested a user type change to ${userType}`]);

            return res.status(200).json({ success: true, message: 'User type change request sent for approval' });
        } else {
            await pool.query(`UPDATE users SET usertype = $1 WHERE userid = $2`, [userType, userId]);
            return res.status(200).json({ success: true, message: 'User type updated successfully' });
        }
    } catch (error) {
        console.error('Error handling user type change:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get Current User Favorites (Requires JWT token with userid)
router.get('/favorites', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        const result = await pool.query(`
            SELECT m.title AS "Title", m.movieposterlink AS "MoviePosterLink", m.movieid AS "MovieID", uf.rank AS "Rank"
            FROM userfavorites uf
            JOIN movies m ON uf.movieid = m.movieid
            WHERE uf.userid = $1
            ORDER BY uf.rank ASC
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No favorite movies found' });
        }

        const movies = await processMoviesWithDirectors(result.rows);
        return res.status(200).json({ success: true, favorites: movies });
    } catch (error) {
        console.error('Error fetching favorite movies:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get IsFriend (Requires JWT token with userid)
router.get('/isFriend/:userid', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.userid, 10);
    const loggedInUserId = req.userId;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    try {
        if (await isFriend(userId, loggedInUserId))
            return res.status(200).json({ success: true, isFriend: true });
        else
            return res.status(200).json({ success: true, isFriend: false });
    } catch (error) {
        console.error('Error fetching isFriend:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
