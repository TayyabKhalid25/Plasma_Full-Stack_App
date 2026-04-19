"use client";

import { useState } from "react";
import { Search, Bell } from "lucide-react";
import Link from "next/link";

const statusModes = [
  { id: "comp", label: "COMP" },
  { id: "chill", label: "CHILL" },
  { id: "offline", label: "OFFLINE" },
];

export const TopNav = () => {
  const [activeMode, setActiveMode] = useState("chill");

  return (
    <div className="flex w-full h-16 items-center justify-between px-6 py-0 fixed top-0 left-0 bg-plasma-bg/80 border-b border-white/5 shadow-[0px_0px_40px_#5638951a] backdrop-blur-md z-50">
      <div className="inline-flex h-[85px] items-center gap-8 relative flex-[0_0_auto]">
        <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
          <Link href="/pulse" className="text-3xl font-bold text-white font-display tracking-[0.15em] hover:opacity-80 transition-opacity">
            PLASMA
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
        <div className="inline-flex items-start p-1 relative flex-[0_0_auto] bg-plasma-slate rounded-full">
          {statusModes.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`all-[unset] cursor-pointer flex-col justify-center px-4 py-1.5 rounded-full inline-flex items-center relative flex-[0_0_auto] ${
                  isActive ? "bg-plasma-success shadow-[0px_0px_15px_rgba(46,204,113,0.3)]" : ""
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
          <button className="flex-col justify-center p-2 rounded-full inline-flex items-center relative flex-[0_0_auto] hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5 text-plasma-text-primary" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-plasma-secondary rounded-full border-2 border-solid border-plasma-bg" />
          </button>
          <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
            {/* TODO: REPLACE_IMAGE - Current user avatar icon */}
            <div className="relative w-10 h-10 rounded-full border-2 border-solid border-plasma-success bg-[url(https://api.dicebear.com/7.x/avataaars/svg?seed=Me)] bg-cover bg-center" />
            <div className="absolute right-0 bottom-0 w-3 h-3 bg-plasma-success rounded-full border-2 border-solid border-plasma-bg" />
          </div>
        </div>
      </div>
    </div>
  );
};
