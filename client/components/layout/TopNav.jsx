"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Search, Bell, Trophy, UserPlus, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const statusModes = [
  { id: "comp", label: "COMP", bg: "bg-plasma-secondary", shadow: "shadow-[0px_0px_15px_rgba(232,65,24,0.3)]" },
  { id: "chill", label: "CHILL", bg: "bg-plasma-success", shadow: "shadow-[0px_0px_15px_rgba(46,204,113,0.3)]" },
  { id: "offline", label: "OFFLINE", bg: "bg-plasma-text-secondary", shadow: "shadow-[0px_0px_15px_rgba(148,163,184,0.2)]" },
];

const notifIconMap = {
  FRIEND_REQUEST: UserPlus,
  ACHIEVEMENT: Trophy,
  RALLY: Calendar,
  SYSTEM: AlertCircle,
};

const notifColorMap = {
  FRIEND_REQUEST: "bg-plasma-primary/15 text-plasma-primary",
  ACHIEVEMENT: "bg-plasma-secondary/15 text-plasma-secondary",
  RALLY: "bg-plasma-success/15 text-plasma-success",
  SYSTEM: "bg-plasma-warning/15 text-plasma-warning",
};

// Helper to safely read cached values
function getCachedData() {
  if (typeof window === "undefined") return { mode: null, avatar: null, name: null };
  
  let mode = localStorage.getItem("plasma_active_mode");
  let avatar = null;
  let name = null;

  const cachedUser = localStorage.getItem("plasma_cached_user");
  if (cachedUser) {
    try {
      const parsed = JSON.parse(cachedUser);
      if (!mode && parsed.intent) mode = parsed.intent.toLowerCase();
      if (parsed.avatar) avatar = parsed.avatar;
      if (parsed.name) name = parsed.name;
    } catch { /* ignore */ }
  }
  return { mode, avatar, name };
}

export const TopNav = () => {
  const { user, logout, token, updateIntent } = useAuth();
  const [cachedMode, setCachedMode] = useState("chill"); // SSR Default
  const [cachedAvatar, setCachedAvatar] = useState(null); // SSR Default
  const [cachedName, setCachedName] = useState("User"); // SSR Default
  const [isMounted, setIsMounted] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Derive active mode: prefer live user.intent from context, fall back to cached
  const activeMode = user?.intent ? user.intent.toLowerCase() : cachedMode;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const previewNotifs = notifications.slice(0, 4);

  // Synchronously update state and reveal component after client hydration
  useIsomorphicLayoutEffect(() => {
    const { mode, avatar, name } = getCachedData();
    if (mode) setCachedMode(mode);
    if (avatar) setCachedAvatar(avatar);
    if (name) setCachedName(name);
    setIsMounted(true);
  }, []);

  // Cache user data to localStorage whenever it arrives from AuthContext
  useEffect(() => {
    if (user) {
      const cacheData = { name: user.name, avatar: user.avatar, intent: user.intent };
      localStorage.setItem("plasma_cached_user", JSON.stringify(cacheData));
      setCachedAvatar(user.avatar || null);
      setCachedName(user.name || "User");
    }
  }, [user]);

  // Fetch real notifications from API
  useEffect(() => {
    if (!token) return;
    const fetchNotifications = async () => {
      setNotifsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data.map(n => ({
            id: n.notificationID,
            type: n.notificationType,
            title: n.senderName ? `${n.senderName} ${n.message}` : n.message,
            time: new Date(n.sentAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            read: n.isRead,
            avatar: n.senderAvatar || null,
          })));
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setNotifsLoading(false);
      }
    };
    fetchNotifications();
  }, [token]);

  // Handle mode change — delegates to AuthContext
  const handleModeChange = (modeId) => {
    updateIntent(modeId);
  };

  // Mark a single notification as read
  const markNotifRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    try {
      await fetch(`${API_BASE}/api/notifications/${notifId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all notifications as read
  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  // Listen for optimistic updates from the notification page
  useEffect(() => {
    const handleAllRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };
    const handleSingleRead = (e) => {
      const id = e.detail?.id;
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    };

    window.addEventListener("plasma_notifications_read", handleAllRead);
    window.addEventListener("plasma_notification_read_single", handleSingleRead);
    return () => {
      window.removeEventListener("plasma_notifications_read", handleAllRead);
      window.removeEventListener("plasma_notification_read_single", handleSingleRead);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    if (showNotifDropdown || showProfileDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifDropdown, showProfileDropdown]);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ users: [], games: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchDropdownRef = useRef(null);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ users: [], games: [] });
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setShowSearchDropdown(true);
      try {
        const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    if (showSearchDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearchDropdown]);

  // Resolve display values: prefer live user data, fall back to cached
  const displayAvatar = user?.avatar || cachedAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || user?.username || cachedName || 'User'}`;
  const displayName = user?.name || cachedName;

  return (
    <div className="flex w-full h-16 items-center justify-between px-6 py-0 fixed top-0 left-0 bg-plasma-bg/80 border-b border-white/5 shadow-[0px_0px_40px_#5638951a] backdrop-blur-md z-50">
      <div className="inline-flex h-[85px] items-center gap-8 relative flex-[0_0_auto]">
        <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
          <Link href="/pulse" className="hover:opacity-80 transition-opacity flex items-center">
            <svg
              viewBox="0 0 2013.09 468"
              className="h-6 w-auto text-white hover:text-plasma-primary transition-colors"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon points="0 99.37 96.23 99.37 100.17 99.37 292.56 99.37 292.56 241.68 197.16 241.68 197.16 331.59 197.16 331.98 197.16 338.66 297.59 338.66 299.5 336.34 394.31 241.86 394.31 0 0 0 0 99.37" />
              <polygon points="100.17 273.23 100.17 265.82 100.17 130.93 96.23 130.93 0 226.82 0 350.71 0 375.33 0 468 170.22 467.27 265.79 370.81 100.17 370.21 100.17 273.23" />
              <path d="M576.96.34h-171.47v241.02h74.37v-68.86h97.1c44.07,0,62.67-18.59,62.67-62.67v-46.83c0-44.07-18.59-62.67-62.67-62.67ZM565.26,99.16c0,14.12-4.48,18.59-18.59,18.59h-66.8v-59.91h66.8c14.12,0,18.59,4.48,18.59,18.59v22.72Z" />
              <polygon points="738.79 .34 664.42 .34 664.42 241.36 858.62 241.36 858.62 175.59 738.79 175.59 738.79 .34" />
              <path d="M964.66.34l-101.23,241.02h78.5l13.43-37.53h98.82l13.43,37.53h82.29L1049.02.34h-84.36ZM973.96,152.53l30.99-85.39,30.64,85.39h-61.63Z" />
              <path d="M1342.72,95.71l-97.1-8.61c-11.36-1.03-15.15-4.13-15.15-15.15v-4.48c0-11.36,3.79-15.15,15.15-15.15h59.91c11.36,0,15.15,3.79,15.15,15.15v6.89h71.62v-19.63c0-37.53-17.22-54.4-54.4-54.4h-127.4c-37.19,0-54.4,16.87-54.4,54.4v32.37c0,36.84,15.84,50.61,54.4,54.4l97.1,8.61c12.05,1.03,15.15,3.79,15.15,15.15v8.61c0,11.36-3.79,15.15-15.15,15.15h-68.17c-11.36,0-15.15-3.79-15.15-15.15v-9.98h-71.62v23.07c0,37.53,17.22,54.4,54.4,54.4h135.66c37.19,0,54.4-16.87,54.4-54.4v-36.84c0-37.19-15.84-51.3-54.4-54.4Z" />
              <polygon points="1569.62 125.67 1492.49 .34 1427.07 .34 1427.07 241.36 1495.94 241.36 1495.94 120.5 1549.31 203.83 1587.18 203.83 1640.55 120.5 1640.55 241.36 1709.41 241.36 1709.41 .34 1647.09 .34 1569.62 125.67" />
              <path d="M1912.21.34h-84.36l-101.23,241.02h78.5l13.43-37.53h98.82l13.43,37.53h82.29L1912.21.34ZM1837.15,152.53l30.99-85.39,30.64,85.39h-61.63Z" />
            </svg>
          </Link>
        </div>
        <div className="inline-flex flex-col items-start relative flex-[0_0_auto]" ref={searchDropdownRef}>
          <div className="w-80 justify-center pl-10 pr-4 py-2.5 flex-[0_0_auto] bg-plasma-slate rounded-full overflow-hidden flex items-start relative border border-transparent focus-within:border-plasma-primary/30 transition-colors">
            <input
              className="relative grow border-none bg-transparent text-plasma-text-primary text-sm outline-none placeholder:text-plasma-text-secondary"
              placeholder="Search players, games..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowSearchDropdown(true)}
            />
          </div>
          <div className="inline-flex flex-col items-start absolute top-3 left-4">
            <Search className="w-4 h-4 text-plasma-text-secondary" />
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-12 left-0 w-[400px] bg-plasma-slate border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-[100] overflow-hidden animate-fade-in">
              <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                {searchLoading ? (
                  <div className="p-6 text-center text-plasma-text-secondary text-xs">Searching...</div>
                ) : (searchResults.users.length === 0 && searchResults.games.length === 0) ? (
                  <div className="p-6 text-center text-plasma-text-secondary text-xs">No results found for "{searchQuery}"</div>
                ) : (
                  <>
                    {/* Users Section */}
                    {searchResults.users.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-2 text-[10px] font-black text-plasma-text-secondary uppercase tracking-widest">Players</div>
                        {searchResults.users.map(u => (
                          <Link 
                            key={u.id}
                            href={`/profile/${u.id}`}
                            onClick={() => setShowSearchDropdown(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group"
                          >
                            <img 
                              src={u.avatarURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} 
                              alt="" 
                              className="w-8 h-8 rounded-full bg-plasma-bg border border-white/10"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-plasma-text-primary truncate group-hover:text-plasma-primary transition-colors">{u.username}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Games Section */}
                    {searchResults.games.length > 0 && (
                      <div className="p-2 border-t border-white/5">
                        <div className="px-3 py-2 text-[10px] font-black text-plasma-text-secondary uppercase tracking-widest">Games</div>
                        {searchResults.games.map(g => (
                          <Link 
                            key={g.id}
                            href={`/library/${g.id}`}
                            onClick={() => setShowSearchDropdown(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group"
                          >
                            <div className="w-10 h-14 rounded-lg bg-plasma-bg border border-white/10 overflow-hidden flex-shrink-0">
                              {g.coverArtURL ? (
                                <img src={g.coverArtURL} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-plasma-text-secondary font-bold">GAME</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-plasma-text-primary truncate group-hover:text-plasma-primary transition-colors">{g.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-plasma-secondary bg-plasma-secondary/10 px-2 py-0.5 rounded-full">{g.platform}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="inline-flex items-center gap-6 relative flex-[0_0_auto]">
        <div className={`inline-flex items-center p-1 relative flex-[0_0_auto] bg-plasma-slate rounded-full gap-1 transition-opacity duration-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
          {statusModes.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`cursor-pointer justify-center px-4 py-1.5 rounded-full inline-flex items-center relative flex-[0_0_auto] transition-all ${
                  isActive ? `${mode.bg} ${mode.shadow}` : "hover:bg-white/5"
                }`}
                suppressHydrationWarning
              >
                <div
                  className={`font-display font-bold text-[11px] text-center tracking-[0.55px] leading-[16.5px] whitespace-nowrap ${
                    isActive ? "text-white" : "text-plasma-text-secondary"
                  }`}
                  suppressHydrationWarning
                >
                  {mode.label}
                </div>
              </button>
            );
          })}
        </div>
        <div className="inline-flex items-center gap-4 relative flex-[0_0_auto]">
          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative flex-col justify-center p-2 rounded-full inline-flex items-center flex-[0_0_auto] hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5 text-plasma-text-primary" />
              {unreadCount > 0 && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-plasma-secondary rounded-full border-2 border-solid border-plasma-bg flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{unreadCount}</span>
                </div>
              )}
            </button>

            {/* Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-12 w-[360px] bg-plasma-slate border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-[100] overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-plasma-text-primary">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold text-plasma-secondary bg-plasma-secondary/10 px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.some(n => !n.read) && (
                    <button 
                      onClick={markAllRead}
                      className="text-[10px] font-bold text-plasma-primary hover:text-plasma-secondary transition-colors cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Preview Items */}
                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                  {notifsLoading ? (
                    <div className="p-6 text-center text-plasma-text-secondary text-xs">Loading...</div>
                  ) : previewNotifs.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="w-8 h-8 mx-auto text-plasma-text-secondary/30 mb-2" strokeWidth={1} />
                      <p className="text-xs text-plasma-text-secondary">No notifications yet</p>
                    </div>
                  ) : (
                    previewNotifs.map((notif) => {
                      const Icon = notifIconMap[notif.type] || Bell;
                      const colorClass = notifColorMap[notif.type] || "bg-white/5 text-plasma-text-secondary";
                      return (
                        <div
                          key={notif.id}
                          onClick={() => markNotifRead(notif.id)}
                          className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5 cursor-pointer ${
                            !notif.read ? "bg-plasma-primary/5" : ""
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                            {notif.avatar ? (
                              <img src={notif.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
                            ) : (
                              <Icon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${notif.read ? "text-plasma-text-secondary" : "text-plasma-text-primary"}`}>
                              {notif.title}
                            </p>
                            <p className="text-[10px] text-plasma-text-secondary mt-0.5">{notif.time}</p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-plasma-secondary shrink-0 mt-1" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifDropdown(false)}
                  className="flex items-center justify-center py-3 border-t border-white/5 text-xs font-bold text-plasma-primary hover:bg-plasma-primary/5 transition-colors"
                >
                  See All Notifications
                </Link>
              </div>
            )}
          </div>

          {/* Avatar → Profile */}
          <div className={`relative transition-opacity duration-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`} ref={profileDropdownRef}>
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="inline-flex flex-col items-start relative flex-[0_0_auto] cursor-pointer"
            >
              <div 
                className="relative w-10 h-10 rounded-full border-2 border-solid bg-cover bg-center hover:opacity-80 transition-opacity" 
                style={{ 
                  backgroundImage: `url(${displayAvatar})`,
                  borderColor: activeMode === 'comp' ? '#e84118' : activeMode === 'chill' ? '#2ecc71' : '#94a3b8'
                }}
                suppressHydrationWarning
              />
              <div 
                className="absolute right-0 bottom-0 w-3 h-3 rounded-full border-2 border-solid border-plasma-bg" 
                style={{ 
                  backgroundColor: activeMode === 'comp' ? '#e84118' : activeMode === 'chill' ? '#2ecc71' : '#94a3b8'
                }}
              />
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 top-12 w-48 bg-plasma-slate border border-white/10 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-[100] overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-bold text-plasma-text-primary truncate">{displayName}</p>
                </div>
                <div className="p-1">
                  <Link 
                    href="/profile"
                    onClick={() => setShowProfileDropdown(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-plasma-text-secondary hover:text-plasma-text-primary hover:bg-white/5 rounded-lg transition-colors"
                  >
                    View Profile
                  </Link>
                  <Link 
                    href="/settings"
                    onClick={() => setShowProfileDropdown(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-plasma-text-secondary hover:text-plasma-text-primary hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Settings
                  </Link>
                </div>
                <div className="p-1 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setShowProfileDropdown(false);
                      logout();
                    }}
                    className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm text-plasma-error hover:bg-plasma-error/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
