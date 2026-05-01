"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, API_BASE } from "@/context/AuthContext";

export const FloatingMessages = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const widgetRef = useRef(null);
  const pathname = usePathname();

  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const fetchInbox = () => {
      fetch(`${API_BASE}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const mapped = data.data.map(c => ({
              id: c.contactID,
              friend: {
                name: c.contactUsername,
                avatar: c.contactAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.contactID}`,
                online: c.online,
              },
              lastMessage: c.content,
              lastMessageTime: new Date(c.timestampUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: c.unreadCount || 0,
            }));
            setConversations(mapped.slice(0, 5));
            const totalUnread = mapped.reduce((acc, conv) => acc + (conv.unread || 0), 0);
            setUnreadCount(totalUnread);
          }
        })
        .catch(err => console.error("Failed to fetch floating messages", err));
    };

    fetchInbox();

    // WebSocket listener for real-time unread updates
    const WS_BASE = API_BASE.replace(/^http/, "ws");
    const ws = new WebSocket(`${WS_BASE}/ws/chat?token=${token}`);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "NEW_MESSAGE") {
          // Re-fetch inbox to get updated unread counts and newest message
          fetchInbox();
        }
      } catch (err) {
        if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
          console.error("FloatingMessages WS error:", err);
        }
      }
    };

    ws.onerror = () => {
      // Quietly handle connection drops in floating widget
    };

    return () => ws.close();
  }, [token]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // We don't need formatTime if we just use the raw lastMessageTime from dummy
  // since dummy already provides "2m ago", "1h ago", etc.

  if (pathname?.startsWith("/messages")) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" ref={widgetRef}>
      
      {/* Popover Menu */}
      {isOpen && (
        <div className="mb-4 w-80 bg-plasma-slate border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden animate-fade-in flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-plasma-slate-hover/50">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-[15px] tracking-[1px] text-plasma-text-primary">MESSAGES</span>
              {unreadCount > 0 && (
                <span className="bg-plasma-primary/20 text-plasma-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-plasma-text-secondary hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex flex-col max-h-[350px] overflow-y-auto custom-scrollbar">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <Link 
                  href={`/messages?id=${conv.id}`} 
                  key={conv.id}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <img 
                      src={conv.friend.avatar} 
                      alt={conv.friend.name} 
                      className="w-10 h-10 rounded-full border border-white/10 object-cover"
                    />
                    {conv.friend.online && (
                      <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-plasma-success rounded-full border-2 border-solid border-plasma-slate" />
                    )}
                  </div>
                  
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-plasma-text-primary truncate">
                        {conv.friend.name}
                      </span>
                      <span className="text-[10px] text-plasma-text-secondary whitespace-nowrap shrink-0 ml-2">
                        {conv.lastMessageTime}
                      </span>
                    </div>
                    <span className={`text-[12px] truncate ${conv.unread > 0 ? "text-plasma-text-primary font-medium" : "text-plasma-text-secondary"}`}>
                      {conv.lastMessage}
                    </span>
                  </div>
                  
                  {conv.unread > 0 && (
                    <div className="w-2 h-2 rounded-full bg-plasma-primary shrink-0" />
                  )}
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-plasma-text-secondary text-sm">
                No recent messages
              </div>
            )}
          </div>

          {/* Footer View All */}
          <Link 
            href="/messages"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 p-3 bg-plasma-slate-hover text-[12px] font-bold tracking-[0.5px] text-plasma-primary hover:bg-white/10 transition-colors uppercase border-t border-white/5 cursor-pointer"
          >
            View all messages
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-primary-gradient shadow-[0_0_20px_rgba(86,56,149,0.5)] flex items-center justify-center text-white hover:scale-105 hover:shadow-[0_0_25px_rgba(86,56,149,0.7)] transition-all cursor-pointer relative"
      >
        <MessageSquare className="w-6 h-6" />
        
        {/* Badge */}
        {!isOpen && unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-plasma-secondary rounded-full border-2 border-solid border-plasma-bg flex items-center justify-center animate-bounce-subtle">
            <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </button>
      
    </div>
  );
};
