import { useState, useEffect } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Plus, X } from "lucide-react";
import { apiService } from "@/services/apiService";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { useAuth, API_BASE } from "@/context/AuthContext";

export function CreateRallyModal({ isOpen, onClose, onRallyCreated, initialData = null }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    gameId: "",
    date: "",
    time: "",
    intent: "CHILL",
    roles: [{ id: Date.now(), name: "", totalSlots: 1 }],
    maxCapacity: 5,
    description: "",
    description: ""
  });
  const [hasRoles, setHasRoles] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);

  useEffect(() => {
    if (initialData && isOpen) {
      const d = new Date(initialData.scheduledStartUTC || initialData.date);
      setFormData({
        title: initialData.title || "",
        gameId: initialData.gameID || initialData.gameId || "",
        date: d.toISOString().split('T')[0],
        time: d.toTimeString().split(' ')[0].substring(0, 5),
        intent: initialData.requiredIntent || initialData.intent || "CHILL",
        roles: initialData.roles && initialData.roles.length > 0 ? initialData.roles : [{ id: Date.now(), name: "", totalSlots: 1 }],
        maxCapacity: initialData.maxCapacity || 5,
        description: initialData.description || "",
        autoRSVP: false
      });
      setHasRoles(!!(initialData.roles && initialData.roles.length > 0));
    } else if (isOpen) {
      setFormData({
        title: "",
        gameId: "",
        date: "",
        time: "",
        intent: "CHILL",
        roles: [{ id: Date.now(), name: "", totalSlots: 1 }],
        maxCapacity: 5,
        description: "",
        autoRSVP: true
      });
      setHasRoles(true);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen || !token) return;
    const fetchGames = async () => {
      setLoadingGames(true);
      try {
        const res = await fetch(`${API_BASE}/api/library`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setGames(data.data.map(g => ({ id: g.gameID, title: g.title })));
        }
      } catch (err) {
        console.error("Failed to fetch library games", err);
      } finally {
        setLoadingGames(false);
      }
    };
    fetchGames();
  }, [isOpen, token]);

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    try {
      const payload = {
        ...formData,
        roles: hasRoles ? formData.roles : []
      };
      
      let res;
      if (initialData?.eventID || initialData?.id) {
        res = await apiService.updateRally(initialData.eventID || initialData.id, payload);
      } else {
        res = await apiService.createRally(payload);
      }
      
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await apiService.deleteRally(initialData.eventID || initialData.id);
      if (onRallyCreated) onRallyCreated(); // Trigger refetch
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setErrors({ main: "An unexpected error occurred while deleting." });
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-end items-center gap-3 w-full">
      {initialData && (
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading}
          className="mr-auto px-4 py-2 rounded-xl text-sm font-bold text-plasma-error hover:bg-plasma-error/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          Delete Rally
        </button>
      )}
      <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold text-plasma-text-secondary hover:text-white transition-colors cursor-pointer">
        Cancel
      </button>
      <button 
        onClick={handleSubmit} 
        disabled={loading}
        className="px-6 py-2 rounded-xl bg-primary-gradient text-white text-sm font-bold flex items-center gap-2 hover:shadow-[0_0_15px_rgba(86,56,149,0.4)] transition-all disabled:opacity-50 cursor-pointer"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {initialData ? "Update Rally" : "Create Rally"}
      </button>
    </div>
  );

  return (
    <>
      <ModalWrapper isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Rally" : "Create Rally"} footer={footer} maxWidth="max-w-xl">
      <div className="space-y-5">
        {errors.main && <div className="p-3 bg-plasma-error/10 border border-plasma-error/30 rounded-lg text-plasma-error text-sm">{errors.main}</div>}
        
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
              disabled={loadingGames}
              className={`w-full bg-plasma-bg border ${errors.gameId ? 'border-plasma-error' : 'border-white/10'} rounded-lg px-4 py-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary appearance-none cursor-pointer disabled:opacity-50`}
            >
              <option value="" disabled>{loadingGames ? "Loading games..." : "Select a game..."}</option>
              {games.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
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

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">Intent</label>
            <div className="flex gap-2">
              {["CHILL", "COMP"].map(intent => (
                <button
                  key={intent}
                  type="button"
                  onClick={() => setFormData({...formData, intent})}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    formData.intent === intent 
                      ? "bg-plasma-primary/20 border-plasma-primary text-plasma-primary" 
                      : "bg-plasma-bg border-white/5 text-plasma-text-secondary hover:border-white/20 hover:text-white"
                  }`}
                >
                  {intent}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider">Squad composition</label>
              <button 
                type="button"
                onClick={() => setHasRoles(!hasRoles)}
                className="text-[10px] text-plasma-primary hover:underline font-bold"
              >
                {hasRoles ? "Remove Roles" : "Use Roles"}
              </button>
            </div>
            {hasRoles && (
              <button type="button" onClick={addRole} className="text-[10px] uppercase font-bold text-plasma-primary hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
                <Plus className="w-3 h-3" /> Add Role
              </button>
            )}
          </div>
          
          {hasRoles ? (
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
                    type="button"
                    onClick={() => removeRole(role.id)}
                    disabled={formData.roles.length <= 1}
                    className="p-2 text-plasma-text-secondary hover:text-plasma-error disabled:opacity-30 transition-colors rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">Total Capacity</label>
              <input 
                type="number" 
                min="1"
                max="100"
                value={formData.maxCapacity}
                onChange={e => setFormData({...formData, maxCapacity: parseInt(e.target.value) || 1})}
                className="w-full bg-plasma-bg border border-white/10 rounded-lg px-4 py-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary"
              />
            </div>
          )}
          {errors.roles && <span className="text-xs text-plasma-error block mt-1">{errors.roles}</span>}
        </div>
      </div>
    </ModalWrapper>

    <ConfirmDeleteModal 
      isOpen={showDeleteConfirm} 
      onClose={() => setShowDeleteConfirm(false)}
      onConfirm={confirmDelete}
      title="Delete Rally"
      message="Are you sure you want to delete this rally? This will also remove the associated post and notify all attendees."
    />
    </>
  );
}
