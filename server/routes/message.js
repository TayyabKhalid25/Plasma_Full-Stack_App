const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper to check BR-2 Double Opt-In
async function checkMutualFollow(userA, userB) {
    const result = await pool.query(`
        SELECT "isMutual" FROM "follow_relationships"
        WHERE ("followerID" = $1 AND "followedID" = $2)
           OR ("followerID" = $2 AND "followedID" = $1)
    `, [userA, userB]);
    
    return result.rows.some(row => row.isMutual === true);
}

// GET /api/messages
// Retrieves inbox (latest message from all active conversations)
router.get('/', authenticateToken, async (req, res) => {
    const myId = req.userId;
    try {
        const result = await pool.query(`
            WITH latest_messages AS (
                SELECT DISTINCT ON (
                    LEAST("senderID", "receiverID"),
                    GREATEST("senderID", "receiverID")
                )
                    "messageID",
                    "senderID",
                    "receiverID",
                    "content",
                    "isLobbyInvite",
                    "timestampUTC",
                    CASE
                        WHEN "senderID" = $1 THEN "receiverID"
                        ELSE "senderID"
                    END as "contactID"
                FROM "direct_messages"
                WHERE "senderID" = $1 OR "receiverID" = $1
                ORDER BY
                    LEAST("senderID", "receiverID"),
                    GREATEST("senderID", "receiverID"),
                    "timestampUTC" DESC
            )
            SELECT lm.*, u."plasmaUsername" as "contactUsername", u."avatarParams" as "contactAvatar"
            FROM latest_messages lm
            JOIN "users" u ON u."userID" = lm."contactID"
            ORDER BY lm."timestampUTC" DESC
        `, [myId]);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching inbox:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/messages/:userId
// Retrieves conversation with another user
router.get('/:userId', authenticateToken, async (req, res) => {
    const friendId = req.params.userId;
    const myId = req.userId;
    
    try {
        const isMutual = await checkMutualFollow(myId, friendId);
        if (!isMutual) {
            return res.status(403).json({ success: false, message: 'You must mutually follow each other to access direct messages.' });
        }
        
        const result = await pool.query(`
            SELECT "messageID", "senderID", "receiverID", "content", "isLobbyInvite", "lobbyLink", "timestampUTC"
            FROM "direct_messages"
            WHERE ("senderID" = $1 AND "receiverID" = $2) OR ("senderID" = $2 AND "receiverID" = $1)
            ORDER BY "timestampUTC" ASC
            LIMIT 100
        `, [myId, friendId]);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching DMs:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/messages/:userId
// Sends a new DM, with lobby invite support
router.post('/:userId', authenticateToken, async (req, res) => {
    const friendId = req.params.userId;
    const myId = req.userId;
    const { content, isLobbyInvite, lobbyLink } = req.body;
    
    if (!content && !isLobbyInvite) {
        return res.status(400).json({ success: false, message: 'Message content or lobby invite is required' });
    }
    
    try {
        const isMutual = await checkMutualFollow(myId, friendId);
        if (!isMutual) {
            return res.status(403).json({ success: false, message: 'You must mutually follow each other to send direct messages.' });
        }
        
        const result = await pool.query(`
            INSERT INTO "direct_messages" ("senderID", "receiverID", "content", "isLobbyInvite", "lobbyLink")
            VALUES ($1, $2, $3, $4, $5)
            RETURNING "messageID", "timestampUTC"
        `, [myId, friendId, content, isLobbyInvite || false, lobbyLink]);
        
        res.status(201).json({ success: true, data: result.rows[0], message: 'Message sent' });
    } catch (error) {
        console.error('Error sending DM:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;