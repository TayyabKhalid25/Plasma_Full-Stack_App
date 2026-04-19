"use client";

import { use } from "react";
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowLeft, Clock, Trophy, Users, Play, Calendar } from "lucide-react";
import Link from "next/link";
import { games } from "@/data/dummy";

export default function GameDetailPage({ params }) {
  const { id } = use(params);
  const game = games.find((g) => g.id === id);
  const [isPlaying, setIsPlaying] = useState(game?.nowPlaying || false);

  if (!game) {
    return (
      <DashboardLayout showRightRail={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="font-display font-bold text-2xl text-plasma-text-primary mb-2">Game Not Found</h2>
          <p className="text-plasma-text-secondary text-sm mb-6">This game isn&apos;t in your library.</p>
          <Link href="/library" className="px-6 py-2 rounded-full bg-primary-gradient text-white font-bold text-sm hover:scale-[1.02] transition-transform">
            Back to Library
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const friendsPlaying = [
    { name: "Ahmed", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed", status: "In Match" },
    { name: "Sarah", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", status: "Menu" },
  ];

  const achievements = [
    { title: "First Win", unlocked: true, xp: "25 XP" },
    { title: "10 Kill Streak", unlocked: true, xp: "50 XP" },
    { title: "Ranked Master", unlocked: true, xp: "100 XP" },
    { title: "Complete All Challenges", unlocked: false, xp: "200 XP" },
    { title: "Speed Runner", unlocked: false, xp: "150 XP" },
  ];

  return (
    <DashboardLayout showRightRail={false}>
      <div className="max-w-4xl mx-auto px-8 py-8 pb-20 animate-fade-in">
        {/* Back link */}
        <Link href="/library" className="inline-flex items-center gap-2 text-sm text-plasma-text-secondary hover:text-plasma-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>

        {/* Hero Banner */}
        <div className="relative w-full h-[280px] rounded-2xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${game.image})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-plasma-bg via-plasma-bg/60 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between">
            <div>
              <h1 className="font-display font-bold text-4xl text-plasma-text-primary mb-1">{game.title}</h1>
              <p className="text-sm text-plasma-text-secondary">{game.description}</p>
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all cursor-pointer shrink-0 ${
                isPlaying
                  ? "bg-plasma-secondary text-white shadow-[0_0_20px_rgba(255,42,122,0.3)]"
                  : "bg-primary-gradient text-white hover:shadow-card-glow hover:scale-[1.02]"
              }`}
            >
              <Play className={`w-4 h-4 ${isPlaying ? "fill-white" : ""}`} />
              {isPlaying ? "NOW PLAYING" : "Set Playing"}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Hours Played", value: game.hoursPlayed, icon: Clock },
            { label: "Achievements", value: `${achievements.filter((a) => a.unlocked).length}/${achievements.length}`, icon: Trophy },
            { label: "Friends Playing", value: friendsPlaying.length, icon: Users },
            { label: "Last Played", value: isPlaying ? "Now" : game.lastPlayed, icon: Calendar },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-plasma-slate rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-plasma-text-secondary" />
                  <span className="text-[11px] font-bold text-plasma-text-secondary uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-xl font-display font-bold text-plasma-text-primary">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Achievements */}
          <div className="lg:col-span-2">
            <h2 className="font-display font-bold text-lg text-plasma-text-primary mb-4">Achievements</h2>
            <div className="space-y-2">
              {achievements.map((ach, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    ach.unlocked
                      ? "bg-plasma-slate border-white/5"
                      : "bg-plasma-slate/40 border-transparent opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ach.unlocked ? "bg-plasma-primary/15" : "bg-white/5"}`}>
                      <Trophy className={`w-4 h-4 ${ach.unlocked ? "text-plasma-primary" : "text-plasma-text-secondary"}`} />
                    </div>
                    <span className={`text-sm font-medium ${ach.unlocked ? "text-plasma-text-primary" : "text-plasma-text-secondary"}`}>
                      {ach.title}
                    </span>
                  </div>
                  <span className={`text-xs font-mono ${ach.unlocked ? "text-plasma-primary" : "text-plasma-text-secondary"}`}>
                    {ach.xp}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Friends Playing */}
          <div>
            <h2 className="font-display font-bold text-lg text-plasma-text-primary mb-4">Friends Playing</h2>
            <div className="bg-plasma-slate rounded-xl border border-white/5 p-4">
              {friendsPlaying.length > 0 ? (
                <div className="space-y-3">
                  {friendsPlaying.map((friend) => (
                    <div key={friend.name} className="flex items-center gap-3">
                      <div className="relative">
                        <img src={friend.avatar} alt={friend.name} className="w-9 h-9 rounded-full bg-plasma-slate" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-plasma-success rounded-full border-2 border-plasma-slate" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-plasma-text-primary">{friend.name}</p>
                        <p className="text-[11px] text-plasma-success">{friend.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-plasma-text-secondary text-center py-4">No friends playing right now</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
