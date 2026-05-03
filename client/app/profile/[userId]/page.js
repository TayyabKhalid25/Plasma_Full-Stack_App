"use client";

import { useState, useEffect, use } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Gamepad2, Play, Medal, Trophy, Calendar, Users, UserPlus, UserMinus, Swords, Shield, Target, Gem, Lock, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { AchievementIcon } from "@/components/ui/AchievementIcon";
import { getIntentStyle } from "@/lib/intentStyles";
import { getAvatarUrl, getRarityProps } from "@/lib/utils";
import { ActivityFeedTab, mapActivityPost } from "@/components/ui/ActivityFeedTab";

const iconMap = { Trophy, Swords, Shield, Target, Medal, Gem, Lock };

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
              {[1,2,3].map(i => <div key={i} className="w-[100px] h-[56px] rounded-lg bg-plasma-slate-hover" />)}
            </div>
          </div>
        </div>
        <div className="w-32 h-12 rounded-full bg-plasma-slate-hover" />
      </div>
    </header>
  );
}

export default function UserProfile({ params }) {
  const resolvedParams = use(params);
  const targetUserId = resolvedParams.userId;
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("Activity");
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  
  const [profileData, setProfileData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutual, setIsMutual] = useState(false);
  const [isFollower, setIsFollower] = useState(false);
  const [hofData, setHofData] = useState([]);
  const [squad, setSquad] = useState([]);
  const [prestigeData, setPrestigeData] = useState(null);
  
  const [activityPosts, setActivityPosts] = useState([]);
  const [libraryGames, setLibraryGames] = useState([]);
  const [rallies, setRallies] = useState([]);
  const [gamesProgress, setGamesProgress] = useState([]);
  const [expandedGames, setExpandedGames] = useState({});
  const [loadingTab, setLoadingTab] = useState(false);

  // Fetch user profile
  useEffect(() => {
    if (!token || !targetUserId) return;
    const fetchUserProfile = async () => {
      setLoading(true);
      // Clear user-specific data when switching profiles
      setGamesProgress([]);
      setHofData([]);
      setActivityPosts([]);
      setLibraryGames([]);
      setRallies([]);
      setExpandedGames({});
      
      try {
        const [userRes, prestigeRes, squadRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/${targetUserId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/prestige/${targetUserId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/users/${targetUserId}/followers`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        
        const userData = await userRes.json();
        const prestigeJson = await prestigeRes.json();
        const squadJson = await squadRes.json();
        
        if (userData.success) {
          const p = userData.data.profile;
          setProfileData({
            username: p.username,
            avatar: getAvatarUrl(p.avatarURL, p.username),
            intent: p.intent || "CHILL",
            bio: p.bio || "",
            totalPlasmaXP: p.totalPlasmaXP || 0,
          });
          setIsFollowing(userData.data.isFollowing);
          setIsMutual(userData.data.isMutual);
          setIsFollower(userData.data.isFollower);
          const mappedHOF = userData.data.hallOfFame.map(item => ({
            ...getRarityProps(item.rarityWeight || 0),
            id: item.achievementID,
            title: item.title,
            description: item.description,
            iconName: item.iconName,
            xp: `${item.plasmaXP} XP`,
            unlockedAt: (item.unlockedAt && item.unlockedAt !== "NULL" && item.unlockedAt !== "null") ? item.unlockedAt : null,
            unlocked: true,
            gameId: item.appID,
            gameTitle: item.gameTitle
          }));
          setHofData(mappedHOF);
        }
        
        if (squadJson.success) {
          setSquad(squadJson.data.filter(u => u.isMutual));
        }
        if (prestigeJson.success) {
          setPrestigeData(prestigeJson.data);
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [token, targetUserId]);

  // Fetch tab data
  useEffect(() => {
    if (!token || !targetUserId) return;
    const fetchTabData = async () => {
      setLoadingTab(true);
      try {
        if (activeTab === "Activity") {
          const res = await fetch(`${API_BASE}/api/feed?userId=${targetUserId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setActivityPosts(data.data.map(mapActivityPost));
          }
        } else if (activeTab === "Library") {
          const res = await fetch(`${API_BASE}/api/library/user/${targetUserId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setLibraryGames(data.data.map(g => ({
              id: g.appID,
              title: g.title,
              image: g.coverArtURL || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop",
              isCurrentlyPlaying: g.isCurrentlyPlaying,
            })));
          }
        } else if (activeTab === "Achievements") {
          const res = await fetch(`${API_BASE}/api/achievements/${targetUserId}?orderBy=rarityWeight&direction=DESC`, {
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
          const res = await fetch(`${API_BASE}/api/rallies/user/${targetUserId}`, {
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
  }, [token, targetUserId, activeTab]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await fetch(`${API_BASE}/api/users/${targetUserId}/follow`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(false);
        setIsMutual(false);
      } else {
        const res = await fetch(`${API_BASE}/api/users/${targetUserId}/follow`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (data.success) {
          setIsFollowing(true);
          setIsMutual(data.isMutual);
        }
      }
    } catch (err) {
      console.error("Follow/unfollow failed", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const toggleExpand = (index) => {
    setExpandedGames(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const userStats = profileData && prestigeData ? [
    { label: "Plasma XP", value: (profileData.totalPlasmaXP || prestigeData.totalPlasmaXP || 0).toLocaleString(), highlight: true },
    { label: "Achievements", value: String(prestigeData.unlockedCount) },
    { label: "Squad", value: String(squad.length || 0) },
  ] : [];

  return (
    <DashboardLayout showRightRail={false}>
      <div className="pb-20 animate-fade-in min-h-screen">
        
        {/* PROFILE HEADER */}
        {loading ? <ProfileHeaderSkeleton /> : profileData && (
          <header className="relative min-h-[280px] w-full flex items-center px-8 md:px-20 overflow-hidden py-10 md:py-0">
            <div className="absolute inset-0 z-0 bg-plasma-bg">
              <div className="absolute inset-0 bg-gradient-to-br from-plasma-primary/30 to-plasma-secondary/15 backdrop-blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-plasma-bg to-transparent"></div>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center w-full justify-between gap-6 md:gap-0 mt-8 md:mt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative shrink-0">
                  <div className={`w-[120px] h-[120px] rounded-full border-[3px] ${getIntentStyle(profileData.intent).border} p-1 bg-plasma-slate overflow-hidden`}>
                    <img src={getAvatarUrl(profileData.avatar, profileData.username)} alt="User Profile" className="w-full h-full object-cover rounded-full" />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="font-display font-bold text-[32px] text-plasma-text-primary leading-tight">{profileData.username}</h1>
                    <span className={`px-3 py-1 rounded-full ${getIntentStyle(profileData.intent).badge} border ${getIntentStyle(profileData.intent).border} text-[10px] font-bold font-sans flex items-center gap-1.5`}>
                      <Gamepad2 className="w-3.5 h-3.5" /> {getIntentStyle(profileData.intent).label}
                    </span>
                    {isMutual && (
                      <span className="px-2 py-0.5 rounded-full bg-plasma-secondary/10 border border-plasma-secondary/30 text-plasma-secondary text-[10px] font-bold">
                        FRIENDS
                      </span>
                    )}
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
              
              <button 
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all shrink-0 cursor-pointer disabled:opacity-50 ${
                  isFollowing 
                    ? "bg-plasma-slate border border-white/10 text-plasma-text-primary hover:bg-plasma-error/20 hover:text-plasma-error hover:border-plasma-error/30"
                    : "bg-primary-gradient text-white hover:shadow-card-glow hover:scale-[1.02]"
                }`}
              >
                {isMutual ? (
                  <><UserMinus className="w-4 h-4" /> Remove Friend</>
                ) : isFollowing ? (
                  <><UserMinus className="w-4 h-4" /> Cancel Request</>
                ) : isFollower ? (
                  <><UserPlus className="w-4 h-4" /> Accept Request</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Add Friend</>
                )}
              </button>
            </div>
          </header>
        )}

        {/* HALL OF FAME ROW */}
        {!loading && (
          <section className="px-8 md:px-20 py-8 relative z-10 overflow-visible">
            <h3 className="text-plasma-text-secondary font-sans font-bold text-[10px] tracking-[0.2em] uppercase mb-6">Hall of Fame</h3>
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
                  className={`pb-4 text-sm font-semibold font-sans whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === tab 
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
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="aspect-[3/4] rounded-xl bg-plasma-slate-hover animate-pulse" />
                    ))}
                  </div>
                ) : libraryGames.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {libraryGames.slice(0, 12).map((game) => (
                      <Link href={`/profile/${targetUserId}/library/${game.id}`} key={game.id} className="relative aspect-[3/4] rounded-xl overflow-hidden group hover:scale-[1.03] transition-transform block">
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${game.image})` }} />
                        {game.isCurrentlyPlaying && (
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-plasma-secondary text-white text-[8px] font-bold rounded z-10">LIVE</div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-plasma-slate/80 backdrop-blur-sm">
                          <span className="text-[11px] font-semibold text-plasma-text-primary truncate block">{game.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-plasma-text-secondary text-sm">No games in library.</p>
                  </div>
                )}
              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === "Achievements" && (
              <div className="py-8 animate-fade-in max-w-[800px]">
                {prestigeData && (
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-3xl font-mono font-bold bg-primary-gradient bg-clip-text text-transparent">{prestigeData.totalPlasmaXP.toLocaleString()}</span>
                      <span className="text-xs text-plasma-text-secondary ml-2">PLASMA XP</span>
                    </div>
                  </div>
                )}
                
                {loadingTab ? (
                  <div className="text-center py-12"><div className="w-6 h-6 border-2 border-t-transparent border-plasma-primary rounded-full animate-spin mx-auto" /></div>
                ) : (
                  <div className="space-y-10">
                    {gamesProgress.length > 0 ? (
                      gamesProgress.map((game, index) => {
                        const isExpanded = expandedGames[index];

                        return (
                          <div key={index} className="animate-fade-in relative hover:z-30">
                            <div className="flex items-center justify-between mb-4">
                              <Link href={`/profile/${targetUserId}/prestige/${game.id}`} className="text-[11px] font-bold text-plasma-text-secondary tracking-[0.2em] uppercase hover:text-plasma-primary transition-colors block cursor-pointer">{game.title}</Link>
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
                  <p className="text-sm text-plasma-text-secondary">{squad.length} members in their squad</p>
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
                      <p className="text-plasma-text-secondary text-sm">They haven't added any squad members yet.</p>
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
                    {[1,2].map(i => (
                      <div key={i} className="flex items-center justify-between p-4 bg-plasma-slate/60 rounded-xl border border-white/5 animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-plasma-slate-hover" />
                          <div className="space-y-2">
                            <div className="w-32 h-4 rounded bg-plasma-slate-hover" />
                            <div className="w-24 h-3 rounded bg-plasma-slate-hover" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : rallies.length > 0 ? (
                  <div className="space-y-3">
                    {rallies.map((event) => (
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-plasma-text-secondary text-sm">No rallies found.</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
