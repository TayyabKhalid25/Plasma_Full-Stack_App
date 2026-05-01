"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { 
  Search, 
  Gamepad2, 
  Diamond, 
  Cloud, 
  Zap, 
  Shield, 
  Sparkles, 
  Dog, 
  Star, 
  Castle, 
  Cpu,
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { gameFilters } from "@/data/dummy";
import { useModal } from "@/hooks/useModal";
import { SearchIGDBGameModal } from "@/components/modals/SearchIGDBGameModal";

const iconMap = { Gamepad2, Diamond, Cloud, Zap, Shield, Sparkles, Dog, Star, Castle, Cpu };

// --- Skeleton Card ---
function GameCardSkeleton() {
  return (
    <div className="relative aspect-[2/3] rounded-xl overflow-hidden animate-pulse bg-plasma-slate-hover">
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-plasma-slate/80 backdrop-blur-[8px] flex items-center justify-between">
        <div className="w-3/4 h-3 bg-plasma-slate rounded" />
        <div className="w-4 h-4 bg-plasma-slate rounded" />
      </div>
    </div>
  );
}

export default function Library() {
  const [games, setGames] = useState([]);
  const [igdbResults, setIgdbResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);
  const { token } = useAuth();
  const addGameModal = useModal();
  
  // Show toast with auto-dismiss
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch local library
  const fetchLibrary = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/games?filter=${activeFilter}&q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const mapped = data.data.map(g => ({
          id: g.appID,
          title: g.title,
          image: getHighResImage(g.appID, g.coverArtURL, g.platform),
          nowPlaying: g.isCurrentlyPlaying || false,
          platform: g.platform?.toLowerCase() || "non-steam",
          iconName: g.platform === "STEAM" ? "Cloud" : "Gamepad2"
        }));
        setGames(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Prefer Steam's high-res vertical capsule over the tiny icon
  function getHighResImage(appID, fallbackURL, platform) {
    if (platform === "STEAM" && appID && !appID.startsWith("custom_") && !appID.startsWith("igdb_")) {
      return `https://steamcdn-a.akamaihd.net/steam/apps/${appID}/library_600x900.jpg`;
    }
    return fallbackURL || null;
  }

  useEffect(() => {
    fetchLibrary();
  }, [token, activeFilter, searchQuery]);

  // Search IGDB when query is present
  useEffect(() => {
    if (!searchQuery || !token) {
      setIgdbResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/library/igdb/search?q=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setIgdbResults(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  const togglePlaying = async (gameId, e, currentPlaying) => {
    e.preventDefault();
    e.stopPropagation();
    setGames((prev) => prev.map((g) => (g.id === gameId ? { ...g, nowPlaying: !currentPlaying } : g)));
    try {
      await fetch(`${API_BASE}/api/library/${gameId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isCurrentlyPlaying: !currentPlaying })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const addToLibrary = async (igdbGame) => {
    try {
      const res = await fetch(`${API_BASE}/api/library/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          gameId: igdbGame.id,
          title: igdbGame.title,
          coverArtURL: igdbGame.coverArtURL,
          playStatus: "WANT_TO_PLAY"
        })
      });
      if (res.ok) {
        setSearchQuery("");
        fetchLibrary();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const syncSteam = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/api/library/sync/steam`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Synced ${data.syncedGames} games successfully!`, "success");
        fetchLibrary();
      } else {
        showToast(data.message || "Sync failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error during sync", "error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <DashboardLayout showRightRail={false}>
      <div className="flex flex-col items-center pt-8 pb-20 px-10 min-h-screen">
        <div className="w-full max-w-[960px]">
          
          {/* Toast Notification */}
          {toast && (
            <div className={`fixed top-20 right-6 z-[200] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in transition-all ${
              toast.type === "success" 
                ? "bg-plasma-success/20 border border-plasma-success/30 text-plasma-success" 
                : "bg-plasma-error/20 border border-plasma-error/30 text-plasma-error"
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {toast.message}
            </div>
          )}

          {/* Library Header */}
          <div className="mb-10 text-center md:text-left">
            <div className="flex items-center justify-between">
              <h1 className="font-display font-bold text-[32px] text-plasma-text-primary">
                The Omni-Library
              </h1>
              <button 
                onClick={syncSteam}
                disabled={syncing}
                className="px-4 py-2 bg-primary-gradient text-white font-bold text-xs rounded-full shadow-card-glow hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  "Sync Steam Library"
                )}
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-8 flex justify-center md:justify-start">
              <div className="relative w-full max-w-[600px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-plasma-text-secondary group-focus-within:text-plasma-primary transition-colors" />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-plasma-slate-hover border-none rounded-lg py-[14px] pl-12 pr-4 text-plasma-text-primary placeholder:text-plasma-text-secondary focus:ring-1 focus:ring-plasma-primary transition-all outline-none" 
                  placeholder="Search any game..." 
                  type="text"
                />
                {igdbResults.length > 0 && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-plasma-bg border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
                    {igdbResults.map(res => (
                      <div key={res.id} onClick={() => addToLibrary(res)} className="flex items-center gap-3 p-3 hover:bg-plasma-slate-hover cursor-pointer transition-colors border-b border-white/5 last:border-b-0">
                        {res.coverArtURL ? (
                          <img src={res.coverArtURL} alt="" className="w-8 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-10 rounded bg-white/5 flex items-center justify-center"><Gamepad2 className="w-4 h-4 text-plasma-text-secondary" /></div>
                        )}
                        <span className="text-sm font-semibold text-plasma-text-primary">{res.title}</span>
                        <span className="text-[10px] ml-auto bg-plasma-primary/20 text-plasma-primary px-2 py-1 rounded">Add</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filter Pills */}
            <div className={`mt-6 flex gap-3 overflow-x-auto hide-scrollbar pb-2 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
              {gameFilters.map((filter) => {
                const isActive = activeFilter === filter.id && !loading;
                return (
                  <button
                    key={filter.id}
                    onClick={() => !loading && setActiveFilter(filter.id)}
                    className={`px-6 py-2 rounded-full font-sans font-medium text-sm whitespace-nowrap transition-all ${
                      isActive 
                        ? "bg-plasma-primary text-white" 
                        : "bg-plasma-slate-hover text-plasma-text-secondary hover:text-plasma-text-primary"
                    } ${loading ? "pointer-events-none" : ""}`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skeleton Loading State */}
          {loading ? (
            <div className="animate-fade-in">
              <div className="mb-6 flex items-center gap-2">
                <div className="w-20 h-3 rounded bg-plasma-slate-hover animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-plasma-slate-hover" />
                <div className="w-16 h-3 rounded bg-plasma-slate-hover animate-pulse" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <GameCardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : games.length === 0 ? (
            /* Empty State Content Area */
            <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
              <div className="mb-6 flex items-center justify-center text-plasma-slate-hover">
                <Gamepad2 className="w-32 h-32" strokeWidth={1} />
              </div>
              <h3 className="font-display font-semibold text-2xl text-plasma-text-primary mb-2">
                Your shelf is empty
              </h3>
              <p className="font-sans font-normal text-[15px] text-plasma-text-secondary max-w-[320px] mx-auto mb-8">
                Search for a game above or sync your Steam library to start building your collection.
              </p>
              <button 
                onClick={syncSteam}
                disabled={syncing}
                className="px-10 py-3 rounded-full bg-primary-gradient text-white font-sans font-bold text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(255,42,122,0.3)] hover:shadow-[0_0_30px_rgba(255,42,122,0.5)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-70"
              >
                {syncing && <Loader2 className="w-4 h-4 animate-spin" />}
                {syncing ? "Syncing..." : "Sync Steam Library"}
              </button>
            </div>
          ) : (
            /* Populated State */
            <div className="animate-fade-in">
              {/* Stats Bar */}
              <div className="mb-6 flex items-center gap-2 text-plasma-text-secondary font-sans font-normal text-[13px]">
                <span>{games.length} Games</span>
                <span className="w-1 h-1 rounded-full bg-plasma-text-secondary/30"></span>
                <span>{games.filter(g => g.platform === "steam").length} Steam</span>
                <span className="w-1 h-1 rounded-full bg-plasma-text-secondary/30"></span>
                <span>{games.filter(g => g.platform !== "steam").length} Non-Steam</span>
                <span className="w-1 h-1 rounded-full bg-plasma-text-secondary/30"></span>
                <span>{games.filter(g => g.nowPlaying).length} Currently Playing</span>
                <span className="w-1 h-1 rounded-full bg-plasma-text-secondary/30"></span>
                <button onClick={() => addGameModal.open()} className="text-plasma-primary hover:text-plasma-secondary transition-colors font-bold ml-auto cursor-pointer flex items-center gap-1">
                  + Add Game
                </button>
              </div>

              {/* Game Grid */}
              {games.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {games.map((game) => {
                    const Icon = iconMap[game.iconName] || Gamepad2;
                    return (
                      <Link 
                        href={`/library/${game.id}`} 
                        key={game.id}
                        className={`relative aspect-[2/3] rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 ${
                          game.nowPlaying 
                            ? "border-2 border-plasma-secondary shadow-[0_0_20px_rgba(255,42,122,0.3)]" 
                            : "hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(86,56,149,0.25)] hover:z-10"
                        }`}
                      >
                        {game.image ? (
                          <div 
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${game.image})` }}
                          />
                        ) : (
                          <div className="w-full h-full bg-plasma-slate flex items-center justify-center">
                            <Gamepad2 className="w-12 h-12 text-plasma-text-secondary/30" />
                          </div>
                        )}
                        
                        {game.nowPlaying && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-plasma-secondary text-white text-[10px] font-bold rounded-md z-20">
                            NOW PLAYING
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-plasma-bg/70 backdrop-blur-[4px] flex flex-col items-center justify-center gap-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            onClick={(e) => togglePlaying(game.id, e, game.nowPlaying)}
                            className="flex items-center justify-between w-full px-2"
                          >
                            <span className="text-[12px] font-medium text-plasma-text-primary">Set Playing</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${game.nowPlaying ? "bg-plasma-secondary" : "bg-plasma-primary"}`}>
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${game.nowPlaying ? "right-0.5" : "left-0.5"}`}></div>
                            </div>
                          </button>

                          <div className="text-[13px] font-bold text-plasma-text-primary hover:text-plasma-secondary transition-colors flex items-center gap-1 mt-2">
                            View Details <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Bottom Label Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-plasma-slate/80 backdrop-blur-[8px] flex items-center justify-between z-20">
                          <span className="font-sans font-semibold text-[13px] text-plasma-text-primary truncate pr-2">
                            {game.title}
                          </span>
                          <Icon className="w-4 h-4 text-plasma-text-secondary shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-plasma-text-secondary text-sm">No games match your search or filter.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <SearchIGDBGameModal 
        isOpen={addGameModal.isOpen} 
        onClose={addGameModal.close}
        onAddGame={(game) => {
          setGames(prev => [...prev, { ...game, nowPlaying: false, iconName: "Gamepad2" }]);
        }}
      />
    </DashboardLayout>
  );
}
