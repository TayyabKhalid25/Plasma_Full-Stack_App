/**
 * PLASMA — Service Abstraction Layer
 * 
 * All data fetching goes through here. Each function tries the real API first,
 * and falls back to dummy data if the server is unavailable or returns an error.
 * 
 * Usage in components:
 *   import { getUser, getFeed } from "@/services/api";
 *   const user = await getUser();
 */

import * as dummy from "@/data/dummy";

const API_BASE = "http://localhost:5000";

// Simulates network latency for realistic loading states (dummy fallback only)
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

// Shared fetch helper — attaches JWT and handles errors
async function apiFetch(endpoint, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("plasma_token") : null;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API error ${res.status}`);
  }

  return res.json();
}

// ─── AUTH ────────────────────────────────────────────────────
export async function getUser() {
  try {
    const data = await apiFetch("/api/auth/me");
    if (data.success) return data.data;
    throw new Error("Failed");
  } catch {
    await delay();
    return dummy.currentUser;
  }
}

// ─── FEED / PULSE ────────────────────────────────────────────
export async function getFeed(filter = "all") {
  try {
    const data = await apiFetch(`/api/feed?filter=${filter}`);
    if (data.success && data.data) {
      // Map API response to frontend shape, or return raw
      return { posts: data.data, notifications: [] };
    }
    throw new Error("Failed");
  } catch {
    await delay();
    const posts = dummy.feedPosts;
    const notifs = dummy.feedNotifications;

    if (filter === "all") return { posts, notifications: notifs };
    if (filter === "friends") return { posts, notifications: notifs };
    if (filter === "my-posts") return { posts: posts.filter((p) => p.user.name === "Wahaj"), notifications: [] };
    if (filter === "comp") return { posts: posts.filter((p) => p.intent === "COMP"), notifications: notifs.filter((n) => n.intent === "COMP") };
    if (filter === "chill") return { posts: posts.filter((p) => p.intent === "CHILL"), notifications: notifs.filter((n) => n.intent === "CHILL") };
    return { posts, notifications: notifs };
  }
}

export function getFeedFilters() {
  return dummy.feedFilters;
}

// ─── LIBRARY / GAMES ─────────────────────────────────────────
export async function getGames(filter = "all", search = "") {
  try {
    const data = await apiFetch(`/api/games?filter=${filter}&q=${encodeURIComponent(search)}`);
    if (data.success && data.data) return data.data;
    throw new Error("Failed");
  } catch {
    await delay();
    let result = [...dummy.games];

    if (search) {
      result = result.filter((g) => g.title.toLowerCase().includes(search.toLowerCase()));
    }
    if (filter === "playing") result = result.filter((g) => g.nowPlaying);
    if (filter === "steam") result = result.filter((g) => g.platform === "steam");
    if (filter === "non-steam") result = result.filter((g) => g.platform === "non-steam");

    return result;
  }
}

export async function getGameById(id) {
  await delay();
  // No single-game endpoint in the API collection
  return dummy.games.find((g) => g.id === id) || null;
}

export function getGameFilters() {
  return dummy.gameFilters;
}

// ─── PRESTIGE / ACHIEVEMENTS ─────────────────────────────────
export async function getAchievements(tab = "steam") {
  try {
    const data = await apiFetch(`/api/achievements?type=${tab}`);
    if (data.success) return data.data;
    throw new Error("Failed");
  } catch {
    await delay();
    return {
      hallOfFame: dummy.hallOfFame,
      gamesProgress: dummy.gamesProgress,
    };
  }
}

export async function getLeaderboard(scope = "friends") {
  try {
    const data = await apiFetch(`/api/leaderboard?scope=${scope}`);
    if (data.success) return data.data;
    throw new Error("Failed");
  } catch {
    await delay();
    if (scope === "global") return dummy.globalLeaderboard;
    return dummy.leaderboard;
  }
}

// ─── RALLY / EVENTS ──────────────────────────────────────────
export async function getRallies(view = "calendar") {
  try {
    const data = await apiFetch(`/api/rallies?view=${view}`);
    if (data.success) return data.data;
    throw new Error("Failed");
  } catch {
    await delay();
    if (view === "list") return dummy.rallyListEvents;
    return dummy.rallyEvents;
  }
}

// ─── SQUAD / FRIENDS ─────────────────────────────────────────
export async function getSquad() {
  try {
    const data = await apiFetch("/api/squad");
    if (data.success) return data.data;
    throw new Error("Failed");
  } catch {
    await delay();
    return dummy.squadMembers;
  }
}

export async function getFriends() {
  try {
    const data = await apiFetch("/api/friends");
    if (data.success) return data.data;
    throw new Error("Failed");
  } catch {
    await delay();
    return {
      requests: dummy.friendRequests,
      online: dummy.onlineFriends,
      offline: dummy.offlineFriends,
    };
  }
}

// ─── RIGHT RAIL ──────────────────────────────────────────────
export async function getTrending() {
  // No API endpoint — always use dummy
  await delay(100);
  return dummy.trendingGames;
}

export async function getUpcomingRallies() {
  // No API endpoint — always use dummy
  await delay(100);
  return dummy.upcomingRallies;
}

// ─── NOTIFICATIONS ───────────────────────────────────────────
export async function getNotifications(filter = "all") {
  try {
    const data = await apiFetch(`/api/notifications?filter=${filter}`);
    if (data.success) return data.data;
    throw new Error("Failed");
  } catch {
    await delay();
    if (filter === "all") return dummy.notifications;
    return dummy.notifications.filter((n) => n.type === filter);
  }
}

// ─── MESSAGES ────────────────────────────────────────────────
export async function getConversations() {
  // No API endpoint — always use dummy
  await delay();
  return dummy.conversations;
}

export async function getConversation(id) {
  // No API endpoint — always use dummy
  await delay();
  return dummy.conversations.find((c) => c.id === id) || null;
}

// ─── SETTINGS ────────────────────────────────────────────────
export async function getSettings() {
  try {
    const data = await apiFetch("/api/settings");
    if (data.success) return data.data;
    throw new Error("Failed");
  } catch {
    await delay();
    return dummy.userSettings;
  }
}

export async function updateSettings(settings) {
  try {
    const data = await apiFetch("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    if (data.success) return data;
    throw new Error("Failed");
  } catch {
    await delay(500);
    console.log("Settings updated (mock):", settings);
    return { success: true };
  }
}
