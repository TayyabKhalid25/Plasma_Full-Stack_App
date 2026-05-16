"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { getTrending, getUpcomingRallies } from "@/services/api";

/**
 * RightRail Component
 * @component
 * @param {object} props
 */
export const RightRail = () => {
  const [trendingGames, setTrendingGames] = useState([]);
  const [upcomingRallies, setUpcomingRallies] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const data = await getTrending();
        setTrendingGames(data || []);
      } catch {}
    }
    async function fetchRallies() {
      try {
        const data = await getUpcomingRallies();
        setUpcomingRallies(data || []);
      } catch {}
    }
    async function fetchUser() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("plasma_token") : null;
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
        const res = await fetch(`${apiBase}/api/prestige/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) setUser(data.data);
      } catch (err) {
        console.error("Failed to fetch prestige summary:", err);
      }
    }
    setLoading(true);
    Promise.all([
      fetchTrending(),
      fetchRallies(),
      fetchUser(),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col w-[280px] h-[calc(100vh-64px)] items-start gap-6 px-6 py-8 fixed top-16 right-0 overflow-y-auto custom-scrollbar bg-transparent">
      {/* Trending */}
      <div className="flex flex-col items-start gap-4 p-4 relative self-stretch w-full bg-plasma-slate rounded-xl border border-white/5 shadow-lg">
        <div className="font-display font-bold text-plasma-text-secondary text-xs tracking-[1.80px]">
          TRENDING IN SQUAD
        </div>
        <div className="flex flex-col items-start gap-4 relative self-stretch w-full">
          {loading ? (
            <span className="text-xs text-plasma-text-secondary">Loading...</span>
          ) : trendingGames.length > 0 ? (
            trendingGames.map((game) => (
              <div key={game.appID || game.name} className="flex items-center justify-between w-full gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="flex w-8 h-8 items-center justify-center rounded-xl shrink-0"
                    style={{ backgroundColor: game.bgColor || '#563895' }}
                  >
                    <span className="font-sans font-bold text-white text-[10px]">{game.initials || (game.title ? game.title.slice(0,2).toUpperCase() : "")}</span>
                  </div>
                  <span className="font-sans font-semibold text-plasma-text-primary text-xs truncate">{game.title || game.name}</span>
                </div>
                <div className="px-2 py-0.5 bg-plasma-slate-hover rounded-2xl shrink-0">
                  <span className="font-sans font-bold text-plasma-secondary text-[10px]">{game.currentlyPlayingCount || game.count}</span>
                </div>
              </div>
            ))
          ) : (
            <span className="text-[10px] font-bold text-plasma-text-secondary uppercase tracking-widest opacity-40 py-2">
              Everyone is offline
            </span>
          )}
        </div>
      </div>

      {/* Rallies */}
      <div className="flex flex-col items-start gap-4 p-4 relative self-stretch w-full bg-plasma-slate rounded-xl border border-white/5 shadow-lg">
        <div className="font-display font-bold text-plasma-text-secondary text-xs tracking-[1.80px]">
          UPCOMING RALLIES
        </div>
        <div className="flex flex-col items-start gap-4 relative self-stretch w-full">
          {loading ? (
            <span className="text-xs text-plasma-text-secondary">Loading...</span>
          ) : (
            upcomingRallies.map((rally) => (
              <Link 
                key={rally.id}
                href={`/rally/${rally.id}`}
                className="flex flex-col gap-1 pl-3 border-l-2 border-plasma-primary cursor-pointer hover:bg-white/5 rounded-lg transition-all w-full"
              >
                <span className="font-sans font-bold text-plasma-text-primary text-xs">{rally.title}</span>
                <span className="font-sans text-plasma-text-secondary text-[10px]">{rally.time}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Prestige */}
      <Link href="/prestige" className="flex flex-col items-start gap-4 p-4 relative self-stretch w-full bg-plasma-slate rounded-xl border border-white/5 overflow-hidden shadow-lg cursor-pointer hover:-translate-y-1 transition-transform">
        <div className="font-display font-bold text-plasma-text-secondary text-xs tracking-[1.80px] z-10">
          YOUR PRESTIGE
        </div>
        <div className="flex flex-col gap-2 w-full z-10">
          <div className="flex items-end justify-between">
            <div className="bg-primary-gradient bg-clip-text text-transparent font-mono font-bold text-xl">
              {loading || !user ? "..." : `${user.totalPlasmaXP || 0} XP`}
            </div>
            <div className="text-[10px] font-bold text-plasma-text-secondary uppercase mb-1">
              {loading || !user ? "" : `LEVEL ${user.level || 1}`}
            </div>
          </div>
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex-1 h-1 bg-plasma-slate-hover rounded-full overflow-hidden">
              <div 
                className="h-full bg-plasma-primary shadow-[0px_0px_8px_#563895] transition-all duration-1000" 
                style={{ width: `${loading || !user ? 0 : (user.progressPercentage || 0)}%` }}
              />
            </div>
            <div className="px-2 py-0.5 bg-plasma-primary rounded-full">
              <span className="font-sans font-bold text-white text-[10px]">RANK #{loading || !user ? "..." : (user.globalRank || "-")}</span>
            </div>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-plasma-secondary blur-[20px] opacity-10" />
      </Link>
    </div>
  );
};
