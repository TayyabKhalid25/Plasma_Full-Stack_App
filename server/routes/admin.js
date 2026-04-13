const express = require('express');
const { authenticateToken, jwt } = require('../middleware/authMiddleware');
const { pool } = require('../config/dbConfig');
const router = express.Router();

// Delete User Account (Admin Only)
router.delete('/user/:userId', authenticateToken, async (req, res) => {
    let { userId } = req.params;
    if (!userId) {
        return res.status(400).send({ success: false, message: 'userId parameter is required.' });
    }
    userId = parseInt(userId, 10);
    if (isNaN(userId)) {
        return res.status(400).send({ success: false, message: 'Invalid userId. It must be a number.' });
    }

    const loggedInUserId = req.userId;

    try {
        const adminResult = await pool.query(`
            SELECT userid FROM users WHERE userid = $1 AND LOWER(usertype) = 'admin'
        `, [loggedInUserId]);

        if (adminResult.rows.length === 0) {
            return res.status(403).send({ success: false, message: 'Only admins can delete accounts.' });
        }

        const userResult = await pool.query(`SELECT userid FROM users WHERE userid = $1`, [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).send({ success: false, message: 'User not found.' });
        }

        await pool.query(`DELETE FROM users WHERE userid = $1`, [userId]);
        res.send({ success: true, message: 'User account deleted successfully.' });
    } catch (err) {
        console.error('Error deleting user account:', err.message);
        res.status(500).send({ success: false, message: 'Error deleting user account.' });
    }
});

module.exports = router;