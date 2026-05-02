"use client";

import { useState, useEffect, use } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  Trophy, Lock, ChevronLeft, Calendar, Users, Target, Shield, Medal, 
  Sparkles, Zap, Star, Loader2, ArrowLeft, Gamepad2, Info, Activity
} from "lucide-react";
import { getAvatarUrl, getRarityProps } from "@/lib/utils";
import Link from "next/link";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";

const iconMap = { Trophy, Target, Shield, Medal, Sparkles, Zap, Star, Gamepad2 };

export default function GamePrestigePage({ params }) {
  const { gameId } = use(params);
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!token || !gameId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [achRes, friendsRes] = await Promise.all([
          fetch(`${API_BASE}/api/achievements/game/${gameId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/api/achievements/game/${gameId}/friends`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const achJson = await achRes.json();
        const friendsJson = await friendsRes.json();

        if (achJson.success) setData(achJson.data);
        if (friendsJson.success) setFriends(friendsJson.data);
      } catch (err) {
        console.error("Failed to fetch game prestige data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, gameId]);

  if (loading) {
    return (
      <DashboardLayout showRightRail={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-plasma-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout showRightRail={false}>
        <div className="p-8 text-center">
          <p className="text-plasma-text-secondary">Game not found or error loading data.</p>
          <Link href="/prestige" className="text-plasma-primary hover:underline mt-4 inline-block">
            Back to Prestige
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { game, achievements } = data;
  const unlocked = achievements.filter(a => a.isUnlocked);
  const locked = achievements.filter(a => !a.isUnlocked);
  const totalXp = unlocked.reduce((acc, a) => acc + a.plasmaXP, 0);
  const completionPercentage = Math.round((unlocked.length / achievements.length) * 100);

  // Group achievements by date
  const groupedAchievements = unlocked.reduce((acc, ach) => {
    const date = new Date(ach.unlockedAt);
    let group = "Earlier";
    if (isToday(date)) group = "Today";
    else if (isThisWeek(date)) group = "This Week";
    else if (isThisMonth(date)) group = "This Month";
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(ach);
    return acc;
  }, {});

  const groupOrder = ["Today", "This Week", "This Month", "Earlier"];

  // Calculate actual Rarity Score (average rarity weight of unlocked achievements)
  const avgRarity = unlocked.length > 0 
    ? (unlocked.reduce((acc, a) => acc + parseFloat(a.rarityWeight), 0) / unlocked.length).toFixed(1)
    : "0.0";

  return (
    <DashboardLayout showRightRail={false}>
      <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-10 pb-24">
        
        {/* Header Section */}
        <div className="relative group">
          <Link href="/prestige" className="flex items-center gap-2 text-plasma-text-secondary hover:text-white transition-colors mb-6 group/back">
            <div className="p-2 rounded-full bg-white/5 group-hover/back:bg-plasma-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest">Back to Prestige</span>
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-plasma-primary/20 blur-[60px] rounded-full group-hover:bg-plasma-primary/30 transition-all duration-700" />
              <img 
                src={game.coverArtURL || "https://placehold.co/600x900?text=No+Cover"} 
                alt={game.title}
                className="w-48 h-72 object-cover rounded-2xl border-2 border-white/10 shadow-2xl relative z-10"
              />
            </div>
            
            <div className="flex-1 space-y-4 text-center md:text-left z-10">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-6xl font-display font-black text-white tracking-tight uppercase">
                  {game.title}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="px-3 py-1 rounded-full bg-plasma-primary/10 border border-plasma-primary/30 text-plasma-primary text-[10px] font-bold tracking-tighter uppercase">
                    {game.platform}
                  </span>
                  <span className="text-plasma-text-secondary text-sm font-medium">
                    {unlocked.length} of {achievements.length} Achievements Unlocked
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 pt-4">
                <div className="text-center md:text-left">
                  <p className="text-[48px] font-mono font-black bg-primary-gradient bg-clip-text text-transparent leading-none">
                    {totalXp.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-plasma-text-secondary tracking-widest uppercase mt-2">TOTAL PLASMA XP</p>
                </div>
                
                <div className="h-12 w-px bg-white/10 hidden md:block" />
                
                <div className="space-y-3 min-w-[200px]">
                  <div className="flex justify-between text-xs font-bold uppercase">
                    <span className="text-plasma-text-secondary">Completion</span>
                    <span className="text-plasma-primary">{completionPercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-primary-gradient transition-all duration-1000 shadow-[0_0_15px_rgba(255,42,122,0.5)]" 
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-white/5">
          {["all", "unlocked", "locked", "friends"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 text-sm font-bold uppercase tracking-widest transition-all relative ${
                activeTab === tab ? "text-white" : "text-plasma-text-secondary hover:text-white"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-plasma-primary shadow-[0_0_10px_rgba(255,42,122,0.8)]" />
              )}
            </button>
          ))}
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Achievements List (2/3) */}
          <div className="lg:col-span-2 space-y-12">
            
            {activeTab !== "friends" && (
              <>
                {/* Unlocked Achievements Grouped by Date */}
                {(activeTab === "all" || activeTab === "unlocked") && groupOrder.map(group => (
                  groupedAchievements[group] && groupedAchievements[group].length > 0 && (
                    <div key={group} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <h2 className="text-xs font-black text-plasma-text-secondary uppercase tracking-[0.3em] shrink-0">
                          {group}
                        </h2>
                        <div className="h-px w-full bg-white/5" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupedAchievements[group].map(ach => (
                          <AchievementCard key={ach.achievementID} achievement={ach} />
                        ))}
                      </div>
                    </div>
                  )
                ))}

                {/* Locked Achievements */}
                {(activeTab === "all" || activeTab === "locked") && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xs font-black text-plasma-text-secondary uppercase tracking-[0.3em] shrink-0">
                        Locked {locked.length > 0 ? `(${locked.length})` : ""}
                      </h2>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    
                    {locked.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                        {locked.map(ach => (
                          <AchievementCard key={ach.achievementID} achievement={ach} isLocked />
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 px-6 rounded-3xl bg-white/5 border border-dashed border-white/10 text-center">
                        <Info className="w-8 h-8 mx-auto text-plasma-text-secondary/30 mb-3" />
                        <p className="text-sm text-plasma-text-secondary font-medium">
                          {game.isManualEntry 
                            ? "Locked achievements are not available for manual entries. This feature is exclusive to Steam-linked titles." 
                            : "Congratulations! You've unlocked every achievement for this game."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === "friends" && (
              <div className="space-y-8">
                {friends.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                    <Users className="w-12 h-12 mx-auto text-plasma-text-secondary/20 mb-4" />
                    <p className="text-plasma-text-secondary font-medium">None of your friends have unlocked achievements in this game yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {friends.map(friend => (
                      <FriendAchievementCard key={friend.id} friend={friend} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Side Stats/Activity (1/3) */}
          <div className="space-y-8">
            {/* Global Statistics (Only for Steam Games) */}
            {!game.isManualEntry && (
              <div className="bg-plasma-slate/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5 space-y-6">
                <h3 className="text-xs font-bold text-plasma-text-secondary uppercase tracking-widest">Global Statistics</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-plasma-primary" />
                      <span className="text-xs font-medium text-plasma-text-secondary">Avg. Rarity</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-white">{avgRarity}%</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] text-plasma-text-secondary leading-relaxed">
                    You've earned <span className="text-white font-bold">{totalXp.toLocaleString()} XP</span> from this game. 
                    Your average achievement rarity is <span className="text-plasma-primary font-bold">{avgRarity}%</span> among all Plasma players.
                  </p>
                </div>
              </div>
            )}

            {/* Manual Game Stats */}
            {game.isManualEntry && (
              <div className="bg-plasma-slate/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold text-plasma-text-secondary uppercase tracking-widest">Milestone Progress</h3>
                <div className="p-4 rounded-2xl bg-plasma-primary/5 border border-plasma-primary/20">
                  <p className="text-[32px] font-mono font-black text-white">{unlocked.length}</p>
                  <p className="text-[10px] font-bold text-plasma-text-secondary uppercase tracking-tighter">Manual Milestones Recorded</p>
                </div>
                <p className="text-[10px] text-plasma-text-secondary leading-relaxed italic">
                  Manual games are tracked personally. Share your milestones in the Feed to earn recognition from the squad!
                </p>
              </div>
            )}

            {/* Quick Friend List */}
            {activeTab !== "friends" && friends.length > 0 && (
              <div className="bg-plasma-slate/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5 space-y-6">
                <h3 className="text-xs font-bold text-plasma-text-secondary uppercase tracking-widest">Friends Playing</h3>
                <div className="flex -space-x-3">
                  {friends.slice(0, 5).map(f => (
                    <img 
                      key={f.id} 
                      src={getAvatarUrl(f.avatar, f.username)} 
                      className="w-10 h-10 rounded-full border-2 border-plasma-bg hover:-translate-y-1 transition-transform cursor-pointer"
                      title={f.username}
                    />
                  ))}
                  {friends.length > 5 && (
                    <div className="w-10 h-10 rounded-full bg-plasma-primary border-2 border-plasma-bg flex items-center justify-center text-[10px] font-bold text-white">
                      +{friends.length - 5}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setActiveTab("friends")}
                  className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  View All Activity
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

function AchievementCard({ achievement, isLocked }) {
  const rarity = getRarityProps(achievement.rarityWeight);
  const Icon = iconMap[achievement.iconName] || Trophy;

  return (
    <div className={`p-4 rounded-3xl bg-plasma-slate/60 backdrop-blur-md border border-white/5 hover:border-white/10 transition-all group hover:scale-[1.02] cursor-pointer relative overflow-hidden ${isLocked ? 'grayscale opacity-75' : ''}`}>
      {!isLocked && (
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity ${rarity.bg}`} />
      )}
      
      <div className="flex gap-4 items-center">
        <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 relative z-10 transition-transform group-hover:scale-110 ${isLocked ? 'bg-white/5 border-white/10' : `${rarity.border} ${rarity.shadow} bg-white/5`}`}>
          {isLocked ? <Lock className="w-6 h-6 text-plasma-text-secondary" /> : <Icon className={`w-8 h-8 ${rarity.color}`} />}
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="text-sm font-bold text-white truncate group-hover:text-plasma-primary transition-colors">{achievement.title}</h4>
          <p className="text-[11px] text-plasma-text-secondary line-clamp-2 leading-snug">
            {isLocked ? "Connect to Steam to unlock this hidden achievement." : achievement.description || "No description available."}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <span className={`text-[10px] font-mono font-bold ${isLocked ? 'text-plasma-text-secondary' : rarity.color}`}>
              +{achievement.plasmaXP} XP
            </span>
            <span className="text-[10px] font-bold text-plasma-text-secondary/50 uppercase tracking-tighter">
              {achievement.rarityWeight}% Players
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FriendAchievementCard({ friend }) {
  return (
    <div className="p-5 rounded-3xl bg-plasma-slate/60 backdrop-blur-md border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-4">
        <img 
          src={getAvatarUrl(friend.avatar, friend.username)} 
          className="w-12 h-12 rounded-full border-2 border-plasma-primary/30"
          alt=""
        />
        <div>
          <h4 className="text-sm font-bold text-white">{friend.username}</h4>
          <p className="text-[10px] text-plasma-text-secondary font-medium uppercase tracking-widest">
            {friend.unlockedCount} Achievements Unlocked
          </p>
        </div>
      </div>

      <div className="flex -space-x-2">
        {friend.achievements.slice(0, 8).map(ach => {
          const rarity = getRarityProps(ach.rarityWeight || 10);
          return (
            <div 
              key={ach.id}
              className={`w-10 h-10 rounded-full border-2 border-plasma-bg bg-plasma-slate flex items-center justify-center ${rarity.border} ${rarity.shadow}`}
              title={ach.title}
            >
              <Trophy className={`w-4 h-4 ${rarity.color}`} />
            </div>
          );
        })}
        {friend.achievements.length > 8 && (
          <div className="w-10 h-10 rounded-full bg-plasma-primary border-2 border-plasma-bg flex items-center justify-center text-[10px] font-bold text-white">
            +{friend.achievements.length - 8}
          </div>
        )}
      </div>

      <Link 
        href={`/profile/${friend.id}`}
        className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-plasma-primary text-xs font-bold uppercase tracking-widest transition-all text-center"
      >
        View Profile
      </Link>
    </div>
  );
}
