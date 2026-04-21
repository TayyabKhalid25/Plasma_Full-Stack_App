"use client";

import { useState, useEffect } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { 
  Gamepad2, 
  Heart, 
  MessageSquare, 
  Share2,
  ImageIcon,
  MoreHorizontal
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { feedPosts, feedNotifications, feedFilters } from "@/data/dummy";
import { useModal } from "@/hooks/useModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { PostOptionsModal } from "@/components/modals/PostOptionsModal";
import { PostCommentsModal } from "@/components/modals/PostCommentsModal";

// --- COMPONENTS ---

export const ActivityFeedSection = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [posts, setPosts] = useState(feedPosts);
  const [postText, setPostText] = useState("");
  const [showPostFeedback, setShowPostFeedback] = useState(false);

  const { token, user } = useAuth();
  const shareModal = useModal();
  const optionsModal = useModal();
  const commentsModal = useModal();

  useEffect(() => {
    if (!token) return;
    const fetchFeed = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/feed?filter=${activeFilter}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const mapped = data.data.map(p => ({
            id: p.postID,
            type: "post",
            user: { name: p.username, avatar: p.avatarURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Me", borderColor: "#2ecc71" },
            intent: p.intent || "CHILL",
            intentColor: "bg-plasma-success/10 text-plasma-success",
            text: p.content,
            image: p.mediaURL,
            likes: 0,
            comments: 0,
            time: new Date(p.timestampUTC).toLocaleString(),
            liked: false,
          }));
          setPosts(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch feed", err);
      }
    };
    fetchFeed();
  }, [token, activeFilter]);

  // Filter logic
  const filteredPosts = posts;

  const filteredNotifications = feedNotifications.filter((n) => {
    if (activeFilter === "all" || activeFilter === "friends") return true;
    return false;
  });

  const toggleLike = async (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
    try {
      await fetch(`${API_BASE}/api/pulse/posts/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reactionType: "LIKE" })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = (id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleAddComment = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, comments: p.comments + 1 } : p));
  };

  const handlePost = async () => {
    if (!postText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/pulse/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: postText, mediaUrl: null })
      });
      const data = await res.json();
      if (data.success) {
        const newPost = {
          id: data.data.postID,
          type: "post",
          user: { name: user?.username || "You", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Me", borderColor: "#2ecc71" },
          intent: user?.intent || "CHILL",
          intentColor: "bg-plasma-success/10 text-plasma-success",
          text: data.data.content,
          image: null,
          likes: 0,
          comments: 0,
          time: "Just now",
          liked: false,
        };
        setPosts((prev) => [newPost, ...prev]);
        setPostText("");
        setShowPostFeedback(true);
        setTimeout(() => setShowPostFeedback(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center pt-8 pb-12 px-12 relative flex-1 grow max-w-3xl mx-auto">
      <div className="flex flex-col w-full items-start gap-6 relative">
        
        {/* Post Composer */}
        <div className="flex flex-col items-start gap-4 p-4 relative self-stretch w-full bg-plasma-slate rounded-xl border border-white/5">
          <div className="flex items-start gap-4 relative self-stretch w-full">
            <div className="relative w-10 h-10 rounded-full bg-[url(https://api.dicebear.com/7.x/avataaars/svg?seed=Me)] bg-cover bg-center border-2 border-plasma-success" />
            <div className="flex items-center justify-center px-4 py-2 relative flex-1 self-stretch bg-plasma-slate-hover rounded-full">
              <input 
                type="text"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePost()}
                placeholder="Share a moment..." 
                className="w-full bg-transparent border-none text-sm text-plasma-text-primary placeholder:text-plasma-text-secondary outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between relative self-stretch w-full">
            <div className="flex gap-2">
              <button className="p-2 text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer">
                <Gamepad2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer">
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={handlePost}
              className={`flex justify-center px-6 py-1.5 rounded-full items-center transition-all cursor-pointer ${
                showPostFeedback 
                  ? "bg-plasma-success text-white" 
                  : "bg-primary-gradient text-white hover:opacity-90"
              }`}
            >
              <span className="font-display font-bold text-sm tracking-[0.35px]">
                {showPostFeedback ? "Posted! ✓" : "Post"}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-start gap-2 py-2 relative self-stretch w-full">
          {feedFilters.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex-col justify-center px-5 py-1.5 rounded-full inline-flex items-center transition-colors cursor-pointer ${
                activeFilter === tab.id ? "bg-plasma-primary text-white" : "bg-plasma-slate-hover text-plasma-text-secondary hover:bg-white/10"
              }`}
            >
              <div className="font-sans font-bold text-xs tracking-[0] leading-4 whitespace-nowrap">
                {tab.label}
              </div>
            </button>
          ))}
        </div>

        {/* Feed Items */}
        <div className="flex flex-col items-start gap-4 relative self-stretch w-full">
          
          {/* Activity Notifications */}
          {filteredNotifications.map((notif) => (
            <div key={notif.id} className={`flex items-center justify-between p-4 relative self-stretch w-full rounded-xl border-l-4 transition-colors ${
              notif.type === "offline" 
                ? "bg-plasma-slate/40 opacity-60 border-transparent" 
                : "bg-plasma-slate border-plasma-primary hover:bg-white/5"
            }`}>
              <div className="inline-flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full ${notif.user.avatar ? `bg-[url(${notif.user.avatar})] bg-cover bg-center` : "bg-white/10"}`} />
                <div>
                  <p className="font-sans text-sm text-plasma-text-secondary">
                    {notif.type === "offline" ? (
                      <span className="font-medium">{notif.user.name} went offline</span>
                    ) : (
                      <>
                        <span className="font-bold text-plasma-text-primary">{notif.user.name}</span> started playing <span className="font-bold text-plasma-text-primary">{notif.game}</span>
                      </>
                    )}
                  </p>
                  <div className="font-sans text-[10px] text-plasma-text-secondary">{notif.time}</div>
                </div>
              </div>
              {notif.type !== "offline" && (
                <button className="px-4 py-1 bg-plasma-primary rounded-full hover:bg-plasma-primary/80 transition-colors cursor-pointer">
                  <span className="font-sans font-bold text-white text-[11px] tracking-[0.55px]">JOIN</span>
                </button>
              )}
            </div>
          ))}

          {/* Posts */}
          {filteredPosts.map((post) => (
            <div key={post.id} className="flex flex-col items-start gap-4 p-5 relative self-stretch w-full bg-plasma-slate rounded-xl border border-white/5">
              <div className="flex items-start justify-between relative self-stretch w-full">
                <div className="inline-flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full border-2 bg-[url(${post.user.avatar})] bg-cover bg-center`} style={{ borderColor: post.user.borderColor }} />
                  <div className="flex flex-col">
                    <span className="font-sans font-semibold text-plasma-text-primary text-base">{post.user.name}</span>
                    <span className="font-sans text-plasma-text-secondary text-[11px]">{post.time}</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full ${post.intentColor} flex items-center gap-2`}>
                  <span className="font-sans font-bold text-[10px]">{post.intent === "COMP" ? "⚔ COMP" : post.intent}</span>
                </div>
                <button 
                  onClick={() => optionsModal.open(post)}
                  className="p-1 ml-2 text-plasma-text-secondary hover:text-white transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              <p className="font-sans text-plasma-text-primary text-[15px]">
                {post.text}
              </p>
              {post.image && (
                <div className="relative w-full h-[300px] rounded-2xl overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${post.image})` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
              )}
              <div className="flex items-center gap-8 pt-2">
                <button 
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-2 transition-colors cursor-pointer ${
                    post.liked ? "text-plasma-secondary" : "text-plasma-text-secondary hover:text-plasma-text-primary"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.liked ? "fill-plasma-secondary" : ""}`} />
                  <span className="text-xs">{post.likes}</span>
                </button>
                <button 
                  onClick={() => commentsModal.open(post)}
                  className="flex items-center gap-2 text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs">{post.comments}</span>
                </button>
                <button 
                  onClick={() => shareModal.open({ type: 'post', id: post.id })}
                  className="text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {filteredPosts.length === 0 && filteredNotifications.length === 0 && (
            <div className="text-center py-16 w-full">
              <p className="text-plasma-text-secondary text-sm">No posts match this filter.</p>
            </div>
          )}

        </div>
      </div>

      <ShareModal 
        isOpen={shareModal.isOpen} 
        onClose={shareModal.close} 
        shareType={shareModal.modalData?.type} 
        shareId={shareModal.modalData?.id} 
      />
      <PostOptionsModal 
        isOpen={optionsModal.isOpen} 
        onClose={optionsModal.close} 
        post={optionsModal.modalData} 
        onDelete={handleDeletePost}
      />
      <PostCommentsModal 
        isOpen={commentsModal.isOpen} 
        onClose={commentsModal.close} 
        post={commentsModal.modalData} 
        onAddComment={handleAddComment}
        onToggleLike={toggleLike}
      />
    </div>
  );
};

export default function Pulse() {
  return (
    <DashboardLayout>
      <ActivityFeedSection />
    </DashboardLayout>
  );
}
