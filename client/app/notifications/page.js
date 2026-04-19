"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Bell, UserPlus, Trophy, Calendar, AlertCircle, CheckCheck, Filter
} from "lucide-react";
import { notifications as allNotifications } from "@/data/dummy";

const filterTabs = [
  { id: "all", label: "All", icon: Bell },
  { id: "friend_request", label: "Friend Requests", icon: UserPlus },
  { id: "achievement", label: "Achievements", icon: Trophy },
  { id: "rally", label: "Rallies", icon: Calendar },
  { id: "system", label: "System", icon: AlertCircle },
];

const iconMap = {
  friend_request: UserPlus,
  achievement: Trophy,
  rally: Calendar,
  system: AlertCircle,
};

const colorMap = {
  friend_request: "bg-plasma-primary/15 text-plasma-primary",
  achievement: "bg-plasma-secondary/15 text-plasma-secondary",
  rally: "bg-plasma-success/15 text-plasma-success",
  system: "bg-plasma-warning/15 text-plasma-warning",
};

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [notifs, setNotifs] = useState(allNotifications);

  const filtered = activeFilter === "all" ? notifs : notifs.filter((n) => n.type === activeFilter);
  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <DashboardLayout showRightRail={false}>
      <div className="max-w-3xl mx-auto px-8 py-10 pb-20 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-[32px] text-plasma-text-primary">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-plasma-text-secondary mt-1">
                You have <span className="text-plasma-secondary font-bold">{unreadCount}</span> unread notification{unreadCount !== 1 && "s"}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-plasma-text-secondary hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 hide-scrollbar">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            const count = tab.id === "all" ? notifs.length : notifs.filter((n) => n.type === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-plasma-primary text-white"
                    : "bg-plasma-slate text-plasma-text-secondary hover:text-white hover:bg-plasma-slate-hover"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-white/5"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Notification List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Bell className="w-16 h-16 mx-auto text-plasma-slate-hover mb-4" strokeWidth={1} />
              <p className="text-plasma-text-secondary text-sm">No notifications in this category</p>
            </div>
          ) : (
            filtered.map((notif) => {
              const Icon = iconMap[notif.type] || Bell;
              const colorClass = colorMap[notif.type] || "bg-white/5 text-plasma-text-secondary";
              return (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                    notif.read
                      ? "bg-plasma-slate/40 border-transparent hover:bg-plasma-slate/60"
                      : "bg-plasma-slate border-plasma-primary/20 hover:border-plasma-primary/40"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    {notif.avatar ? (
                      <img src={notif.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${notif.read ? "text-plasma-text-secondary" : "text-plasma-text-primary"}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-plasma-text-secondary mt-1">{notif.time}</p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-plasma-secondary shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
