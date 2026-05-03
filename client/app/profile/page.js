"use client";

import { useState, useEffect } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Gamepad2, Medal, Trophy, Swords, Shield, Target, Calendar, Users, User, Loader2, ChevronDown, ChevronUp, Lock, Gem, ExternalLink, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { AddMilestoneModal } from "@/components/modals/AddMilestoneModal";
import { AchievementIcon } from "@/components/ui/AchievementIcon";
import { getIntentStyle } from "@/lib/intentStyles";
import { getRarityProps, getAvatarUrl } from "@/lib/utils";
import { ActivityFeedTab, mapActivityPost } from "@/components/ui/ActivityFeedTab";

import { useModal } from "@/hooks/useModal";
import { EditHallOfFameModal } from "@/components/modals/EditHallOfFameModal";

const iconMap = { Trophy, Swords, Shield, Target, Medal, Gem, Lock };

// Prefer Steam's high-res vertical capsule over the tiny icon
function getHighResImage(appID, fallbackURL, platform) {
  if (platform === "STEAM" && appID && !appID.startsWith("custom_") && !appID.startsWith("igdb_")) {
    return `https://steamcdn-a.akamaihd.net/steam/apps/${appID}/library_600x900.jpg`;
  }
  return fallbackURL || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop";
}

// --- SKELETONS ---
function ProfileHeaderSkeleton() {
  return (
    <header className="relative min-h-[280px] w-full flex items-center px-8 md:px-20 overflow-hidden py-10 md:py-0">
      <div className="absolute inset-0 z-0 bg-plasma-bg">
        <div className="absolute inset-0 bg-gradient-to-br from-plasma-primary/30 to-plasma-secondary/15 backdrop-blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-plasma-bg to-transparent"></div>
      </div>
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center w-full justify-between gap-6 md:gap-0 mt-8 md:mt-0 animate-pulse">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-[120px] h-[120px] rounded-full bg-plasma-slate-hover border-[3px] border-plasma-slate" />
          <div className="space-y-3">
            <div className="w-40 h-8 rounded bg-plasma-slate-hover" />
            <div className="w-24 h-4 rounded bg-plasma-slate-hover" />
            <div className="flex gap-3 mt-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-[100px] h-[56px] rounded-lg bg-plasma-slate-hover" />)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}



export default function Profile() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("Activity");
  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState(null);
  const [prestigeData, setPrestigeData] = useState(null);
  const [activityPosts, setActivityPosts] = useState([]);
  const [libraryGames, setLibraryGames] = useState([]);
  const [rallies, setRallies] = useState([]);
  const [hofData, setHofData] = useState([]);
  const [squad, setSquad] = useState([]);
  const [gamesProgress, setGamesProgress] = useState([]);
  const [expandedGames, setExpandedGames] = useState({});
  const [loadingTab, setLoadingTab] = useState(false);
  const editHofModal = useModal();

  // Fetch profile + prestige on mount
  useEffect(() => {
    if (!token || !user) return;
    const fetchProfile = async () => {
      setLoading(true);
      // Clear tab-specific data to prevent stale rendering
      setGamesProgress([]);
      setHofData([]);
      setActivityPosts([]);
      setLibraryGames([]);
      setRallies([]);
      setExpandedGames({});

      try {
        const [prestigeRes, squadRes] = await Promise.all([
          fetch(`${API_BASE}/api/prestige/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/users/${user.id}/followers`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const prestigeJson = await prestigeRes.json();
        const squadJson = await squadRes.json();

        // Use user from auth context as profile data
        setProfileData({
          username: user.name || user.username,
          avatar: user.avatar || null,
          bio: user.bio || "",
        });

        if (prestigeJson.success) {
          setPrestigeData(prestigeJson.data);
          setHofData(prestigeJson.data.hallOfFame.map((item) => {
            const rarityProps = getRarityProps(item.rarityWeight);
            return {
              ...rarityProps,
              id: item.achievementID,
              gameId: item.appID,
              title: item.title,
              description: item.description,
              iconName: item.iconName || rarityProps.iconName,
              xp: `${item.plasmaXP} XP`,
              unlockedAt: item.unlockedAt, // Pass raw date for robust handling in AchievementIcon
              unlocked: true,
              gameTitle: item.gameTitle,
            };
          }));
        }

        if (squadJson.success) {
          setSquad(squadJson.data.filter(u => u.isMutual));
        }
        // Pre-fetch library for the stats counter
        try {
          const libRes = await fetch(`${API_BASE}/api/library/user/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
          const libJson = await libRes.json();
          if (libJson.success) {
            setLibraryGames(libJson.data.map(g => ({
              id: g.appID,
              title: g.title,
              image: getHighResImage(g.appID, g.coverArtURL, g.platform),
              isCurrentlyPlaying: g.isCurrentlyPlaying,
            })));
          }
        } catch (err) {
          console.error("Failed to fetch initial library data", err);
        }

      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, user?.id]);

  const handleUpdateHof = async (achievementIds) => {
    try {
      await fetch(`${API_BASE}/api/prestige/me/hall-of-fame`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ achievementIds })
      });
      // Refresh prestige data to update Hall of Fame
      const res = await fetch(`${API_BASE}/api/prestige/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setPrestigeData(data.data);
        setHofData(data.data.hallOfFame.map((item) => {
          const rarityProps = getRarityProps(item.rarityWeight);
          return {
            id: item.achievementID,
            gameId: item.appID,
            title: item.title,
            description: item.description,
            iconName: item.iconName,
            xp: `${item.plasmaXP} XP`,
            unlockedAt: item.unlockedAt,
            unlocked: true,
            gameTitle: item.gameTitle,
            ...rarityProps
          };
        }));
      }
    } catch (err) {
      console.error("Failed to update Hall of Fame", err);
    }
  };

  const toggleExpand = (index) => {
    setExpandedGames(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Fetch tab data
  useEffect(() => {
    if (!token || !user) return;

    const fetchTabData = async () => {
      setLoadingTab(true);
      try {
        if (activeTab === "Activity") {
          const res = await fetch(`${API_BASE}/api/pulse/user/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setActivityPosts(data.data.map(mapActivityPost));
          }
        } else if (activeTab === "Library" && libraryGames.length === 0) {
          const res = await fetch(`${API_BASE}/api/library/user/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setLibraryGames(data.data.map(g => ({
              id: g.appID,
              title: g.title,
              image: getHighResImage(g.appID, g.coverArtURL, g.platform),
              isCurrentlyPlaying: g.isCurrentlyPlaying,
            })));
          }
        } else if (activeTab === "Achievements") {
          const res = await fetch(`${API_BASE}/api/achievements/${user.id}?orderBy=rarityWeight&direction=DESC`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            const formattedGames = data.data.gamesProgress.map(g => ({
              id: g.appID,
              title: g.gameTitle,
              achievements: g.achievements.map(a => {
                const rarityProps = getRarityProps(a.rarityWeight);
                return {
                  id: a.achievementID,
                  title: a.title,
                  description: a.description,
                  iconName: a.iconName,
                  xp: `${a.plasmaXP} XP`,
                  unlockedAt: a.unlockedAt,
                  unlocked: !!a.unlockedAt && a.unlockedAt !== "NULL" && a.unlockedAt !== "null",
                  gameTitle: g.gameTitle,
                  ...rarityProps
                };
              })
            }));
            setGamesProgress(formattedGames);
          }
        } else if (activeTab === "Rallies") {
          const res = await fetch(`${API_BASE}/api/rallies/user/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setRallies(data.data.map(e => ({
              id: e.eventID,
              title: e.title,
              date: new Date(e.scheduledStartUTC).toLocaleDateString([], { month: 'short', day: 'numeric' }),
              time: new Date(e.scheduledStartUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              intent: e.requiredIntent,
              intentColor: getIntentStyle(e.requiredIntent).badge,
              slotsFilled: parseInt(e.currentAttendees) || 0,
              slotsTotal: e.maxCapacity,
            })));
          }
        }
      } catch (err) {
        console.error("Failed to fetch tab data", err);
      } finally {
        setLoadingTab(false);
      }
    };
    fetchTabData();
  }, [token, user?.id, activeTab]);

  const userStats = profileData && prestigeData ? [
    { label: "Plasma XP", value: prestigeData.totalPlasmaXP.toLocaleString(), highlight: true },
    { label: "Achievements", value: String(prestigeData.unlockedCount) },
    { label: "Squad", value: String(squad.length || 0) },
    { label: "Library", value: String(libraryGames.length) },
  ] : [];

  return (
    <DashboardLayout showRightRail={false}>
      <div className="pb-20 animate-fade-in min-h-screen">

        {/* PROFILE HEADER */}
        {loading ? <ProfileHeaderSkeleton /> : profileData && (
          <header className="relative min-h-[280px] w-full flex items-center px-8 md:px-20 overflow-hidden py-10 md:py-0">
            <div className="absolute inset-0 z-0 bg-plasma-bg">
              <div className="absolute inset-0 bg-gradient-to-br from-plasma-primary/20 to-plasma-secondary/10"></div>
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-plasma-bg to-transparent"></div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center w-full justify-between gap-6 md:gap-0 mt-8 md:mt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative shrink-0">
                  <div className={`w-[120px] h-[120px] rounded-full border-[3px] ${getIntentStyle(user?.intent).border} p-1 bg-plasma-slate overflow-hidden`}>
                    <img src={getAvatarUrl(profileData.avatar, profileData.username)} alt="User Profile" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-[3px] border-plasma-bg" style={{ backgroundColor: getIntentStyle(user?.intent).border === 'border-plasma-secondary' ? '#FF2A7A' : getIntentStyle(user?.intent).border === 'border-slate-500' ? '#94a3b8' : '#2ECC71' }}></div>
                </div>

                <div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="font-display font-bold text-[32px] text-plasma-text-primary leading-tight">{profileData.username}</h1>
                    <span className={`px-3 py-1 rounded-full ${getIntentStyle(user?.intent).badge} border ${getIntentStyle(user?.intent).border} text-[10px] font-bold font-sans flex items-center gap-1.5`}>
                      <Gamepad2 className="w-3.5 h-3.5" /> {getIntentStyle(user?.intent).label}
                    </span>
                  </div>

                  <div className="flex gap-3 mt-4 flex-wrap">
                    {userStats.map((stat, idx) => (
                      <div key={idx} className="bg-plasma-slate/60 backdrop-blur-md rounded-lg px-4 py-3 min-w-[100px] border border-white/5">
                        <p className={`font-mono text-[18px] leading-none ${stat.highlight ? "text-plasma-secondary" : "text-plasma-text-primary"}`}>{stat.value}</p>
                        <p className="text-plasma-text-secondary text-[11px] font-medium mt-1 uppercase tracking-tighter">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary-gradient text-white font-bold text-sm transition-all hover:shadow-card-glow hover:scale-[1.02] shrink-0 cursor-pointer"
                >
                  <User className="w-4 h-4" /> Edit Profile
                </Link>
              </div>
            </div>
          </header>
        )}

        {/* HALL OF FAME ROW */}
        {!loading && (
          <section className="px-8 md:px-20 py-8 relative z-10 overflow-visible">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-plasma-text-secondary font-sans font-bold text-[10px] tracking-[0.2em] uppercase">Hall of Fame</h3>
              <button
                onClick={() => editHofModal.open()}
                className="text-plasma-primary text-[12px] font-bold uppercase tracking-wider hover:text-plasma-secondary transition-colors cursor-pointer"
              >
                Edit Hall of Fame
              </button>
            </div>
            <div className="flex flex-wrap gap-6 pb-12 overflow-visible relative z-10">
              {hofData.length > 0 ? hofData.map((item) => (
                <div key={item.id} className="relative">
                  <AchievementIcon achievement={item} showGameTitle={true} />
                </div>
              )) : (
                <p className="text-sm text-plasma-text-secondary">No pinned achievements yet.</p>
              )}
            </div>
          </section>
        )}

        {/* CONTENT TABS */}
        {!loading && (
          <section className="px-8 md:px-20 mt-2 relative z-20">
            <div className="flex gap-8 border-b border-white/5 overflow-x-auto hide-scrollbar">
              {["Activity", "Library", "Achievements", "Squad", "Rallies"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-sm font-semibold font-sans whitespace-nowrap transition-colors cursor-pointer ${activeTab === tab
                    ? "border-b-2 border-plasma-primary text-plasma-text-primary"
                    : "border-b-2 border-transparent text-plasma-text-secondary hover:text-plasma-text-primary"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ACTIVITY TAB */}
            {activeTab === "Activity" && (
              <ActivityFeedTab
                posts={activityPosts}
                loadingTab={loadingTab}
                currentUserId={user?.id}
                onPostsChange={setActivityPosts}
              />
            )}

            {/* LIBRARY TAB */}
            {activeTab === "Library" && (
              <div className="py-8 animate-fade-in">
                {loadingTab ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="aspect-[2/3] rounded-xl bg-plasma-slate-hover animate-pulse" />
                    ))}
                  </div>
                ) : libraryGames.length > 0 ? (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {libraryGames.slice(0, 12).map((game) => (
                        <div 
                          key={game.id} 
                          className="relative aspect-[2/3] rounded-xl overflow-hidden group hover:scale-[1.03] transition-transform shadow-lg block"
                        >
                          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${game.image})` }} />
                          {game.isCurrentlyPlaying && (
                            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-plasma-secondary text-white text-[8px] font-bold rounded z-10 shadow-[0_0_10px_rgba(255,42,122,0.5)]">LIVE</div>
                          )}
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-plasma-bg/70 backdrop-blur-[4px] flex flex-col items-center justify-center gap-3 px-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                togglePlaying(game.id, game.isCurrentlyPlaying);
                              }}
                              className="flex items-center justify-between w-full px-2"
                            >
                              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Set Playing</span>
                              <div className={`w-7 h-3.5 rounded-full relative transition-colors ${game.isCurrentlyPlaying ? "bg-plasma-secondary" : "bg-white/20"}`}>
                                <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${game.isCurrentlyPlaying ? "right-0.5" : "left-0.5"}`}></div>
                              </div>
                            </button>

                            <Link 
                              href={`/library/${game.id}`}
                              className="text-[11px] font-black text-white hover:text-plasma-primary transition-colors flex items-center gap-1 mt-1 uppercase tracking-widest"
                            >
                              Details <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <span className="text-[10px] font-bold text-white truncate block uppercase tracking-tight">{game.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 text-center">
                      <Link href="/library" className="text-plasma-primary text-sm font-semibold hover:text-plasma-secondary transition-colors">
                        View Full Library →
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-plasma-text-secondary text-sm">No games in library yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Achievements" && (
              <div className="py-8 animate-fade-in max-w-[800px] relative overflow-visible z-20">
                {prestigeData && (
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-3xl font-mono font-bold bg-primary-gradient bg-clip-text text-transparent">{prestigeData.totalPlasmaXP.toLocaleString()}</span>
                      <span className="text-xs text-plasma-text-secondary ml-2">PLASMA XP</span>
                    </div>
                    <Link href="/prestige" className="text-plasma-primary text-sm font-semibold hover:text-plasma-secondary transition-colors">
                      View All →
                    </Link>
                  </div>
                )}

                {loadingTab ? (
                  <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-plasma-primary" /></div>
                ) : (
                  <div className="space-y-10">
                    {gamesProgress.length > 0 ? (
                      gamesProgress.map((game, index) => {
                        const isExpanded = expandedGames[index];

                        return (
                          <div key={index} className="animate-fade-in relative hover:z-30">
                            <div className="flex items-center justify-between mb-4">
                              <Link href={`/prestige/${game.id}`} className="text-[11px] font-bold text-plasma-text-secondary tracking-[0.2em] uppercase hover:text-plasma-primary transition-colors block cursor-pointer">{game.title}</Link>
                              {game.achievements.length > 1 && (
                                <button
                                  onClick={() => toggleExpand(index)}
                                  className="text-[10px] font-bold text-plasma-primary hover:text-plasma-secondary transition-colors uppercase tracking-[0.15em] flex items-center gap-1 cursor-pointer"
                                >
                                  {isExpanded ? "Show Less" : "Show All"}
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                            <div
                              className="flex flex-wrap gap-[32px] transition-all duration-300 ease-in-out overflow-visible relative z-20"
                            >
                              {(isExpanded ? game.achievements : game.achievements.slice(0, 5)).map((ach, aIdx) => (
                                <AchievementIcon key={aIdx} achievement={ach} />
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-plasma-text-secondary text-sm">No achievements yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SQUAD TAB */}
            {activeTab === "Squad" && (
              <div className="py-8 animate-fade-in max-w-[680px]">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-plasma-text-secondary">{squad.length} members in your squad</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {squad.length > 0 ? squad.map((member) => (
                    <Link
                      key={member.plasmaUserID}
                      href={`/profile/${member.plasmaUserID}`}
                      className="flex items-center gap-4 p-4 bg-plasma-slate/60 rounded-xl border border-white/5 hover:bg-white/5 transition-colors group"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={getAvatarUrl(member.avatarURL, member.username)}
                          alt=""
                          className="w-12 h-12 rounded-full border border-white/10"
                        />
                        {member.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-plasma-success rounded-full border-2 border-plasma-slate" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-plasma-text-primary truncate group-hover:text-plasma-primary transition-colors">{member.username}</p>
                        <p className="text-[10px] text-plasma-text-secondary uppercase tracking-widest mt-1">SQUAD MEMBER</p>
                      </div>
                    </Link>
                  )) : (
                    <div className="text-center py-12 col-span-2">
                      <p className="text-plasma-text-secondary text-sm">You haven't added any squad members yet.</p>
                      <Link href="/pulse" className="text-plasma-primary text-xs font-bold mt-4 inline-block hover:underline">Find Players on Pulse →</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RALLIES TAB */}
            {activeTab === "Rallies" && (
              <div className="py-8 animate-fade-in max-w-[680px]">
                {loadingTab ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between p-4 bg-plasma-slate/60 rounded-xl border border-white/5 animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-plasma-slate-hover" />
                          <div className="space-y-2">
                            <div className="w-32 h-4 rounded bg-plasma-slate-hover" />
                            <div className="w-24 h-3 rounded bg-plasma-slate-hover" />
                          </div>
                        </div>
                        <div className="w-16 h-6 rounded bg-plasma-slate-hover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-sm text-plasma-text-secondary">{rallies.length} rallies</p>
                      <Link href="/rally" className="text-plasma-primary text-sm font-semibold hover:text-plasma-secondary transition-colors">
                        View Calendar →
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {rallies.length > 0 ? rallies.map((event) => (
                        <Link
                          key={event.id}
                          href={`/rally/${event.id}`}
                          className="flex items-center justify-between p-4 bg-plasma-slate/60 rounded-xl border border-white/5 hover:bg-white/10 hover:scale-[1.01] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-plasma-primary/10 flex items-center justify-center group-hover:bg-plasma-primary/20 transition-colors">
                              <Calendar className="w-5 h-5 text-plasma-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-plasma-text-primary group-hover:text-plasma-primary transition-colors">{event.title}</p>
                              <div className="flex items-center gap-2 text-xs text-plasma-text-secondary">
                                <span>{event.date} at {event.time}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-plasma-text-secondary">
                              <Users className="w-3.5 h-3.5" />
                              <span>{event.slotsFilled}/{event.slotsTotal}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${event.intentColor}`}>{event.intent}</span>
                          </div>
                        </Link>
                      )) : (
                        <div className="text-center py-12">
                          <p className="text-plasma-text-secondary text-sm">No rallies yet.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <EditHallOfFameModal
        isOpen={editHofModal.isOpen}
        onClose={editHofModal.close}
        initialSelectedIds={hofData.map(h => h.id)}
        onUpdate={(ids) => handleUpdateHof(ids)}
      />
    </DashboardLayout>
  );
}
