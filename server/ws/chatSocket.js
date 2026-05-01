const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/dbConfig');
const { setOnline, setOffline } = require('./presence');
const { stopAllUserActivity } = require('../utils/activityUtils');

// Map of userId -> Set of WebSocket connections
const clients = new Map();
// Map of userId -> Timeout ID for stale activity cleanup
const cleanupTimeouts = new Map();

function setupWebSocket(server) {
    const wss = new WebSocketServer({ server, path: '/ws/chat' });

    wss.on('connection', (ws, req) => {
        console.log(`WS: Connection attempt from ${req.socket.remoteAddress}`);

        // Safer token extraction using URLSearchParams
        let token = null;
        try {
            const queryIndex = req.url.indexOf('?');
            if (queryIndex !== -1) {
                const query = req.url.substring(queryIndex + 1);
                const params = new URLSearchParams(query);
                token = params.get('token');
            }
        } catch (err) {
            console.error('WS: Failed to parse query params:', err);
        }

        if (!token) {
            console.log('WS: Connection rejected - No token');
            ws.close(4001, 'Authentication required');
            return;
        }

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId;
        } catch (err) {
            console.log('WS: Connection rejected - Invalid token:', err.message);
            ws.close(4003, 'Invalid token');
            return;
        }

        // Cancel any pending cleanup timeout if the user reconnected
        if (cleanupTimeouts.has(userId)) {
            console.log(`WS: User ${userId} reconnected, cancelling cleanup timeout.`);
            clearTimeout(cleanupTimeouts.get(userId));
            cleanupTimeouts.delete(userId);
        }

        // Register this connection
        if (!clients.has(userId)) {
            clients.set(userId, new Set());
            setOnline(userId); // Mark user as online
        }
        clients.get(userId).add(ws);

        console.log(`WS: User ${userId} connected (${clients.get(userId).size} connections)`);

        ws.on('message', async (raw) => {
            try {
                const msg = JSON.parse(raw);

                // HEARTBEAT HANDLERS
                if (msg.type === 'PING' || msg.type === 'PING_PLAYING') {
                    // Stay connected to prevent cleanup
                    return;
                }

                if (msg.type === 'SEND_MESSAGE') {
                    const { receiverId, content } = msg;
                    console.log(`WS: User ${userId} sending message to ${receiverId}`);
                    
                    if (!receiverId || !content) {
                        console.log('WS: Missing receiverId or content');
                        return;
                    }

                    // Persist to database
                    try {
                        const result = await pool.query(`
                            INSERT INTO "direct_messages" ("senderID", "receiverID", "content")
                            VALUES ($1, $2, $3)
                            RETURNING "messageID", "senderID", "receiverID", "content", "timestampUTC"
                        `, [userId, receiverId, content]);

                        const savedMsg = result.rows[0];
                        console.log(`WS: Message saved to DB with ID: ${savedMsg.messageID}`);

                        const payload = JSON.stringify({
                            type: 'NEW_MESSAGE',
                            data: savedMsg
                        });

                        // Send to receiver if online
                        const receiverSockets = clients.get(receiverId);
                        if (receiverSockets) {
                            console.log(`WS: Sending to receiver ${receiverId} (${receiverSockets.size} sockets)`);
                            receiverSockets.forEach(s => {
                                if (s.readyState === 1) s.send(payload);
                            });
                        } else {
                            console.log(`WS: Receiver ${receiverId} is offline`);
                        }

                        // Echo back to sender
                        const senderSockets = clients.get(userId);
                        if (senderSockets) {
                            senderSockets.forEach(s => {
                                if (s.readyState === 1) s.send(payload);
                            });
                        }
                    } catch (dbErr) {
                        console.error('WS: Database error during message save:', dbErr.message);
                    }
                }
            } catch (err) {
                console.error('WS message error:', err);
            }
        });

        ws.on('close', (code, reason) => {
            const set = clients.get(userId);
            if (set) {
                set.delete(ws);
                const remaining = set.size;
                if (remaining === 0) {
                    clients.delete(userId);
                    setOffline(userId); // Mark user as offline
                    console.log(`WS: User ${userId} disconnected (0 connections left). Starting 5-min grace period.`);
                    
                    // Start 5-minute grace period before cleaning up activity
                    const timeoutId = setTimeout(async () => {
                        console.log(`WS: Grace period expired for user ${userId}. Cleaning up...`);
                        await stopAllUserActivity(userId);
                        cleanupTimeouts.delete(userId);
                    }, 5 * 60 * 1000); // 5 minutes
                    
                    cleanupTimeouts.set(userId, timeoutId);
                } else {
                    console.log(`WS: User ${userId} closed one connection (${remaining} left)`);
                }
            }
        });

        ws.on('error', (err) => {
            console.error(`WS: Error for user ${userId}:`, err.message);
        });
    });

    return wss;
}

function sendToUser(userId, payload) {
    const userSockets = clients.get(userId);
    if (userSockets) {
        userSockets.forEach(s => {
            if (s.readyState === 1) s.send(JSON.stringify(payload));
        });
    }
}

module.exports = { setupWebSocket, sendToUser };
