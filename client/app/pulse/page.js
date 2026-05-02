"use client";

import { useState, useEffect } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import Link from "next/link";
import {
  Gamepad2,
  Heart,
  MessageSquare,
  Share2,
  ImageIcon,
  MoreHorizontal,
  X,
  Edit2,
  Trash2
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useModal } from "@/hooks/useModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { PostCommentsModal } from "@/components/modals/PostCommentsModal";
import { UploadMediaModal } from "@/components/modals/UploadMediaModal";
import { EditPostModal } from "@/components/modals/EditPostModal";
import { getIntentStyle } from "@/lib/intentStyles";
import { getAvatarUrl } from "@/lib/utils";

const feedFilters = [
  { id: "all", label: "All" },
  { id: "friends", label: "Friends Activity" },
  { id: "my-posts", label: "My Posts" },
  { id: "comp", label: "Comp Only" },
  { id: "chill", label: "Chill Only" },
];


// --- COMPONENTS ---

export const ActivityFeedSection = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [mediaUrl, setMediaUrl] = useState(null);
  const [showPostFeedback, setShowPostFeedback] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const { token, user } = useAuth();
  const shareModal = useModal();
  const deleteModal = useModal();
  const commentsModal = useModal();
  const uploadModal = useModal();
  const editModal = useModal();

  useEffect(() => {
    if (!token) return;
    const fetchFeed = async () => {
      setLoadingFeed(true);
      try {
        const res = await fetch(`${API_BASE}/api/feed?filter=${activeFilter}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const mapped = data.data.map(p => ({
              id: p.postID,
              type: "post",
              userID: p.plasmaUserID,
              rawIntent: p.intent,
              intent: getIntentStyle(p.intent).label,
              intentColor: getIntentStyle(p.intent).badge,
              user: {
                name: p.username,
                avatar: getAvatarUrl(p.avatarURL, p.username),
              },
              text: p.content,
              image: p.mediaURL,
              likes: parseInt(p.reactionCount) || 0,
              comments: parseInt(p.commentCount) || 0,
              time: new Date(p.timestampUTC).toLocaleString(),
              liked: p.hasReacted,
            }));
          setPosts(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch feed", err);
      } finally {
        setLoadingFeed(false);
      }
    };
    fetchFeed();
  }, [token, activeFilter]);

  // Filter logic
  const filteredPosts = posts;

  const toggleLike = async (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );

    // Sync active modal data if open
    if (commentsModal.isOpen && commentsModal.modalData?.id === postId) {
      commentsModal.setModalData(prev => ({
        ...prev,
        liked: !prev.liked,
        likes: prev.liked ? prev.likes - 1 : prev.likes + 1
      }));
    }
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

  const handleDeletePost = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/pulse/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPost = async (postId, content, mediaURL) => {
    const res = await fetch(`${API_BASE}/api/pulse/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content, mediaURL })
    });
    const data = await res.json();
    if (data.success) {
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, text: data.data.content, image: data.data.mediaURL }
        : p
      ));
    }
  };

  const handleAddComment = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, comments: p.comments + 1 } : p));
  };

  const handlePost = async () => {
    if (!postText.trim() && !mediaUrl) return;
    try {
      const res = await fetch(`${API_BASE}/api/pulse/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: postText, mediaURL: mediaUrl })
      });
      const data = await res.json();
      if (data.success) {
        const newPost = {
          id: data.data.postID,
          type: "post",
          userID: user?.plasmaUserID || user?.id,
          rawIntent: data.data.intent,
          intent: getIntentStyle(data.data.intent).label,
          intentColor: getIntentStyle(data.data.intent).badge,
          user: {
            name: user?.username || user?.name || "User",
            avatar: getAvatarUrl(user?.avatar, user?.username || user?.name),
          },
          text: data.data.content,
          image: data.data.mediaURL,
          likes: 0,
          comments: 0,
          time: "Just now",
          liked: false,
        };
        setPosts((prev) => [newPost, ...prev]);
        setPostText("");
        setMediaUrl(null);
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
            <div
              className={`relative shrink-0 w-10 h-10 rounded-full bg-cover bg-center border-2 ${getIntentStyle(user?.intent).border}`}
              style={{ backgroundImage: `url(${getAvatarUrl(user?.avatar, user?.username || user?.name)})` }}
            />
            <div className="flex flex-col flex-1 gap-3 w-full">
              <div className="flex items-center justify-center px-4 py-2 relative self-stretch bg-plasma-slate-hover rounded-full">
                <input
                  type="text"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePost()}
                  placeholder="Share a moment..."
                  className="w-full bg-transparent border-none text-sm text-plasma-text-primary placeholder:text-plasma-text-secondary outline-none"
                />
              </div>
              {mediaUrl && (
                <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-white/10 group">
                  {mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                    <video src={mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={mediaUrl} alt="Attached Media" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => setMediaUrl(null)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between relative self-stretch w-full">
            <div className="flex gap-2">
              <button
                onClick={() => uploadModal.open()}
                data-tooltip="Upload Media"
                className="p-2 text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handlePost}
              className={`flex justify-center px-6 py-1.5 rounded-full items-center transition-all cursor-pointer ${showPostFeedback
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
              className={`flex-col justify-center px-5 py-1.5 rounded-full inline-flex items-center transition-colors cursor-pointer ${activeFilter === tab.id ? "bg-plasma-primary text-white" : "bg-plasma-slate-hover text-plasma-text-secondary hover:bg-white/10"
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

          {/* Loading Skeletons */}
          {loadingFeed && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-4 p-5 self-stretch w-full bg-plasma-slate rounded-xl border border-white/5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-plasma-slate-hover" />
                    <div className="flex flex-col gap-2">
                      <div className="w-28 h-3.5 rounded-full bg-plasma-slate-hover" />
                      <div className="w-16 h-2.5 rounded-full bg-plasma-slate-hover" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-3 rounded-full bg-plasma-slate-hover" />
                    <div className="w-3/4 h-3 rounded-full bg-plasma-slate-hover" />
                  </div>
                  {i === 1 && <div className="w-full h-48 rounded-xl bg-plasma-slate-hover" />}
                  <div className="flex gap-8 pt-1">
                    <div className="w-12 h-3 rounded-full bg-plasma-slate-hover" />
                    <div className="w-12 h-3 rounded-full bg-plasma-slate-hover" />
                    <div className="w-6 h-3 rounded-full bg-plasma-slate-hover" />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Posts */}
          {filteredPosts.map((post) => {
            // Use the historical intent captured with the post
            const style = getIntentStyle(post.rawIntent);
            return (
            <div key={post.id} className="flex flex-col items-start gap-4 p-5 relative self-stretch w-full bg-plasma-slate rounded-xl border border-white/5">
              <div className="flex items-start justify-between relative self-stretch w-full">
                <Link 
                  href={String(post.userID) === String(user?.id) ? "/profile" : `/profile/${post.userID}`}
                  className="inline-flex items-start gap-3 hover:opacity-80 transition-opacity group"
                >
                  <div
                    className={`w-10 h-10 shrink-0 rounded-full border-2 bg-cover bg-center ${style.border} group-hover:scale-105 transition-transform`}
                    style={{ backgroundImage: `url('${post.user.avatar}')` }}
                  />
                  <div className="flex flex-col">
                    <span className="font-sans font-semibold text-plasma-text-primary text-base group-hover:text-plasma-primary transition-colors">{post.user.name}</span>
                    <span className="font-sans text-plasma-text-secondary text-[11px]">{post.time}</span>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full ${style.badge} flex items-center gap-2`}>
                    <span className="font-sans font-bold text-[10px]">{style.label}</span>
                  </div>
                  {post.userID === user?.id && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === post.id ? null : post.id)}
                        className="p-1 text-plasma-text-secondary hover:text-white transition-colors cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openDropdownId === post.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-plasma-slate border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                          <button
                            onClick={() => {
                              setOpenDropdownId(null);
                              editModal.open(post);
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left text-plasma-text-primary text-sm font-semibold"
                          >
                            <Edit2 className="w-4 h-4" /> Edit Post
                          </button>
                          <button
                            onClick={() => {
                              setOpenDropdownId(null);
                              deleteModal.open(post);
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-plasma-error/10 transition-colors text-left text-plasma-error text-sm font-semibold"
                          >
                            <Trash2 className="w-4 h-4" /> Delete Post
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="font-sans text-plasma-text-primary text-[15px]">
                {post.text}
              </p>
              {post.image && (
                <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 mt-2 bg-black">
                  {post.image.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                    <video
                      src={post.image}
                      controls
                      className="w-full max-h-[500px] object-contain"
                    />
                  ) : (
                    <img src={post.image} alt="Post media" className="w-full max-h-[500px] object-contain" />
                  )}
                </div>
              )}
              <div className="flex items-center gap-8 pt-2">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-2 transition-colors cursor-pointer ${post.liked ? "text-plasma-secondary" : "text-plasma-text-secondary hover:text-plasma-text-primary"
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
          )})}

          {/* Empty state */}
          {!loadingFeed && filteredPosts.length === 0 && (
            <div className="text-center py-16 w-full">
              <p className="text-plasma-text-secondary text-sm">No posts yet. Share a moment above!</p>
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
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => handleDeletePost(deleteModal.modalData?.id)}
      />
      <PostCommentsModal
        isOpen={commentsModal.isOpen}
        onClose={commentsModal.close}
        post={commentsModal.modalData}
        onAddComment={handleAddComment}
        onToggleLike={toggleLike}
      />
      <UploadMediaModal
        isOpen={uploadModal.isOpen}
        onClose={uploadModal.close}
        onUploadComplete={(url) => setMediaUrl(url)}
      />
      <EditPostModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        post={editModal.modalData}
        onSave={handleEditPost}
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
