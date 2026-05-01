import { useState, useEffect } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Heart, Send, MoreHorizontal } from "lucide-react";
import { useAuth, API_BASE } from "@/context/AuthContext";

export function PostCommentsModal({ isOpen, onClose, post, onAddComment, onToggleLike }) {
  const { token, user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch comments from API
  useEffect(() => {
    if (isOpen && post && token) {
      setComments([]); // Clear existing comments to prevent stale data display
      const fetchComments = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/api/pulse/posts/${post.id}/comments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            const mapped = data.data.map(c => ({
              id: c.commentID,
              user: { 
                name: c.username, 
                avatar: c.avatarURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}` 
              },
              text: c.text,
              time: new Date(c.timestampUTC).toLocaleString(),
              liked: false
            }));
            setComments(mapped);
          }
        } catch (err) {
          console.error("Failed to fetch comments", err);
        } finally {
          setLoading(false);
        }
      };
      fetchComments();
    }
  }, [isOpen, post?.id, token]);

  const handleSubmit = async () => {
    if (!commentText.trim() || !token) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/pulse/posts/${post.id}/comments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ content: commentText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        const newComment = {
          id: data.data.commentID,
          user: { 
            name: user?.name || "You", 
            avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'You'}` 
          },
          text: data.data.text,
          time: "Just now",
          liked: false
        };
        
        setComments([...comments, newComment]);
        setCommentText("");
        if (onAddComment) onAddComment(post.id); // Notify parent to update count
      }
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!post) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Post Details" maxWidth="max-w-2xl">
      <div className="flex flex-col h-[60vh]">
        {/* Original Post Recap */}
        <div className="flex gap-4 pb-4 border-b border-white/5 shrink-0">
          <img src={post.user?.avatar} className="w-10 h-10 rounded-full border-2 border-plasma-slate bg-plasma-slate" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-sans font-semibold text-plasma-text-primary text-sm">{post.user?.name}</span>
                <span className="font-sans text-plasma-text-secondary text-[11px] ml-2">{post.time}</span>
              </div>
              {post.intent && (
                <div className={`px-2 py-0.5 rounded-full ${post.intentColor} text-[10px] font-bold`}>
                  {post.intent}
                </div>
              )}
            </div>
            <p className="text-sm text-plasma-text-primary mt-2">{post.text}</p>
            {post.image && (
              <img src={post.image} className="mt-3 rounded-xl max-h-48 w-auto object-cover border border-white/5" />
            )}
            
            <div className="flex items-center gap-6 mt-4">
              <button 
                onClick={() => onToggleLike && onToggleLike(post.id)}
                className={`flex items-center gap-2 transition-colors cursor-pointer text-xs font-medium ${post.liked ? "text-plasma-secondary" : "text-plasma-text-secondary hover:text-plasma-text-primary"}`}
              >
                <Heart className={`w-4 h-4 ${post.liked ? "fill-plasma-secondary" : ""}`} />
                {post.likes}
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
          {loading ? (
            // Skeleton Loading
            [1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
                <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-none p-3">
                  <div className="h-2 w-20 bg-white/5 rounded mb-2" />
                  <div className="h-3 w-full bg-white/5 rounded" />
                </div>
              </div>
            ))
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <img src={comment.user.avatar} className="w-8 h-8 rounded-full bg-plasma-slate shrink-0" />
                <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-none p-3 relative">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-plasma-text-primary">{comment.user.name}</span>
                    <span className="text-[10px] text-plasma-text-secondary">{comment.time}</span>
                  </div>
                  <p className="text-sm text-plasma-text-primary">{comment.text}</p>
                  <div className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button className="p-1 text-plasma-text-secondary hover:text-plasma-secondary transition-colors">
                      <Heart className={`w-3.5 h-3.5 ${comment.liked ? "fill-plasma-secondary text-plasma-secondary" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-plasma-text-secondary text-sm">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="pt-4 border-t border-white/5 shrink-0 flex items-center gap-3">
          <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'You'}`} className="w-8 h-8 rounded-full bg-plasma-slate shrink-0" />
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            className="flex-1 bg-plasma-bg border border-white/5 rounded-full px-4 py-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary"
          />
          <button 
            onClick={handleSubmit}
            disabled={!commentText.trim()}
            className="p-2 rounded-full bg-plasma-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-plasma-primary/80 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
