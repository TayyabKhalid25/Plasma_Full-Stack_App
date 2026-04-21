import { useState } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Check } from "lucide-react";

export function RsvpRoleModal({ isOpen, onClose, event, onRsvp }) {
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedRoleId) return;
    setLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    if (onRsvp) onRsvp(event.id, selectedRoleId);
    onClose();
  };

  if (!event) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Select Role" maxWidth="max-w-md">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-plasma-text-secondary">RSVPing for</p>
          <h3 className="text-lg font-display font-bold text-plasma-text-primary mt-1">{event.title}</h3>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider block">Available Roles</label>
          {event.roles?.map((role, idx) => {
            const isFull = role.filled >= role.total;
            const isSelected = selectedRoleId === idx;
            
            return (
              <button
                key={idx}
                onClick={() => !isFull && setSelectedRoleId(idx)}
                disabled={isFull}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border-2 text-left ${
                  isFull 
                    ? "opacity-50 bg-white/5 border-transparent cursor-not-allowed"
                    : isSelected 
                      ? "border-plasma-primary bg-plasma-primary/10"
                      : "border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10 cursor-pointer"
                }`}
              >
                <div>
                  <span className="text-sm font-bold text-plasma-text-primary">{role.name}</span>
                  <p className="text-xs text-plasma-text-secondary mt-0.5">{role.filled} / {role.total} filled</p>
                </div>
                {isSelected && <Check className="w-5 h-5 text-plasma-primary" />}
                {isFull && <span className="text-[10px] font-bold text-plasma-error uppercase">Full</span>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-plasma-text-secondary bg-white/5 hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={loading || selectedRoleId === null}
            className="flex-1 px-4 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 bg-primary-gradient hover:shadow-card-glow"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm RSVP
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
