"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  ArrowLeft, Heart, MessageSquare, Share2, Send, 
  MoreHorizontal, Trash2, Edit2, Loader2, Sparkles, Reply, X
} from "lucide-react";
import Link from "next/link";
import { getIntentStyle } from "@/lib/intentStyles";
import { getAvatarUrl } from "@/lib/utils";
import { useModal } from "@/hooks/useModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { EditPostModal } from "@/components/modals/EditPostModal";

export default function PostPage() {
  const { postId } = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const shareModal = useModal();
  const deleteModal = useModal();
  const editModal = useModal();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdown && !e.target.closest('.dropdown-trigger')) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

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
            time: new Date(c.timestampUTC).toLocaleString(),
            parentCommentID: c.parentCommentID,
            parentText: c.parentText,
            parentUsername: c.parentUsername
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
        body: JSON.stringify({ 
          content: commentText,
          parentCommentID: replyTo?.id
        })
      });
      const data = await res.json();
      if (data.success) {
        const newComment = {
          id: data.data.commentID,
          username: data.data.username,
          avatar: getAvatarUrl(data.data.avatarURL, data.data.username),
          text: data.data.text,
          time: "Just now",
          parentCommentID: replyTo?.id,
          parentText: replyTo?.text,
          parentUsername: replyTo?.username
        };
        setComments(prev => [...prev, newComment]);
        setCommentText("");
        setReplyTo(null);
        setPost(prev => ({ ...prev, comments: prev.comments + 1 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pulse/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        router.push('/pulse');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPost = async (id, content, mediaURL) => {
    try {
      const res = await fetch(`${API_BASE}/api/pulse/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, mediaURL })
      });
      const data = await res.json();
      if (data.success) {
        setPost(prev => ({
          ...prev,
          content: data.data.content,
          media: data.data.mediaURL
        }));
      }
    } catch (err) {
      console.error(err);
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
          className="flex items-center gap-3 text-plasma-text-secondary hover:text-white transition-all mb-8 group"
        >
          <div className="w-10 h-10 rounded-full bg-plasma-slate border border-white/5 flex items-center justify-center group-hover:border-plasma-primary/50 group-hover:bg-plasma-primary/10 transition-all shadow-lg">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em]">Return to Feed</span>
        </button>

        {/* Main Post Section */}
        <article className="bg-plasma-slate/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-lg relative">
          
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
            
            {post.userID === user?.id && (
              <div className="relative dropdown-trigger">
                <button 
                  onClick={() => setOpenDropdown(!openDropdown)}
                  className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-plasma-text-secondary hover:text-white transition-all cursor-pointer"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                {openDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-plasma-slate border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                    <button 
                      onClick={() => {
                        setOpenDropdown(false);
                        editModal.open(post);
                      }}
                      className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left text-plasma-text-primary text-sm font-semibold"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Post
                    </button>
                    <button 
                      onClick={() => {
                        setOpenDropdown(false);
                        deleteModal.open(post);
                      }}
                      className="w-full flex items-center gap-3 p-4 hover:bg-plasma-error/10 transition-colors text-left text-plasma-error text-sm font-semibold border-t border-white/5"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Post
                    </button>
                  </div>
                )}
              </div>
            )}
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

            <button 
              onClick={() => shareModal.open({ type: 'post', id: post.id })}
              className="p-2 rounded-full text-plasma-text-secondary hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            >
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
          <div className="relative">
            {replyTo && (
              <div className="mb-4 p-3 bg-plasma-primary/5 border-l-4 border-plasma-primary rounded-r-2xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                <div className="min-w-0">
                  <p className="text-[10px] font-normal text-plasma-primary uppercase tracking-widest">Replying to {replyTo.username}</p>
                  <p className="text-xs text-plasma-text-secondary truncate">{replyTo.text}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 text-plasma-text-secondary hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
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
              className="w-full bg-plasma-slate/50 border border-white/10 rounded-2xl py-4 pl-14 pr-14 text-sm text-white placeholder:text-plasma-text-secondary outline-none focus:border-plasma-primary/50 transition-all"
            />
            <button 
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary-gradient flex items-center justify-center text-white disabled:opacity-30 transition-all hover:scale-105"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="py-20 text-center bg-plasma-slate/20 backdrop-blur-sm rounded-[32px] border border-white/5 border-dashed">
                <Sparkles className="w-10 h-10 mx-auto text-plasma-primary/40 mb-4" />
                <p className="text-plasma-text-secondary font-bold tracking-tight">Be the first to spark a conversation!</p>
                <p className="text-[11px] text-plasma-text-muted mt-2 uppercase tracking-widest font-black">Plasma Pulse Protocol</p>
              </div>
            ) : (
              comments.filter(c => !c.parentCommentID).map((parentComment) => (
                <div key={parentComment.id} className="bg-plasma-slate/40 backdrop-blur-md rounded-[32px] border border-white/10 p-6 space-y-6 shadow-lg">
                  {/* Parent Comment */}
                  <div className="flex gap-4 group animate-fade-in">
                    <Link href={`/profile/${parentComment.id}`} className="shrink-0">
                      <img src={parentComment.avatar} alt={parentComment.username} className="w-10 h-10 rounded-full border border-white/10" />
                    </Link>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white hover:text-plasma-primary transition-colors cursor-pointer">
                          {parentComment.username}
                        </span>
                        <span className="text-[10px] text-plasma-text-secondary font-medium uppercase tracking-widest">{parentComment.time}</span>
                      </div>

                      <div className="flex items-end justify-between gap-4">
                        <p className="text-sm text-plasma-text-secondary leading-relaxed flex-1">
                          {parentComment.text}
                        </p>
                        <button 
                          onClick={() => setReplyTo({ id: parentComment.id, text: parentComment.text, username: parentComment.username })}
                          className="p-2 text-plasma-text-secondary hover:text-plasma-primary transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Reply"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  <div className="ml-14 space-y-6 border-l border-white/10 pl-6">
                    {comments.filter(c => c.parentCommentID === parentComment.id).map((reply) => (
                      <div key={reply.id} className="flex gap-3 group animate-fade-in">
                        <Link href={`/profile/${reply.id}`} className="shrink-0">
                          <img src={reply.avatar} alt={reply.username} className="w-8 h-8 rounded-full border border-white/10" />
                        </Link>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white/80 hover:text-plasma-primary transition-colors cursor-pointer">
                              {reply.username}
                            </span>
                            <span className="text-[9px] text-plasma-text-secondary font-medium uppercase tracking-widest">{reply.time}</span>
                          </div>
                          <p className="text-xs text-plasma-text-secondary leading-relaxed">
                            {reply.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={shareModal.close}
        shareType="post"
        shareId={post.id}
      />
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDeletePost}
      />
      <EditPostModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        post={editModal.modalData}
        onSave={handleEditPost}
      />
    </DashboardLayout>
  );
}
