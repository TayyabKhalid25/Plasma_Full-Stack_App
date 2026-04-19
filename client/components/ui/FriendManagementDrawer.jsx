"use client";

import { X, Search, UserPlus, Check, XCircle, MoreVertical } from "lucide-react";

export function FriendManagementDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-plasma-bg border-l border-white/10 shadow-2xl animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-plasma-slate">
          <div>
            <h2 className="font-display font-bold text-xl text-plasma-text-primary">Friend Management</h2>
            <p className="text-plasma-text-secondary text-xs">Manage your squad and requests</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-plasma-text-secondary hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 pb-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-plasma-text-secondary" />
            <input 
              type="text" 
              placeholder="Search by Username or ID..."
              className="w-full bg-plasma-slate border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-plasma-text-primary placeholder:text-plasma-text-secondary focus:border-plasma-primary outline-none transition-colors"
            />
          </div>
        </div>

        {/* Content Tabs area - Just visual for now */}
        <div className="flex gap-4 px-6 border-b border-white/5 mt-4">
          <button className="pb-2 border-b-2 border-plasma-primary text-sm font-semibold text-plasma-text-primary">All Friends</button>
          <button className="pb-2 border-b-2 border-transparent text-sm font-semibold text-plasma-text-secondary hover:text-white transition-colors flex items-center gap-1">
            Requests <span className="bg-plasma-error text-white text-[9px] px-1.5 py-0.5 rounded-full">2</span>
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Section: Pending Requests */}
          <div>
            <h3 className="text-xs font-bold text-plasma-text-secondary tracking-widest uppercase mb-4">Pending Requests</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-plasma-slate/50 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Req1" alt="Req1" className="w-10 h-10 rounded-full border border-white/10" />
                  <div>
                    <p className="text-sm font-bold text-white">Ghost_Sniper</p>
                    <p className="text-[11px] text-plasma-text-secondary">Level 12 • Requested 2h ago</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-1.5 bg-plasma-success/20 text-plasma-success rounded-lg hover:bg-plasma-success hover:text-white transition-colors cursor-pointer">
                    <Check className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 bg-plasma-error/20 text-plasma-error rounded-lg hover:bg-plasma-error hover:text-white transition-colors cursor-pointer">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-plasma-slate/50 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Req2" alt="Req2" className="w-10 h-10 rounded-full border border-white/10" />
                  <div>
                    <p className="text-sm font-bold text-white">NoobSlayer99</p>
                    <p className="text-[11px] text-plasma-text-secondary">Level 45 • Requested 1d ago</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-1.5 bg-plasma-success/20 text-plasma-success rounded-lg hover:bg-plasma-success hover:text-white transition-colors cursor-pointer">
                    <Check className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 bg-plasma-error/20 text-plasma-error rounded-lg hover:bg-plasma-error hover:text-white transition-colors cursor-pointer">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Online Friends */}
          <div>
            <h3 className="text-xs font-bold text-plasma-text-secondary tracking-widest uppercase mb-4">Online (3)</h3>
            <div className="space-y-1">
              {['Ahmed', 'Sarah', 'Ali'].map((friend, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-plasma-slate rounded-lg group transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 relative">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend}`} alt={friend} className="w-8 h-8 rounded-full bg-plasma-slate" />
                    <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-plasma-success rounded-full border-2 border-plasma-bg" />
                    <div>
                      <p className="text-sm font-medium text-white">{friend}</p>
                      <p className="text-[10px] text-plasma-primary">Playing Valorant</p>
                    </div>
                  </div>
                  <button className="text-plasma-text-secondary opacity-0 group-hover:opacity-100 hover:text-white transition-all cursor-pointer">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Offline Friends */}
          <div>
            <h3 className="text-xs font-bold text-plasma-text-secondary tracking-widest uppercase mb-4">Offline (2)</h3>
            <div className="space-y-1 opacity-60">
              {['Omar', 'Zain'].map((friend, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-plasma-slate rounded-lg group transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 relative">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend}`} alt={friend} className="w-8 h-8 rounded-full bg-plasma-slate grayscale" />
                    <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-plasma-text-secondary rounded-full border-2 border-plasma-bg" />
                    <div>
                      <p className="text-sm font-medium text-white">{friend}</p>
                      <p className="text-[10px] text-plasma-text-secondary">Last seen 4h ago</p>
                    </div>
                  </div>
                  <button className="text-plasma-text-secondary opacity-0 group-hover:opacity-100 hover:text-white transition-all cursor-pointer">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Area */}
        <div className="p-6 border-t border-white/5 bg-plasma-slate">
          <button className="w-full py-3 bg-primary-gradient text-white rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-[0_0_15px_rgba(86,56,149,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer">
            <UserPlus className="w-4 h-4" /> Add Friend
          </button>
        </div>
      </div>
    </div>
  );
}
