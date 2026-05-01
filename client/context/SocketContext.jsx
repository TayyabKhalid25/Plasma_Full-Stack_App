"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth, API_BASE } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [reconnectCount, setReconnectCount] = useState(0);
    const wsRef = useRef(null);

    useEffect(() => {
        if (!token) {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        // Construct WebSocket URL safely
        let wsUrl;
        try {
            const base = API_BASE.startsWith('http') 
                ? API_BASE 
                : typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
            
            const isSecure = base.startsWith('https');
            const wsProtocol = isSecure ? "wss:" : "ws:";
            const host = base.replace(/^https?:\/\//, "");
            wsUrl = `${wsProtocol}//${host}/ws/chat?token=${token}`;
        } catch (err) {
            console.error("WS: URL construction failed", err);
            return;
        }
        
        console.log("WS: Attempting connection to:", wsUrl);
        let ws;
        try {
            ws = new WebSocket(wsUrl);
            wsRef.current = ws;
        } catch (err) {
            console.error("WS: Constructor failed", err);
            return;
        }

        let heartbeatInterval;

        ws.onopen = () => {
            console.log("WS: Connected");
            setIsConnected(true);
            setReconnectCount(0); // Reset on success

            // General heartbeat to keep 'Online' status fresh
            heartbeatInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "PING" }));
                }
            }, 30000);
        };

        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                setLastMessage(payload);
            } catch (err) {
                console.error("WS: Parse error", err);
            }
        };

        ws.onclose = (e) => {
            console.log(`WS: Disconnected. Code: ${e.code}, Reason: ${e.reason}`);
            setIsConnected(false);
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            
            // Reconnect logic with backoff
            if (token) {
                const delay = Math.min(1000 * Math.pow(2, reconnectCount), 10000);
                console.log(`WS: Reconnecting in ${delay}ms...`);
                setTimeout(() => {
                    setReconnectCount(prev => prev + 1);
                }, delay);
            }
        };

        ws.onerror = (err) => {
            // Standard WebSocket errors are opaque in browsers
            console.error("WS: Error event triggered");
        };

        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            if (heartbeatInterval) clearInterval(heartbeatInterval);
        };
    }, [token, reconnectCount]);

    const sendMessage = (type, data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, ...data }));
            return true;
        }
        return false;
    };

    return (
        <SocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
