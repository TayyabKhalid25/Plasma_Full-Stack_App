"use client";

import { useState, useEffect } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  Gamepad2, Play, Medal, Trophy, Swords, Shield, Target, Calendar, Users, User
} from "lucide-react";
import Link from "next/link";

const iconMap = { Trophy, Swords, Shield, Target, Medal };

const getIntentColor = (intent) => {
  const i = intent?.toUpperCase();
  if (i === "COMPETITIVE" || i === "COMP") return "text-plasma-error bg-plasma-error/20 border-plasma-error/30";
  if (i === "LFG") return "text-yellow-500 bg-yellow-500/20 border-yellow-500/30";
  return "text-plasma-success bg-plasma-success/20 border-plasma-success/30";
};

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
              {[1,2,3,4].map(i => <div key={i} className="w-[100px] h-[56px] rounded-lg bg-plasma-slate-hover" />)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1,2].map(i => (
        <div key={i} className="bg-plasma-slate/60 rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-plasma-slate-hover" />
            <div className="space-y-1.5">
              <div className="w-24 h-3.5 rounded bg-plasma-slate-hover" />
              <div className="w-32 h-2.5 rounded bg-plasma-slate-hover" />
            </div>
          </div>
          <div className="w-full h-4 rounded bg-plasma-slate-hover mb-2" />
          <div className="w-2/3 h-4 rounded bg-plasma-slate-hover" />
        </div>
      ))}
    </div>
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
  const [loadingTab, setLoadingTab] = useState(false);

  // Fetch profile + prestige on mount
  useEffect(() => {
    if (!token || !user) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [prestigeRes] = await Promise.all([
          fetch(`${API_BASE}/api/prestige/me`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        
        const prestigeJson = await prestigeRes.json();
        
        // Use user from auth context as profile data
        setProfileData({
          username: user.name || user.username,
          avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || user.username}`,
          intent: user.intent || "CHILL",
          bio: user.bio || "",
        });
        
        if (prestigeJson.success) {
          setPrestigeData(prestigeJson.data);
          setHofData(prestigeJson.data.hallOfFame.map((item, i) => ({
            id: item.achievementID,
            title: item.title,
            xp: `${item.plasmaXP} XP`,
            color: i === 0 ? "text-plasma-secondary" : "text-plasma-primary",
          })));
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
  }, [token, user]);

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
            setActivityPosts(data.data.map(p => ({
              id: p.postID,
              type: p.type,
              content: p.content,
              mediaURL: p.mediaURL,
              time: new Date(p.timestampUTC).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              username: p.username,
              avatar: p.avatarURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`,
            })));
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
        } else if (activeTab === "Rallies") {
          const res = await fetch(`${API_BASE}/api/rallies`, {
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
              intentColor: getIntentColor(e.requiredIntent),
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
  }, [token, user, activeTab]);

  const userStats = profileData && prestigeData ? [
    { label: "Plasma XP", value: prestigeData.totalPlasmaXP.toLocaleString(), highlight: true },
    { label: "Achievements", value: String(prestigeData.unlockedCount) },
    { label: "Library", value: String(libraryGames.length) },
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
                  <div className="w-[120px] h-[120px] rounded-full border-[3px] border-[#2ECC71] p-1 bg-plasma-slate overflow-hidden">
                    <img src={profileData.avatar} alt="User Profile" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="absolute bottom-2 right-2 w-5 h-5 bg-[#2ECC71] rounded-full border-[3px] border-plasma-bg"></div>
                </div>
                
                <div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="font-display font-bold text-[32px] text-plasma-text-primary leading-tight">{profileData.username}</h1>
                    <span className="px-3 py-1 rounded-full bg-[#2ECC71]/10 border border-[#2ECC71]/30 text-[#2ECC71] text-[10px] font-bold font-sans flex items-center gap-1.5">
                      <Gamepad2 className="w-3.5 h-3.5" /> {profileData.intent}
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
              
              <Link 
                href="/settings" 
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary-gradient text-white font-bold text-sm transition-all hover:shadow-card-glow hover:scale-[1.02] shrink-0 cursor-pointer"
              >
                <User className="w-4 h-4" /> Edit Profile
              </Link>
            </div>
          </header>
        )}

        {/* HALL OF FAME ROW */}
        {!loading && (
          <section className="px-8 md:px-20 py-8">
            <h3 className="text-plasma-text-secondary font-sans font-bold text-[10px] tracking-[0.2em] uppercase mb-6">Hall of Fame</h3>
            <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
              {hofData.length > 0 ? hofData.map((item) => (
                <div key={item.id} className="w-[72px] h-[72px] shrink-0 group relative">
                  <div className="w-full h-full rounded-2xl bg-plasma-slate/60 backdrop-blur-md border border-white/5 flex items-center justify-center group-hover:border-plasma-secondary/40 transition-all cursor-help overflow-hidden">
                    <Trophy className={`w-8 h-8 ${item.color} opacity-80`} />
                  </div>
                </div>
              )) : (
                <p className="text-sm text-plasma-text-secondary">No pinned achievements yet.</p>
              )}
            </div>
          </section>
        )}

        {/* CONTENT TABS */}
        {!loading && (
          <section className="px-8 md:px-20 mt-2">
            <div className="flex gap-8 border-b border-white/5 overflow-x-auto hide-scrollbar">
              {["Activity", "Library", "Achievements", "Rallies"].map(tab => (
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
              <div className="w-full max-w-[680px] py-8 flex flex-col gap-6 animate-fade-in">
                {loadingTab ? <FeedSkeleton /> : activityPosts.length > 0 ? (
                  activityPosts.map(post => (
                    <div key={post.id} className="bg-plasma-slate/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <img src={post.avatar} alt="" className="w-10 h-10 rounded-full border border-plasma-primary/20 bg-plasma-slate" />
                        <div>
                          <p className="text-sm font-bold text-plasma-text-primary">{post.username}</p>
                          <p className="text-[11px] text-plasma-text-secondary">{post.time}</p>
                        </div>
                      </div>
                      {post.content && (
                        <p className="text-sm text-plasma-text-secondary mb-4 leading-relaxed">{post.content}</p>
                      )}
                      {post.mediaURL && (
                        <div className="rounded-xl overflow-hidden aspect-video relative group border border-white/5 cursor-pointer">
                          {post.mediaURL.endsWith('.mp4') || post.mediaURL.endsWith('.webm') ? (
                            <video src={post.mediaURL} controls className="w-full h-full object-cover" />
                          ) : (
                            <img src={post.mediaURL} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-plasma-text-secondary text-sm">No posts yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* LIBRARY TAB */}
            {activeTab === "Library" && (
              <div className="py-8 animate-fade-in">
                {loadingTab ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="aspect-[2/3] rounded-xl bg-plasma-slate-hover animate-pulse" />
                    ))}
                  </div>
                ) : libraryGames.length > 0 ? (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {libraryGames.slice(0, 12).map((game) => (
                        <div key={game.id} className="relative aspect-[2/3] rounded-xl overflow-hidden group cursor-pointer hover:scale-[1.03] transition-transform">
                          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${game.image})` }} />
                          {game.isCurrentlyPlaying && (
                            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-plasma-secondary text-white text-[8px] font-bold rounded z-10">LIVE</div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-plasma-slate/80 backdrop-blur-sm">
                            <span className="text-[11px] font-semibold text-plasma-text-primary truncate block">{game.title}</span>
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

            {/* ACHIEVEMENTS TAB */}
            {activeTab === "Achievements" && (
              <div className="py-8 animate-fade-in">
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
                <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar">
                  {hofData.map((item) => (
                    <div key={item.id} className="flex flex-col items-center gap-2 shrink-0">
                      <div className={`w-16 h-16 rounded-full border-2 border-plasma-primary flex items-center justify-center bg-white/5`}>
                        <Trophy className={`w-7 h-7 ${item.color}`} />
                      </div>
                      <p className="text-[10px] font-bold text-plasma-text-primary whitespace-nowrap">{item.title}</p>
                      <p className={`text-[10px] font-mono ${item.color}`}>{item.xp}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RALLIES TAB */}
            {activeTab === "Rallies" && (
              <div className="py-8 animate-fade-in max-w-[680px]">
                {loadingTab ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
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
                        <div key={event.id} className="flex items-center justify-between p-4 bg-plasma-slate/60 rounded-xl border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-plasma-primary/10 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-plasma-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-plasma-text-primary">{event.title}</p>
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
                        </div>
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
    </DashboardLayout>
  );
}
