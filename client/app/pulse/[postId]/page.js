"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  ArrowLeft, Heart, MessageSquare, Share2, Send, 
  MoreHorizontal, Trash2, Edit2, Loader2, Sparkles
} from "lucide-react";
import Link from "next/link";
import { getIntentStyle } from "@/lib/intentStyles";
import { getAvatarUrl } from "@/lib/utils";

export default function PostPage() {
  const { postId } = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    if (!token || !postId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`${API_BASE}/api/pulse/posts/${postId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/api/pulse/posts/${postId}/comments`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const postData = await postRes.json();
        const commentsData = await commentsRes.json();

        if (postData.success) {
          setPost({
            id: postData.data.postID,
            userID: postData.data.plasmaUserID,
            username: postData.data.username,
            avatar: getAvatarUrl(postData.data.avatarURL, postData.data.username),
            content: postData.data.content,
            media: postData.data.mediaURL,
            intent: postData.data.intent,
            likes: parseInt(postData.data.reactionCount),
            comments: parseInt(postData.data.commentCount),
            liked: postData.data.hasReacted,
            time: new Date(postData.data.timestampUTC).toLocaleString()
          });
        }
        
        if (commentsData.success) {
          setComments(commentsData.data.map(c => ({
            id: c.commentID,
            username: c.username,
            avatar: getAvatarUrl(c.avatarURL, c.username),
            text: c.text,
            time: new Date(c.timestampUTC).toLocaleString()
          })));
        }
      } catch (err) {
        console.error("Failed to fetch post details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, postId]);

  const toggleLike = async () => {
    if (!post) return;
    setPost(prev => ({
      ...prev,
      liked: !prev.liked,
      likes: prev.liked ? prev.likes - 1 : prev.likes + 1
    }));

    try {
      await fetch(`${API_BASE}/api/pulse/posts/${post.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reactionType: "LIKE" })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/pulse/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: commentText })
      });
      const data = await res.json();
      if (data.success) {
        const newComment = {
          id: data.data.commentID,
          username: data.data.username,
          avatar: getAvatarUrl(data.data.avatarURL, data.data.username),
          text: data.data.text,
          time: "Just now"
        };
        setComments(prev => [...prev, newComment]);
        setCommentText("");
        setPost(prev => ({ ...prev, comments: prev.comments + 1 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout showRightRail={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 text-plasma-primary animate-spin" />
          <p className="text-plasma-text-secondary font-medium animate-pulse">Loading post...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!post) {
    return (
      <DashboardLayout showRightRail={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-2">
            <MessageSquare className="w-10 h-10 text-plasma-text-secondary opacity-20" />
          </div>
          <h2 className="text-2xl font-bold text-white">Post not found</h2>
          <p className="text-plasma-text-secondary max-w-xs">The post you're looking for might have been deleted or moved.</p>
          <button 
            onClick={() => router.push('/pulse')}
            className="px-8 py-3 rounded-full bg-primary-gradient text-white font-bold hover:scale-105 transition-all"
          >
            Back to Feed
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const style = getIntentStyle(post.intent);

  return (
    <DashboardLayout showRightRail={false}>
      <div className="max-w-[800px] mx-auto px-4 md:px-8 py-10 pb-32 animate-fade-in">
        
        {/* Navigation */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-plasma-text-secondary hover:text-white transition-colors mb-8 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">Back</span>
        </button>

        {/* Main Post Section */}
        <article className="bg-plasma-slate/40 backdrop-blur-xl rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative">
          
          {/* Header */}
          <div className="p-6 md:p-8 flex items-center justify-between">
            <Link href={`/profile/${post.userID}`} className="flex items-center gap-4 group">
              <div 
                className={`w-14 h-14 rounded-full border-2 ${style.border} p-0.5 group-hover:scale-105 transition-transform`}
              >
                <img src={post.avatar} alt={post.username} className="w-full h-full rounded-full object-cover bg-plasma-bg" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white group-hover:text-plasma-primary transition-colors leading-tight">
                  {post.username}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`px-2 py-0.5 rounded-full ${style.badge} text-[10px] font-black uppercase tracking-tighter`}>
                    {style.label}
                  </div>
                  <span className="text-[11px] text-plasma-text-secondary font-medium">• {post.time}</span>
                </div>
              </div>
            </Link>
            
            <div className="relative">
              <button 
                onClick={() => setOpenDropdown(!openDropdown)}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-plasma-text-secondary hover:text-white transition-all cursor-pointer"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              
              {openDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-plasma-slate border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  <button className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left text-plasma-text-primary text-sm font-semibold">
                    <Share2 className="w-4 h-4" /> Copy Link
                  </button>
                  {post.userID === user?.id && (
                    <>
                      <button className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left text-plasma-text-primary text-sm font-semibold border-t border-white/5">
                        <Edit2 className="w-4 h-4" /> Edit Post
                      </button>
                      <button className="w-full flex items-center gap-3 p-4 hover:bg-plasma-error/10 transition-colors text-left text-plasma-error text-sm font-semibold border-t border-white/5">
                        <Trash2 className="w-4 h-4" /> Delete Post
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 md:px-8 pb-4">
            <p className="text-lg md:text-xl text-plasma-text-primary leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Media */}
          {post.media && (
            <div className="px-6 md:px-8 pb-8">
              <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/40 aspect-video group">
                {post.media.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video src={post.media} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={post.media} alt="Post content" className="w-full h-full object-contain hover:scale-105 transition-transform duration-700" />
                )}
              </div>
            </div>
          )}

          {/* Actions Footer */}
          <div className="px-6 md:px-8 py-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button 
                onClick={toggleLike}
                className={`flex items-center gap-2.5 transition-all group cursor-pointer ${post.liked ? 'text-plasma-secondary' : 'text-plasma-text-secondary hover:text-white'}`}
              >
                <div className={`p-2 rounded-full transition-colors ${post.liked ? 'bg-plasma-secondary/10' : 'group-hover:bg-white/5'}`}>
                  <Heart className={`w-5 h-5 ${post.liked ? 'fill-plasma-secondary' : ''}`} />
                </div>
                <span className="text-sm font-bold font-mono">{post.likes.toLocaleString()}</span>
              </button>

              <div className="flex items-center gap-2.5 text-plasma-text-secondary">
                <div className="p-2 rounded-full">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold font-mono">{post.comments.toLocaleString()}</span>
              </div>
            </div>

            <button className="p-2 rounded-full text-plasma-text-secondary hover:bg-white/5 hover:text-white transition-all cursor-pointer">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-12 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-plasma-text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
              Comments
              <div className="h-px w-24 bg-white/5" />
            </h2>
          </div>

          {/* Comment Input */}
          <form onSubmit={handleAddComment} className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <img 
                src={getAvatarUrl(user?.avatar, user?.username)} 
                className="w-8 h-8 rounded-full border border-white/10" 
                alt="Me" 
              />
            </div>
            <input 
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your thoughts..."
              className="w-full bg-plasma-slate/40 backdrop-blur-md border border-white/5 rounded-2xl py-4 pl-16 pr-16 text-sm text-white placeholder:text-plasma-text-secondary outline-none focus:border-plasma-primary/30 transition-all shadow-xl"
            />
            <button 
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary-gradient flex items-center justify-center text-white disabled:opacity-30 transition-all hover:scale-105"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="py-12 text-center bg-white/2 backdrop-blur-sm rounded-3xl border border-dashed border-white/5">
                <Sparkles className="w-8 h-8 mx-auto text-plasma-text-secondary opacity-20 mb-3" />
                <p className="text-sm text-plasma-text-secondary font-medium">Be the first to spark a conversation!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 p-5 rounded-3xl bg-white/2 hover:bg-white/5 border border-white/5 transition-all group animate-fade-in">
                  <Link href={`/profile/${comment.id}`} className="shrink-0">
                    <img src={comment.avatar} alt={comment.username} className="w-10 h-10 rounded-full border border-white/10" />
                  </Link>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white hover:text-plasma-primary transition-colors cursor-pointer">
                        {comment.username}
                      </span>
                      <span className="text-[10px] text-plasma-text-secondary font-medium uppercase tracking-widest">{comment.time}</span>
                    </div>
                    <p className="text-sm text-plasma-text-secondary leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
