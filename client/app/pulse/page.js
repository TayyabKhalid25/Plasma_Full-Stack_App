"use client";

import { 
  Gamepad2, 
  Heart, 
  MessageSquare, 
  Share2
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// --- DATA ---
const filterTabs = [
  { label: "All", active: true },
  { label: "Friends Activity", active: false },
  { label: "My Posts", active: false },
  { label: "Comp Only", active: false },
  { label: "Chill Only", active: false },
];

// --- COMPONENTS ---

export const ActivityFeedSection = () => {
  return (
    <div className="flex flex-col items-center pt-8 pb-12 px-12 relative flex-1 grow max-w-3xl mx-auto">
      <div className="flex flex-col w-full items-start gap-6 relative">
        
        {/* Post Composer */}
        <div className="flex flex-col items-start gap-4 p-4 relative self-stretch w-full bg-plasma-slate rounded-xl border border-white/5">
          <div className="flex items-start gap-4 relative self-stretch w-full">
            {/* TODO: REPLACE_IMAGE - Current user avatar in post composer */}
            <div className="relative w-10 h-10 rounded-full bg-[url(https://api.dicebear.com/7.x/avataaars/svg?seed=Me)] bg-cover bg-center border-2 border-plasma-success" />
            <div className="flex items-center justify-center px-4 py-2 relative flex-1 self-stretch bg-plasma-slate-hover rounded-full">
              <input 
                type="text" 
                placeholder="Share a moment..." 
                className="w-full bg-transparent border-none text-sm text-plasma-text-primary placeholder:text-plasma-text-secondary outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between relative self-stretch w-full">
            <button className="p-2 text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer">
              <Gamepad2 className="w-5 h-5" />
            </button>
            <button className="flex justify-center px-6 py-1.5 rounded-full bg-primary-gradient items-center hover:opacity-90 transition-opacity cursor-pointer">
              <span className="font-display font-bold text-white text-sm tracking-[0.35px]">
                Post
              </span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-start gap-2 py-2 relative self-stretch w-full">
          {filterTabs.map((tab) => (
            <button
              key={tab.label}
              className={`flex-col justify-center px-5 py-1.5 rounded-full inline-flex items-center transition-colors cursor-pointer ${
                tab.active ? "bg-plasma-primary text-white" : "bg-plasma-slate-hover text-plasma-text-secondary hover:bg-white/10"
              }`}
            >
              <div className="font-sans font-bold text-xs tracking-[0] leading-4 whitespace-nowrap">
                {tab.label}
              </div>
            </button>
          ))}
        </div>

        {/* Feed Items */}
        <div className="flex flex-col items-start gap-4 relative self-stretch w-full">
          
          {/* Notification 1 */}
          <div className="flex items-center justify-between p-4 relative self-stretch w-full bg-plasma-slate rounded-xl border-l-4 border-plasma-primary hover:bg-white/5 transition-colors">
            <div className="inline-flex items-center gap-4">
              {/* TODO: REPLACE_IMAGE - Wahaj avatar */}
              <div className="w-8 h-8 rounded-full bg-[url(https://api.dicebear.com/7.x/avataaars/svg?seed=Wahaj)] bg-cover bg-center" />
              <div>
                <p className="font-sans text-sm text-plasma-text-secondary">
                  <span className="font-bold text-plasma-text-primary">Wahaj</span> started playing <span className="font-bold text-plasma-text-primary">Counter-Strike 2</span>
                </p>
                <div className="font-sans text-[10px] text-plasma-text-secondary">2m ago</div>
              </div>
            </div>
            <button className="px-4 py-1 bg-plasma-primary rounded-full hover:bg-plasma-primary/80 transition-colors cursor-pointer">
              <span className="font-sans font-bold text-white text-[11px] tracking-[0.55px]">JOIN</span>
            </button>
          </div>

          {/* Post 1 */}
          <div className="flex flex-col items-start gap-4 p-5 relative self-stretch w-full bg-plasma-slate rounded-xl border border-white/5">
            <div className="flex items-start justify-between relative self-stretch w-full">
              <div className="inline-flex items-start gap-3">
                {/* TODO: REPLACE_IMAGE - Ahmed avatar */}
                <div className="w-10 h-10 rounded-full border-2 border-plasma-success bg-[url(https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed)] bg-cover bg-center" />
                <div className="flex flex-col">
                  <span className="font-sans font-semibold text-plasma-text-primary text-base">Ahmed</span>
                  <span className="font-sans text-plasma-text-secondary text-[11px]">15m ago</span>
                </div>
              </div>
              <div className="px-3 py-1 bg-plasma-success/10 rounded-full">
                <span className="font-sans font-bold text-plasma-success text-[10px]">CHILL</span>
              </div>
            </div>
            <p className="font-sans text-plasma-text-primary text-[15px]">
              Ranked grind tonight who's in? 🎮
            </p>
            {/* TODO: REPLACE_IMAGE - Post screenshot 1 */}
            <div className="relative w-full h-[300px] rounded-2xl overflow-hidden bg-[url(https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop)] bg-cover bg-center">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
            <div className="flex items-center gap-8 pt-2">
              <button className="flex items-center gap-2 text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer">
                <Heart className="w-4 h-4" />
                <span className="text-xs">12</span>
              </button>
              <button className="flex items-center gap-2 text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">3</span>
              </button>
              <button className="text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification 2 */}
          <div className="flex items-center justify-between p-4 relative self-stretch w-full bg-plasma-slate rounded-xl border-l-4 border-plasma-primary hover:bg-white/5 transition-colors">
            <div className="inline-flex items-center gap-4">
              {/* TODO: REPLACE_IMAGE - Sarah avatar */}
              <div className="w-8 h-8 rounded-full bg-[url(https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah)] bg-cover bg-center" />
              <div>
                <p className="font-sans text-sm text-plasma-text-secondary">
                  <span className="font-bold text-plasma-text-primary">Sarah</span> started playing <span className="font-bold text-plasma-text-primary">Helldivers 2</span>
                </p>
                <div className="font-sans text-[10px] text-plasma-text-secondary">45m ago</div>
              </div>
            </div>
            <button className="px-4 py-1 bg-plasma-primary rounded-full hover:bg-plasma-primary/80 transition-colors cursor-pointer">
              <span className="font-sans font-bold text-white text-[11px] tracking-[0.55px]">JOIN</span>
            </button>
          </div>

          {/* Post 2 */}
          <div className="flex flex-col items-start gap-4 p-5 relative self-stretch w-full bg-plasma-slate rounded-xl border border-white/5">
            <div className="flex items-start justify-between relative self-stretch w-full">
              <div className="inline-flex items-start gap-3">
                {/* TODO: REPLACE_IMAGE - Ali avatar */}
                <div className="w-10 h-10 rounded-full border-2 border-plasma-secondary bg-[url(https://api.dicebear.com/7.x/avataaars/svg?seed=Ali)] bg-cover bg-center" />
                <div className="flex flex-col">
                  <span className="font-sans font-semibold text-plasma-text-primary text-base">Ali</span>
                  <span className="font-sans text-plasma-text-secondary text-[11px]">1h ago</span>
                </div>
              </div>
              <div className="px-3 py-1 bg-plasma-secondary/10 rounded-full">
                <span className="font-sans font-bold text-plasma-secondary text-[10px]">⚔ COMP</span>
              </div>
            </div>
            <p className="font-sans text-plasma-text-primary text-[15px]">
              Finally hit Diamond! Let's go 💎
            </p>
            {/* TODO: REPLACE_IMAGE - Post screenshot 2 */}
            <div className="relative w-full h-[300px] rounded-2xl overflow-hidden bg-[url(https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165&auto=format&fit=crop)] bg-cover bg-center" />
            <div className="flex items-center gap-8 pt-2">
              <button className="flex items-center gap-2 text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer">
                <Heart className="w-4 h-4" />
                <span className="text-xs">45</span>
              </button>
              <button className="flex items-center gap-2 text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">12</span>
              </button>
              <button className="text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Offline Notification */}
          <div className="flex items-center p-4 relative self-stretch w-full bg-plasma-slate/40 rounded-xl opacity-60">
            <div className="inline-flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10" />
              <div>
                <p className="font-sans font-medium text-sm text-plasma-text-secondary">
                  Omar went offline
                </p>
                <div className="font-sans text-[10px] text-plasma-text-secondary">3h ago</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default function Pulse() {
  return (
    <DashboardLayout>
      <ActivityFeedSection />
    </DashboardLayout>
  );
}
