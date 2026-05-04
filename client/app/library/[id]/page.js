"use client";

import { use, useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowLeft, Clock, Trophy, Users, Play, Calendar, Loader2, Cloud, Gamepad2, Plus, ExternalLink, Swords, Shield, Target, Medal, Skull, Flame, Crosshair, Lock, Sparkles, Leaf, Flag, Gem, Zap, Activity } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useModal } from "@/hooks/useModal";
import { AddMilestoneModal } from "@/components/modals/AddMilestoneModal";
import { AchievementIcon } from "@/components/ui/AchievementIcon";
import { getRarityProps, getHeroImage } from "@/lib/utils";

const formatLastPlayed = (dateString) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function GameDetailPage({ params }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams?.id;
  console.log("[GameDetail] Resolved ID:", id, "Params:", resolvedParams);

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const { token } = useAuth();
  const { sendMessage } = useSocket();
  const router = useRouter();
  const milestoneModal = useModal();
  const [friendsPlaying, setFriendsPlaying] = useState([]);

  // Heartbeat for 'Currently Playing' status
  useEffect(() => {
    if (isPlaying && id) {
      const interval = setInterval(() => {
        console.log(`WS: Heartbeat for game ${id}`);
        sendMessage("PING_PLAYING", { gameId: id });
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [isPlaying, id, sendMessage]);

  const [achievements, setAchievements] = useState([]);

  const fetchAchievements = useCallback(async () => {
    if (!token || !id) return;
    try {
      const res = await fetch(`${API_BASE}/api/achievements/game/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const achievementJson = await res.json();
      if (achievementJson.success) {
        setAchievements(achievementJson.data.achievements
          .filter(ach => !!ach.unlockedAt)
          .map(ach => {
            const rarityProps = getRarityProps(ach.rarityWeight);
            return {
              id: ach.achievementID,
              title: ach.title,
              description: ach.description,
              proofUrl: ach.proofUrl,
              xp: `${ach.plasmaXP} XP`,
              unlockedAt: ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : null,
              unlocked: !!ach.unlockedAt,
              ...rarityProps
            };
          }));
      }
    } catch (err) {
      console.error("Failed to fetch achievements:", err);
    }
  }, [id, token]);

  const fetchFriendsPlaying = useCallback(async () => {
    if (!token || !id) return;
    try {
      const res = await fetch(`${API_BASE}/api/achievements/game/${id}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const friendsJson = await res.json();
      if (friendsJson.success) {
        setFriendsPlaying(friendsJson.data);
      }
    } catch (err) {
      console.error("Failed to fetch friends playing:", err);
    }
  }, [id, token]);

  useEffect(() => {
    fetchAchievements();
    fetchFriendsPlaying();
  }, [fetchAchievements, fetchFriendsPlaying]);

  const [isOwned, setIsOwned] = useState(false);


  useEffect(() => {
    let ignore = false;
    const fetchGameDetails = async () => {
      if (!token || !id) {
        console.log("[GameDetail] Skipping fetch - missing token or ID");
        return;
      }

      setLoading(true);
      console.log("[GameDetail] Starting fetch sequence for:", id);

      try {
        // 1. Try local library first
        const res = await fetch(`${API_BASE}/api/library/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const libraryJson = await res.json();

        if (ignore) return;

        if (libraryJson.success) {
          console.log("[GameDetail] Found in library:", id);
          const g = libraryJson.data;
          setGame({
            id: g.appID,
            title: g.title,
            image: getHeroImage(g.appID, g.coverArtURL, g.platform),
            platform: g.platform,
            hoursPlayed: g.hoursPlayed || 0,
            lastPlayed: formatLastPlayed(g.lastPlayedAt),
            nowPlaying: g.isCurrentlyPlaying,
            description: "No description available for this title.",
            coverArtURL: g.coverArtURL
          });
          setIsPlaying(g.isCurrentlyPlaying);
          setIsOwned(true);
        } else if (String(id).startsWith("igdb_")) {
          // 2. If not in library but it's an IGDB ID, fetch global info
          console.log("[GameDetail] Not in library, attempting IGDB fetch:", id);
          const igdbId = String(id).replace("igdb_", "");
          const igdbRes = await fetch(`${API_BASE}/api/library/igdb/${igdbId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const igdbJson = await igdbRes.json();

          if (ignore) return;
          console.log("[GameDetail] IGDB API Response:", igdbJson);

          if (igdbJson.success) {
            const g = igdbJson.data;
            const newGame = {
              id: `igdb_${g.id}`,
              title: g.name,
              image: g.screenshots?.[0] || (g.cover?.url ? g.cover.url.replace("t_thumb", "t_1080p").replace("//", "https://") : null),
              platform: "Global DB",
              hoursPlayed: 0,
              lastPlayed: "Never",
              nowPlaying: false,
              description: g.summary || "No description available.",
              coverArtURL: g.cover?.url,
              genres: g.genres?.map(gn => gn.name).join(", "),
              releaseDate: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : null
            };
            console.log("[GameDetail] Setting IGDB game state:", newGame.title);
            setGame(newGame);
            setIsOwned(false);
          } else {
            console.error("[GameDetail] IGDB fetch failed:", igdbJson.message);
            setGame(null);
          }
        } else {
          console.warn("[GameDetail] Game not found anywhere:", id);
          setGame(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error("[GameDetail] Fetch error:", err);
          setGame(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchGameDetails();
    return () => { ignore = true; };
  }, [id, token]);


  const togglePlaying = async () => {
    const newStatus = !isPlaying;
    setIsPlaying(newStatus);
    try {
      await fetch(`${API_BASE}/api/library/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isCurrentlyPlaying: newStatus })
      });
    } catch (err) {
      console.error(err);
      setIsPlaying(!newStatus); // Rollback
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove this game from your library?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/library/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        router.push("/library");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout showRightRail={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-plasma-primary animate-spin mb-4" />
          <p className="text-plasma-text-secondary animate-pulse">Loading game intelligence...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!game) {
    return (
      <DashboardLayout showRightRail={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="w-20 h-20 bg-plasma-error/10 rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-10 h-10 text-plasma-error opacity-50" />
          </div>
          <h2 className="font-display font-bold text-2xl text-plasma-text-primary mb-2">Game Not Found</h2>
          <p className="text-plasma-text-secondary text-sm mb-8 max-w-xs">This game isn&apos;t in your collection or may have been removed.</p>
          <Link href="/library" className="px-8 py-3 rounded-full bg-plasma-slate border border-white/10 text-white font-bold text-sm hover:bg-plasma-slate-hover transition-all">
            Back to Library
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const formatPlaytime = (hours) => {
    if (!hours || hours === 0) return "0m";
    const totalMinutes = Math.floor(hours * 60);
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  return (
    <DashboardLayout showRightRail={false}>
      <div className="max-w-4xl mx-auto px-8 py-8 pb-20 animate-fade-in">
        {/* Back link */}
        <Link href="/library" className="inline-flex items-center gap-2 text-sm text-plasma-text-secondary hover:text-plasma-primary transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Library
        </Link>

        {/* Hero Banner */}
        <div className="relative w-full h-[320px] rounded-2xl overflow-hidden mb-8 shadow-2xl border border-white/5">
          {game.image ? (
            <Image 
              src={game.image} 
              alt={game.title} 
              fill 
              className="object-cover transition-transform duration-700 hover:scale-105" 
              priority 
              sizes="(max-width: 1024px) 100vw, 1024px" 
            />
          ) : (
            <div className="absolute inset-0 bg-plasma-slate flex items-center justify-center">
              <Play className="w-20 h-20 text-white/5" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-plasma-bg via-plasma-bg/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border-2 transition-all shadow-2xl ${game.platform === "Steam"
                  ? "bg-[#171a21] text-[#66c0f4] border-[#66c0f4]/30 shadow-blue-500/20"
                  : "bg-[#1a1122] text-plasma-primary border-plasma-primary/40 shadow-plasma-primary/20"
                  }`}>
                  {game.platform === "Steam" ? <Cloud className="w-3 h-3 fill-current" /> : <Gamepad2 className="w-3 h-3 fill-current" />}
                  {game.platform}
                </span>
                {game.releaseDate && (
                  <span className="text-[10px] font-bold text-plasma-text-secondary bg-white/5 px-2 py-1 rounded-md">{game.releaseDate}</span>
                )}
              </div>
              <h1 className="font-display font-bold text-4xl md:text-5xl text-plasma-text-primary mb-2 truncate drop-shadow-lg">{game.title}</h1>
              <p className="text-[15px] text-plasma-text-secondary max-w-xl line-clamp-2 drop-shadow-md">
                {game.genres ? <span className="text-plasma-primary font-bold mr-2">{game.genres} •</span> : ""}
                {game.description}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {!isOwned ? (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_BASE}/api/library/manual`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                          gameId: game.id,
                          title: game.title,
                          coverArtURL: game.coverArtURL
                        })
                      });
                      if (res.ok) {
                        setIsOwned(true);
                      }
                    } catch (err) {
                      console.error("Failed to add game:", err);
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm bg-plasma-primary text-white hover:shadow-card-glow hover:scale-[1.02] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  ADD TO COLLECTION
                </button>
              ) : (
                <>
                  <button
                    onClick={handleRemove}
                    className="px-5 py-3 rounded-xl font-bold text-sm bg-plasma-error/10 text-plasma-error border border-plasma-error/20 hover:bg-plasma-error hover:text-white transition-all cursor-pointer"
                  >
                    Remove
                  </button>
                  {game.platform === "STEAM" && !String(id).startsWith("igdb_") && !String(id).startsWith("custom_") ? (
                    <button
                      onClick={async () => {
                        if (!isPlaying) {
                          // Launch steam
                          window.location.href = `steam://run/${id}`;
                          // If not already playing, toggle it on
                          await togglePlaying();
                        } else {
                          // If already playing, this acts as the "Stop Playing" toggle
                          await togglePlaying();
                        }
                      }}
                      className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${isPlaying
                        ? "bg-plasma-secondary text-white shadow-[0_0_25px_rgba(255,42,122,0.4)]"
                        : "bg-[#1b2838] text-[#66c0f4] border border-[#66c0f4]/20 hover:bg-[#2a475e] hover:shadow-[0_0_15px_rgba(102,192,244,0.3)]"
                        }`}
                    >
                      <Play className={`w-4 h-4 ${isPlaying ? "fill-white" : ""}`} />
                      {isPlaying ? "STOP PLAYING" : "RUN GAME"}
                    </button>
                  ) : (
                    <button
                      onClick={togglePlaying}
                      className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${isPlaying
                        ? "bg-plasma-secondary text-white shadow-[0_0_25px_rgba(255,42,122,0.4)]"
                        : "bg-primary-gradient text-white hover:shadow-card-glow hover:scale-[1.02]"
                        }`}
                    >
                      <Play className={`w-4 h-4 ${isPlaying ? "fill-white" : ""}`} />
                      {isPlaying ? "NOW PLAYING" : "Set Playing"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Hours Played", value: formatPlaytime(game.hoursPlayed), icon: Clock },
            { label: "Achievements", value: `${achievements.length}`, icon: Trophy },
            { label: "Friends Playing", value: `${friendsPlaying.length}`, icon: Users },
            { label: "Last Played", value: isPlaying ? "Now" : game.lastPlayed, icon: Calendar },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-plasma-slate/60 backdrop-blur-md rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-plasma-primary" />
                  <span className="text-[10px] font-bold text-plasma-text-secondary uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-2xl font-display font-bold text-plasma-text-primary">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-xl text-plasma-text-primary">Achievements</h2>
                <button
                  onClick={milestoneModal.open}
                  className="w-6 h-6 rounded-full bg-plasma-primary/10 border border-plasma-primary/30 flex items-center justify-center text-plasma-primary hover:bg-plasma-primary hover:text-white transition-all cursor-pointer"
                  title="Add Custom Milestone"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-plasma-text-secondary font-medium">{achievements.length} Unlocked</span>
              </div>
            </div>

            {achievements.length > 0 ? (
              <div className="flex flex-wrap gap-8">
                {achievements.map((ach) => (
                  <AchievementIcon key={ach.id} achievement={ach} />
                ))}
              </div>
            ) : (
              <div className="bg-plasma-slate/30 border border-dashed border-white/10 rounded-2xl p-12 text-center">
                <Trophy className="w-12 h-12 text-plasma-text-secondary/20 mx-auto mb-4" />
                <p className="text-plasma-text-secondary text-sm">No achievements unlocked for {game.title} yet.</p>
              </div>
            )}
          </div>

          {/* Friends Playing Activity */}
          <div>
            <h2 className="font-display font-bold text-xl text-plasma-text-primary mb-4">Activity</h2>
            <div className="bg-plasma-slate/60 backdrop-blur-md rounded-2xl border border-white/5 p-6">
              {friendsPlaying.length > 0 ? (
                <div className="space-y-4">
                  {friendsPlaying.map(friend => (
                    <div key={friend.id} className="flex items-center gap-3">
                      <Link href={`/profile/${friend.id}`} className="shrink-0 relative w-10 h-10">
                        <Image src={friend.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + friend.username} alt={friend.username} fill className="rounded-full border border-white/10 hover:border-plasma-primary transition-colors object-cover" sizes="40px" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/profile/${friend.id}`} className="text-sm font-bold text-plasma-text-primary truncate hover:text-plasma-primary transition-colors block">{friend.username}</Link>
                        <p className="text-xs text-plasma-text-secondary truncate">Unlocked {friend.unlockedCount} achievements</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-plasma-text-secondary text-center py-8 italic">No friends have played this yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <AddMilestoneModal
        isOpen={milestoneModal.isOpen}
        onClose={milestoneModal.close}
        onAdded={fetchAchievements}
        gameId={id}
      />
    </DashboardLayout>
  );
}
