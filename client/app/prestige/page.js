"use client";

import { useState, useEffect } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Trophy, Swords, Shield, Target, Medal, Skull, Flame, Crosshair, Users, Lock, Sparkles, Leaf, Flag, Diamond, Zap, Activity, Loader2, CheckCircle2, ChevronDown, ChevronUp
} from "lucide-react";
import { useModal } from "@/hooks/useModal";
import { EditHallOfFameModal } from "@/components/modals/EditHallOfFameModal";
import { InviteFriendsModal } from "@/components/modals/InviteFriendsModal";
import { AddMilestoneModal } from "@/components/modals/AddMilestoneModal";
import { getIntentStyle } from "@/lib/intentStyles";
import { getAvatarUrl, getRarityProps } from "@/lib/utils";
import Link from "next/link";

const iconMap = { Trophy, Swords, Shield, Target, Medal, Skull, Flame, Crosshair, Users, Lock, Sparkles, Leaf, Flag, Diamond, Zap, Activity };

const achievementTabs = [
  { id: "all", label: "All" },
  { id: "steam", label: "Steam Trophies" },
  { id: "manual", label: "Manual Milestones" },
];

// --- SKELETONS ---
function HofSkeleton() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex flex-col items-center gap-2 w-[72px] shrink-0 animate-pulse">
          <div className="w-[72px] h-[72px] rounded-full bg-plasma-slate-hover" />
          <div className="w-16 h-3 rounded bg-plasma-slate-hover" />
          <div className="w-12 h-2.5 rounded bg-plasma-slate-hover" />
        </div>
      ))}
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="flex items-center gap-3 p-2.5 border-b border-white/5 animate-pulse">
          <div className="w-6 h-5 rounded bg-plasma-slate-hover" />
          <div className="w-8 h-8 rounded-full bg-plasma-slate-hover" />
          <div className="flex-1 h-4 rounded bg-plasma-slate-hover" />
          <div className="w-16 h-4 rounded bg-plasma-slate-hover" />
        </div>
      ))}
    </div>
  );
}

function AchievementGridSkeleton() {
  return (
    <div className="space-y-10 py-6">
      {[1, 2].map(g => (
        <div key={g}>
          <div className="w-32 h-3 rounded bg-plasma-slate-hover mb-4 animate-pulse" />
          <div className="flex flex-wrap gap-[32px]">
            {[1, 2, 3, 4].map(a => (
              <div key={a} className="flex flex-col items-center gap-2 w-[72px] animate-pulse">
                <div className="w-[72px] h-[72px] rounded-full bg-plasma-slate-hover" />
                <div className="w-14 h-2.5 rounded bg-plasma-slate-hover" />
                <div className="w-10 h-2 rounded bg-plasma-slate-hover" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Prestige() {
  const { token, user } = useAuth();
  const [activeAchTab, setActiveAchTab] = useState("all");
  const [activeLeaderboard, setActiveLeaderboard] = useState("friends");

  const [loading, setLoading] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const [prestigeData, setPrestigeData] = useState({ totalPlasmaXP: 0, unlockedCount: 0, hallOfFame: [] });
  const [gamesProgress, setGamesProgress] = useState([]);
  const [hof, setHof] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [expandedGames, setExpandedGames] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const editHofModal = useModal();
  const inviteModal = useModal();
  const addMilestoneModal = useModal();

  // Fetch prestige + achievements data
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prestigeRes, achievementsRes] = await Promise.all([
          fetch(`${API_BASE}/api/prestige/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/achievements?type=${activeAchTab}&orderBy=rarityWeight&direction=DESC`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const prestigeJson = await prestigeRes.json();
        const achievementsJson = await achievementsRes.json();

        if (prestigeJson.success) {
          setPrestigeData(prestigeJson.data);
          // Map hall of fame
          setHof(prestigeJson.data.hallOfFame.map((item) => {
            const rarityProps = getRarityProps(item.rarityWeight);
            return {
              id: item.achievementID,
              title: item.title,
              xp: `+${item.plasmaXP}`,
              ...rarityProps
            };
          }));
        }

        if (achievementsJson.success) {
          setGamesProgress(achievementsJson.data.gamesProgress.map(game => ({
            title: game.gameTitle?.toUpperCase() || "UNKNOWN GAME",
            achievements: game.achievements.map(ach => {
              const rarityProps = getRarityProps(ach.rarityWeight);
              return {
                title: ach.title,
                xp: `${ach.plasmaXP} XP`,
                unlocked: !!ach.unlockedAt,
                ...rarityProps
              };
            })
          })));
        }
      } catch (err) {
        console.error("Failed to fetch prestige data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, activeAchTab]);

  // Fetch leaderboard
  useEffect(() => {
    if (!token) return;
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const res = await fetch(`${API_BASE}/api/leaderboard?scope=${activeLeaderboard === "global" ? "global" : "friends"}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setLeaderboardData(data.data.map((u, idx) => ({
            id: idx + 1,
            name: u.username,
            xp: `${(u.totalPlasmaXP || 0).toLocaleString()} XP`,
            rank: idx < 3 ? ["🥇", "🥈", "🥉"][idx] : String(idx + 1),
            avatar: getAvatarUrl(u.avatarURL, u.username),
            rawIntent: u.intent,
            plasmaUserID: u.plasmaUserID,
            isCurrentUser: String(u.plasmaUserID) === String(user?.id),
          })));
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, [token, activeLeaderboard, user?.id]);

  const handleUpdateHof = async (achievementIds) => {
    try {
      await fetch(`${API_BASE}/api/prestige/me/hall-of-fame`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ achievementIds })
      });
      // Refresh prestige data
      const res = await fetch(`${API_BASE}/api/prestige/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setPrestigeData(data.data);
        setHof(data.data.hallOfFame.map((item) => {
          const rarityProps = getRarityProps(item.rarityWeight);
          return {
            id: item.achievementID,
            title: item.title,
            xp: `${item.plasmaXP} XP`,
            ...rarityProps,
            borderColor: rarityProps.border,
            glow: rarityProps.shadow,
          };
        }));
      }
    } catch (err) {
      console.error("Failed to update Hall of Fame", err);
    }
  };

  const syncAchievements = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/api/steam/sync/achievements`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Synced ${data.syncedAchievements} achievements across ${data.gamesProcessed} games!`, "success");
        // Re-trigger the data fetch
        setActiveAchTab(prev => prev); // force useEffect re-run
        // Manually re-fetch
        const [prestigeRes, achievementsRes] = await Promise.all([
          fetch(`${API_BASE}/api/prestige/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/achievements?type=${activeAchTab}&orderBy=rarityWeight&direction=DESC`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const prestigeJson = await prestigeRes.json();
        const achievementsJson = await achievementsRes.json();
        if (prestigeJson.success) setPrestigeData(prestigeJson.data);
        if (achievementsJson.success) {
          setGamesProgress(achievementsJson.data.gamesProgress.map(game => ({
            title: game.gameTitle?.toUpperCase() || "UNKNOWN GAME",
            achievements: game.achievements.map(ach => {
              const rarityProps = getRarityProps(ach.rarityWeight);
              return {
                title: ach.title,
                xp: `${ach.plasmaXP} XP`,
                unlocked: !!ach.unlockedAt,
                ...rarityProps
              };
            })
          })));
        }
      } else {
        showToast(data.message || "Sync failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error during sync", "error");
    } finally {
      setSyncing(false);
    }
  };

  const toggleExpand = (index) => {
    setExpandedGames(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <DashboardLayout showRightRail={false}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-[200] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in transition-all ${toast.type === "success"
          ? "bg-plasma-success/20 border border-plasma-success/30 text-plasma-success"
          : "bg-plasma-error/20 border border-plasma-error/30 text-plasma-error"
          }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {toast.message}
        </div>
      )}

      <div className="max-w-[1440px] mx-auto p-8 flex flex-col lg:flex-row gap-8 min-h-screen pb-20">

        {/* LEFT SECTION (65%) */}
        <div className="w-full lg:w-[65%] space-y-8 animate-fade-in">

          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <h1 className="font-display font-bold text-[32px] text-plasma-text-primary leading-none">The Prestige</h1>
            <div className="flex items-center gap-6">
              <button
                onClick={syncAchievements}
                disabled={syncing}
                className="px-4 py-2 bg-primary-gradient text-white font-bold text-xs rounded-full shadow-card-glow hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  "Sync Steam Achievements"
                )}
              </button>
              <div className="text-right">
                {loading ? (
                  <div className="w-24 h-10 rounded bg-plasma-slate-hover animate-pulse" />
                ) : (
                  <>
                    <span className="block text-[40px] font-mono font-bold bg-primary-gradient bg-clip-text text-transparent leading-none">
                      {prestigeData.totalPlasmaXP.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-bold text-plasma-text-secondary tracking-widest uppercase mt-1 block">PLASMA XP</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* HALL OF FAME */}
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold text-plasma-text-secondary tracking-[0.2em] uppercase">HALL OF FAME</h2>
              <button
                onClick={() => editHofModal.open()}
                className="text-plasma-primary text-sm font-semibold hover:text-plasma-secondary transition-colors cursor-pointer"
              >
                Edit Hall of Fame
              </button>
            </div>

            {loading ? <HofSkeleton /> : (
              <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
                {hof.length > 0 ? hof.map((item) => {
                  const Icon = iconMap[item.iconName] || Trophy;
                  return (
                    <div key={item.id} className="flex flex-col items-center gap-2 shrink-0">
                      <div className={`w-[72px] h-[72px] rounded-full bg-plasma-slate/60 backdrop-blur-md border-2 ${item.border} flex items-center justify-center hover:border-plasma-secondary/40 transition-all overflow-hidden ${item.shadow}`}>
                        <Icon className={`w-8 h-8 ${item.color} opacity-80`} />
                      </div>
                      <div className="text-center w-[72px]">
                        <p className="text-[10px] font-bold text-plasma-text-primary truncate">{item.title}</p>
                        <p className={`text-[10px] font-mono ${item.color}`}>{item.xp}</p>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-plasma-text-secondary py-4">No achievements pinned yet.</p>
                )}
              </div>
            )}
          </section>

          {/* Achievement Tabs */}
          <div className="mt-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex gap-8">
              {achievementTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveAchTab(tab.id)}
                  className={`pb-3 px-1 border-b-2 text-sm font-semibold cursor-pointer transition-colors ${activeAchTab === tab.id
                    ? "border-plasma-primary text-plasma-text-primary"
                    : "border-transparent text-plasma-text-secondary hover:text-plasma-text-primary"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => addMilestoneModal.open()}
              className="pb-3 text-plasma-primary text-sm font-bold hover:text-plasma-secondary transition-colors cursor-pointer flex items-center gap-1"
            >
              + Add Manual Milestone
            </button>
          </div>

          {/* Achievement Grid */}
          {loading ? <AchievementGridSkeleton /> : (
            <div className="space-y-10 py-6">
              {gamesProgress.length > 0 ? (
                gamesProgress.map((game, index) => {
                  const isExpanded = expandedGames[index];
                  const itemsPerRow = 8;
                  const hasMore = game.achievements.length > itemsPerRow;
                  const displayedAchievements = isExpanded ? game.achievements : game.achievements.slice(0, itemsPerRow);

                  return (
                    <div key={index} className="animate-fade-in">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[11px] font-bold text-plasma-text-secondary tracking-[0.2em] uppercase">{game.title}</h3>
                        {hasMore && (
                          <button
                            onClick={() => toggleExpand(index)}
                            className="text-[10px] font-bold text-plasma-primary hover:text-plasma-secondary transition-colors uppercase tracking-[0.15em] flex items-center gap-1 cursor-pointer"
                          >
                            {isExpanded ? "Show Less" : "Show All"}
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-[32px]">
                        {displayedAchievements.map((ach, aIdx) => {
                          const Icon = iconMap[ach.iconName] || Lock;
                          return (
                            <div key={aIdx} className={`flex flex-col items-center gap-2 w-[72px] text-center ${!ach.unlocked ? 'opacity-50 grayscale' : ''}`}>
                              <div className={`w-[72px] h-[72px] rounded-full border-2 ${ach.border} flex items-center justify-center bg-white/5 relative ${ach.unlocked ? ach.shadow : ''}`}>
                                <Icon className={`w-8 h-8 ${ach.color}`} />
                              </div>
                              <p className={`text-[10px] font-medium truncate w-full ${!ach.unlocked ? 'text-plasma-text-secondary' : 'text-plasma-text-primary'}`}>
                                {ach.title}
                              </p>
                              <p className={`text-[9px] font-mono ${ach.color}`}>{ach.xp}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-plasma-text-secondary text-sm">No achievements in this category yet.</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT PANEL (35%) */}
        <div className="w-full lg:w-[35%] relative animate-fade-in">
          <div className="sticky top-24 bg-plasma-slate rounded-xl p-6 border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-lg text-plasma-text-primary">
                {activeLeaderboard === "friends" ? "FRIENDS LEADERBOARD" : "GLOBAL LEADERBOARD"}
              </h2>
            </div>

            {/* Ranking Tabs */}
            <div className="flex gap-6 border-b border-white/5 mb-4">
              <button
                onClick={() => setActiveLeaderboard("friends")}
                className={`pb-2 px-1 border-b-2 text-sm font-medium cursor-pointer transition-colors ${activeLeaderboard === "friends"
                  ? "border-plasma-primary text-plasma-text-primary"
                  : "border-transparent text-plasma-text-secondary hover:text-plasma-text-primary"
                  }`}
              >
                Friends
              </button>
              <button
                onClick={() => setActiveLeaderboard("global")}
                className={`pb-2 px-1 border-b-2 text-sm font-medium cursor-pointer transition-colors ${activeLeaderboard === "global"
                  ? "border-plasma-primary text-plasma-text-primary"
                  : "border-transparent text-plasma-text-secondary hover:text-plasma-text-primary"
                  }`}
              >
                Global
              </button>
            </div>

            {/* Leaderboard Rows */}
            {loadingLeaderboard ? <LeaderboardSkeleton /> : (
              <div className="space-y-1">
                {leaderboardData.map((lb) => {
                  const liveIntent = lb.isCurrentUser ? user?.intent : lb.rawIntent;
                  const style = getIntentStyle(liveIntent);
                  return (
                    <Link
                      href={`/profile/${lb.plasmaUserID}`}
                      key={lb.id}
                      className={`flex items-center gap-3 p-2.5 border-b border-white/5 transition-colors cursor-pointer ${lb.isCurrentUser ? 'bg-white/10 rounded-lg' : 'hover:bg-white/5'
                        }`}
                    >
                      <span className={`w-6 text-center ${lb.id <= 3 ? 'text-lg' : 'text-sm text-plasma-text-secondary font-mono'}`}>
                        {lb.rank}
                      </span>
                      <div className="relative shrink-0">
                        <img
                          src={lb.avatar}
                          alt={lb.name}
                          className={`w-8 h-8 rounded-full border-2 ${style.border}`}
                        />
                      </div>
                      <span className={`flex-1 text-sm truncate ${lb.isCurrentUser ? 'text-plasma-secondary font-bold' : lb.id <= 3 ? 'text-plasma-text-primary font-medium' : 'text-plasma-text-secondary'}`}>
                        {lb.name}
                      </span>
                      <span className={`font-mono text-sm ${lb.isCurrentUser ? 'text-plasma-secondary' : lb.id === 1 ? 'text-plasma-secondary' : lb.id === 2 ? 'text-plasma-text-primary' : 'text-plasma-text-secondary'}`}>
                        {lb.xp}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Bottom CTA */}
            <button
              onClick={() => inviteModal.open()}
              className="w-full mt-6 py-3 rounded-full bg-primary-gradient text-white font-bold text-sm tracking-widest uppercase hover:shadow-[0_0_20px_rgba(255,42,122,0.3)] transition-all cursor-pointer"
            >
              Invite Friends
            </button>
          </div>
        </div>

      </div>

      <EditHallOfFameModal
        isOpen={editHofModal.isOpen}
        onClose={editHofModal.close}
        initialSelectedIds={hof.map(h => h.id)}
        onUpdate={(ids) => handleUpdateHof(ids)}
      />
      <InviteFriendsModal
        isOpen={inviteModal.isOpen}
        onClose={inviteModal.close}
      />
      <AddMilestoneModal
        isOpen={addMilestoneModal.isOpen}
        onClose={addMilestoneModal.close}
        onAdded={() => {
          // Trigger a re-fetch of the achievements
          setActiveAchTab((prev) => prev === "manual" ? "all" : "manual");
          setTimeout(() => setActiveAchTab("manual"), 50);
        }}
      />
    </DashboardLayout>
  );
}
