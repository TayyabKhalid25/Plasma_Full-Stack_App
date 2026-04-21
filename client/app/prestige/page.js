"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  Trophy, Swords, Shield, Target, Medal, Skull, Flame, Crosshair, Users, Lock, Sparkles, Leaf, Flag, Diamond, Zap, Activity
} from "lucide-react";
import { hallOfFame, gamesProgress, leaderboard, globalLeaderboard, currentUser } from "@/data/dummy";
import { useModal } from "@/hooks/useModal";
import { EditHallOfFameModal } from "@/components/modals/EditHallOfFameModal";
import { InviteFriendsModal } from "@/components/modals/InviteFriendsModal";

const iconMap = { Trophy, Swords, Shield, Target, Medal, Skull, Flame, Crosshair, Users, Lock, Sparkles, Leaf, Flag, Diamond, Zap, Activity };

const achievementTabs = [
  { id: "steam", label: "Steam Trophies" },
  { id: "manual", label: "Manual Milestones" },
  { id: "all", label: "All" },
];

export default function Prestige() {
  const [activeAchTab, setActiveAchTab] = useState("steam");
  const [activeLeaderboard, setActiveLeaderboard] = useState("friends");

  const editHofModal = useModal();
  const inviteModal = useModal();

  const leaderboardData = activeLeaderboard === "global" ? globalLeaderboard : leaderboard;

  // Filter achievements by tab
  const filteredProgress = activeAchTab === "all" 
    ? gamesProgress 
    : activeAchTab === "steam" 
      ? gamesProgress.filter((_, i) => i !== 1) // Simulate: Elden Ring is "manual"
      : gamesProgress.filter((_, i) => i === 1);

  return (
    <DashboardLayout showRightRail={false}>
      <div className="max-w-[1440px] mx-auto p-8 flex flex-col lg:flex-row gap-8 min-h-screen pb-20">
        
        {/* LEFT SECTION (65%) */}
        <div className="w-full lg:w-[65%] space-y-8 animate-fade-in">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <h1 className="font-display font-bold text-[32px] text-plasma-text-primary leading-none">The Prestige</h1>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="block text-[40px] font-mono font-bold bg-primary-gradient bg-clip-text text-transparent leading-none">{currentUser.stats.xp}</span>
                <span className="text-[11px] font-bold text-plasma-text-secondary tracking-widest uppercase mt-1 block">PLASMA XP</span>
              </div>
              <div className="px-4 py-2 bg-plasma-slate border border-plasma-primary rounded-full">
                <span className="text-plasma-primary font-bold font-sans text-sm">Global Rank: #{currentUser.stats.globalRank}</span>
              </div>
            </div>
          </div>

          {/* HALL OF FAME */}
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold text-plasma-text-secondary tracking-[0.2em] uppercase">HALL OF FAME ⭐</h2>
              <button 
                onClick={() => editHofModal.open()}
                className="text-plasma-primary text-sm font-semibold hover:text-plasma-secondary transition-colors cursor-pointer"
              >
                Edit Hall of Fame
              </button>
            </div>
            
            <div className="flex gap-[20px] overflow-x-auto pb-4 hide-scrollbar">
              {hallOfFame.map((item) => {
                const Icon = iconMap[item.iconName] || Trophy;
                return (
                  <div key={item.id} className="flex flex-col items-center gap-3 w-[96px] shrink-0">
                    <div className={`w-[96px] h-[96px] rounded-full border-[3px] ${item.borderColor} ${item.glow || ''} flex items-center justify-center bg-white/5 backdrop-blur-sm group cursor-pointer hover:scale-105 transition-transform`}>
                      <Icon className={`w-12 h-12 ${item.color}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-plasma-text-primary whitespace-nowrap">{item.title}</p>
                      <p className={`text-[12px] font-mono ${item.color}`}>{item.xp}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Achievement Tabs */}
          <div className="mt-8 border-b border-white/5">
            <div className="flex gap-8">
              {achievementTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveAchTab(tab.id)}
                  className={`pb-3 px-1 border-b-2 text-sm font-semibold cursor-pointer transition-colors ${
                    activeAchTab === tab.id
                      ? "border-plasma-primary text-plasma-text-primary"
                      : "border-transparent text-plasma-text-secondary hover:text-plasma-text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Achievement Grid */}
          <div className="space-y-10 py-6">
            {filteredProgress.length > 0 ? (
              filteredProgress.map((game, index) => (
                <div key={index}>
                  <h3 className="text-[11px] font-bold text-plasma-text-secondary tracking-[0.2em] uppercase mb-4">{game.title}</h3>
                  <div className="flex flex-wrap gap-[32px]">
                    {game.achievements.map((ach, aIdx) => {
                      const Icon = iconMap[ach.iconName] || Lock;
                      return (
                        <div key={aIdx} className={`flex flex-col items-center gap-2 w-[72px] text-center ${!ach.unlocked ? 'opacity-50 grayscale' : ''}`}>
                          <div className={`w-[72px] h-[72px] rounded-full border-2 ${ach.border} flex items-center justify-center bg-white/5 relative`}>
                            <Icon className={`w-8 h-8 ${ach.color}`} />
                          </div>
                          <p className={`text-[10px] font-medium truncate w-full ${!ach.unlocked ? 'text-plasma-text-secondary' : 'text-plasma-text-primary'}`}>
                            {ach.title}
                          </p>
                          <p className={`text-[9px] font-mono ${ach.color}`}>{ach.xp}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-plasma-text-secondary text-sm">No achievements in this category yet.</p>
              </div>
            )}
          </div>

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
                className={`pb-2 px-1 border-b-2 text-sm font-medium cursor-pointer transition-colors ${
                  activeLeaderboard === "friends"
                    ? "border-plasma-primary text-plasma-text-primary"
                    : "border-transparent text-plasma-text-secondary hover:text-plasma-text-primary"
                }`}
              >
                Friends
              </button>
              <button
                onClick={() => setActiveLeaderboard("global")}
                className={`pb-2 px-1 border-b-2 text-sm font-medium cursor-pointer transition-colors ${
                  activeLeaderboard === "global"
                    ? "border-plasma-primary text-plasma-text-primary"
                    : "border-transparent text-plasma-text-secondary hover:text-plasma-text-primary"
                }`}
              >
                Global
              </button>
            </div>
            
            {/* Leaderboard Rows */}
            <div className="space-y-1">
              {leaderboardData.map((user) => (
                <div 
                  key={user.id} 
                  className={`flex items-center gap-3 p-2.5 border-b border-white/5 transition-colors ${
                    user.isCurrentUser ? 'bg-white/10 rounded-lg' : 'hover:bg-white/5'
                  }`}
                >
                  <span className={`w-6 text-center ${user.id <= 3 || (typeof user.rank === "string" && user.rank.length <= 2) ? 'text-lg' : 'text-sm text-plasma-text-secondary font-mono'}`}>
                    {user.rank}
                  </span>
                  <div className="relative shrink-0">
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className={`w-8 h-8 rounded-full border-2 ${
                        user.id <= 2 ? 'border-plasma-error' : user.isCurrentUser ? 'border-plasma-primary' : 'border-transparent opacity-80'
                      }`} 
                    />
                  </div>
                  <span className={`flex-1 text-sm truncate ${user.isCurrentUser ? 'text-plasma-secondary font-bold' : user.id <= 2 ? 'text-plasma-text-primary font-medium' : 'text-plasma-text-secondary'}`}>
                    {user.name}
                  </span>
                  <span className={`font-mono text-sm ${user.isCurrentUser ? 'text-plasma-secondary' : user.id === 1 ? 'text-plasma-secondary' : user.id === 2 ? 'text-plasma-text-primary' : 'text-plasma-text-secondary'}`}>
                    {user.xp}
                  </span>
                </div>
              ))}
            </div>
            
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
        onUpdate={(ids) => {
          // Handle update
        }}
      />
      <InviteFriendsModal 
        isOpen={inviteModal.isOpen} 
        onClose={inviteModal.close}
      />
    </DashboardLayout>
  );
}
