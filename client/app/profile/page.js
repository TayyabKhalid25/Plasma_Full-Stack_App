"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  Gamepad2, MoreHorizontal, PlayCircle, Heart, MessageCircle, Share2, Play, Medal, Trophy, Swords, Shield, Target, Calendar, Users
} from "lucide-react";
import Link from "next/link";
import { currentUser, hallOfFame, games, rallyEvents } from "@/data/dummy";
import { useModal } from "@/hooks/useModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { PostOptionsModal } from "@/components/modals/PostOptionsModal";

const iconMap = { Trophy, Swords, Shield, Target, Medal };

const userStats = [
  { label: "Plasma XP", value: currentUser.stats.xp, highlight: true },
  { label: "Achievements", value: String(currentUser.stats.achievements) },
  { label: "Rallies", value: String(currentUser.stats.rallies) },
  { label: "Library", value: String(currentUser.stats.library) },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState("Activity");
  
  const shareModal = useModal();
  const optionsModal = useModal();

  return (
    <DashboardLayout showRightRail={false}>
      <div className="pb-20 animate-fade-in min-h-screen">
        
        {/* PROFILE HEADER */}
        <header className="relative min-h-[280px] w-full flex items-center px-8 md:px-20 overflow-hidden py-10 md:py-0">
          {/* Background Layer */}
          <div className="absolute inset-0 z-0 bg-plasma-bg">
            <div className="absolute inset-0 bg-gradient-to-br from-plasma-primary/30 to-plasma-secondary/15 backdrop-blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-plasma-bg to-transparent"></div>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center w-full justify-between gap-6 md:gap-0 mt-8 md:mt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar Section */}
              <div className="relative shrink-0">
                <div className="w-[120px] h-[120px] rounded-full border-[3px] border-[#2ECC71] p-1 bg-plasma-slate overflow-hidden">
                  <img src={currentUser.avatar} alt="User Profile" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-[#2ECC71] rounded-full border-[3px] border-plasma-bg"></div>
              </div>
              
              {/* User Info Section */}
              <div>
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="font-display font-bold text-[32px] text-plasma-text-primary leading-tight">{currentUser.username}</h1>
                  <span className="px-3 py-1 rounded-full bg-[#2ECC71]/10 border border-[#2ECC71]/30 text-[#2ECC71] text-[10px] font-bold font-sans flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5" /> {currentUser.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-plasma-text-secondary text-[13px] font-medium mt-1">Member since {currentUser.memberSince}</p>
                
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
            
            <Link href="/settings" className="border border-plasma-primary text-plasma-primary hover:bg-plasma-primary/10 transition-colors px-6 py-2.5 rounded-xl font-sans font-bold text-sm shrink-0 cursor-pointer">
              Edit Profile
            </Link>
          </div>
        </header>

        {/* HALL OF FAME ROW */}
        <section className="px-8 md:px-20 py-8">
          <h3 className="text-plasma-text-secondary font-sans font-bold text-[10px] tracking-[0.2em] uppercase mb-6">Hall of Fame</h3>
          <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
            {hallOfFame.map((item) => {
              const Icon = iconMap[item.iconName] || Trophy;
              return (
                <div key={item.id} className="w-[72px] h-[72px] shrink-0 group relative">
                  <div className="w-full h-full rounded-2xl bg-plasma-slate/60 backdrop-blur-md border border-white/5 flex items-center justify-center group-hover:border-plasma-secondary/40 transition-all cursor-help overflow-hidden">
                    <Icon className={`w-8 h-8 ${item.color} opacity-80`} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CONTENT TABS */}
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
              {/* Post with Image */}
              <div className="bg-plasma-slate/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={currentUser.avatar} alt="Wahaj" className="w-10 h-10 rounded-full border border-plasma-primary/20 bg-plasma-slate" />
                    <div>
                      <p className="text-sm font-bold text-plasma-text-primary">{currentUser.username}</p>
                      <p className="text-[11px] text-plasma-text-secondary">Shared a clip • 2h ago</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => optionsModal.open({ id: 'profile-post-1' })}
                    className="text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-plasma-text-secondary mb-4 leading-relaxed">
                  Finally hit Platinum in the new Season! That last clutch was insane. 🏆
                </p>
                <div className="rounded-xl overflow-hidden aspect-video relative group border border-white/5 cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" alt="Gameplay Clip" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="text-white w-14 h-14" strokeWidth={1} />
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4">
                  <button className="flex items-center gap-2 text-plasma-text-secondary text-xs hover:text-plasma-secondary transition-colors cursor-pointer"><Heart className="w-4 h-4" /> 24</button>
                  <button className="flex items-center gap-2 text-plasma-text-secondary text-xs hover:text-plasma-primary transition-colors cursor-pointer"><MessageCircle className="w-4 h-4" /> 8</button>
                  <button 
                    onClick={() => shareModal.open({ type: 'post', id: 'profile-post-1' })}
                    className="flex items-center gap-2 text-plasma-text-secondary text-xs hover:text-white transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>

              {/* Auto Activity */}
              <div className="bg-plasma-slate/60 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border-l-4 border-plasma-primary border-t border-r border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-plasma-primary/10 flex items-center justify-center shrink-0"><Play className="w-5 h-5 text-plasma-primary fill-plasma-primary" /></div>
                  <div>
                    <p className="text-xs text-plasma-text-secondary font-medium"><span className="text-plasma-text-primary font-bold">{currentUser.username}</span> started playing</p>
                    <p className="text-sm font-bold text-plasma-text-primary">Cyberpunk 2077: Phantom Liberty</p>
                  </div>
                </div>
                <p className="text-[10px] text-plasma-text-secondary uppercase tracking-wider font-bold shrink-0 ml-4">Just Now</p>
              </div>

              {/* Achievement */}
              <div className="bg-plasma-slate/60 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border-l-4 border-plasma-secondary border-t border-r border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-plasma-secondary/10 flex items-center justify-center shrink-0"><Medal className="w-5 h-5 text-plasma-secondary" /></div>
                  <div>
                    <p className="text-xs text-plasma-text-secondary font-medium"><span className="text-plasma-text-primary font-bold">{currentUser.username}</span> unlocked achievement</p>
                    <p className="text-sm font-bold text-plasma-text-primary">&quot;Shadow operative&quot; in Apex Legends</p>
                  </div>
                </div>
                <p className="text-[10px] text-plasma-text-secondary uppercase tracking-wider font-bold shrink-0 ml-4">5h ago</p>
              </div>
            </div>
          )}

          {/* LIBRARY TAB */}
          {activeTab === "Library" && (
            <div className="py-8 animate-fade-in">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {games.slice(0, 8).map((game) => (
                  <Link key={game.id} href={`/library/${game.id}`} className="relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer hover:scale-[1.03] transition-transform">
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${game.image})` }} />
                    {game.nowPlaying && (
                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-plasma-secondary text-white text-[8px] font-bold rounded z-10">LIVE</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-plasma-slate/80 backdrop-blur-sm">
                      <span className="text-[11px] font-semibold text-plasma-text-primary truncate block">{game.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link href="/library" className="text-plasma-primary text-sm font-semibold hover:text-plasma-secondary transition-colors">
                  View Full Library →
                </Link>
              </div>
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === "Achievements" && (
            <div className="py-8 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-3xl font-mono font-bold bg-primary-gradient bg-clip-text text-transparent">{currentUser.stats.xp}</span>
                  <span className="text-xs text-plasma-text-secondary ml-2">PLASMA XP</span>
                </div>
                <Link href="/prestige" className="text-plasma-primary text-sm font-semibold hover:text-plasma-secondary transition-colors">
                  View All →
                </Link>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar">
                {hallOfFame.map((item) => {
                  const Icon = iconMap[item.iconName] || Trophy;
                  return (
                    <div key={item.id} className="flex flex-col items-center gap-2 shrink-0">
                      <div className={`w-16 h-16 rounded-full border-2 ${item.borderColor} flex items-center justify-center bg-white/5`}>
                        <Icon className={`w-7 h-7 ${item.color}`} />
                      </div>
                      <p className="text-[10px] font-bold text-plasma-text-primary whitespace-nowrap">{item.title}</p>
                      <p className={`text-[10px] font-mono ${item.color}`}>{item.xp}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RALLIES TAB */}
          {activeTab === "Rallies" && (
            <div className="py-8 animate-fade-in max-w-[680px]">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-plasma-text-secondary">{rallyEvents.length} upcoming rallies</p>
                <Link href="/rally" className="text-plasma-primary text-sm font-semibold hover:text-plasma-secondary transition-colors">
                  View Calendar →
                </Link>
              </div>
              <div className="space-y-3">
                {rallyEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-plasma-slate/60 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-plasma-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-plasma-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-plasma-text-primary">{event.title}</p>
                        <div className="flex items-center gap-2 text-xs text-plasma-text-secondary">
                          <span>{event.game}</span>
                          <span className="w-1 h-1 rounded-full bg-plasma-text-secondary/30" />
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
                ))}
              </div>
            </div>
          )}
        </section>

      </div>
      
      <ShareModal 
        isOpen={shareModal.isOpen} 
        onClose={shareModal.close} 
        shareType={shareModal.modalData?.type} 
        shareId={shareModal.modalData?.id} 
      />
      <PostOptionsModal 
        isOpen={optionsModal.isOpen} 
        onClose={optionsModal.close} 
        post={optionsModal.modalData} 
      />
    </DashboardLayout>
  );
}
