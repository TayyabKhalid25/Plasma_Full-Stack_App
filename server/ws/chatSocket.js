const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/dbConfig');

// Map of userId -> Set of WebSocket connections
const clients = new Map();

function setupWebSocket(server) {
    const wss = new WebSocketServer({ server, path: '/ws/chat' });

    wss.on('connection', (ws, req) => {
        // Extract token from query string: ws://host/ws/chat?token=xxx
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
            ws.close(4001, 'Authentication required');
            return;
        }

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId;
        } catch {
            ws.close(4003, 'Invalid token');
            return;
        }

        // Register this connection
        if (!clients.has(userId)) {
            clients.set(userId, new Set());
        }
        clients.get(userId).add(ws);

        console.log(`WS: User ${userId} connected (${clients.get(userId).size} connections)`);

        ws.on('message', async (raw) => {
            try {
                const msg = JSON.parse(raw);

                if (msg.type === 'SEND_MESSAGE') {
                    const { receiverId, content } = msg;
                    if (!receiverId || !content) return;

                    // Persist to database
                    const result = await pool.query(`
                        INSERT INTO "direct_messages" ("senderID", "receiverID", "content")
                        VALUES ($1, $2, $3)
                        RETURNING "messageID", "senderID", "receiverID", "content", "timestampUTC"
                    `, [userId, receiverId, content]);

                    const savedMsg = result.rows[0];

                    const payload = JSON.stringify({
                        type: 'NEW_MESSAGE',
                        data: savedMsg
                    });

                    // Send to receiver if online
                    const receiverSockets = clients.get(receiverId);
                    if (receiverSockets) {
                        receiverSockets.forEach(s => {
                            if (s.readyState === 1) s.send(payload);
                        });
                    }

                    // Echo back to sender (for multi-tab sync)
                    const senderSockets = clients.get(userId);
                    if (senderSockets) {
                        senderSockets.forEach(s => {
                            if (s.readyState === 1) s.send(payload);
                        });
                    }
                }
            } catch (err) {
                console.error('WS message error:', err);
            }
        });

        ws.on('close', () => {
            const set = clients.get(userId);
            if (set) {
                set.delete(ws);
                if (set.size === 0) clients.delete(userId);
            }
        });

        ws.on('error', (err) => {
            console.error('WS error:', err);
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
