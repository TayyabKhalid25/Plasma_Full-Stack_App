"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth, API_BASE } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
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

        const WS_BASE = API_BASE.replace(/^http/, "ws");
        const wsUrl = `${WS_BASE}/ws/chat?token=${token}`;
        
        console.log("WS: Connecting to", wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("WS: Connected");
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                setLastMessage(payload);
            } catch (err) {
                console.error("WS: Parse error", err);
            }
        };

        ws.onclose = () => {
            console.log("WS: Disconnected");
            setIsConnected(false);
        };

        ws.onerror = (err) => {
            console.error("WS: Error", err);
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [token]);

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
