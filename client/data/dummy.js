/**
 * PLASMA — Centralized Dummy Data
 * 
 * All mock data lives here. Pages import from services/api.js which
 * reads from this file. When the real API is ready, only api.js changes.
 */

// ─── CURRENT USER ────────────────────────────────────────────
export const currentUser = {
  id: "wahaj",
  username: "Wahaj",
  email: "wahaj@plasma.gg",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Me",
  status: "chill", // "comp" | "chill" | "offline"
  memberSince: "January 2024",
  stats: {
    xp: "12,450",
    xpRaw: 12450,
    achievements: 184,
    rallies: 23,
    library: 47,
    globalRank: 42,
  },
};

// ─── SQUAD MEMBERS ───────────────────────────────────────────
export const squadMembers = [
  {
    id: "wahaj",
    name: "Wahaj",
    status: "Playing Valorant",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wahaj",
    online: true,
    borderColor: null,
    offline: false,
  },
  {
    id: "ahmed",
    name: "Ahmed",
    status: "Menu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed",
    online: true,
    borderColor: "#2ecc71",
    offline: false,
  },
  {
    id: "sarah",
    name: "Sarah",
    status: "Helldivers 2",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    online: true,
    borderColor: "#2ecc71",
    offline: false,
  },
  {
    id: "ali",
    name: "Ali",
    status: "In-Queue",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali",
    online: true,
    borderColor: "#ff2a7a",
    offline: false,
  },
  {
    id: "omar",
    name: "Omar",
    status: "Offline",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Omar",
    online: false,
    borderColor: "#28243d",
    offline: true,
  },
];

// ─── PULSE FEED ──────────────────────────────────────────────
export const feedPosts = [
  {
    id: "post-1",
    type: "post",
    user: { name: "Ahmed", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed", borderColor: "#2ecc71" },
    intent: "CHILL",
    intentColor: "bg-plasma-success/10 text-plasma-success",
    text: "Ranked grind tonight who's in? 🎮",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    likes: 12,
    comments: 3,
    time: "15m ago",
    liked: false,
  },
  {
    id: "post-2",
    type: "post",
    user: { name: "Ali", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali", borderColor: "#ff2a7a" },
    intent: "COMP",
    intentColor: "bg-plasma-secondary/10 text-plasma-secondary",
    text: "Finally hit Diamond! Let's go 💎",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165&auto=format&fit=crop",
    likes: 45,
    comments: 12,
    time: "1h ago",
    liked: false,
  },
];

export const feedNotifications = [
  {
    id: "notif-1",
    type: "activity",
    user: { name: "Wahaj", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wahaj" },
    game: "Counter-Strike 2",
    time: "2m ago",
    intent: null,
  },
  {
    id: "notif-2",
    type: "activity",
    user: { name: "Sarah", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
    game: "Helldivers 2",
    time: "45m ago",
    intent: null,
  },
  {
    id: "notif-3",
    type: "offline",
    user: { name: "Omar", avatar: null },
    game: null,
    time: "3h ago",
    intent: null,
  },
];

export const feedFilters = [
  { id: "all", label: "All" },
  { id: "friends", label: "Friends Activity" },
  { id: "my-posts", label: "My Posts" },
  { id: "comp", label: "Comp Only" },
  { id: "chill", label: "Chill Only" },
];

// ─── LIBRARY / GAMES ─────────────────────────────────────────
export const games = [
  { id: "valorant", title: "Valorant", iconName: "Gamepad2", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop", nowPlaying: false, platform: "steam", hoursPlayed: 342, lastPlayed: "2h ago", description: "A 5v5 character-based tactical shooter." },
  { id: "league-of-legends", title: "League of Legends", iconName: "Diamond", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165&auto=format&fit=crop", nowPlaying: true, platform: "non-steam", hoursPlayed: 1205, lastPlayed: "Now", description: "A team-based strategy game." },
  { id: "fortnite", title: "Fortnite", iconName: "Cloud", image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop", nowPlaying: false, platform: "non-steam", hoursPlayed: 89, lastPlayed: "3d ago", description: "Battle royale and more." },
  { id: "apex-legends", title: "Apex Legends", iconName: "Zap", image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=2119&auto=format&fit=crop", nowPlaying: false, platform: "steam", hoursPlayed: 456, lastPlayed: "1d ago", description: "A free-to-play hero battle royale." },
  { id: "overwatch-2", title: "Overwatch 2", iconName: "Shield", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop", nowPlaying: false, platform: "non-steam", hoursPlayed: 210, lastPlayed: "5d ago", description: "Team-based action game." },
  { id: "genshin-impact", title: "Genshin Impact", iconName: "Sparkles", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165&auto=format&fit=crop", nowPlaying: false, platform: "non-steam", hoursPlayed: 180, lastPlayed: "1w ago", description: "Open-world action RPG." },
  { id: "palworld", title: "Palworld", iconName: "Dog", image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop", nowPlaying: false, platform: "steam", hoursPlayed: 67, lastPlayed: "2w ago", description: "Creature-collection survival." },
  { id: "helldivers-2", title: "Helldivers 2", iconName: "Star", image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=2119&auto=format&fit=crop", nowPlaying: false, platform: "steam", hoursPlayed: 134, lastPlayed: "4d ago", description: "Cooperative third-person shooter." },
  { id: "elden-ring", title: "Elden Ring", iconName: "Castle", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop", nowPlaying: false, platform: "steam", hoursPlayed: 298, lastPlayed: "2d ago", description: "Action RPG in a dark fantasy world." },
  { id: "cyberpunk-2077", title: "Cyberpunk 2077", iconName: "Cpu", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165&auto=format&fit=crop", nowPlaying: false, platform: "steam", hoursPlayed: 156, lastPlayed: "1w ago", description: "Open-world RPG set in Night City." },
];

export const gameFilters = [
  { id: "all", label: "All" },
  { id: "playing", label: "Currently Playing" },
  { id: "steam", label: "Steam" },
  { id: "non-steam", label: "Non-Steam" },
  { id: "playstation", label: "PlayStation" },
  { id: "xbox", label: "Xbox" },
];

// ─── PRESTIGE / ACHIEVEMENTS ─────────────────────────────────
export const hallOfFame = [
  { id: 1, title: "Global Elite", xp: "100 XP", iconName: "Skull", color: "text-plasma-secondary", borderColor: "border-plasma-secondary", glow: "shadow-[0_0_15px_rgba(255,42,122,0.4)]" },
  { id: 2, title: "Demolitions", xp: "50 XP", iconName: "Flame", color: "text-plasma-primary", borderColor: "border-plasma-primary" },
  { id: 3, title: "Win Streak", xp: "25 XP", iconName: "Crosshair", color: "text-[#3498DB]", borderColor: "border-[#3498DB]" },
  { id: 4, title: "Elden Lord", xp: "500 XP", iconName: "Sparkles", color: "text-plasma-secondary", borderColor: "border-plasma-secondary" },
  { id: 5, title: "Radiant", xp: "300 XP", iconName: "Diamond", color: "text-plasma-primary", borderColor: "border-plasma-primary" },
];

export const gamesProgress = [
  {
    title: "COUNTER-STRIKE 2",
    achievements: [
      { title: "Global Elite", xp: "100 XP", iconName: "Skull", color: "text-plasma-secondary", border: "border-plasma-secondary", unlocked: true },
      { title: "Demolitions", xp: "50 XP", iconName: "Flame", color: "text-plasma-primary", border: "border-plasma-primary", unlocked: true },
      { title: "Win Streak", xp: "25 XP", iconName: "Crosshair", color: "text-[#3498DB]", border: "border-[#3498DB]", unlocked: true },
      { title: "Support Role", xp: "10 XP", iconName: "Users", color: "text-[#2ECC71]", border: "border-[#2ECC71]", unlocked: true },
      { title: "Clutch King", xp: "50 XP", iconName: "Lock", color: "text-plasma-text-secondary", border: "border-plasma-text-secondary", unlocked: false },
      { title: "Knife Master", xp: "75 XP", iconName: "Lock", color: "text-plasma-text-secondary", border: "border-plasma-text-secondary", unlocked: false },
    ]
  },
  {
    title: "ELDEN RING",
    achievements: [
      { title: "Elden Lord", xp: "500 XP", iconName: "Sparkles", color: "text-plasma-secondary", border: "border-plasma-secondary", unlocked: true },
      { title: "Erdtree Bloom", xp: "200 XP", iconName: "Leaf", color: "text-plasma-primary", border: "border-plasma-primary", unlocked: true },
      { title: "God-Slayer", xp: "150 XP", iconName: "Flag", color: "text-plasma-primary", border: "border-plasma-primary", unlocked: true },
      { title: "All Bosses", xp: "1000 XP", iconName: "Lock", color: "text-plasma-text-secondary", border: "border-plasma-text-secondary", unlocked: false },
      { title: "Ranni Ending", xp: "400 XP", iconName: "Lock", color: "text-plasma-text-secondary", border: "border-plasma-text-secondary", unlocked: false },
    ]
  },
  {
    title: "VALORANT",
    achievements: [
      { title: "Radiant", xp: "300 XP", iconName: "Diamond", color: "text-plasma-primary", border: "border-plasma-primary", unlocked: true },
      { title: "Entry Fragger", xp: "40 XP", iconName: "Zap", color: "text-plasma-primary", border: "border-plasma-primary", unlocked: true },
      { title: "Anchor", xp: "30 XP", iconName: "Shield", color: "text-[#3498DB]", border: "border-[#3498DB]", unlocked: true },
      { title: "Pocket Sage", xp: "20 XP", iconName: "Activity", color: "text-[#2ECC71]", border: "border-[#2ECC71]", unlocked: true },
    ]
  }
];

export const leaderboard = [
  { id: 1, name: "Ahmed", xp: "15,200 XP", rank: "🥇", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed", isCurrentUser: false },
  { id: 2, name: "Sarah", xp: "14,800 XP", rank: "🥈", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", isCurrentUser: false },
  { id: 3, name: "Wahaj", xp: "12,450 XP", rank: "🥉", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Me", isCurrentUser: true },
  { id: 4, name: "Katarina", xp: "9,800 XP", rank: "4", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kat", isCurrentUser: false },
  { id: 5, name: "Liam_X", xp: "8,450 XP", rank: "5", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Liam", isCurrentUser: false },
  { id: 6, name: "NoobSlayer", xp: "7,200 XP", rank: "6", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noob", isCurrentUser: false },
  { id: 7, name: "PixelWiz", xp: "6,900 XP", rank: "7", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pixel", isCurrentUser: false },
  { id: 8, name: "Ghost_77", xp: "5,100 XP", rank: "8", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ghost", isCurrentUser: false },
];

export const globalLeaderboard = [
  { id: 1, name: "xXDarkLordXx", xp: "98,200 XP", rank: "1", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DarkLord", isCurrentUser: false },
  { id: 2, name: "ProGamer99", xp: "87,100 XP", rank: "2", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer", isCurrentUser: false },
  { id: 3, name: "NightHawk", xp: "76,500 XP", rank: "3", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk", isCurrentUser: false },
  { id: 42, name: "Wahaj", xp: "12,450 XP", rank: "42", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Me", isCurrentUser: true },
];

// ─── RALLY / EVENTS ──────────────────────────────────────────
export const rallyEvents = [
  {
    id: 1, title: "Friday Night Ranked", game: "Valorant", date: "Mar 22", time: "9:00 PM",
    intent: "COMP", intentColor: "text-error border-error/30 bg-error/20",
    slotsFilled: 4, slotsTotal: 6,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    roles: [
      { name: "DPS", filled: 2, total: 3, percent: 66 },
      { name: "Sentinel", filled: 1, total: 2, percent: 50 },
      { name: "Support", filled: 0, total: 1, percent: 0 },
    ],
    players: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=P1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=P2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=P3",
    ],
    rsvpd: false,
  },
  {
    id: 2, title: "Sunday Chill Custom Games", game: "Fortnite", date: "Mar 24", time: "3:00 PM",
    intent: "CHILL", intentColor: "text-plasma-primary border-plasma-primary/30 bg-plasma-primary/10",
    slotsFilled: 3, slotsTotal: 10,
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop",
    roles: [{ name: "Any Roles", filled: 3, total: 10, percent: 30 }],
    players: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=P4",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=P5",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=P6",
    ],
    rsvpd: false,
  },
];

export const rallyListEvents = [
  {
    category: "Today — March 21",
    items: [
      { id: 101, title: "Late Night Valorant", game: "Valorant", time: "11:00 PM", intent: "COMP", intentColor: "text-plasma-error bg-plasma-error/20 border-plasma-error/30", slotsFilled: 3, slotsTotal: 5, icon: "https://api.dicebear.com/7.x/initials/svg?seed=VL&backgroundColor=ffb4ab" },
    ]
  },
  {
    category: "This Week",
    items: [
      { id: 102, title: "Friday Night Ranked", game: "Valorant", date: "Mar 22", time: "9:00 PM", intent: "COMP", intentColor: "text-plasma-error bg-plasma-error/20 border-plasma-error/30", slotsFilled: 4, slotsTotal: 6, isTomorrow: true, icon: "https://api.dicebear.com/7.x/initials/svg?seed=VL&backgroundColor=ffb4ab" },
      { id: 103, title: "Sunday Chill Games", game: "Fortnite", date: "Mar 24", time: "3:00 PM", intent: "CHILL", intentColor: "text-plasma-success bg-plasma-success/20 border-plasma-success/30", slotsFilled: 3, slotsTotal: 10, icon: "https://api.dicebear.com/7.x/initials/svg?seed=FN&backgroundColor=bbf7d0" },
      { id: 104, title: "Ranked Grind Tuesday", game: "CS2", date: "Mar 26", time: "8:00 PM", intent: "COMP", intentColor: "text-plasma-error bg-plasma-error/20 border-plasma-error/30", slotsFilled: 2, slotsTotal: 4, icon: "https://api.dicebear.com/7.x/initials/svg?seed=CS&backgroundColor=ffb4ab" },
    ]
  },
  {
    category: "Later",
    items: [
      { id: 105, title: "Weekend Tournament Prep", game: "Valorant", date: "Mar 28", time: "7:00 PM", intent: "LFG", intentColor: "text-yellow-500 bg-yellow-500/20 border-yellow-500/30", slotsFilled: 1, slotsTotal: 8, icon: "https://api.dicebear.com/7.x/initials/svg?seed=VL&backgroundColor=fef08a" },
    ]
  }
];

// ─── RIGHT RAIL ──────────────────────────────────────────────
export const trendingGames = [
  { initials: "VL", bgColor: "#563895", name: "Valorant", count: "4 PLAYING" },
  { initials: "CS", bgColor: "#ff2a7a", name: "CS2", count: "3 PLAYING" },
  { initials: "HD", bgColor: "#2ecc71", name: "Helldivers 2", count: "2 PLAYING" },
];

export const upcomingRallies = [
  { title: "Friday Ranked", time: "Tomorrow 9PM", borderColor: "#563895" },
  { title: "Sunday Chill", time: "In 3 days", borderColor: "#ff2a7a" },
];

// ─── NOTIFICATIONS ───────────────────────────────────────────
export const notifications = [
  { id: 1, type: "friend_request", title: "Ghost_Sniper sent you a friend request", time: "2h ago", read: false, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Req1" },
  { id: 2, type: "achievement", title: "You unlocked 'Shadow Operative' in Apex Legends", time: "5h ago", read: false, avatar: null },
  { id: 3, type: "rally", title: "Friday Night Ranked starts in 1 hour", time: "6h ago", read: true, avatar: null },
  { id: 4, type: "friend_request", title: "NoobSlayer99 sent you a friend request", time: "1d ago", read: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Req2" },
  { id: 5, type: "system", title: "Welcome to Plasma! Complete your profile to get started.", time: "2d ago", read: true, avatar: null },
  { id: 6, type: "achievement", title: "Ahmed unlocked 'Elden Lord' — you're falling behind!", time: "3d ago", read: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed" },
  { id: 7, type: "rally", title: "You RSVP'd to Sunday Chill Games", time: "3d ago", read: true, avatar: null },
];

// ─── MESSAGES ────────────────────────────────────────────────
export const conversations = [
  {
    id: "conv-1",
    friend: { name: "Ahmed", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed", online: true },
    lastMessage: "Let's queue ranked tonight?",
    lastMessageTime: "2m ago",
    unread: 2,
    messages: [
      { id: 1, sender: "ahmed", text: "Yo you online?", time: "10:30 PM" },
      { id: 2, sender: "wahaj", text: "Yeah just finished a game", time: "10:32 PM" },
      { id: 3, sender: "ahmed", text: "Let's queue ranked tonight?", time: "10:33 PM" },
    ],
  },
  {
    id: "conv-2",
    friend: { name: "Sarah", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", online: true },
    lastMessage: "GG that was insane 🔥",
    lastMessageTime: "1h ago",
    unread: 0,
    messages: [
      { id: 1, sender: "sarah", text: "That last round was crazy", time: "9:15 PM" },
      { id: 2, sender: "wahaj", text: "I know right! That clutch play though", time: "9:16 PM" },
      { id: 3, sender: "sarah", text: "GG that was insane 🔥", time: "9:17 PM" },
    ],
  },
  {
    id: "conv-3",
    friend: { name: "Ali", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali", online: false },
    lastMessage: "See you at the rally tomorrow",
    lastMessageTime: "5h ago",
    unread: 0,
    messages: [
      { id: 1, sender: "ali", text: "Hey are you joining the rally tomorrow?", time: "5:00 PM" },
      { id: 2, sender: "wahaj", text: "Yeah I'm in, what time again?", time: "5:05 PM" },
      { id: 3, sender: "ali", text: "9 PM. I'll send the invite", time: "5:06 PM" },
      { id: 4, sender: "wahaj", text: "Perfect 👍", time: "5:07 PM" },
      { id: 5, sender: "ali", text: "See you at the rally tomorrow", time: "5:08 PM" },
    ],
  },
  {
    id: "conv-4",
    friend: { name: "Omar", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Omar", online: false },
    lastMessage: "I'll be back online next week",
    lastMessageTime: "2d ago",
    unread: 0,
    messages: [
      { id: 1, sender: "omar", text: "Hey I'll be away for a few days", time: "Mon 3:00 PM" },
      { id: 2, sender: "wahaj", text: "No worries, take care!", time: "Mon 3:15 PM" },
      { id: 3, sender: "omar", text: "I'll be back online next week", time: "Mon 3:16 PM" },
    ],
  },
];

// ─── SETTINGS ────────────────────────────────────────────────
export const userSettings = {
  account: {
    username: "Wahaj",
    email: "wahaj@plasma.gg",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Me",
  },
  notifications: {
    friendRequests: true,
    achievementAlerts: true,
    rallyReminders: true,
    emailDigest: false,
    pushNotifications: true,
  },
  privacy: {
    profileVisibility: "public", // "public" | "friends" | "private"
    activityVisibility: "friends", // "public" | "friends" | "private"
    showOnlineStatus: true,
  },
  connectedAccounts: {
    steam: { connected: true, username: "pro_gamer_wahaj" },
    discord: { connected: false, username: null },
    twitch: { connected: false, username: null },
  },
  appearance: {
    theme: "dark", // only dark for now
  },
};

// ─── FRIENDS (for drawer) ────────────────────────────────────
export const friendRequests = [
  { id: "req-1", name: "Ghost_Sniper", level: 12, timeAgo: "2h ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Req1" },
  { id: "req-2", name: "NoobSlayer99", level: 45, timeAgo: "1d ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Req2" },
];

export const onlineFriends = [
  { name: "Ahmed", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed", playing: "Valorant" },
  { name: "Sarah", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", playing: "Valorant" },
  { name: "Ali", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali", playing: "Valorant" },
];

export const offlineFriends = [
  { name: "Omar", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Omar", lastSeen: "4h ago" },
  { name: "Zain", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zain", lastSeen: "1d ago" },
];
