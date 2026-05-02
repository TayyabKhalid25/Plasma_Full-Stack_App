"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAvatarUrl } from "@/lib/utils";
import { 
  Search, Send, MoreVertical, Phone, Video, Info, User, 
  ChevronRight, ArrowLeft, Trophy, Settings, MessageSquare,
  Share2, Calendar, Clock, PlusCircle
} from "lucide-react";
import { useModal } from "@/hooks/useModal";
import { NewMessageModal } from "@/components/modals/NewMessageModal";
import { getIntentStyle } from "@/lib/intentStyles";
import Link from "next/link";

const formatMessage = (text) => {
  if (!text) return null;

  // URL detection regex
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const steamRegex = /(steam:\/\/run\/\d+)/g;
  const plasmaPostRegex = /(plasma:post:([^\s]+))/g;
  
  const parts = text.split(/((?:https?:\/\/[^\s]+)|(?:steam:\/\/run\/\d+)|(?:plasma:post:[^\s]+))/g);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-white underline decoration-white/30 hover:decoration-white transition-all font-bold">
          {part}
        </a>
      );
    }
    if (part.match(steamRegex)) {
      return (
        <a key={i} href={part} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/10 mt-1 mb-1">
          <Trophy className="w-3 h-3 text-plasma-primary" />
          Launch Steam Game
        </a>
      );
    }
    if (part.match(plasmaPostRegex)) {
      const postId = part.split(':').pop();
      return (
        <Link 
          key={i} 
          href={`/pulse/${postId}`} 
          className="block mt-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-plasma-secondary/10 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-plasma-secondary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-plasma-secondary uppercase tracking-widest">Shared Post</p>
              <p className="text-xs text-white font-medium group-hover:text-plasma-secondary transition-colors">View Post in Activity Feed</p>
            </div>
            <ChevronRight className="w-4 h-4 text-plasma-text-secondary ml-auto" />
          </div>
        </Link>
      );
    }
    return part;
  });
};




// --- SKELETONS ---
function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-plasma-slate-hover shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-24 h-3.5 rounded bg-plasma-slate-hover" />
        <div className="w-36 h-2.5 rounded bg-plasma-slate-hover" />
      </div>
    </div>
  );
}

function ChatBubbleSkeleton({ isRight }) {
  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl animate-pulse ${isRight ? "bg-plasma-primary/30 rounded-br-md" : "bg-plasma-slate rounded-bl-md"
        }`}>
        <div className="w-32 h-3 rounded bg-plasma-slate-hover mb-2" />
        <div className="w-16 h-2 rounded bg-plasma-slate-hover" />
      </div>
    </div>
  );
}

function RallyInviteCard({ lobbyLink, isMe }) {
  const { token } = useAuth();
  const [rally, setRally] = useState(null);
  const [loading, setLoading] = useState(true);

  const eventId = lobbyLink?.includes('/rally/')
    ? lobbyLink.split('/rally/')[1].split('?')[0].split('#')[0]
    : null;

  useEffect(() => {
    if (!eventId || !token) return;
    const fetchRally = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/rallies/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setRally(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch rally for invite", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRally();
  }, [eventId, token]);

  if (loading) return (
    <div className="mt-4 pt-4 border-t border-white/10 animate-pulse space-y-3">
      <div className="h-4 w-3/4 bg-white/5 rounded" />
      <div className="h-3 w-1/2 bg-white/5 rounded" />
      <div className="h-10 w-full bg-white/5 rounded-xl" />
    </div>
  );

  if (!rally) return null;

  const startDate = new Date(rally.scheduledStartUTC);
  const formattedDate = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-plasma-primary">Inbound Rally</span>
          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${getIntentStyle(rally.requiredIntent).badge} ${getIntentStyle(rally.requiredIntent).border}`}>
            {rally.requiredIntent}
          </span>
        </div>
        <h4 className="text-sm font-bold text-plasma-text-primary line-clamp-1">{rally.title}</h4>
        <div className="flex items-center gap-3 text-[10px] text-plasma-text-secondary font-medium">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 opacity-50" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 opacity-50" />
            {formattedTime}
          </div>
        </div>
      </div>

      <Link
        href={`/rally/${eventId}`}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isMe
            ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            : "bg-plasma-primary hover:bg-plasma-primary/80 text-white shadow-lg shadow-plasma-primary/20"
          }`}
      >
        View Rally
      </Link>
    </div>
  );
}

export default function MessagesPage() {
  const { token, user } = useAuth();
  const { isConnected, lastMessage, sendMessage } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const newMessageModal = useModal();
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch inbox / conversation list
  useEffect(() => {
    if (!token) return;
    const fetchInbox = async () => {
      setLoadingConversations(true);
      try {
        const res = await fetch(`${API_BASE}/api/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setConversations(data.data.map(c => ({
            id: c.contactID,
            friend: {
              name: c.contactUsername,
              avatar: getAvatarUrl(c.contactAvatar, c.contactUsername),
              online: c.online,
            },
            lastMessage: c.content,
            lastMessageTime: new Date(c.timestampUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: c.unreadCount || 0,
          })));
        }
      } catch (err) {
        console.error("Failed to fetch inbox", err);
      } finally {
        setLoadingConversations(false);
      }
    };
    fetchInbox();
  }, [token]);

  // Fetch messages and mark as read when conversation is selected
  useEffect(() => {
    if (!token || !activeConvId) return;
    const fetchMessages = async () => {
      setLoadingChat(true);
      try {
        // Fetch the messages
        const res = await fetch(`${API_BASE}/api/messages/${activeConvId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMessages(data.data.map(m => ({
            id: m.messageID,
            sender: m.senderID,
            text: m.content,
            time: new Date(m.timestampUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isLobbyInvite: m.isLobbyInvite,
            lobbyLink: m.lobbyLink
          })));

          // Mark as read in the background
          fetch(`${API_BASE}/api/messages/${activeConvId}/read`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          }).then(() => {
            // Update local state to clear unread count for this conversation
            setConversations(prev => prev.map(c =>
              c.id === activeConvId ? { ...c, unread: 0 } : c
            ));
          });
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      } finally {
        setLoadingChat(false);
      }
    };
    fetchMessages();
  }, [token, activeConvId]);

  // Keep a ref so the WS handler always sees the latest activeConvId
  const activeConvIdRef = useRef(activeConvId);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  // Handle incoming messages from global SocketContext
  useEffect(() => {
    if (lastMessage && lastMessage.type === "NEW_MESSAGE") {
      const msg = lastMessage.data;
      const currentConvId = activeConvIdRef.current;
      const isCurrentChat = (msg.senderID === currentConvId || msg.receiverID === currentConvId);

      if (isCurrentChat) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.messageID)) return prev;
          const tempIndex = prev.findIndex(m => m.id.startsWith("temp-") && m.text === msg.content);
          const newMsg = {
            id: msg.messageID,
            sender: msg.senderID,
            text: msg.content,
            time: new Date(msg.timestampUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isLobbyInvite: msg.isLobbyInvite,
            lobbyLink: msg.lobbyLink
          };
          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = newMsg;
            return updated;
          }
          return [...prev, newMsg];
        });

        // Mark as read
        if (msg.senderID !== user?.id) {
          fetch(`${API_BASE}/api/messages/${currentConvId}/read`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }

      // Update conversation list preview
      const contactId = msg.senderID === user?.id ? msg.receiverID : msg.senderID;
      setConversations(prev => {
        const exists = prev.find(c => c.id === contactId);
        if (exists) {
          return prev.map(c => c.id === contactId
            ? {
              ...c,
              lastMessage: msg.content,
              lastMessageTime: "Just now",
              unread: isCurrentChat ? 0 : (c.unread + 1)
            }
            : c
          );
        }
        return prev;
      });
    }
  }, [lastMessage, token, user?.id]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const handleSend = () => {
    if (!messageInput.trim() || !activeConvId) return;

    const success = sendMessage("SEND_MESSAGE", {
      receiverId: activeConvId,
      content: messageInput.trim(),
    });

    if (!success) {
      console.error("WS: Failed to send message - Socket not connected");
      return;
    }

    // Optimistic local append (will be deduplicated when WS echoes back)
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender: user?.id,
      text: messageInput.trim(),
      time: "Just now",
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setMessageInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = searchQuery
    ? conversations.filter(c => c.friend.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  return (
    <DashboardLayout showRightRail={false}>
      <div className="flex h-[calc(100vh-64px)] animate-fade-in">
        {/* Conversation List */}
        <div className={`w-full md:w-[340px] border-r border-white/5 flex flex-col bg-plasma-slate/30 shrink-0 ${activeConvId ? "hidden md:flex" : "flex"}`}>
          {/* Search Header */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-display font-bold text-xl text-plasma-text-primary">Messages</h1>
              <button
                onClick={() => newMessageModal.open()}
                className="p-2 bg-plasma-primary/10 text-plasma-primary rounded-xl hover:bg-plasma-primary hover:text-white transition-all cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-plasma-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-plasma-slate border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-plasma-text-primary placeholder:text-plasma-text-secondary focus:border-plasma-primary outline-none transition-colors"
              />
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingConversations ? (
              <>
                {[1, 2, 3, 4].map(i => <ConversationSkeleton key={i} />)}
              </>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-plasma-text-secondary text-sm">No conversations yet.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer text-left ${activeConvId === conv.id
                      ? "bg-plasma-primary/10 border-l-4 border-plasma-primary"
                      : "hover:bg-white/5 border-l-4 border-transparent"
                    }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.friend.avatar}
                      alt={conv.friend.name}
                      className="w-10 h-10 rounded-full bg-plasma-slate"
                    />
                    {conv.friend.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-plasma-success rounded-full border-2 border-plasma-slate" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-plasma-text-primary truncate">{conv.friend.name}</span>
                      <span className="text-[10px] text-plasma-text-secondary shrink-0 ml-2">{conv.lastMessageTime}</span>
                    </div>
                    <p className="text-xs text-plasma-text-secondary truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-plasma-secondary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {conv.unread}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${activeConvId ? "flex" : "hidden md:flex"}`}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-plasma-slate/30">
                <button
                  onClick={() => setActiveConvId(null)}
                  className="md:hidden p-1 text-plasma-text-secondary hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img src={activeConv.friend.avatar} alt="" className="w-9 h-9 rounded-full bg-plasma-slate" />
                <div>
                  <p className="text-sm font-bold text-plasma-text-primary">{activeConv.friend.name}</p>
                  <p className="text-[11px] text-plasma-text-secondary">
                    {activeConv.friend.online ? (
                      <span className="text-plasma-success">Online</span>
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {loadingChat ? (
                  <>
                    <ChatBubbleSkeleton isRight={false} />
                    <ChatBubbleSkeleton isRight={true} />
                    <ChatBubbleSkeleton isRight={false} />
                    <ChatBubbleSkeleton isRight={true} />
                  </>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-plasma-text-secondary text-sm">No messages yet. Say hi!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${isMe
                            ? "bg-plasma-primary text-white rounded-br-md"
                            : "bg-plasma-slate border border-white/5 text-plasma-text-primary rounded-bl-md"
                          }`}>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">{formatMessage(msg.text)}</div>

                          {msg.isLobbyInvite && (
                            <RallyInviteCard lobbyLink={msg.lobbyLink} isMe={isMe} />
                          )}

                          <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-plasma-text-secondary"}`}>{msg.time}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/5 bg-plasma-slate/30">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeConv.friend.name}...`}
                    className="flex-1 bg-plasma-slate border border-white/5 rounded-full px-5 py-2.5 text-sm text-plasma-text-primary placeholder:text-plasma-text-secondary outline-none focus:border-plasma-primary transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!messageInput.trim() || !isConnected}
                    className="w-10 h-10 rounded-full bg-primary-gradient flex items-center justify-center text-white hover:shadow-card-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-20 h-20 text-plasma-slate-hover mb-4" strokeWidth={1} />
              <h3 className="font-display font-bold text-xl text-plasma-text-primary mb-2">Your Messages</h3>
              <p className="text-sm text-plasma-text-secondary max-w-xs">
                Select a conversation to start chatting with your squad mates.
              </p>
            </div>
          )}
        </div>
      </div>

      <NewMessageModal
        isOpen={newMessageModal.isOpen}
        onClose={newMessageModal.close}
        onStartChat={(friend) => {
          // Check if we already have this conversation in the list
          const existing = conversations.find(c => c.id === friend.id);
          if (!existing) {
            // Add a temporary "new chat" entry so the UI can render it
            setConversations(prev => [{
              id: friend.id,
              friend: {
                name: friend.name,
                avatar: friend.avatar,
                online: friend.online
              },
              lastMessage: "Start a conversation...",
              lastMessageTime: "Now",
              unread: 0
            }, ...prev]);
          }
          setActiveConvId(friend.id);
        }}
      />
    </DashboardLayout>
  );
}
