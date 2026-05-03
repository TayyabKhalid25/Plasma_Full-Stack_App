import { useState, useEffect, useRef } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Check, CheckCircle2 } from "lucide-react";
import { useAuth, API_BASE } from "@/context/AuthContext";

export function RsvpRoleModal({ isOpen, onClose, event, onRsvp }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (isOpen && event && event.preselectedRoleIdx !== undefined) {
      setSelectedRole(event.preselectedRoleIdx);
    }
  }, [isOpen, event]);

  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleConfirm = async () => {
    if (selectedRole === null) return;
    setLoading(true);
    try {
      const roleName = event.roles?.[selectedRole]?.name || null;
      const eventId = event.id || event.eventID;
      const res = await fetch(`${API_BASE}/api/rallies/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ declaredRole: roleName })
      });
      const data = await res.json();
      if (data.success) {
        setConfirmed(true);
        if (onRsvp) onRsvp(eventId, selectedRole);
        
        // Auto-close after showing confirmation
        timerRef.current = setTimeout(() => {
          setConfirmed(false);
          setSelectedRole(null);
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("RSVP failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedRole(null);
    setConfirmed(false);
    onClose();
  };

  if (!event) return null;

  const slotsFilled = event.slotsFilled ?? event.currentAttendees ?? 0;
  const slotsTotal = event.slotsTotal ?? event.maxCapacity ?? 0;

  return (
    <ModalWrapper isOpen={isOpen} onClose={handleClose} title="Select Role" maxWidth="max-w-md">
      <div className="space-y-6">
        {/* Confirmed state */}
        {confirmed ? (
          <div className="flex flex-col items-center py-8 gap-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-plasma-success" />
            <h3 className="text-lg font-display font-bold text-plasma-text-primary">RSVP Confirmed!</h3>
            <p className="text-sm text-plasma-text-secondary">You're locked in for <span className="text-white font-bold">{event.title}</span></p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-sm text-plasma-text-secondary">RSVPing for</p>
              <h3 className="text-lg font-display font-bold text-plasma-text-primary mt-1">{event.title}</h3>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider block">Available Roles</label>
              {event.roles?.map((role, idx) => {
                const filled = role.filled ?? event.roleCounts?.[role.name] ?? 0;
                const total = role.total ?? role.totalSlots ?? 0;
                const isFull = filled >= total;
                const isSelected = selectedRole === idx;
                
                return (
                  <button
                    key={idx}
                    onClick={() => !isFull && setSelectedRole(idx)}
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
                      <p className="text-xs text-plasma-text-secondary mt-0.5">{filled} / {total} filled</p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-plasma-primary" />}
                    {isFull && <span className="text-[10px] font-bold text-plasma-error uppercase">Full</span>}
                  </button>
                );
              })}
              {(!event.roles || event.roles.length === 0) && (
                <button
                  onClick={() => {
                    if (slotsFilled < slotsTotal) setSelectedRole(-1);
                  }}
                  disabled={slotsFilled >= slotsTotal}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border-2 text-left ${
                    slotsFilled >= slotsTotal 
                      ? "opacity-50 bg-white/5 border-transparent cursor-not-allowed"
                      : selectedRole === -1 
                        ? "border-plasma-primary bg-plasma-primary/10"
                        : "border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10 cursor-pointer"
                  }`}
                >
                  <div>
                    <span className="text-sm font-bold text-plasma-text-primary">Open Slots</span>
                    <p className="text-xs text-plasma-text-secondary mt-0.5">{slotsFilled} / {slotsTotal} filled</p>
                  </div>
                  {selectedRole === -1 && <Check className="w-5 h-5 text-plasma-primary" />}
                  {slotsFilled >= slotsTotal && <span className="text-[10px] font-bold text-plasma-error uppercase">Full</span>}
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={handleClose} className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-plasma-text-secondary bg-white/5 hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleConfirm} 
                disabled={loading || selectedRole === null}
                className="flex-1 px-4 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 bg-primary-gradient hover:shadow-card-glow"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm RSVP
              </button>
            </div>
          </>
        )}
      </div>
    </ModalWrapper>
  );
}
