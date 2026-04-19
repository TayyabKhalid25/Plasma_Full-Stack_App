"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, Trophy, UserPlus, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notifications } from "@/data/dummy";

const statusModes = [
  { id: "comp", label: "COMP" },
  { id: "chill", label: "CHILL" },
  { id: "offline", label: "OFFLINE" },
];

const notifIconMap = {
  friend_request: UserPlus,
  achievement: Trophy,
  rally: Calendar,
  system: AlertCircle,
};

const notifColorMap = {
  friend_request: "bg-plasma-primary/15 text-plasma-primary",
  achievement: "bg-plasma-secondary/15 text-plasma-secondary",
  rally: "bg-plasma-success/15 text-plasma-success",
  system: "bg-plasma-warning/15 text-plasma-warning",
};

export const TopNav = () => {
  const [activeMode, setActiveMode] = useState("chill");
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const previewNotifs = notifications.slice(0, 4);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    if (showNotifDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifDropdown]);

  return (
    <div className="flex w-full h-16 items-center justify-between px-6 py-0 fixed top-0 left-0 bg-plasma-bg/80 border-b border-white/5 shadow-[0px_0px_40px_#5638951a] backdrop-blur-md z-50">
      <div className="inline-flex h-[85px] items-center gap-8 relative flex-[0_0_auto]">
        <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
          <Link href="/pulse" className="hover:opacity-80 transition-opacity">
            <Image src="/lockup.svg" alt="Plasma" width={112} height={24} className="h-6 w-auto brightness-0 invert" priority />
          </Link>
        </div>
        <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
          <div className="w-80 justify-center pl-10 pr-4 py-2.5 flex-[0_0_auto] bg-plasma-slate rounded-full overflow-hidden flex items-start relative">
            <input
              className="relative grow border-none bg-transparent text-plasma-text-secondary text-sm outline-none"
              placeholder="Search players, games..."
              type="text"
            />
          </div>
          <div className="inline-flex flex-col items-start absolute top-3 left-4">
            <Search className="w-4 h-4 text-plasma-text-secondary" />
          </div>
        </div>
      </div>
      <div className="inline-flex items-center gap-6 relative flex-[0_0_auto]">
        <div className="inline-flex items-center p-1 relative flex-[0_0_auto] bg-plasma-slate rounded-full gap-1">
          {statusModes.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`cursor-pointer justify-center px-4 py-1.5 rounded-full inline-flex items-center relative flex-[0_0_auto] transition-all ${
                  isActive ? "bg-plasma-success shadow-[0px_0px_15px_rgba(46,204,113,0.3)]" : "hover:bg-white/5"
                }`}
              >
                <div
                  className={`font-display font-bold text-[11px] text-center tracking-[0.55px] leading-[16.5px] whitespace-nowrap ${
                    isActive ? "text-white" : "text-plasma-text-secondary"
                  }`}
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
                  <span className="font-display font-bold text-sm text-plasma-text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-plasma-secondary bg-plasma-secondary/10 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {/* Preview Items */}
                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                  {previewNotifs.map((notif) => {
                    const Icon = notifIconMap[notif.type] || Bell;
                    const colorClass = notifColorMap[notif.type] || "bg-white/5 text-plasma-text-secondary";
                    return (
                      <div
                        key={notif.id}
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
                  })}
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
          <Link href="/profile" className="inline-flex flex-col items-start relative flex-[0_0_auto]">
            <div className="relative w-10 h-10 rounded-full border-2 border-solid border-plasma-success bg-[url(https://api.dicebear.com/7.x/avataaars/svg?seed=Me)] bg-cover bg-center hover:opacity-80 transition-opacity" />
            <div className="absolute right-0 bottom-0 w-3 h-3 bg-plasma-success rounded-full border-2 border-solid border-plasma-bg" />
          </Link>
        </div>
      </div>
    </div>
  );
};
