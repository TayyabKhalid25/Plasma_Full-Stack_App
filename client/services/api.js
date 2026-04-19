/**
 * PLASMA — Service Abstraction Layer
 * 
 * All data fetching goes through here. Currently returns dummy data.
 * When the backend API is ready, swap the implementations below.
 * 
 * Usage in components:
 *   import { getUser, getFeed } from "@/services/api";
 *   const user = await getUser();
 */

import * as dummy from "@/data/dummy";

// Simulates network latency for realistic loading states
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

// ─── AUTH ────────────────────────────────────────────────────
export async function getUser() {
  await delay();
  // TODO: Replace with: const res = await fetch('/api/auth/me'); return res.json();
  return dummy.currentUser;
}

// ─── FEED / PULSE ────────────────────────────────────────────
export async function getFeed(filter = "all") {
  await delay();
  // TODO: Replace with: const res = await fetch(`/api/feed?filter=${filter}`); return res.json();
  const posts = dummy.feedPosts;
  const notifs = dummy.feedNotifications;

  if (filter === "all") return { posts, notifications: notifs };
  if (filter === "friends") return { posts, notifications: notifs };
  if (filter === "my-posts") return { posts: posts.filter((p) => p.user.name === "Wahaj"), notifications: [] };
  if (filter === "comp") return { posts: posts.filter((p) => p.intent === "COMP"), notifications: notifs.filter((n) => n.intent === "COMP") };
  if (filter === "chill") return { posts: posts.filter((p) => p.intent === "CHILL"), notifications: notifs.filter((n) => n.intent === "CHILL") };
  return { posts, notifications: notifs };
}

export function getFeedFilters() {
  return dummy.feedFilters;
}

// ─── LIBRARY / GAMES ─────────────────────────────────────────
export async function getGames(filter = "all", search = "") {
  await delay();
  // TODO: Replace with: const res = await fetch(`/api/games?filter=${filter}&q=${search}`); return res.json();
  let result = [...dummy.games];

  if (search) {
    result = result.filter((g) => g.title.toLowerCase().includes(search.toLowerCase()));
  }
  if (filter === "playing") result = result.filter((g) => g.nowPlaying);
  if (filter === "steam") result = result.filter((g) => g.platform === "steam");
  if (filter === "non-steam") result = result.filter((g) => g.platform === "non-steam");
  // playstation and xbox have no games in dummy data yet

  return result;
}

export async function getGameById(id) {
  await delay();
  // TODO: Replace with: const res = await fetch(`/api/games/${id}`); return res.json();
  return dummy.games.find((g) => g.id === id) || null;
}

export function getGameFilters() {
  return dummy.gameFilters;
}

// ─── PRESTIGE / ACHIEVEMENTS ─────────────────────────────────
export async function getAchievements(tab = "steam") {
  await delay();
  // TODO: Replace with: const res = await fetch(`/api/achievements?type=${tab}`); return res.json();
  return {
    hallOfFame: dummy.hallOfFame,
    gamesProgress: dummy.gamesProgress,
  };
}

export async function getLeaderboard(scope = "friends") {
  await delay();
  // TODO: Replace with: const res = await fetch(`/api/leaderboard?scope=${scope}`); return res.json();
  if (scope === "global") return dummy.globalLeaderboard;
  return dummy.leaderboard;
}

// ─── RALLY / EVENTS ──────────────────────────────────────────
export async function getRallies(view = "calendar") {
  await delay();
  // TODO: Replace with: const res = await fetch(`/api/rallies?view=${view}`); return res.json();
  if (view === "list") return dummy.rallyListEvents;
  return dummy.rallyEvents;
}

// ─── SQUAD / FRIENDS ─────────────────────────────────────────
export async function getSquad() {
  await delay();
  // TODO: Replace with: const res = await fetch('/api/squad'); return res.json();
  return dummy.squadMembers;
}

export async function getFriends() {
  await delay();
  // TODO: Replace with: const res = await fetch('/api/friends'); return res.json();
  return {
    requests: dummy.friendRequests,
    online: dummy.onlineFriends,
    offline: dummy.offlineFriends,
  };
}

// ─── RIGHT RAIL ──────────────────────────────────────────────
export async function getTrending() {
  await delay(100);
  // TODO: Replace with: const res = await fetch('/api/trending'); return res.json();
  return dummy.trendingGames;
}

export async function getUpcomingRallies() {
  await delay(100);
  // TODO: Replace with: const res = await fetch('/api/rallies/upcoming'); return res.json();
  return dummy.upcomingRallies;
}

// ─── NOTIFICATIONS ───────────────────────────────────────────
export async function getNotifications(filter = "all") {
  await delay();
  // TODO: Replace with: const res = await fetch(`/api/notifications?filter=${filter}`); return res.json();
  if (filter === "all") return dummy.notifications;
  return dummy.notifications.filter((n) => n.type === filter);
}

// ─── MESSAGES ────────────────────────────────────────────────
export async function getConversations() {
  await delay();
  // TODO: Replace with: const res = await fetch('/api/messages'); return res.json();
  return dummy.conversations;
}

export async function getConversation(id) {
  await delay();
  // TODO: Replace with: const res = await fetch(`/api/messages/${id}`); return res.json();
  return dummy.conversations.find((c) => c.id === id) || null;
}

// ─── SETTINGS ────────────────────────────────────────────────
export async function getSettings() {
  await delay();
  // TODO: Replace with: const res = await fetch('/api/settings'); return res.json();
  return dummy.userSettings;
}

export async function updateSettings(settings) {
  await delay(500);
  // TODO: Replace with: const res = await fetch('/api/settings', { method: 'PUT', body: JSON.stringify(settings) }); return res.json();
  console.log("Settings updated (mock):", settings);
  return { success: true };
}
