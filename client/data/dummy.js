/**
 * PLASMA — Centralized Dummy Data
 * 
 * Mock data for features where backend APIs do not exist yet.
 */

export const feedFilters = [
  { id: "all", label: "All" },
  { id: "friends", label: "Friends Activity" },
  { id: "my-posts", label: "My Posts" },
  { id: "comp", label: "Comp Only" },
  { id: "chill", label: "Chill Only" },
];

export const gameFilters = [
  { id: "all", label: "All" },
  { id: "playing", label: "Currently Playing" },
  { id: "steam", label: "Steam" },
  { id: "non-steam", label: "Non-Steam" },
  { id: "playstation", label: "PlayStation" },
  { id: "xbox", label: "Xbox" },
];

// ─── RIGHT RAIL (API does not exist) ─────────────────────────
export const trendingGames = [
  { initials: "VL", bgColor: "#563895", name: "Valorant", count: "4 PLAYING" },
  { initials: "CS", bgColor: "#ff2a7a", name: "CS2", count: "3 PLAYING" },
  { initials: "HD", bgColor: "#2ecc71", name: "Helldivers 2", count: "2 PLAYING" },
];

export const upcomingRallies = [
  { title: "Friday Ranked", time: "Tomorrow 9PM", borderColor: "#563895" },
  { title: "Sunday Chill", time: "In 3 days", borderColor: "#ff2a7a" },
];
