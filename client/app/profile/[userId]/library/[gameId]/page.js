"use client";

import { use, useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowLeft, Clock, Trophy, Lock, Loader2, Gamepad2, Cloud, Activity, Users } from "lucide-react";
import Link from "next/link";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { AchievementIcon } from "@/components/ui/AchievementIcon";
import { getRarityProps, getHeroImage } from "@/lib/utils";

export default function UserLibraryDetailPage({ params }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const { userId, gameId: id } = resolvedParams;

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [privacyError, setPrivacyError] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [friendsPlaying, setFriendsPlaying] = useState([]);
  const { token } = useAuth();

  const fetchData = useCallback(async () => {
    if (!token || !id || !userId) return;
    setLoading(true);
    setPrivacyError(false);
    try {
      // Fetch game details
      const gameRes = await fetch(`${API_BASE}/api/library/user/${userId}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const gameJson = await gameRes.json();

      if (gameJson.success) {
        setGame(gameJson.data);
      } else if (gameJson.isPrivate) {
        setPrivacyError(true);
        setLoading(false);
        return;
      }

      // Fetch achievements
      const achRes = await fetch(`${API_BASE}/api/achievements/game/${id}?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const achJson = await achRes.json();
      
      if (achJson.success) {
        setAchievements(achJson.data.achievements
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

      // Fetch friends playing
      const friendsRes = await fetch(`${API_BASE}/api/achievements/game/${id}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const friendsJson = await friendsRes.json();
      if (friendsJson.success) {
        setFriendsPlaying(friendsJson.data);
      }
    } catch (err) {
      console.error("Failed to fetch user game details:", err);
    } finally {
      setLoading(false);
    }
  }, [id, userId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  if (loading) {
    return (
      <DashboardLayout showRightRail={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-plasma-primary animate-spin mb-4" />
          <p className="text-plasma-text-secondary animate-pulse text-xs font-bold uppercase tracking-widest">Loading details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (privacyError) {
    return (
      <DashboardLayout showRightRail={false}>
        <div className="p-12 text-center max-w-xl mx-auto">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
            <Lock className="w-10 h-10 text-plasma-text-secondary/50" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Private Profile</h2>
          <p className="text-plasma-text-secondary leading-relaxed mb-8">
            This user has set their Steam profile to private. You can only view their library if you are mutual friends on Plasma.
          </p>
          <Link 
            href={`/profile/${userId}`} 
            className="px-8 py-3 rounded-full bg-plasma-primary text-white font-bold uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(255,42,122,0.4)] transition-all"
          >
            Back to Profile
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!game) {
    return (
      <DashboardLayout showRightRail={false}>
        <div className="p-8 text-center">
          <p className="text-plasma-text-secondary mb-6">Game not found in library.</p>
          <Link href={`/profile/${userId}`} className="px-8 py-3 rounded-full bg-plasma-slate border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-plasma-slate-hover transition-all">
            Back to Profile
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const heroImage = getHeroImage(game.appID, game.coverArtURL, game.platform);

  return (
    <DashboardLayout showRightRail={false}>
      <div className="animate-fade-in pb-20 max-w-5xl mx-auto px-4 sm:px-8">
        {/* Header/Back Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/profile/${userId}`} className="w-10 h-10 rounded-full bg-plasma-slate/60 backdrop-blur-md flex items-center justify-center text-plasma-text-secondary hover:text-white hover:bg-plasma-slate transition-all border border-white/5 group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <h1 className="text-xs font-bold text-plasma-text-secondary uppercase tracking-[0.2em]">User's Library</h1>
        </div>

        {/* Hero Banner */}
        <div className="relative h-[300px] md:h-[400px] w-full rounded-3xl overflow-hidden mb-12 group shadow-2xl border border-white/5">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-plasma-bg via-plasma-bg/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-36 md:w-32 md:h-48 rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0 bg-plasma-slate/80">
                  <img src={game.coverArtURL} alt={game.title} className="w-full h-full object-cover" />
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${game.platform === "STEAM"
                      ? "bg-[#171a21] text-[#66c0f4] border-[#66c0f4]/30"
                      : "bg-[#1a1122] text-plasma-primary border-plasma-primary/40"
                      }`}>
                      {game.platform === "STEAM" ? <Cloud className="w-3 h-3 fill-current" /> : <Gamepad2 className="w-3 h-3 fill-current" />}
                      {game.platform}
                    </span>
                    {game.isCurrentlyPlaying && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-plasma-secondary text-white shadow-[0_0_15px_rgba(255,42,122,0.4)]">
                        <Activity className="w-3 h-3" />
                        Now Playing
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-lg">
                    {game.title}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Hours Played", value: `${Math.round(game.hoursPlayed || 0)}H`, icon: Clock },
            { label: "Achievements", value: `${achievements.length}`, icon: Trophy },
            { label: "Friends Playing", value: `${friendsPlaying.length}`, icon: Users },
            { label: "Last Session", value: game.lastPlayedAt ? new Date(game.lastPlayedAt).toLocaleDateString() : "Never", icon: Activity },
          ].map((stat) => (
            <div key={stat.label} className="bg-plasma-slate/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-plasma-slate/60 transition-colors">
              <div className="flex items-center gap-3 mb-2 text-plasma-text-secondary">
                <stat.icon className="w-4 h-4 text-plasma-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-2xl font-mono font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Unlocked Achievements</h3>
              <span className="text-xs text-plasma-text-secondary font-medium">{achievements.length} Unlocked</span>
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
                <p className="text-plasma-text-secondary text-sm italic">No achievements unlocked for this game yet.</p>
              </div>
            )}
          </div>

          {/* Friends Activity */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Activity</h3>
            <div className="bg-plasma-slate/40 backdrop-blur-md rounded-2xl border border-white/5 p-6">
              {friendsPlaying.length > 0 ? (
                <div className="space-y-4">
                  {friendsPlaying.map(friend => (
                    <div key={friend.id} className="flex items-center gap-3 group">
                      <Link href={`/profile/${friend.id}`} className="shrink-0 relative">
                        <img src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} alt={friend.username} className="w-10 h-10 rounded-full border border-white/10 group-hover:border-plasma-primary transition-colors" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/profile/${friend.id}`} className="text-sm font-bold text-plasma-text-primary truncate hover:text-plasma-primary transition-colors block">{friend.username}</Link>
                        <p className="text-xs text-plasma-text-secondary truncate">Unlocked {friend.unlockedCount} achievements</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-plasma-text-secondary italic">No friends have played this yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
