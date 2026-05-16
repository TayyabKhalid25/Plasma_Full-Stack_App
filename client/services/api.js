/**
 * PLASMA — Service Abstraction Layer
 * 
 * All data fetching goes through here. Each function calls the real API
 * via the shared httpClient.
 */

import { apiFetch } from "./httpClient";


// ─── AUTH ────────────────────────────────────────────────────
export async function getUser() {
  const data = await apiFetch("/api/auth/me");
  if (data.success) return data.data;
  throw new Error("Failed");
}

// ─── FEED / PULSE ────────────────────────────────────────────
export async function getFeed(filter = "all") {
  const data = await apiFetch(`/api/feed?filter=${filter}`);
  if (data.success && data.data) {
    // Map API response to frontend shape, or return raw
    return { posts: data.data, notifications: [] };
  }
  throw new Error("Failed");
}

export function getFeedFilters() {
  return [
    { id: "all", label: "All" },
    { id: "friends", label: "Friends Activity" },
    { id: "my-posts", label: "My Posts" },
    { id: "comp", label: "Comp Only" },
    { id: "chill", label: "Chill Only" },
  ];
}

// ─── LIBRARY / GAMES ─────────────────────────────────────────
export async function getGames(filter = "all", search = "") {
  const data = await apiFetch(`/api/games?filter=${filter}&q=${encodeURIComponent(search)}`);
  if (data.success && data.data) return data.data;
  throw new Error("Failed");
}

export function getGameFilters() {
  return [
    { id: "all", label: "All" },
    { id: "playing", label: "Currently Playing" },
    { id: "steam", label: "Steam" },
    { id: "non-steam", label: "Non-Steam" },
    { id: "playstation", label: "PlayStation" },
    { id: "xbox", label: "Xbox" },
  ];
}

// ─── PRESTIGE / ACHIEVEMENTS ─────────────────────────────────
export async function getAchievements(tab = "steam") {
  const data = await apiFetch(`/api/achievements?type=${tab}`);
  if (data.success) return data.data;
  throw new Error("Failed");
}

export async function getLeaderboard(scope = "friends") {
  const data = await apiFetch(`/api/leaderboard?scope=${scope}`);
  if (data.success) return data.data;
  throw new Error("Failed");
}

// ─── RALLY / EVENTS ──────────────────────────────────────────
export async function getRallies(view = "calendar") {
  const data = await apiFetch(`/api/rallies?view=${view}`);
  if (data.success) return data.data;
  throw new Error("Failed");
}

// ─── SQUAD / FRIENDS ─────────────────────────────────────────
export async function getSquad() {
  const data = await apiFetch("/api/squad");
  if (data.success) return data.data;
  throw new Error("Failed");
}

export async function getFriends() {
  const data = await apiFetch("/api/users/friends");
  if (data.success) return data.data;
  throw new Error("Failed");
}

// ─── RIGHT RAIL ──────────────────────────────────────────────
export async function getTrending() {
  const data = await apiFetch("/api/pulse/trending");
  if (data.success) {
    return data.data.map(item => ({
      appID: item.appID,
      title: item.title,
      count: `${item.playingCount} PLAYING`,
      initials: item.title.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      bgColor: item.title.includes('Val') ? '#563895' : item.title.includes('CS') ? '#FF2A7A' : '#2ECC71'
    }));
  }
  throw new Error("Failed");
}

export async function getUpcomingRallies() {
  const data = await apiFetch("/api/rallies/upcoming");
  if (data.success) {
    return data.data.map(item => ({
      id: item.eventID,
      title: item.title,
      time: new Date(item.scheduledStartUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent: item.requiredIntent
    }));
  }
  throw new Error("Failed");
}

// ─── NOTIFICATIONS ───────────────────────────────────────────
export async function getNotifications(filter = "all") {
  const data = await apiFetch(`/api/notifications?filter=${filter}`);
  if (data.success) return data.data;
  throw new Error("Failed");
}

// ─── SETTINGS ────────────────────────────────────────────────
export async function getSettings() {
  const data = await apiFetch("/api/settings");
  if (data.success) return data.data;
  throw new Error("Failed");
}

export async function updateSettings(settings) {
  const data = await apiFetch("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  if (data.success) return data;
  throw new Error("Failed");
}
