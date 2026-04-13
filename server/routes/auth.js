const express = require('express');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { authenticateToken, jwt } = require('../middleware/authMiddleware');
const { pool } = require('../config/dbConfig');
const router = express.Router();

// Authentication route for User Log In
router.post('/signin', async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).send('Request body is required');
    }

    const keys = Object.keys(req.body);
    if (keys.length !== 2 || !keys.includes('userName') || !keys.includes('password')) {
        return res.status(400).send('Request body must contain only userName and password');
    }

    const { userName, password } = req.body;

    try {
        const result = await pool.query(`
            SELECT userid AS "UserId", passwordhash AS "PasswordHash", usertype AS "UserType", privacy AS "Privacy", username AS "Username"
            FROM users
            WHERE username = $1
        `, [userName]);

        if (result.rows.length > 0) {
            const hashedPassword = result.rows[0].PasswordHash;
            const isMatch = await bcrypt.compare(password, hashedPassword);

            if (isMatch) {
                const payload = { userId: result.rows[0].UserId };
                const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60d' });
                const user = {
                    userId: result.rows[0].UserId,
                    userName: result.rows[0].Username,
                    userType: result.rows[0].UserType,
                    privacy: result.rows[0].Privacy
                };
                res.json({ success: true, message: 'Authentication successful', token, user });
            } else {
                res.status(401).json({ success: false, message: 'Invalid Password' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Invalid Username' });
        }
    } catch (err) {
        console.error('Error during authentication:', err.message);
        res.status(500).send('Error during authentication');
    }
});

// Route to check if a userName exists in the database
router.get('/authname/:name', async (req, res) => {
    const userName = req.params.name;

    try {
        const result = await pool.query(`
            SELECT COUNT(*) AS count
            FROM users
            WHERE username = $1
        `, [userName]);

        if (parseInt(result.rows[0].count) > 0) {
            res.json({ found: true, message: 'Username found' });
        } else {
            res.json({ found: false, message: 'Username not found' });
        }
    } catch (err) {
        console.error('Error checking userName:', err.message);
        res.status(500).send('Error checking userName');
    }
});

// Route to check if an email exists in the database
router.get('/authemail/:mail', async (req, res) => {
    const email = req.params.mail;

    try {
        const result = await pool.query(`
            SELECT COUNT(*) AS count
            FROM users
            WHERE email = $1
        `, [email]);

        if (parseInt(result.rows[0].count) > 0) {
            res.json({ found: true, message: 'Email found' });
        } else {
            res.json({ found: false, message: 'Email not found' });
        }
    } catch (err) {
        console.error('Error checking email:', err.message);
        res.status(500).send('Error checking email');
    }
});

// Route for User Sign Up
router.post('/signup', async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).send('Request body is required');
    }

    const requiredFields = ['fullName', 'userName', 'password', 'email'];
    const keys = Object.keys(req.body);

    if (keys.length !== requiredFields.length || !requiredFields.every(field => keys.includes(field))) {
        return res.status(400).send(`Request body must contain only the following fields: ${requiredFields.join(', ')}`);
    }

    const { fullName, userName, password, email } = req.body;

    try {
        // Check if userName or email already exists
        const checkResult = await pool.query(`
            SELECT COUNT(*) AS count
            FROM users
            WHERE username = $1 OR email = $2
        `, [userName, email]);

        if (parseInt(checkResult.rows[0].count) > 0) {
            return res.status(409).json({ success: false, message: 'Username or email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_COST_FACTOR, 10));

        // Insert new user and return the generated UserId
        const insertResult = await pool.query(`
            INSERT INTO users (fullname, username, passwordhash, email, usertype, privacy, gender)
            VALUES ($1, $2, $3, $4, 'User', 'Private', 'Other')
            RETURNING userid AS "UserId"
        `, [fullName, userName, hashedPassword, email]);

        const payload = { userId: insertResult.rows[0].UserId };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60d' });
        const user = {
            userId: insertResult.rows[0].UserId,
            userName: userName,
            userType: 'User',
            privacy: 'Private'
        };
        res.json({ success: true, message: 'User registered successfully', token, user });
    } catch (err) {
        console.error('Error during sign up:', err.message);
        res.status(500).send('Error during sign up');
    }
});

// Route to Verify JWT token
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Token is valid' });
});

// Password reset
router.put('/reset', async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).send('Request body is required');
    }

    const requiredFields = ['email', 'password'];
    const keys = Object.keys(req.body);

    if (keys.length !== requiredFields.length || !requiredFields.every(field => keys.includes(field))) {
        return res.status(400).send(`Request body must contain only the following fields: ${requiredFields.join(', ')}`);
    }

    const { email, password } = req.body;

    try {
        const result = await pool.query(`
            SELECT userid AS "UserId"
            FROM users
            WHERE email = $1
        `, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Email not found' });
        }

        const userId = result.rows[0].UserId;
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_COST_FACTOR, 10));

        await pool.query(`
            UPDATE users
            SET passwordhash = $1
            WHERE userid = $2
        `, [hashedPassword, userId]);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Error during password update:', err.message);
        res.status(500).send('Error during password update');
    }
});

module.exports = router;