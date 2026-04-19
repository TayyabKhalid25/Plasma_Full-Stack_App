"use client";

import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { RightRail } from "./RightRail";
import { FriendManagementDrawer } from "../ui/FriendManagementDrawer";
import { useState } from "react";

export const DashboardLayout = ({ children, showRightRail = true }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col items-start relative bg-plasma-bg min-h-screen pt-16 font-sans">
      <TopNav />
      <Sidebar onOpenDrawer={() => setIsDrawerOpen(true)} />
      <div className={`flex items-start justify-center w-full ${showRightRail ? 'pr-[280px]' : ''}`}>
        <main className={`flex-1 grow pl-64 w-full`}>
          {children}
        </main>
        {showRightRail && <RightRail />}
      </div>
      
      {/* Global Overlay Drawer */}
      <FriendManagementDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
};
