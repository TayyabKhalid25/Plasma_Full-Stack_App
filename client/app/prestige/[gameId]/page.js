"use client";

import { useState, useEffect, use } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Trophy, Lock, Users, Medal, Loader2, ArrowLeft, Info } from "lucide-react";
import { AchievementIcon } from "@/components/ui/AchievementIcon";
import { FriendAchievementCard } from "@/components/ui/FriendAchievementCard";
import { getRarityProps } from "@/lib/utils";
import Link from "next/link";

export default function GamePrestigePage({ params }) {
  const { gameId } = use(params);
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);
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

        if (achJson.success) setPageData(achJson.data);
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

  if (!pageData) {
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

  const { game, achievements } = pageData;
  const unlocked = achievements.filter(a => a.isUnlocked);
  const locked = achievements.filter(a => !a.isUnlocked);
  const totalXp = unlocked.reduce((acc, a) => acc + a.plasmaXP, 0);
  const completionPercentage = achievements.length > 0
    ? Math.round((unlocked.length / achievements.length) * 100)
    : 0;

  // Group unlocked by date — backend already sorted unlockedAt DESC
  // Recent: fuzzy labels. Older: specific date per unique day.
  const groupedAchievements = {};
  const groupOrder = [];

  unlocked.forEach(ach => {
    const date = new Date(ach.unlockedAt);
    const now = new Date();
    let group;

    const isToday = date.toDateString() === now.toDateString();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isThisWeek = diffDays <= 7 && !isToday;
    const isThisMonth = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && diffDays > 7;

    if (isToday) group = "Today";
    else if (isThisWeek) group = "This Week";
    else if (isThisMonth) group = "This Month";
    else group = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    if (!groupedAchievements[group]) {
      groupedAchievements[group] = [];
      groupOrder.push(group); // preserves insertion order from sorted backend data
    }
    groupedAchievements[group].push(ach);
  });

  return (
    <DashboardLayout showRightRail={false}>
      <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-10 pb-24">

        {/* Header */}
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
                  <p className="text-[10px] font-bold text-plasma-text-secondary tracking-widest uppercase mt-2">Total Plasma XP</p>
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

        {/* Content */}
        <div className="space-y-12">

          {activeTab !== "friends" && (
            <>
              {/* Unlocked — grouped by date */}
              {(activeTab === "all" || activeTab === "unlocked") && groupOrder.map(group => (
                groupedAchievements[group]?.length > 0 && (
                  <div key={group} className="space-y-5">
                    {/* Date divider */}
                    <div className="flex items-center gap-4">
                      <h2 className="text-xs font-black text-plasma-text-secondary uppercase tracking-[0.3em] shrink-0">
                        {group}
                      </h2>
                      <div className="h-px w-full bg-white/5" />
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 shrink-0">
                        <span className="text-[11px] font-bold text-plasma-text-primary">
                          {groupedAchievements[group].length}
                        </span>
                        <Medal className="w-3.5 h-3.5 text-plasma-gold" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-8 overflow-visible relative z-50">
                      {groupedAchievements[group].map(ach => {
                        const mappedAch = {
                          id: ach.achievementID,
                          title: ach.title,
                          description: ach.description,
                          iconName: ach.iconName,
                          xp: `${ach.plasmaXP} XP`,
                          unlockedAt: ach.unlockedAt,
                          unlocked: true,
                          gameTitle: game.title,
                          ...getRarityProps(ach.rarityWeight)
                        };
                        return <AchievementIcon key={ach.achievementID} achievement={mappedAch} />;
                      })}
                    </div>
                  </div>
                )
              ))}

              {/* Locked */}
              {(activeTab === "all" || activeTab === "locked") && (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xs font-black text-plasma-text-secondary uppercase tracking-[0.3em] shrink-0">
                      Locked
                    </h2>
                    <div className="h-px w-full bg-white/5" />
                    {locked.length > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 shrink-0">
                        <span className="text-[11px] font-bold text-plasma-text-primary">
                          {locked.length}
                        </span>
                        <Lock className="w-3.5 h-3.5 text-plasma-text-secondary" />
                      </div>
                    )}
                  </div>

                  {locked.length > 0 ? (
                    <div className="flex flex-wrap gap-8 overflow-visible relative z-50">
                      {locked.map(ach => {
                        const mappedAch = {
                          id: ach.achievementID,
                          title: ach.title,
                          description: ach.description,
                          iconName: ach.iconName,
                          xp: `${ach.plasmaXP} XP`,
                          unlockedAt: null,
                          unlocked: false,
                          gameTitle: game.title,
                          ...getRarityProps(ach.rarityWeight)
                        };
                        return <AchievementIcon key={ach.achievementID} achievement={mappedAch} />;
                      })}
                    </div>
                  ) : (
                    <div className="py-10 px-6 rounded-3xl bg-white/5 border border-dashed border-white/10 text-center">
                      <Info className="w-8 h-8 mx-auto text-plasma-text-secondary/30 mb-3" />
                      <p className="text-sm text-plasma-text-secondary font-medium">
                        {game.isManualEntry
                          ? "Locked achievements unavailable for manual entries. Steam-linked titles only."
                          : "Congratulations! Every achievement unlocked for this game."}
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
                  <p className="text-plasma-text-secondary font-medium">No friends unlocked achievements in this game yet.</p>
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
      </div>
    </DashboardLayout>
  );
}

