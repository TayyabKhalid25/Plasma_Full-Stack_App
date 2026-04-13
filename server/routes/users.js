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
