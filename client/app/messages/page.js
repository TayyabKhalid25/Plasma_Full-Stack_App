"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Send, MessageSquare, Search, ArrowLeft, PlusCircle } from "lucide-react";
import { conversations as allConversations } from "@/data/dummy";
import { useModal } from "@/hooks/useModal";
import { NewMessageModal } from "@/components/modals/NewMessageModal";

export default function MessagesPage() {
  const [conversations] = useState(allConversations);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [localMessages, setLocalMessages] = useState({});
  const newMessageModal = useModal();

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const getMessages = (convId) => {
    const conv = conversations.find((c) => c.id === convId);
    const base = conv?.messages || [];
    const extra = localMessages[convId] || [];
    return [...base, ...extra];
  };

  const handleSend = () => {
    if (!messageInput.trim() || !activeConvId) return;
    const newMsg = {
      id: Date.now(),
      sender: "wahaj",
      text: messageInput.trim(),
      time: "Just now",
    };
    setLocalMessages((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg],
    }));
    setMessageInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
                placeholder="Search conversations..."
                className="w-full bg-plasma-slate border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-plasma-text-primary placeholder:text-plasma-text-secondary focus:border-plasma-primary outline-none transition-colors"
              />
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer text-left ${
                  activeConvId === conv.id
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
            ))}
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
                {getMessages(activeConvId).map((msg) => {
                  const isMe = msg.sender === "wahaj";
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                        isMe
                          ? "bg-plasma-primary text-white rounded-br-md"
                          : "bg-plasma-slate border border-white/5 text-plasma-text-primary rounded-bl-md"
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-plasma-text-secondary"}`}>{msg.time}</p>
                      </div>
                    </div>
                  );
                })}
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
                    disabled={!messageInput.trim()}
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
          // Logic to start chat with friend
          setActiveConvId(friend.id);
        }}
      />
    </DashboardLayout>
  );
}
