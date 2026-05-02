import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getAvatarUrl(avatar, seed) {
  if (avatar) return avatar;
  // Ensure we have a string for the seed
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
        iconName: "Diamond",
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
