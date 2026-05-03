import { Trophy, Lock } from "lucide-react";
import { getRarityProps } from "@/lib/utils";
import { 
  Sparkles, Zap, Star, Gamepad2, Gem, Swords, Flame, Skull, Crosshair, Leaf, Flag, Activity, Target, Shield, Medal 
} from "lucide-react";

const iconMap = { 
  Trophy, Target, Shield, Medal, Sparkles, Zap, Star, Gamepad2, Gem, Swords, Flame, Skull, Crosshair, Leaf, Flag, Activity 
};

export function AchievementCard({ achievement, isLocked }) {
  const rarity = getRarityProps(achievement.rarityWeight || 10);
  const Icon = iconMap[rarity.iconName] || Trophy;

  return (
    <div className={`p-4 rounded-3xl bg-plasma-slate/60 backdrop-blur-md border border-white/5 transition-all relative overflow-hidden ${isLocked ? "grayscale opacity-90" : ""}`}>
      {!isLocked && (
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-[40px] opacity-20 transition-opacity ${rarity.bg}`} />
      )}

      <div className="flex gap-4 items-center">
        {/* Circle icon container */}
        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0 relative z-10 ${isLocked ? "bg-white/5 border-white/10" : `${rarity.border} ${rarity.shadow} bg-white/5`}`}>
          {isLocked
            ? <Lock className="w-5 h-5 text-plasma-text-secondary" />
            : <Icon className={`w-6 h-6 ${rarity.color}`} />
          }
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="text-sm font-bold text-white truncate transition-colors">{achievement.title}</h4>
          <p className="text-[11px] text-plasma-text-secondary line-clamp-2 leading-snug">
            {achievement.description || "No description available."}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <span className={`text-[10px] font-mono font-bold ${isLocked ? "text-plasma-text-secondary" : rarity.color}`}>
              +{achievement.plasmaXP} XP
            </span>
            <span className="text-[10px] font-bold text-plasma-text-secondary/50 uppercase tracking-tighter">
              {achievement.globalPercentage != null ? achievement.globalPercentage.toFixed(1) : (achievement.rarityWeight || 0).toFixed(1)}% of players have this achievement
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
