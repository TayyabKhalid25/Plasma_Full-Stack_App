import { useState } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, AlertTriangle } from "lucide-react";

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title = "Delete Post", message = "Are you sure you want to delete this post? This action cannot be undone." }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="space-y-6 p-2">
        <div className="flex gap-3 text-plasma-error">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="text-sm text-plasma-text-primary">{message}</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-plasma-text-primary bg-plasma-slate border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-plasma-error hover:bg-plasma-error/80 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(255,42,122,0.3)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Delete"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
