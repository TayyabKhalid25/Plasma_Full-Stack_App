"use client";

import { use, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowLeft, Clock, Trophy, Users, Play, Calendar, Loader2, Cloud, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, API_BASE } from "@/context/AuthContext";

export default function GameDetailPage({ params }) {
  const { id } = use(params);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!token || !id) return;
      try {
        const res = await fetch(`${API_BASE}/api/library/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const g = data.data;
          setGame({
            id: g.appID,
            title: g.title,
            image: g.coverArtURL,
            platform: g.platform === "STEAM" ? "Steam" : "Non-Steam",
            hoursPlayed: g.hoursPlayed || 0,
            lastPlayed: formatLastPlayed(g.lastPlayedAt),
            nowPlaying: g.isCurrentlyPlaying,
            description: "No description available for this title." // Database doesn't store descriptions yet
          });
          setIsPlaying(g.isCurrentlyPlaying);
        }
      } catch (err) {
        console.error("Failed to fetch game details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [id, token]);

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

  const friendsPlaying = []; // Placeholder for now

  const achievements = []; // Placeholder for now

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
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105" style={{ backgroundImage: `url(${game.image})` }} />
          ) : (
            <div className="absolute inset-0 bg-plasma-slate flex items-center justify-center">
              <Play className="w-20 h-20 text-white/5" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-plasma-bg via-plasma-bg/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border-2 transition-all shadow-2xl ${
                  game.platform === "Steam" 
                    ? "bg-[#171a21] text-[#66c0f4] border-[#66c0f4]/30 shadow-blue-500/20" 
                    : "bg-[#1a1122] text-plasma-primary border-plasma-primary/40 shadow-plasma-primary/20"
                }`}>
                  {game.platform === "Steam" ? <Cloud className="w-3 h-3 fill-current" /> : <Gamepad2 className="w-3 h-3 fill-current" />}
                  {game.platform}
                </span>
              </div>
              <h1 className="font-display font-bold text-4xl md:text-5xl text-plasma-text-primary mb-2 truncate drop-shadow-lg">{game.title}</h1>
              <p className="text-[15px] text-plasma-text-secondary max-w-xl line-clamp-2 drop-shadow-md">{game.description}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleRemove}
                className="px-5 py-3 rounded-xl font-bold text-sm bg-plasma-error/10 text-plasma-error border border-plasma-error/20 hover:bg-plasma-error hover:text-white transition-all cursor-pointer"
              >
                Remove
              </button>
              <button
                onClick={togglePlaying}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  isPlaying
                    ? "bg-plasma-secondary text-white shadow-[0_0_25px_rgba(255,42,122,0.4)]"
                    : "bg-primary-gradient text-white hover:shadow-card-glow hover:scale-[1.02]"
                }`}
              >
                <Play className={`w-4 h-4 ${isPlaying ? "fill-white" : ""}`} />
                {isPlaying ? "NOW PLAYING" : "Set Playing"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Hours Played", value: formatPlaytime(game.hoursPlayed), icon: Clock },
            { label: "Achievements", value: "0/0", icon: Trophy },
            { label: "Friends Playing", value: "0", icon: Users },
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
          {/* Achievements Placeholder */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl text-plasma-text-primary">Achievements</h2>
              <span className="text-xs text-plasma-text-secondary font-medium">Coming Soon</span>
            </div>
            <div className="bg-plasma-slate/30 border border-dashed border-white/10 rounded-2xl p-12 text-center">
              <Trophy className="w-12 h-12 text-plasma-text-secondary/20 mx-auto mb-4" />
              <p className="text-plasma-text-secondary text-sm">Achievement synchronization for {game.title} is being calibrated.</p>
            </div>
          </div>

          {/* Friends Playing Placeholder */}
          <div>
            <h2 className="font-display font-bold text-xl text-plasma-text-primary mb-4">Activity</h2>
            <div className="bg-plasma-slate/60 backdrop-blur-md rounded-2xl border border-white/5 p-6">
               <p className="text-sm text-plasma-text-secondary text-center py-8 italic">No recent activity found for this title.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
