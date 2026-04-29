"use client";

import { useState, useEffect } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Bell, UserPlus, Trophy, Calendar, AlertCircle, CheckCheck
} from "lucide-react";

const filterTabs = [
  { id: "all", label: "All", icon: Bell },
  { id: "FRIEND_REQUEST", label: "Friend Requests", icon: UserPlus },
  { id: "ACHIEVEMENT", label: "Achievements", icon: Trophy },
  { id: "RALLY", label: "Rallies", icon: Calendar },
  { id: "SYSTEM", label: "System", icon: AlertCircle },
];

const iconMap = {
  FRIEND_REQUEST: UserPlus,
  ACHIEVEMENT: Trophy,
  RALLY: Calendar,
  SYSTEM: AlertCircle,
};

const colorMap = {
  FRIEND_REQUEST: "bg-plasma-primary/15 text-plasma-primary",
  ACHIEVEMENT: "bg-plasma-secondary/15 text-plasma-secondary",
  RALLY: "bg-plasma-success/15 text-plasma-success",
  SYSTEM: "bg-plasma-warning/15 text-plasma-warning",
};

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-plasma-slate/40 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-plasma-slate-hover shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-3/4 h-3.5 rounded bg-plasma-slate-hover" />
        <div className="w-20 h-2.5 rounded bg-plasma-slate-hover" />
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { token } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setNotifs(data.data.map(n => ({
            id: n.notificationID,
            type: n.notificationType,
            title: n.message,
            time: new Date(n.sentAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            read: n.isRead,
            avatar: n.senderAvatar || null,
            senderName: n.senderName,
          })));
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, [token]);

  const filtered = activeFilter === "all" ? notifs : notifs.filter((n) => n.type === activeFilter);
  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllRead = async () => {
    // Optimistic
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    // Mark each unread notification individually
    const unread = notifs.filter(n => !n.read);
    for (const n of unread) {
      try {
        await fetch(`${API_BASE}/api/notifications/${n.id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }
  };

  const markRead = async (id) => {
    const notif = notifs.find(n => n.id === id);
    if (!notif || notif.read) return;

    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
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
          {loading ? (
            <>
              {[1,2,3,4,5].map(i => <NotificationSkeleton key={i} />)}
            </>
          ) : filtered.length === 0 ? (
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
