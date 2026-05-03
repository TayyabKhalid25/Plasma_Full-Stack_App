import Link from "next/link";
import { Trophy } from "lucide-react";
import { getAvatarUrl, getRarityProps } from "@/lib/utils";

export function FriendAchievementCard({ friend }) {
  return (
    <div className="p-5 rounded-3xl bg-plasma-slate/60 backdrop-blur-md border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-4">
        <img
          src={getAvatarUrl(friend.avatar, friend.username)}
          className="w-12 h-12 rounded-full border-2 border-plasma-primary/30"
          alt=""
        />
        <div>
          <h4 className="text-sm font-bold text-white">{friend.username}</h4>
          <p className="text-[10px] text-plasma-text-secondary font-medium uppercase tracking-widest">
            {friend.unlockedCount} Achievements Unlocked
          </p>
        </div>
      </div>

      <div className="flex -space-x-2">
        {friend.achievements.slice(0, 8).map(ach => {
          const rarity = getRarityProps(ach.rarityWeight || 10);
          return (
            <div
              key={`${friend.id}-${ach.id}`}
              className={`w-10 h-10 rounded-full border-2 border-plasma-bg bg-plasma-slate flex items-center justify-center ${rarity.border} ${rarity.shadow}`}
              title={ach.title}
            >
              <Trophy className={`w-4 h-4 ${rarity.color}`} />
            </div>
          );
        })}
        {friend.achievements.length > 8 && (
          <div className="w-10 h-10 rounded-full bg-plasma-primary border-2 border-plasma-bg flex items-center justify-center text-[10px] font-bold text-white">
            +{friend.achievements.length - 8}
          </div>
        )}
      </div>

      <Link
        href={`/profile/${friend.id}`}
        className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-plasma-primary text-xs font-bold uppercase tracking-widest transition-all text-center"
      >
        View Profile
      </Link>
    </div>
  );
}
