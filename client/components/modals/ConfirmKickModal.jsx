import { useState } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, UserMinus } from "lucide-react";

export function ConfirmKickModal({ isOpen, onClose, onConfirm, username }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Kick Member" maxWidth="max-w-sm">
      <div className="space-y-6 p-2">
        <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-plasma-error/10 flex items-center justify-center border border-plasma-error/20 shrink-0">
                <UserMinus className="w-6 h-6 text-plasma-error" />
            </div>
            <div className="space-y-1">
                <p className="text-sm text-plasma-text-primary font-bold">Unceremoniously Evict {username}?</p>
                <p className="text-xs text-plasma-text-secondary leading-relaxed">This will remove them from the squad list and send a witty dismissal notification.</p>
            </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl text-xs font-black tracking-widest uppercase text-plasma-text-secondary bg-white/5 hover:bg-white/10 transition-all border border-white/5 disabled:opacity-50"
          >
            Mercy
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl text-xs font-black tracking-widest uppercase text-white bg-plasma-error hover:bg-plasma-error/80 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-plasma-error/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kick 'Em"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
