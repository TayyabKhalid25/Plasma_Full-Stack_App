"use client";

import { useState, useEffect } from "react";
import { X, Search, UserPlus, Check, XCircle, MoreVertical, Loader2, Users } from "lucide-react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { getAvatarUrl } from "@/lib/utils";
import Link from "next/link";

export function FriendManagementDrawer({ isOpen, onClose }) {
  const { token } = useAuth();
  const [friends, setFriends] = useState({ requests: [], online: [], offline: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [activeDropdown, setActiveDropdown] = useState(null); // track which user's dropdown is open

  const fetchFriends = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setFriends(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchFriends();
    }
  }, [isOpen, token]);

  // Search users
  useEffect(() => {
    if (!searchQuery || !token) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setSearchResults(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  const sendRequest = async (userId) => {
    setActionLoading(userId);
    try {
      await fetch(`${API_BASE}/api/friends/request/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      setSentRequests(prev => new Set(prev).add(userId));
      fetchFriends();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const acceptRequest = async (userId) => {
    setActionLoading(userId);
    try {
      await fetch(`${API_BASE}/api/friends/request/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFriends();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const removeFriend = async (userId) => {
    setActionLoading(userId);
    try {
      await fetch(`${API_BASE}/api/friends/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFriends();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  const allFriends = [...(friends.online || []), ...(friends.offline || [])];
  const requestCount = friends.requests?.length || 0;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-plasma-bg border-l border-white/10 shadow-2xl animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-plasma-slate">
          <div>
            <h2 className="font-display font-bold text-xl text-plasma-text-primary">Friend Management</h2>
            <p className="text-plasma-text-secondary text-xs">Manage your squad and requests</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-plasma-text-secondary hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 pb-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-plasma-text-secondary" />
            <input 
              id="friendSearchInput"
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Username..."
              className="w-full bg-plasma-slate border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-plasma-text-primary placeholder:text-plasma-text-secondary focus:border-plasma-primary outline-none transition-colors"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchQuery && (
            <div className="mt-2 bg-plasma-slate border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
              {searching ? (
                <div className="p-4 text-center text-plasma-text-secondary text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div key={user.plasmaUserID} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <Link 
                      href={`/profile/${user.plasmaUserID}`}
                      onClick={onClose}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <img src={getAvatarUrl(user.avatarURL, user.username)} alt="" className="w-8 h-8 rounded-full" />
                      <span className="text-sm font-bold text-white">{user.username}</span>
                    </Link>
                    {user.isMutual ? (
                      <span className="text-[10px] font-bold text-plasma-success bg-plasma-success/10 px-3 py-1.5 rounded-lg">Friends</span>
                    ) : (
                      <button 
                        onClick={() => sendRequest(user.plasmaUserID)}
                        disabled={actionLoading === user.plasmaUserID || sentRequests.has(user.plasmaUserID) || user.isRequested}
                        className="text-[10px] font-bold bg-plasma-primary/20 text-plasma-primary px-3 py-1.5 rounded-lg hover:bg-plasma-primary hover:text-white transition-all disabled:opacity-50"
                      >
                        {actionLoading === user.plasmaUserID ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                         (sentRequests.has(user.plasmaUserID) || user.isRequested) ? "Sent!" : "Add"}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-plasma-text-secondary text-sm">No users found</div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-6 border-b border-white/5 mt-4">
          <button 
            onClick={() => setActiveTab("all")}
            className={`pb-2 border-b-2 text-sm font-semibold transition-colors ${activeTab === "all" ? "border-plasma-primary text-plasma-text-primary" : "border-transparent text-plasma-text-secondary hover:text-white"}`}
          >
            All Friends
          </button>
          <button 
            onClick={() => setActiveTab("requests")}
            className={`pb-2 border-b-2 text-sm font-semibold transition-colors flex items-center gap-1 ${activeTab === "requests" ? "border-plasma-primary text-plasma-text-primary" : "border-transparent text-plasma-text-secondary hover:text-white"}`}
          >
            Requests {requestCount > 0 && <span className="bg-plasma-error text-white text-[9px] px-1.5 py-0.5 rounded-full">{requestCount}</span>}
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-plasma-slate-hover" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-24 h-3 rounded bg-plasma-slate-hover" />
                    <div className="w-16 h-2 rounded bg-plasma-slate-hover" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Requests Tab */}
              {activeTab === "requests" && (
                <div>
                  <h3 className="text-xs font-bold text-plasma-text-secondary tracking-widest uppercase mb-4">Pending Requests</h3>
                  {requestCount === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 mx-auto text-plasma-text-secondary/30 mb-2" />
                      <p className="text-sm text-plasma-text-secondary">No pending requests</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {friends.requests.map((req) => (
                        <div key={req.id} className="flex items-center justify-between bg-plasma-slate/50 p-3 rounded-lg border border-white/5">
                          <Link 
                            href={`/profile/${req.id}`}
                            onClick={onClose}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                          >
                            <img src={getAvatarUrl(req.avatar, req.name)} alt="" className="w-10 h-10 rounded-full border border-white/10" />
                            <div>
                              <p className="text-sm font-bold text-white">{req.name}</p>
                              <p className={`text-[11px] font-bold ${req.intent === 'COMPETITIVE' || req.intent === 'COMP' ? 'text-plasma-secondary' : 'text-plasma-success'}`}>
                                {req.playingGame ? `Playing: ${req.playingGame}` : req.intent || "Unknown"}
                              </p>
                            </div>
                          </Link>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => acceptRequest(req.id)}
                              disabled={actionLoading === req.id}
                              className="p-1.5 bg-plasma-success/20 text-plasma-success rounded-lg hover:bg-plasma-success hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => removeFriend(req.id)}
                              className="p-1.5 bg-plasma-error/20 text-plasma-error rounded-lg hover:bg-plasma-error hover:text-white transition-colors cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* All Friends Tab */}
              {activeTab === "all" && (
                <>
                  {allFriends.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto text-plasma-text-secondary/30 mb-3" />
                      <p className="text-sm text-plasma-text-secondary mb-1">No friends yet</p>
                      <p className="text-xs text-plasma-text-secondary">Search for users above to add them to your squad.</p>
                    </div>
                  ) : (
                    <>
                      {friends.online?.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-plasma-text-secondary tracking-widest uppercase mb-4">Online ({friends.online.length})</h3>
                          <div className="space-y-1">
                            {friends.online.map((friend) => (
                              <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-plasma-slate rounded-lg group transition-colors cursor-pointer">
                                <Link 
                                  href={`/profile/${friend.id}`}
                                  onClick={onClose}
                                  className="flex items-center gap-3 relative hover:opacity-80 transition-opacity"
                                >
                                  <img src={getAvatarUrl(friend.avatar, friend.name)} alt="" className="w-8 h-8 rounded-full bg-plasma-slate" />
                                  <div className="absolute left-5 bottom-0 w-2.5 h-2.5 bg-plasma-success rounded-full border-2 border-plasma-bg" />
                                  <div>
                                    <p className="text-sm font-medium text-white">{friend.name}</p>
                                    <p className={`text-[10px] font-bold ${friend.intent === 'COMPETITIVE' || friend.intent === 'COMP' ? 'text-plasma-secondary' : 'text-plasma-success'}`}>
                                      {friend.playingGame ? `Playing: ${friend.playingGame}` : (friend.intent === "COMPETITIVE" ? "Competitive" : "Chill")}
                                    </p>
                                  </div>
                                </Link>
                                <div className="relative">
                                  <button 
                                    onClick={() => setActiveDropdown(activeDropdown === friend.id ? null : friend.id)}
                                    className="p-2 text-plasma-text-secondary opacity-0 group-hover:opacity-100 hover:text-white transition-all cursor-pointer rounded-lg hover:bg-white/5"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  {activeDropdown === friend.id && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                                      <div className="absolute right-0 top-full mt-1 w-40 bg-plasma-slate border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                                        <button 
                                          onClick={() => { removeFriend(friend.id); setActiveDropdown(null); }}
                                          className="w-full text-left px-4 py-2 text-sm text-plasma-error hover:bg-white/5 transition-colors cursor-pointer"
                                        >
                                          Remove Friend
                                        </button>
                                        <button 
                                          onClick={() => { alert("Block user not implemented yet"); setActiveDropdown(null); }}
                                          className="w-full text-left px-4 py-2 text-sm text-plasma-text-secondary hover:bg-white/5 transition-colors cursor-pointer"
                                        >
                                          Block User
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {friends.offline?.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-plasma-text-secondary tracking-widest uppercase mb-4">Offline ({friends.offline.length})</h3>
                          <div className="space-y-1 opacity-60">
                            {friends.offline.map((friend) => (
                              <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-plasma-slate rounded-lg group transition-colors cursor-pointer">
                                <Link 
                                  href={`/profile/${friend.id}`}
                                  onClick={onClose}
                                  className="flex items-center gap-3 relative hover:opacity-80 transition-opacity"
                                >
                                  <img src={getAvatarUrl(friend.avatar, friend.name)} alt="" className="w-8 h-8 rounded-full bg-plasma-slate grayscale" />
                                  <div className="absolute left-5 bottom-0 w-2.5 h-2.5 bg-plasma-text-secondary rounded-full border-2 border-plasma-bg" />
                                  <div>
                                    <p className="text-sm font-medium text-white">{friend.name}</p>
                                    <p className="text-[10px] text-plasma-text-secondary">Offline</p>
                                  </div>
                                </Link>
                                <div className="relative">
                                  <button 
                                    onClick={() => setActiveDropdown(activeDropdown === friend.id ? null : friend.id)}
                                    className="p-2 text-plasma-text-secondary opacity-0 group-hover:opacity-100 hover:text-white transition-all cursor-pointer rounded-lg hover:bg-white/5"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  {activeDropdown === friend.id && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                                      <div className="absolute right-0 top-full mt-1 w-40 bg-plasma-slate border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                                        <button 
                                          onClick={() => { removeFriend(friend.id); setActiveDropdown(null); }}
                                          className="w-full text-left px-4 py-2 text-sm text-plasma-error hover:bg-white/5 transition-colors cursor-pointer"
                                        >
                                          Remove Friend
                                        </button>
                                        <button 
                                          onClick={() => { alert("Block user not implemented yet"); setActiveDropdown(null); }}
                                          className="w-full text-left px-4 py-2 text-sm text-plasma-text-secondary hover:bg-white/5 transition-colors cursor-pointer"
                                        >
                                          Block User
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
