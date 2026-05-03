"use client";

import { useState, useEffect } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Edit2,
  Trash2,
} from "lucide-react";
import { useModal } from "@/hooks/useModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { EditPostModal } from "@/components/modals/EditPostModal";
import { getIntentStyle } from "@/lib/intentStyles";
import { getAvatarUrl } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Skeleton loader — same style used in pulse/page.js
// ---------------------------------------------------------------------------
function ActivitySkeletons() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-4 p-5 self-stretch w-full bg-plasma-slate rounded-xl border border-white/5 animate-pulse"
        >
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
  );
}

// ---------------------------------------------------------------------------
// Single post card — identical visual to pulse/page.js
// ---------------------------------------------------------------------------
function PostCard({ post, currentUserId, onToggleLike, onDelete, onEdit, onShare }) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const style = getIntentStyle(post.rawIntent);
  const isOwner = String(post.userID) === String(currentUserId);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e) => {
      if (!e.target.closest(".dropdown-trigger")) setOpenDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown]);

  return (
    <div className="flex flex-col items-start gap-4 p-5 relative self-stretch w-full bg-plasma-slate rounded-xl border border-white/5 cursor-pointer transition-all hover:border-white/20 hover:bg-plasma-slate/80 group/card">
      {/* Full-card clickable overlay */}
      <Link href={`/pulse/${post.id}`} className="absolute inset-0 z-0" />

      {/* Header row */}
      <div className="flex items-start justify-between relative self-stretch w-full z-10 pointer-events-none">
        <Link
          href={isOwner ? "/profile" : `/profile/${post.userID}`}
          className="inline-flex items-start gap-3 hover:opacity-80 transition-opacity group pointer-events-auto"
        >
          <div
            className={`w-10 h-10 shrink-0 rounded-full border-2 bg-cover bg-center ${style.border} group-hover:scale-105 transition-transform`}
            style={{ backgroundImage: `url('${post.user.avatar}')` }}
          />
          <div className="flex flex-col">
            <span className="font-sans font-semibold text-plasma-text-primary text-base group-hover:text-plasma-primary transition-colors">
              {post.user.name}
            </span>
            <span className="font-sans text-plasma-text-secondary text-[11px]">
              {post.time}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Intent badge */}
          <div className={`px-3 py-1 rounded-full ${style.badge} flex items-center gap-2`}>
            <span className="font-sans font-bold text-[10px]">{style.label}</span>
          </div>

          {/* Owner options dropdown */}
          {isOwner && (
            <div className="relative dropdown-trigger pointer-events-auto">
              <button
                onClick={() => setOpenDropdown((v) => !v)}
                className="p-1 text-plasma-text-secondary hover:text-white transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {openDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-plasma-slate border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  <button
                    onClick={() => {
                      setOpenDropdown(false);
                      onEdit(post);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left text-plasma-text-primary text-sm font-semibold"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Post
                  </button>
                  <button
                    onClick={() => {
                      setOpenDropdown(false);
                      onDelete(post);
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

      {/* Body */}
      <div className="block w-full z-10 pointer-events-none">
        <p className="font-sans text-plasma-text-primary text-[15px] transition-colors group-hover/card:text-white">
          {post.text}
        </p>
        {post.image && (
          <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 mt-3 bg-black">
            {post.image.match(/\.(mp4|webm|ogg|mov)$/i) ? (
              <video src={post.image} className="w-full max-h-[500px] object-contain" />
            ) : (
              <img
                src={post.image}
                alt="Post media"
                className="w-full max-h-[500px] object-contain transition-transform duration-500"
              />
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-8 pt-2 z-10 pointer-events-none">
        <button
          onClick={() => onToggleLike(post.id)}
          className={`flex items-center gap-2 transition-colors cursor-pointer pointer-events-auto ${
            post.liked
              ? "text-plasma-secondary"
              : "text-plasma-text-secondary hover:text-plasma-text-primary"
          }`}
        >
          <Heart className={`w-4 h-4 ${post.liked ? "fill-plasma-secondary" : ""}`} />
          <span className="text-xs">{post.likes}</span>
        </button>
        <Link
          href={`/pulse/${post.id}`}
          className="flex items-center gap-2 text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer pointer-events-auto"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs">{post.comments}</span>
        </Link>
        <button
          onClick={() => onShare({ type: "post", id: post.id })}
          className="text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer pointer-events-auto"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component — drop-in replacement for the Activity tab content.
//
// Props
//   posts         : already-mapped post objects (see mapPost helper below)
//   loadingTab    : boolean — show skeletons while fetching
//   currentUserId : the logged-in user's ID (for edit/delete ownership check)
//   onPostsChange : callback(updatedPosts[]) so parent can reflect mutations
// ---------------------------------------------------------------------------
export function ActivityFeedTab({ posts, loadingTab, currentUserId, onPostsChange }) {
  const { token } = useAuth();
  const shareModal = useModal();
  const deleteModal = useModal();
  const editModal = useModal();

  const toggleLike = async (postId) => {
    const updated = posts.map((p) =>
      p.id === postId
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
    );
    onPostsChange(updated);

    try {
      await fetch(`${API_BASE}/api/pulse/posts/${postId}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reactionType: "LIKE" }),
      });
    } catch (err) {
      console.error("Like toggle failed", err);
    }
  };

  const handleDeletePost = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/pulse/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onPostsChange(posts.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleEditPost = async (postId, content, mediaURL) => {
    const res = await fetch(`${API_BASE}/api/pulse/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, mediaURL }),
    });
    const data = await res.json();
    if (data.success) {
      onPostsChange(
        posts.map((p) =>
          p.id === postId
            ? { ...p, text: data.data.content, image: data.data.mediaURL }
            : p
        )
      );
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 animate-fade-in self-stretch w-full">
        {loadingTab && <ActivitySkeletons />}

        {!loadingTab &&
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onToggleLike={toggleLike}
              onDelete={(p) => deleteModal.open(p)}
              onEdit={(p) => editModal.open(p)}
              onShare={(data) => shareModal.open(data)}
            />
          ))}

        {!loadingTab && posts.length === 0 && (
          <div className="text-center py-16 w-full">
            <p className="text-plasma-text-secondary text-sm">No posts yet.</p>
          </div>
        )}
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
      <EditPostModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        post={editModal.modalData}
        onSave={handleEditPost}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Helper — normalise a raw API post object into the shape ActivityFeedTab
// expects. Works for both /api/pulse/user/:id and /api/feed responses.
// ---------------------------------------------------------------------------
export function mapActivityPost(p) {
  return {
    id: p.postID,
    type: p.type || "post",
    userID: p.plasmaUserID,
    rawIntent: p.intent || null,
    user: {
      name: p.username,
      avatar: getAvatarUrl(p.avatarURL, p.username),
    },
    text: p.content,
    image: p.mediaURL || null,
    likes: parseInt(p.reactionCount) || 0,
    comments: parseInt(p.commentCount) || 0,
    time: new Date(p.timestampUTC).toLocaleString(),
    liked: p.hasReacted || false,
  };
}
