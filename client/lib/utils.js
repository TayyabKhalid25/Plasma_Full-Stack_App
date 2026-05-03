import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getAvatarUrl(avatar, seed) {
  const isBrowser = typeof window !== 'undefined';
  const cacheKey = `avatar_cache_${seed}`;

  if (avatar) {
    // If we have a real avatar, cache it and return it
    if (isBrowser) {
      try {
        localStorage.setItem(cacheKey, avatar);
      } catch (e) {}
    }
    return avatar;
  }

  // If no avatar provided, check cache
  if (isBrowser) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return cached;
    } catch (e) {}
  }

  // Final fallback to DiceBear
  const safeSeed = typeof seed === 'string' ? seed : 'User';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(safeSeed)}`;
}

export function getRarityProps(rarity) {
  switch (rarity) {
    case 1:
      return {
        tier: "Bronze",
        color: "text-plasma-bronze",
        iconName: "Shield",
        border: "border-plasma-bronze/30",
        shadow: "shadow-[0_0_10px_rgba(205,127,50,0.2)]",
        glow: "shadow-[0_0_20px_rgba(205,127,50,0.4)]"
      };
    case 2:
      return {
        tier: "Silver",
        color: "text-plasma-silver",
        iconName: "Target",
        border: "border-plasma-silver/30",
        shadow: "shadow-[0_0_10px_rgba(192,192,192,0.2)]",
        glow: "shadow-[0_0_20px_rgba(192,192,192,0.4)]"
      };
    case 3:
      return {
        tier: "Gold",
        color: "text-plasma-gold",
        iconName: "Medal",
        border: "border-plasma-gold/30",
        shadow: "shadow-[0_0_10px_rgba(255,215,0,0.2)]",
        glow: "shadow-[0_0_20px_rgba(255,215,0,0.4)]"
      };
    case 4:
      return {
        tier: "Platinum",
        color: "text-plasma-platinum",
        iconName: "Gem",
        border: "border-plasma-platinum/30",
        shadow: "shadow-[0_0_10px_rgba(229,228,226,0.2)]",
        glow: "shadow-[0_0_20px_rgba(229,228,226,0.4)]"
      };
    default:
      return {
        tier: "Standard",
        color: "text-plasma-primary",
        iconName: "Trophy",
        border: "border-plasma-primary/30",
        shadow: "",
        glow: ""
      };
  }
}
