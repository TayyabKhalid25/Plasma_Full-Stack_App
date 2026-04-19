"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  Gamepad2, 
  MoreHorizontal, 
  PlayCircle, 
  Heart, 
  MessageCircle, 
  Share2, 
  Play, 
  Medal,
  Trophy,
  Swords,
  Shield,
  Target
} from "lucide-react";

// --- DUMMY DATA ---
const userStats = [
  { label: "Plasma XP", value: "12,450", highlight: true },
  { label: "Achievements", value: "184" },
  { label: "Rallies", value: "23" },
  { label: "Library", value: "47" }
];

const hallOfFame = [
  { id: 1, icon: Trophy, color: "text-plasma-secondary" },
  { id: 2, icon: Swords, color: "text-plasma-primary" },
  { id: 3, icon: Shield, color: "text-[#3498DB]" },
  { id: 4, icon: Target, color: "text-plasma-primary" },
  { id: 5, icon: Medal, color: "text-[#2ECC71]" }
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState("Activity");

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
                  {/* TODO: REPLACE_IMAGE - Main Profile Avatar */}
                  <img 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Me" 
                    alt="User Profile" 
                    className="w-full h-full object-cover rounded-full" 
                  />
                </div>
                {/* Online Status */}
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-[#2ECC71] rounded-full border-[3px] border-plasma-bg"></div>
              </div>
              
              {/* User Info Section */}
              <div>
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="font-display font-bold text-[32px] text-plasma-text-primary leading-tight">Wahaj</h1>
                  <span className="px-3 py-1 rounded-full bg-[#2ECC71]/10 border border-[#2ECC71]/30 text-[#2ECC71] text-[10px] font-bold font-sans flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5" /> CHILL
                  </span>
                </div>
                <p className="text-plasma-text-secondary text-[13px] font-medium mt-1">Member since January 2024</p>
                
                {/* Stat Cards Row */}
                <div className="flex gap-3 mt-4 flex-wrap">
                  {userStats.map((stat, idx) => (
                    <div key={idx} className="bg-plasma-slate/60 backdrop-blur-md rounded-lg px-4 py-3 min-w-[100px] border border-white/5">
                      <p className={`font-mono text-[18px] leading-none ${stat.highlight ? "text-plasma-secondary" : "text-plasma-text-primary"}`}>
                        {stat.value}
                      </p>
                      <p className="text-plasma-text-secondary text-[11px] font-medium mt-1 uppercase tracking-tighter">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <button className="border border-plasma-primary text-plasma-primary hover:bg-plasma-primary/10 transition-colors px-6 py-2.5 rounded-xl font-sans font-bold text-sm shrink-0 cursor-pointer">
              Edit Profile
            </button>
          </div>
        </header>

        {/* HALL OF FAME ROW */}
        <section className="px-8 md:px-20 py-8">
          <h3 className="text-plasma-text-secondary font-sans font-bold text-[10px] tracking-[0.2em] uppercase mb-6">Hall of Fame</h3>
          <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
            {hallOfFame.map((item) => {
              const Icon = item.icon;
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

          {/* ACTIVITY TAB CONTENT */}
          {activeTab === "Activity" && (
            <div className="w-full max-w-[680px] py-8 flex flex-col gap-6 animate-fade-in">
              
              {/* Feed Item 1: Post with Image */}
              <div className="bg-plasma-slate/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* TODO: REPLACE_IMAGE - Post Avatar */}
                    <img 
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Me" 
                      alt="Wahaj" 
                      className="w-10 h-10 rounded-full border border-plasma-primary/20 bg-plasma-slate" 
                    />
                    <div>
                      <p className="text-sm font-bold text-plasma-text-primary">Wahaj</p>
                      <p className="text-[11px] text-plasma-text-secondary">Shared a clip • 2h ago</p>
                    </div>
                  </div>
                  <button className="text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-plasma-text-secondary mb-4 leading-relaxed">
                  Finally hit Platinum in the new Season! That last clutch was insane. 🏆
                </p>
                <div className="rounded-xl overflow-hidden aspect-video relative group border border-white/5 cursor-pointer">
                  {/* TODO: REPLACE_IMAGE - Video Thumbnail */}
                  <img 
                    src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" 
                    alt="Gameplay Clip" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="text-white w-14 h-14" strokeWidth={1} />
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4">
                  <button className="flex items-center gap-2 text-plasma-text-secondary text-xs hover:text-plasma-secondary transition-colors cursor-pointer">
                    <Heart className="w-4 h-4" /> 24
                  </button>
                  <button className="flex items-center gap-2 text-plasma-text-secondary text-xs hover:text-plasma-primary transition-colors cursor-pointer">
                    <MessageCircle className="w-4 h-4" /> 8
                  </button>
                  <button className="flex items-center gap-2 text-plasma-text-secondary text-xs hover:text-white transition-colors cursor-pointer">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>

              {/* Feed Item 2: Auto Activity Start Playing */}
              <div className="bg-plasma-slate/60 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border-l-4 border-plasma-primary border-t border-r border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-plasma-primary/10 flex items-center justify-center shrink-0">
                    <Play className="w-5 h-5 text-plasma-primary fill-plasma-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-plasma-text-secondary font-medium"><span className="text-plasma-text-primary font-bold">Wahaj</span> started playing</p>
                    <p className="text-sm font-bold text-plasma-text-primary">Cyberpunk 2077: Phantom Liberty</p>
                  </div>
                </div>
                <p className="text-[10px] text-plasma-text-secondary uppercase tracking-wider font-bold shrink-0 ml-4">Just Now</p>
              </div>

              {/* Feed Item 3: Auto Activity Achievement */}
              <div className="bg-plasma-slate/60 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border-l-4 border-plasma-secondary border-t border-r border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-plasma-secondary/10 flex items-center justify-center shrink-0">
                    <Medal className="w-5 h-5 text-plasma-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-plasma-text-secondary font-medium"><span className="text-plasma-text-primary font-bold">Wahaj</span> unlocked achievement</p>
                    <p className="text-sm font-bold text-plasma-text-primary">"Shadow operative" in Apex Legends</p>
                  </div>
                </div>
                <p className="text-[10px] text-plasma-text-secondary uppercase tracking-wider font-bold shrink-0 ml-4">5h ago</p>
              </div>

              {/* Feed Item 4: Text Only Post */}
              <div className="bg-plasma-slate/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* TODO: REPLACE_IMAGE - Post Avatar */}
                    <img 
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Me" 
                      alt="Wahaj" 
                      className="w-10 h-10 rounded-full border border-plasma-primary/20 bg-plasma-slate" 
                    />
                    <div>
                      <p className="text-sm font-bold text-plasma-text-primary">Wahaj</p>
                      <p className="text-[11px] text-plasma-text-secondary">Update • 1d ago</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-plasma-text-secondary leading-relaxed">
                  Anyone down for a Rally session tonight? Looking to grind some Prestige ranks before the weekend event ends. Hit me up in the DMs! 🎮✨
                </p>
                <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/5">
                  <button className="flex items-center gap-2 text-plasma-text-secondary text-xs hover:text-plasma-secondary transition-colors cursor-pointer">
                    <Heart className="w-4 h-4" /> 12
                  </button>
                  <button className="flex items-center gap-2 text-plasma-text-secondary text-xs hover:text-plasma-primary transition-colors cursor-pointer">
                    <MessageCircle className="w-4 h-4" /> 3
                  </button>
                </div>
              </div>

            </div>
          )}
          
          {/* PLACEHOLDER FOR OTHER TABS */}
          {activeTab !== "Activity" && (
            <div className="w-full py-16 flex flex-col items-center justify-center text-plasma-text-secondary animate-fade-in">
              <p className="font-sans text-sm">Content for {activeTab} will appear here.</p>
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}
