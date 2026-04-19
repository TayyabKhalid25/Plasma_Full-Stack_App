"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  Trophy, 
  Swords, 
  Shield, 
  Target, 
  Medal, 
  Skull, 
  Flame, 
  Crosshair, 
  Users, 
  Lock, 
  Sparkles, 
  Leaf, 
  Flag,
  Diamond,
  Zap,
  Activity
} from "lucide-react";

// --- DUMMY DATA ---
const hallOfFame = [
  { id: 1, title: "The Immortal", xp: "+500 XP", icon: Trophy, color: "text-plasma-secondary", borderColor: "border-plasma-secondary", glow: "shadow-[0_0_15px_rgba(255,42,122,0.4)]" },
  { id: 2, title: "Ace Master", xp: "+250 XP", icon: Swords, color: "text-plasma-primary", borderColor: "border-plasma-primary" },
  { id: 3, title: "Iron Wall", xp: "+100 XP", icon: Shield, color: "text-[#3498DB]", borderColor: "border-[#3498DB]" },
  { id: 4, title: "Sharpshooter", xp: "+200 XP", icon: Target, color: "text-plasma-primary", borderColor: "border-plasma-primary" },
  { id: 5, title: "First Blood", xp: "+50 XP", icon: Medal, color: "text-[#2ECC71]", borderColor: "border-[#2ECC71]" },
];

const gamesProgress = [
  {
    title: "COUNTER-STRIKE 2",
    achievements: [
      { title: "Global Elite", xp: "100 XP", icon: Skull, color: "text-plasma-secondary", border: "border-plasma-secondary", unlocked: true },
      { title: "Demolitions", xp: "50 XP", icon: Flame, color: "text-plasma-primary", border: "border-plasma-primary", unlocked: true },
      { title: "Win Streak", xp: "25 XP", icon: Crosshair, color: "text-[#3498DB]", border: "border-[#3498DB]", unlocked: true },
      { title: "Support Role", xp: "10 XP", icon: Users, color: "text-[#2ECC71]", border: "border-[#2ECC71]", unlocked: true },
      { title: "Clutch King", xp: "50 XP", icon: Lock, color: "text-plasma-text-secondary", border: "border-plasma-text-secondary", unlocked: false },
      { title: "Knife Master", xp: "75 XP", icon: Lock, color: "text-plasma-text-secondary", border: "border-plasma-text-secondary", unlocked: false },
    ]
  },
  {
    title: "ELDEN RING",
    achievements: [
      { title: "Elden Lord", xp: "500 XP", icon: Sparkles, color: "text-plasma-secondary", border: "border-plasma-secondary", unlocked: true },
      { title: "Erdtree Bloom", xp: "200 XP", icon: Leaf, color: "text-plasma-primary", border: "border-plasma-primary", unlocked: true },
      { title: "God-Slayer", xp: "150 XP", icon: Flag, color: "text-plasma-primary", border: "border-plasma-primary", unlocked: true },
      { title: "All Bosses", xp: "1000 XP", icon: Lock, color: "text-plasma-text-secondary", border: "border-plasma-text-secondary", unlocked: false },
      { title: "Ranni Ending", xp: "400 XP", icon: Lock, color: "text-plasma-text-secondary", border: "border-plasma-text-secondary", unlocked: false },
    ]
  },
  {
    title: "VALORANT",
    achievements: [
      { title: "Radiant", xp: "300 XP", icon: Diamond, color: "text-plasma-primary", border: "border-plasma-primary", unlocked: true },
      { title: "Entry Fragger", xp: "40 XP", icon: Zap, color: "text-plasma-primary", border: "border-plasma-primary", unlocked: true },
      { title: "Anchor", xp: "30 XP", icon: Shield, color: "text-[#3498DB]", border: "border-[#3498DB]", unlocked: true },
      { title: "Pocket Sage", xp: "20 XP", icon: Activity, color: "text-[#2ECC71]", border: "border-[#2ECC71]", unlocked: true },
    ]
  }
];

const leaderboard = [
  { id: 1, name: "Ahmed", xp: "15,200 XP", rank: "🥇", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed", active: false },
  { id: 2, name: "Sarah", xp: "14,800 XP", rank: "🥈", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", active: false },
  { id: 3, name: "Wahaj", xp: "12,450 XP", rank: "🥉", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Me", active: true }, // Current User
  { id: 4, name: "Katarina", xp: "9,800 XP", rank: "4", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kat", active: false },
  { id: 5, name: "Liam_X", xp: "8,450 XP", rank: "5", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Liam", active: false },
  { id: 6, name: "NoobSlayer", xp: "7,200 XP", rank: "6", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noob", active: false },
  { id: 7, name: "PixelWiz", xp: "6,900 XP", rank: "7", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pixel", active: false },
  { id: 8, name: "Ghost_77", xp: "5,100 XP", rank: "8", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ghost", active: false },
];

export default function Prestige() {
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
                <span className="block text-[40px] font-mono font-bold bg-primary-gradient bg-clip-text text-transparent leading-none">12,450</span>
                <span className="text-[11px] font-bold text-plasma-text-secondary tracking-widest uppercase mt-1 block">PLASMA XP</span>
              </div>
              <div className="px-4 py-2 bg-plasma-slate border border-plasma-primary rounded-full">
                <span className="text-plasma-primary font-bold font-sans text-sm">Global Rank: #42</span>
              </div>
            </div>
          </div>

          {/* HALL OF FAME */}
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold text-plasma-text-secondary tracking-[0.2em] uppercase">HALL OF FAME ⭐</h2>
              <button className="text-plasma-primary text-sm font-semibold hover:text-plasma-secondary transition-colors cursor-pointer">
                Edit Hall of Fame
              </button>
            </div>
            
            <div className="flex gap-[20px] overflow-x-auto pb-4 hide-scrollbar">
              {hallOfFame.map((item) => {
                const Icon = item.icon;
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
              <button className="pb-3 px-1 border-b-2 border-plasma-primary text-plasma-text-primary text-sm font-semibold cursor-pointer">
                Steam Trophies
              </button>
              <button className="pb-3 px-1 border-b-2 border-transparent text-plasma-text-secondary text-sm font-semibold hover:text-plasma-text-primary transition-colors cursor-pointer">
                Manual Milestones
              </button>
              <button className="pb-3 px-1 border-b-2 border-transparent text-plasma-text-secondary text-sm font-semibold hover:text-plasma-text-primary transition-colors cursor-pointer">
                All
              </button>
            </div>
          </div>

          {/* Achievement Grid */}
          <div className="space-y-10 py-6">
            {gamesProgress.map((game, index) => (
              <div key={index}>
                <h3 className="text-[11px] font-bold text-plasma-text-secondary tracking-[0.2em] uppercase mb-4">{game.title}</h3>
                <div className="flex flex-wrap gap-[32px]">
                  {game.achievements.map((ach, aIdx) => {
                    const Icon = ach.icon;
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
            ))}
          </div>

        </div>

        {/* RIGHT PANEL (35%) */}
        <div className="w-full lg:w-[35%] relative animate-fade-in">
          <div className="sticky top-24 bg-plasma-slate rounded-xl p-6 border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-lg text-plasma-text-primary">FRIENDS LEADERBOARD</h2>
            </div>
            
            {/* Ranking Tabs */}
            <div className="flex gap-6 border-b border-white/5 mb-4">
              <button className="pb-2 px-1 border-b-2 border-plasma-primary text-sm text-plasma-text-primary font-medium cursor-pointer">Friends</button>
              <button className="pb-2 px-1 border-b-2 border-transparent text-sm text-plasma-text-secondary font-medium hover:text-plasma-text-primary transition-colors cursor-pointer">Global</button>
            </div>
            
            {/* Leaderboard Rows */}
            <div className="space-y-1">
              {leaderboard.map((user) => (
                <div 
                  key={user.id} 
                  className={`flex items-center gap-3 p-2.5 border-b border-white/5 transition-colors ${
                    user.active ? 'bg-white/10 rounded-lg' : 'hover:bg-white/5'
                  }`}
                >
                  <span className={`w-6 text-center ${user.id <= 3 ? 'text-lg' : 'text-sm text-plasma-text-secondary font-mono'}`}>
                    {user.rank}
                  </span>
                  <div className="relative shrink-0">
                    {/* TODO: REPLACE_IMAGE - Leaderboard avatars */}
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className={`w-8 h-8 rounded-full border-2 ${
                        user.id <= 2 ? 'border-plasma-error' : user.active ? 'border-plasma-primary' : 'border-transparent opacity-80'
                      }`} 
                    />
                  </div>
                  <span className={`flex-1 text-sm truncate ${user.active ? 'text-plasma-secondary font-bold' : user.id <= 2 ? 'text-plasma-text-primary font-medium' : 'text-plasma-text-secondary'}`}>
                    {user.name}
                  </span>
                  <span className={`font-mono text-sm ${user.active ? 'text-plasma-secondary' : user.id === 1 ? 'text-plasma-secondary' : user.id === 2 ? 'text-plasma-text-primary' : 'text-plasma-text-secondary'}`}>
                    {user.xp}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Bottom CTA */}
            <button className="w-full mt-6 py-3 rounded-full bg-primary-gradient text-white font-bold text-sm tracking-widest uppercase hover:shadow-[0_0_20px_rgba(255,42,122,0.3)] transition-all cursor-pointer">
              Invite Friends
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
