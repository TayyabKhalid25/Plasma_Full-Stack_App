const express = require('express');
const { pool } = require('../config/dbConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isOnline } = require('../ws/presence');
const { sendToUser } = require('../ws/chatSocket');
const { checkMutualFriendship } = require('../utils/friendshipUtils');

const router = express.Router();

/**
 * GET /api/messages
 * Retrieves the user's inbox, containing the latest message from all active conversations,
 * unread message counts, and the online status of the contact.
 *
 * @requires authenticateToken
 * @returns {{ success: boolean, data: Conversation[] }}
 * @throws {500} Internal server error on DB failure
 */
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
                    "isRead",
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
            ),
            unread_counts AS (
                SELECT 
                    CASE 
                        WHEN "senderID" = $1 THEN "receiverID" 
                        ELSE "senderID" 
                    END as "contactID",
                    COUNT(*) as "unreadCount"
                FROM "direct_messages"
                WHERE "receiverID" = $1 AND "isRead" = FALSE
                GROUP BY 1
            )
            SELECT 
                lm.*, 
                u."username" as "contactUsername", 
                p."avatarURL" as "contactAvatar",
                COALESCE(uc."unreadCount", 0)::int as "unreadCount"
            FROM latest_messages lm
            JOIN "users" u ON u."plasmaUserID" = lm."contactID"
            LEFT JOIN "profiles" p ON u."plasmaUserID" = p."plasmaUserID"
            LEFT JOIN unread_counts uc ON uc."contactID" = lm."contactID"
            ORDER BY lm."timestampUTC" DESC
        `, [myId]);
        
        // Map real-time online status
        const conversations = result.rows.map(row => ({
            ...row,
            online: isOnline(row.contactID)
        }));
        
        res.json({ success: true, data: conversations });
    } catch (error) {
        console.error('Error fetching inbox:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * PUT /api/messages/:userId/read
 * Marks all direct messages from a specific user as read in the database.
 *
 * @requires authenticateToken
 * @param {string} req.params.userId - UUID of the user whose messages are being marked read
 * @returns {{ success: boolean, message: string }}
 * @throws {500} Internal server error on DB failure
 */
router.put('/:userId/read', authenticateToken, async (req, res) => {
    const friendId = req.params.userId;
    const myId = req.userId;
    
    try {
        await pool.query(`
            UPDATE "direct_messages"
            SET "isRead" = TRUE
            WHERE "senderID" = $1 AND "receiverID" = $2 AND "isRead" = FALSE
        `, [friendId, myId]);
        
        res.json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/messages/:userId
 * Retrieves the direct message conversation history with another user.
 * Both users must be mutual friends.
 *
 * @requires authenticateToken
 * @param {string} req.params.userId - UUID of the mutual friend
 * @returns {{ success: boolean, data: DirectMessage[] }}
 * @throws {403} Forbidden if users are not mutual friends
 * @throws {500} Internal server error on DB failure
 */
router.get('/:userId', authenticateToken, async (req, res) => {
    const friendId = req.params.userId;
    const myId = req.userId;
    
    try {
        const isMutual = await checkMutualFriendship(myId, friendId);
        if (!isMutual) {
            return res.status(403).json({ success: false, message: 'You must mutually follow each other to access direct messages.' });
        }
        
        const result = await pool.query(`
            SELECT 
                m."messageID", m."senderID", m."receiverID", m."content", m."isLobbyInvite", m."lobbyLink", m."timestampUTC", m."mediaURL", m."parentMessageID",
                p."content" AS "parentContent", p."senderID" AS "parentSenderID"
            FROM "direct_messages" m
            LEFT JOIN "direct_messages" p ON m."parentMessageID" = p."messageID"
            WHERE (m."senderID" = $1 AND m."receiverID" = $2) OR (m."senderID" = $2 AND m."receiverID" = $1)
            ORDER BY m."timestampUTC" ASC
            LIMIT 100
        `, [myId, friendId]);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching DMs:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST /api/messages/:userId
 * Sends a new direct message to a mutual friend. Supports text, lobby invites, and media.
 * Triggers real-time WebSocket events to both sender and receiver.
 *
 * @requires authenticateToken
 * @param {string} req.params.userId - UUID of the receiver
 * @param {string} [req.body.content] - Text content of the message
 * @param {boolean} [req.body.isLobbyInvite] - Flag indicating if this is a game lobby invite
 * @param {string} [req.body.lobbyLink] - URL/URI for the lobby invite
 * @param {string} [req.body.mediaURL] - URL of attached media
 * @param {string} [req.body.parentMessageID] - UUID of the message being replied to
 * @returns {{ success: boolean, data: Object, message: string }}
 * @throws {400} Bad request if message is completely empty
 * @throws {403} Forbidden if users are not mutual friends
 * @throws {500} Internal server error on DB failure
 */
router.post('/:userId', authenticateToken, async (req, res) => {
    const friendId = req.params.userId;
    const myId = req.userId;
    const { content, isLobbyInvite, lobbyLink, mediaURL, parentMessageID } = req.body;
    
    if (!content && !isLobbyInvite && !mediaURL) {
        return res.status(400).json({ success: false, message: 'Message content, lobby invite, or media is required' });
    }
    
    try {
        const isMutual = await checkMutualFriendship(myId, friendId);
        if (!isMutual) {
            return res.status(403).json({ success: false, message: 'You must mutually follow each other to send direct messages.' });
        }
        
        const result = await pool.query(`
            INSERT INTO "direct_messages" ("senderID", "receiverID", "content", "isLobbyInvite", "lobbyLink", "mediaURL", "parentMessageID")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING "messageID", "timestampUTC"
        `, [myId, friendId, content, isLobbyInvite || false, lobbyLink, mediaURL, parentMessageID]);
        
        const newMessage = {
            messageID: result.rows[0].messageID,
            senderID: myId,
            receiverID: friendId,
            content,
            isLobbyInvite: isLobbyInvite === true || isLobbyInvite === 'true',
            lobbyLink,
            mediaURL,
            parentMessageID,
            timestampUTC: result.rows[0].timestampUTC,
            isRead: false
        };

        // Prepare the payload
        const payload = {
            type: 'NEW_MESSAGE',
            data: newMessage
        };

        // Notify BOTH the receiver and the sender so both UI's update instantly
        sendToUser(friendId, payload);
        sendToUser(myId, payload);
        
        res.status(201).json({ success: true, data: result.rows[0], message: 'Message sent' });
    } catch (error) {
        console.error('Error sending DM:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;