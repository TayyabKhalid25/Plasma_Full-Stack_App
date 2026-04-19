"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
  ArrowRight
} from "lucide-react";
import Link from "next/link";

const mockGames = [
  {
    id: "valorant",
    title: "Valorant",
    // TODO: REPLACE_IMAGE - Valorant game cover art
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    icon: Gamepad2,
    nowPlaying: false,
  },
  {
    id: "league-of-legends",
    title: "League of Legends",
    // TODO: REPLACE_IMAGE - League of Legends game cover art
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165&auto=format&fit=crop",
    icon: Diamond,
    nowPlaying: true,
  },
  {
    id: "fortnite",
    title: "Fortnite",
    // TODO: REPLACE_IMAGE - Fortnite game cover art
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop",
    icon: Cloud,
    nowPlaying: false,
  },
  {
    id: "apex-legends",
    title: "Apex Legends",
    // TODO: REPLACE_IMAGE - Apex Legends game cover art
    image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=2119&auto=format&fit=crop",
    icon: Zap,
    nowPlaying: false,
  },
  {
    id: "overwatch-2",
    title: "Overwatch 2",
    // TODO: REPLACE_IMAGE - Overwatch 2 game cover art
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    icon: Shield,
    nowPlaying: false,
  },
  {
    id: "genshin-impact",
    title: "Genshin Impact",
    // TODO: REPLACE_IMAGE - Genshin Impact game cover art
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165&auto=format&fit=crop",
    icon: Sparkles,
    nowPlaying: false,
  },
  {
    id: "palworld",
    title: "Palworld",
    // TODO: REPLACE_IMAGE - Palworld game cover art
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop",
    icon: Dog,
    nowPlaying: false,
  },
  {
    id: "helldivers-2",
    title: "Helldivers 2",
    // TODO: REPLACE_IMAGE - Helldivers 2 game cover art
    image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=2119&auto=format&fit=crop",
    icon: Star,
    nowPlaying: false,
  },
  {
    id: "elden-ring",
    title: "Elden Ring",
    // TODO: REPLACE_IMAGE - Elden Ring game cover art
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    icon: Castle,
    nowPlaying: false,
  },
  {
    id: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    // TODO: REPLACE_IMAGE - Cyberpunk 2077 game cover art
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165&auto=format&fit=crop",
    icon: Cpu,
    nowPlaying: false,
  },
];

const filters = [
  { id: "all", label: "All" },
  { id: "playing", label: "Currently Playing" },
  { id: "steam", label: "Steam" },
  { id: "non-steam", label: "Non-Steam" },
  { id: "playstation", label: "PlayStation" },
  { id: "xbox", label: "Xbox" },
];

export default function Library() {
  // Toggle this state to view the empty state or populated state
  const [games, setGames] = useState(mockGames);
  const [activeFilter, setActiveFilter] = useState("all");

  const isEmpty = games.length === 0;

  return (
    <DashboardLayout showRightRail={false}>
      <div className="flex flex-col items-center pt-8 pb-20 px-10 min-h-screen">
        <div className="w-full max-w-[960px]">
          
          {/* Library Header */}
          <div className="mb-10 text-center md:text-left">
            <div className="flex items-center justify-between">
              <h1 className="font-display font-bold text-[32px] text-plasma-text-primary">
                The Omni-Library
              </h1>
              {/* DEV TOGGLE FOR TESTING - REMOVE IN PROD */}
              <button 
                onClick={() => setGames(isEmpty ? mockGames : [])}
                className="px-4 py-2 bg-plasma-slate-hover text-plasma-text-secondary text-xs rounded-full hover:text-white transition-colors"
              >
                Toggle Empty State
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-8 flex justify-center md:justify-start">
              <div className="relative w-full max-w-[600px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-plasma-text-secondary group-focus-within:text-plasma-primary transition-colors" />
                <input 
                  className="w-full bg-plasma-slate-hover border-none rounded-lg py-[14px] pl-12 pr-4 text-plasma-text-primary placeholder:text-plasma-text-secondary focus:ring-1 focus:ring-plasma-primary transition-all outline-none" 
                  placeholder="Search any game..." 
                  type="text"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className={`mt-6 flex gap-3 overflow-x-auto hide-scrollbar pb-2 ${isEmpty ? "opacity-50 cursor-not-allowed" : ""}`}>
              {filters.map((filter) => {
                const isActive = activeFilter === filter.id && !isEmpty;
                return (
                  <button
                    key={filter.id}
                    onClick={() => !isEmpty && setActiveFilter(filter.id)}
                    className={`px-6 py-2 rounded-full font-sans font-medium text-sm whitespace-nowrap transition-all ${
                      isActive 
                        ? "bg-plasma-primary text-white" 
                        : "bg-plasma-slate-hover text-plasma-text-secondary hover:text-plasma-text-primary"
                    } ${isEmpty ? "pointer-events-none" : ""}`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isEmpty ? (
            /* Empty State Content Area */
            <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
              <div className="mb-6 flex items-center justify-center text-plasma-slate-hover">
                <Gamepad2 className="w-32 h-32" strokeWidth={1} />
              </div>
              <h3 className="font-display font-semibold text-2xl text-plasma-text-primary mb-2">
                Your shelf is empty
              </h3>
              <p className="font-sans font-normal text-[15px] text-plasma-text-secondary max-w-[320px] mx-auto mb-8">
                Search for a game above to start building your collection.
              </p>
              <button className="px-10 py-3 rounded-full bg-primary-gradient text-white font-sans font-bold text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(255,42,122,0.3)] hover:shadow-[0_0_30px_rgba(255,42,122,0.5)] transition-all cursor-pointer">
                Search Games
              </button>
            </div>
          ) : (
            /* Populated State */
            <div className="animate-fade-in">
              {/* Stats Bar */}
              <div className="mb-6 flex items-center gap-2 text-plasma-text-secondary font-sans font-normal text-[13px]">
                <span>{games.length} Games</span>
                <span className="w-1 h-1 rounded-full bg-plasma-text-secondary/30"></span>
                <span>12 Steam</span>
                <span className="w-1 h-1 rounded-full bg-plasma-text-secondary/30"></span>
                <span>8 Non-Steam</span>
                <span className="w-1 h-1 rounded-full bg-plasma-text-secondary/30"></span>
                <span>{games.filter(g => g.nowPlaying).length} Currently Playing</span>
              </div>

              {/* Game Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {games.map((game) => {
                  const Icon = game.icon;
                  return (
                    <Link 
                      href={`/library/${game.id}`} 
                      key={game.id}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 ${
                        game.nowPlaying 
                          ? "border-2 border-plasma-secondary shadow-[0_0_20px_rgba(255,42,122,0.3)]" 
                          : "hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(86,56,149,0.25)] hover:z-10"
                      }`}
                    >
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${game.image})` }}
                      />
                      
                      {game.nowPlaying && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-plasma-secondary text-white text-[10px] font-bold rounded-md z-20">
                          NOW PLAYING
                        </div>
                      )}

                      {/* Hover Overlay (Simulated for all cards for reusability) */}
                      {!game.nowPlaying && (
                        <div className="absolute inset-0 bg-plasma-bg/70 backdrop-blur-[4px] flex flex-col items-center justify-center gap-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <div className="flex items-center justify-between w-full px-2">
                            <span className="text-[12px] font-medium text-plasma-text-primary">Set Playing</span>
                            <div className="w-8 h-4 bg-plasma-primary rounded-full relative">
                              <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <div className="text-[13px] font-bold text-plasma-text-primary hover:text-plasma-secondary transition-colors flex items-center gap-1">
                            View Details <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}

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
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
