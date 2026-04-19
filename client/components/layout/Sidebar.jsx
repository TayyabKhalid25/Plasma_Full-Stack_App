"use client";

import { Activity, Calendar, Library, Trophy, Settings, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { squadMembers } from "@/data/dummy";

const navItems = [
  { id: "/pulse", label: "PULSE", icon: Activity },
  { id: "/rally", label: "RALLY", icon: Calendar },
  { id: "/library", label: "OMNI LIBRARY", icon: Library },
  { id: "/prestige", label: "PRESTIGE", icon: Trophy },
  { id: "/messages", label: "MESSAGES", icon: MessageSquare },
];

export const Sidebar = ({ onOpenDrawer }) => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 h-[calc(100vh-64px)] items-start px-0 py-6 fixed top-16 left-0 bg-plasma-slate border-r border-white/5 shadow-[20px_0px_40px_rgba(13,11,20,0.5)] overflow-y-auto z-40 custom-scrollbar">
      <div className="flex flex-col items-start gap-1 relative flex-1 self-stretch w-full grow">
        {navItems.map((item) => {
          // Check if current path starts with the nav item ID to keep it active for sub-routes
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

      {/* Settings link */}
      <div className="px-6 pb-4 w-full">
        <Link
          href="/settings"
          className={`flex items-center gap-4 px-2 py-2.5 rounded-lg w-full transition-colors ${
            pathname === "/settings"
              ? "bg-plasma-primary/15 text-plasma-text-primary"
              : "text-plasma-text-secondary hover:bg-white/5 hover:text-plasma-text-primary"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="font-display font-bold text-xs tracking-[1.40px]">SETTINGS</span>
        </Link>
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
            {squadMembers.map((member) => (
              <div
                key={member.id}
                className={`flex items-center gap-3 relative self-stretch w-full cursor-pointer hover:opacity-80 transition-opacity ${member.offline ? "opacity-50 hover:opacity-40" : ""}`}
              >
                <div className="relative flex-[0_0_auto]">
                  <div
                    className={`relative w-8 h-8 rounded-full bg-cover bg-center ${member.borderColor ? "border-2 border-solid" : ""}`}
                    style={{
                      backgroundImage: `url(${member.avatar})`,
                      borderColor: member.borderColor || undefined,
                    }}
                  />
                  {member.online && (
                    <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-plasma-success rounded-full border-2 border-solid border-plasma-slate" />
                  )}
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                  <div className={`font-sans font-medium text-sm truncate ${member.offline ? "text-plasma-text-secondary" : "text-plasma-text-primary"}`}>
                    {member.name}
                  </div>
                  <div className="font-sans text-plasma-text-secondary text-[11px] truncate w-full">
                    {member.status}
                  </div>
                </div>
              </div>
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
