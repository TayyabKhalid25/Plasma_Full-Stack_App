import { Trophy, Lock } from "lucide-react";
import { 
  Sparkles, Zap, Star, Gamepad2, Gem, Swords, Flame, Skull, Crosshair, Leaf, Flag, Activity, Target, Shield, Medal, Users 
} from "lucide-react";

const iconMap = { 
  Trophy, Swords, Shield, Target, Medal, Skull, Flame, Crosshair, Users, Lock, Sparkles, Leaf, Flag, Gem, Zap, Activity 
};

export function AchievementIcon({ achievement }) {
  const Icon = iconMap[achievement.iconName] || Trophy;
  
  return (
    <div className={`flex flex-col items-center gap-3 w-[84px] text-center transition-all group ${!achievement.unlocked ? 'opacity-40 grayscale' : ''}`}>
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

      {/* Tooltip-like hover state for info */}
      {achievement.unlocked && (
        <div className="absolute z-10 hidden group-hover:block pointer-events-none">
          <div className="mt-24 p-3 rounded-xl bg-plasma-slate border border-white/10 shadow-2xl min-w-[200px] -translate-x-1/2 left-1/2 text-left">
            <p className="text-xs font-bold text-plasma-text-primary mb-1">{achievement.title}</p>
            {achievement.description && <p className="text-[10px] text-plasma-text-secondary leading-relaxed mb-2 italic">"{achievement.description}"</p>}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-[9px] font-bold text-plasma-primary uppercase tracking-tighter">Unlocked {achievement.unlockedAt}</span>
              <span className={`text-[9px] font-mono ${achievement.color}`}>{achievement.xp}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
