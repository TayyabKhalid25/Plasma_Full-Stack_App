"use client";

import { useState, useEffect } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { ImageIcon, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useModal } from "@/hooks/useModal";
import { UploadMediaModal } from "@/components/modals/UploadMediaModal";
import { ActivityFeedTab, mapActivityPost } from "@/components/ui/ActivityFeedTab";
import { getIntentStyle } from "@/lib/intentStyles";
import { getAvatarUrl } from "@/lib/utils";

const feedFilters = [
  { id: "all", label: "All" },
  { id: "friends", label: "Friends Activity" },
  { id: "my-posts", label: "My Posts" },
  { id: "comp", label: "Comp Only" },
  { id: "chill", label: "Chill Only" },
];

export const ActivityFeedSection = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [mediaUrl, setMediaUrl] = useState(null);
  const [showPostFeedback, setShowPostFeedback] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const { token, user } = useAuth();
  const uploadModal = useModal();

  useEffect(() => {
    if (!token) return;
    const fetchFeed = async () => {
      setLoadingFeed(true);
      try {
        const res = await fetch(`${API_BASE}/api/feed?filter=${activeFilter}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setPosts(data.data.map(mapActivityPost));
        }
      } catch (err) {
        console.error("Failed to fetch feed", err);
      } finally {
        setLoadingFeed(false);
      }
    };
    fetchFeed();
  }, [token, activeFilter]);

  const handlePost = async () => {
    if (!postText.trim() && !mediaUrl) return;
    try {
      const res = await fetch(`${API_BASE}/api/pulse/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: postText, mediaURL: mediaUrl }),
      });
      const data = await res.json();
      if (data.success) {
        const newPost = {
          id: data.data.postID,
          type: "post",
          userID: user?.plasmaUserID || user?.id,
          rawIntent: data.data.intent,
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
                activeFilter === tab.id
                  ? "bg-plasma-primary text-white"
                  : "bg-plasma-slate-hover text-plasma-text-secondary hover:bg-white/10"
              }`}
            >
              <div className="font-sans font-bold text-xs tracking-[0] leading-4 whitespace-nowrap">
                {tab.label}
              </div>
            </button>
          ))}
        </div>

        {/* Feed — shared component handles cards, skeletons, and modals */}
        <ActivityFeedTab
          posts={posts}
          loadingTab={loadingFeed}
          currentUserId={user?.id}
          onPostsChange={setPosts}
        />
      </div>

      <UploadMediaModal
        isOpen={uploadModal.isOpen}
        onClose={uploadModal.close}
        onUploadComplete={(url) => setMediaUrl(url)}
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
