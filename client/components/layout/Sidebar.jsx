"use client";

import { Activity, Calendar, Library, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { getIntentStyle } from "@/lib/intentStyles";
import { getAvatarUrl } from "@/lib/utils";

const navItems = [
  { id: "/pulse", label: "PULSE", icon: Activity },
  { id: "/rally", label: "RALLY", icon: Calendar },
  { id: "/library", label: "OMNI LIBRARY", icon: Library },
  { id: "/prestige", label: "PRESTIGE", icon: Trophy },
];

export const Sidebar = ({ onOpenDrawer }) => {
  const pathname = usePathname();
  const { token } = useAuth();
  const [friends, setFriends] = useState({ online: [], offline: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchFriends = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setFriends(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch friends:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [token]);

  const onlineSquad = friends.online || [];
  const offlineSquad = friends.offline || [];
  const isEmpty = onlineSquad.length === 0 && !loading;

  return (
    <div className="flex flex-col w-64 h-[calc(100vh-64px)] items-start px-0 py-6 fixed top-16 left-0 bg-plasma-slate border-r border-white/5 shadow-[20px_0px_40px_rgba(13,11,20,0.5)] overflow-y-auto z-40 custom-scrollbar">
      <div className="flex flex-col items-start gap-1 relative flex-1 self-stretch w-full grow">
        {navItems.map((item) => {
          const isActive = pathname === item.id || pathname?.startsWith(`${item.id}/`);
          const IconComponent = item.icon;
          return (
            <Link
              key={item.id}
              href={item.id}
              className={`flex items-center gap-4 px-6 py-3 relative self-stretch w-full text-left transition-colors ${
                isActive
                  ? "border-l-4 border-plasma-primary bg-gradient-to-r from-plasma-primary/20 to-transparent"
                  : "border-l-4 border-transparent hover:bg-white/5"
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? "text-plasma-text-primary" : "text-plasma-text-secondary"}`} />
              <div
                className={`font-display font-bold text-sm tracking-[1.40px] leading-5 whitespace-nowrap ${
                  isActive ? "text-plasma-text-primary" : "text-plasma-text-secondary"
                }`}
              >
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="h-[49px] p-6 self-stretch w-full flex flex-col items-start relative">
        <div className="relative self-stretch w-full h-px bg-plasma-slate-hover" />
      </div>
      <div className="pt-0 pb-4 px-0 self-stretch w-full flex-[0_0_auto] flex flex-col items-start relative">
        <div className="flex flex-col items-start gap-4 px-6 py-0 relative self-stretch w-full flex-[0_0_auto]">
          <div className="font-sans font-bold text-plasma-text-secondary text-[11px] tracking-[1.10px] leading-[16.5px]">
            SQUAD ONLINE
          </div>
          <div className="flex flex-col items-start gap-4 relative self-stretch w-full pb-6">
            {/* Loading skeleton */}
            {loading && (
              <>
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 self-stretch w-full animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-plasma-slate-hover" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-20 h-3 rounded bg-plasma-slate-hover" />
                      <div className="w-14 h-2 rounded bg-plasma-slate-hover" />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Empty state */}
            {isEmpty && (
              <div className="flex flex-col items-center w-full py-4 text-center">
                <Users className="w-8 h-8 text-plasma-text-secondary/30 mb-2" />
                <p className="text-plasma-text-secondary text-[11px]">No squad members yet</p>
              </div>
            )}

            {/* Online friends */}
            {onlineSquad.map((member, idx) => (
              <Link
                href={`/profile/${member.id}`}
                key={`online-${member.id}-${idx}`}
                className="flex items-center gap-3 relative self-stretch w-full cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="relative flex-[0_0_auto]">
                  <div
                    className={`relative w-8 h-8 rounded-full bg-cover bg-center border-2 ${getIntentStyle(member.intent).border}`}
                    style={{ backgroundImage: `url(${getAvatarUrl(member.avatar, member.name)})` }}
                  />
                  <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-plasma-success rounded-full border-2 border-solid border-plasma-slate" />
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                  <div className="font-sans font-medium text-sm truncate text-plasma-text-primary">
                    {member.name}
                  </div>
                  <div className={`font-sans text-[11px] truncate w-full font-bold ${getIntentStyle(member.intent).border.replace('border-', 'text-')}`}>
                    {member.playingGame ? `Playing: ${member.playingGame}` : getIntentStyle(member.intent).label}
                  </div>
                </div>
              </Link>
            ))}


          </div>
          
          <button 
            onClick={onOpenDrawer}
            className="w-full mt-4 bg-plasma-slate-hover border border-white/10 rounded-xl py-3 text-[11px] font-display font-bold uppercase tracking-widest text-plasma-secondary hover:bg-white/5 transition-colors cursor-pointer"
          >
            Manage Squad
          </button>
        </div>
      </div>
    </div>
  );
};
