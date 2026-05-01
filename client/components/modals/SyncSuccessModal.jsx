"use client";

import { ModalWrapper } from "../ui/ModalWrapper";
import { CheckCircle2, Cloud, Zap } from "lucide-react";

export function SyncSuccessModal({ isOpen, onClose, syncedCount }) {
  const footer = (
    <div className="flex justify-center w-full">
      <button
        onClick={onClose}
        className="w-full px-8 py-3 rounded-xl bg-primary-gradient text-white font-bold text-sm transition-all hover:shadow-card-glow hover:scale-[1.02] cursor-pointer"
      >
        LFG!
      </button>
    </div>
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Sync Complete" footer={footer}>
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-20 h-20 rounded-full bg-plasma-success/20 border-2 border-plasma-success/30 flex items-center justify-center mb-6 relative">
          <CheckCircle2 className="w-10 h-10 text-plasma-success" />
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-plasma-bg border border-white/10 flex items-center justify-center animate-bounce shadow-lg">
             <Cloud className="w-4 h-4 text-[#66c0f4]" />
          </div>
        </div>
        
        <h3 className="font-display font-bold text-2xl text-plasma-text-primary mb-2">
          Steam Synced!
        </h3>
        
        <p className="text-plasma-text-secondary text-sm leading-relaxed max-w-[280px]">
          We successfully calibrated your <span className="text-white font-bold">{syncedCount || 0}</span> games and achievements with the Plasma Engine.
        </p>

        <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-plasma-primary/10 border border-plasma-primary/20">
          <Zap className="w-3 h-3 text-plasma-primary fill-current" />
          <span className="text-[10px] font-black uppercase tracking-widest text-plasma-primary">Experience Calibrated</span>
        </div>
      </div>
    </ModalWrapper>
  );
}
