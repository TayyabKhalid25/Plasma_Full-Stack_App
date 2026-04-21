import { useState } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Plus, X } from "lucide-react";
import { apiService } from "@/services/apiService";

export function CreateRallyModal({ isOpen, onClose, onRallyCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    gameId: "",
    date: "",
    time: "",
    intent: "CHILL",
    roles: [{ id: Date.now(), name: "", totalSlots: 1 }]
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    try {
      const res = await apiService.createRally(formData);
      if (onRallyCreated) onRallyCreated(res.data);
      onClose();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setErrors({ main: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const addRole = () => {
    setFormData(prev => ({
      ...prev,
      roles: [...prev.roles, { id: Date.now(), name: "", totalSlots: 1 }]
    }));
  };

  const removeRole = (id) => {
    if (formData.roles.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.filter(r => r.id !== id)
    }));
  };

  const updateRole = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.map(r => r.id === id ? { ...r, [field]: value } : r)
    }));
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold text-plasma-text-secondary hover:text-white transition-colors">
        Cancel
      </button>
      <button 
        onClick={handleSubmit} 
        disabled={loading}
        className="px-6 py-2 rounded-xl bg-primary-gradient text-white text-sm font-bold flex items-center gap-2 hover:shadow-[0_0_15px_rgba(86,56,149,0.4)] transition-all disabled:opacity-50"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Create Rally
      </button>
    </div>
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Create Rally" footer={footer} maxWidth="max-w-xl">
      <div className="space-y-5">
        {errors.main && <div className="p-3 bg-plasma-error/10 border border-plasma-error/30 rounded-lg text-plasma-error text-sm">{errors.main}</div>}
        
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">Event Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Diamond Rank Grind"
              className={`w-full bg-plasma-bg border ${errors.title ? 'border-plasma-error' : 'border-white/10'} rounded-lg px-4 py-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary`}
            />
            {errors.title && <span className="text-xs text-plasma-error mt-1">{errors.title}</span>}
          </div>

          <div>
            <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">Select Game</label>
            <select 
              value={formData.gameId}
              onChange={e => setFormData({...formData, gameId: e.target.value})}
              className={`w-full bg-plasma-bg border ${errors.gameId ? 'border-plasma-error' : 'border-white/10'} rounded-lg px-4 py-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary appearance-none cursor-pointer`}
            >
              <option value="" disabled>Select a game...</option>
              <option value="apex">Apex Legends</option>
              <option value="valorant">Valorant</option>
              <option value="destiny2">Destiny 2</option>
            </select>
            {errors.gameId && <span className="text-xs text-plasma-error mt-1">{errors.gameId}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">Date</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className={`w-full bg-plasma-bg border ${errors.date ? 'border-plasma-error' : 'border-white/10'} rounded-lg px-4 py-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary`}
            />
            {errors.date && <span className="text-xs text-plasma-error mt-1">{errors.date}</span>}
          </div>
          <div>
            <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">Time</label>
            <input 
              type="time" 
              value={formData.time}
              onChange={e => setFormData({...formData, time: e.target.value})}
              className={`w-full bg-plasma-bg border ${errors.time ? 'border-plasma-error' : 'border-white/10'} rounded-lg px-4 py-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary`}
            />
            {errors.time && <span className="text-xs text-plasma-error mt-1">{errors.time}</span>}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">Intent</label>
          <div className="flex gap-3">
            {["CHILL", "COMP", "LFG"].map(intent => (
              <button
                key={intent}
                onClick={() => setFormData({...formData, intent})}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                  formData.intent === intent 
                    ? "bg-plasma-primary/20 border-plasma-primary text-plasma-primary" 
                    : "bg-plasma-bg border-white/5 text-plasma-text-secondary hover:border-white/20 hover:text-white"
                }`}
              >
                {intent}
              </button>
            ))}
          </div>
          {errors.intent && <span className="text-xs text-plasma-error mt-1">{errors.intent}</span>}
        </div>

        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider">Roles / Squad composition</label>
            <button onClick={addRole} className="text-[10px] uppercase font-bold text-plasma-primary hover:text-white transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Role
            </button>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
            {formData.roles.map((role) => (
              <div key={role.id} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Role Name (e.g. Healer)"
                  value={role.name}
                  onChange={e => updateRole(role.id, "name", e.target.value)}
                  className="flex-1 bg-plasma-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary"
                />
                <input 
                  type="number" 
                  min="1"
                  max="10"
                  value={role.totalSlots}
                  onChange={e => updateRole(role.id, "totalSlots", parseInt(e.target.value) || 1)}
                  className="w-20 bg-plasma-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary"
                />
                <button 
                  onClick={() => removeRole(role.id)}
                  disabled={formData.roles.length <= 1}
                  className="p-2 text-plasma-text-secondary hover:text-plasma-error disabled:opacity-30 transition-colors rounded-lg bg-white/5 hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {errors.roles && <span className="text-xs text-plasma-error block mt-1">{errors.roles}</span>}
          </div>
        </div>

      </div>
    </ModalWrapper>
  );
}
