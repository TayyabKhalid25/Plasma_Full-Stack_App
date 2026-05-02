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
