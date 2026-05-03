import { Trophy, Lock } from "lucide-react";
import { 
  Sparkles, Zap, Star, Gamepad2, Gem, Swords, Flame, Skull, Crosshair, Leaf, Flag, Activity, Target, Shield, Medal, Users 
} from "lucide-react";

const iconMap = { 
  Trophy, Swords, Shield, Target, Medal, Skull, Flame, Crosshair, Users, Lock, Sparkles, Leaf, Flag, Gem, Zap, Activity 
};

export function AchievementIcon({ achievement, showGameTitle = false }) {
  const Icon = iconMap[achievement.iconName] || Trophy;
  
  // Robust date handling
  const rawDate = achievement.unlockedAt;
  const isInvalidDate = !rawDate || rawDate === "NULL" || rawDate === "null" || rawDate === "undefined" || rawDate === "Invalid Date";
  
  // Format date if valid, otherwise null
  let displayDate = null;
  if (!isInvalidDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        displayDate = d.toLocaleDateString();
      }
    } catch (e) {
      displayDate = null;
    }
  }
  
  return (
    <div className={`flex flex-col items-center gap-3 w-[84px] text-center transition-all group relative hover:z-[110] ${!achievement.unlocked ? 'opacity-40 grayscale' : ''}`}>
      <div className={`relative w-[72px] h-[72px] rounded-full border-2 ${achievement.border} bg-white/5 flex items-center justify-center transition-all ${achievement.unlocked ? achievement.shadow + " group-hover:" + achievement.glow : ""}`}>
        <Icon className={`w-8 h-8 ${achievement.color} transition-all group-hover:scale-110`} />
        {!achievement.unlocked && <Lock className="absolute bottom-0 right-0 w-4 h-4 text-plasma-text-secondary bg-plasma-bg rounded-full p-0.5" />}
      </div>
      <div className="min-w-0 w-full">
        <p className={`text-[10px] font-bold truncate leading-tight ${achievement.unlocked ? 'text-plasma-text-primary' : 'text-plasma-text-secondary'}`}>
          {achievement.title}
        </p>
        <p className={`text-[9px] font-mono mt-0.5 ${achievement.color}`}>{achievement.xp}</p>
      </div>

      {/* Premium Tooltip - Redesigned for zero-cutoff and maximum info */}
      <div className="absolute z-[100] hidden group-hover:block pointer-events-none bottom-[105%] left-1/2 -translate-x-1/2 mb-4 animate-fade-in shadow-2xl">
        <div 
          className="p-4 rounded-xl bg-slate-950 border border-white/20 w-[260px] text-left ring-1 ring-white/10 shadow-[0_20px_50px_rgba(0,0,0,1)] opacity-100"
          style={{ backgroundColor: '#020617', opacity: 1 }}
        >
          <div className="flex justify-between items-start gap-2 mb-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-2 leading-tight">{achievement.title}</p>
              <p className={`text-[9px] font-mono mt-1 ${achievement.color} font-bold`}>{achievement.xp}</p>
            </div>
            <div className={`shrink-0 w-8 h-8 rounded-lg bg-white/5 border ${achievement.border} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${achievement.color}`} />
            </div>
          </div>
          
          {achievement.description && (
            <p className="text-[10px] text-plasma-text-secondary leading-relaxed mb-4 italic bg-white/5 p-2 rounded-lg border border-white/5">
              "{achievement.description}"
            </p>
          )}
          
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            {/* Status Row */}
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Status</span>
              <span className={`text-[9px] font-black uppercase ${achievement.unlocked ? 'text-plasma-primary' : 'text-plasma-text-secondary'}`}>
                {achievement.unlocked ? "Unlocked" : "Locked"}
              </span>
            </div>
            
            {/* Date Row - Forced visibility if unlocked */}
            {achievement.unlocked && (
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Unlocked On</span>
                <span className="text-[10px] font-bold text-white tracking-tight">{displayDate || "Recent Session"}</span>
              </div>
            )}

            {/* Game Title Row - Enhanced visibility */}
            {(achievement.gameTitle || showGameTitle) && (
              <div className="pt-2 mt-2 border-t border-white/5">
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest block mb-1">Source Game</span>
                <p className="text-[10px] font-black text-plasma-primary truncate bg-plasma-primary/5 px-2 py-1 rounded border border-plasma-primary/10">
                  {achievement.gameTitle || "Plasma Milestone"}
                </p>
              </div>
            )}
          </div>

          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-950 border-r border-b border-white/20 rotate-45 -mt-2 shadow-xl" style={{ backgroundColor: '#020617' }} />
        </div>
      </div>
    </div>
  );
}
