import { useState, useEffect } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Check, Trophy, Shield, Target, Medal, Gem, Lock } from "lucide-react";
import { apiService } from "@/services/apiService";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { getRarityProps } from "@/lib/utils";

const iconMap = { Trophy, Shield, Target, Medal, Gem, Lock };

export function EditHallOfFameModal({ isOpen, onClose, onUpdate, initialSelectedIds = [] }) {
  const { token } = useAuth();
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [error, setError] = useState(null);
  const [availableAchievements, setAvailableAchievements] = useState([]);

  // Fetch real achievements from API when modal opens
  useEffect(() => {
    if (!isOpen || !token) return;
    const fetchAchievements = async () => {
      setLoadingAchievements(true);
      try {
        const res = await fetch(`${API_BASE}/api/achievements?orderBy=rarityWeight&direction=DESC`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          // Flatten all achievements from gamesProgress
          const allAch = (data.data.gamesProgress || []).flatMap(game =>
            (game.achievements || []).map(ach => ({
              id: ach.achievementID,
              title: ach.title,
              xp: ach.plasmaXP,
              gameTitle: game.gameTitle,
              rarityWeight: ach.rarityWeight,
            }))
          );
          setAvailableAchievements(allAch);
          // Set initial selection from prop, filtered to valid IDs
          const validIds = initialSelectedIds.filter(id => allAch.some(a => a.id === id));
          setSelectedIds(validIds);
        }
      } catch (err) {
        console.error("Failed to fetch achievements", err);
      } finally {
        setLoadingAchievements(false);
      }
    };
    fetchAchievements();
  }, [isOpen, token]);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      if (selectedIds.length >= 5) {
        setError("You can only select up to 5 items.");
        return;
      }
      setError(null);
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiService.updateHallOfFame(selectedIds);
      if (onUpdate) onUpdate(selectedIds);
      onClose();
    } catch (err) {
      setError(err.errors?.main || "Failed to update Hall of Fame.");
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-plasma-text-secondary">{selectedIds.length} / 5 Selected</span>
        {selectedIds.length > 0 && (
          <button 
            onClick={() => setSelectedIds([])}
            className="text-[10px] font-bold text-plasma-error/80 hover:text-plasma-error transition-all cursor-pointer uppercase tracking-wider hover:underline"
          >
            Deselect All
          </button>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold text-plasma-text-secondary hover:text-white transition-colors cursor-pointer">
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="px-6 py-2 rounded-xl bg-primary-gradient text-white text-sm font-bold flex items-center gap-2 hover:shadow-card-glow transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save
        </button>
      </div>
    </div>
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Edit Hall of Fame" footer={footer} maxWidth="max-w-3xl">
      <div className="space-y-4 h-[400px] flex flex-col">
        {error && <div className="p-3 bg-plasma-error/10 border border-plasma-error/30 rounded-lg text-plasma-error text-sm shrink-0">{error}</div>}
        
        <p className="text-sm text-plasma-text-secondary shrink-0 mb-2">Select up to 5 achievements to showcase on your profile.</p>

        {loadingAchievements ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-plasma-primary animate-spin" />
          </div>
        ) : availableAchievements.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Trophy className="w-12 h-12 text-plasma-text-secondary/30 mb-3" />
            <p className="text-sm text-plasma-text-secondary">No achievements unlocked yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 overflow-y-auto custom-scrollbar p-1">
             {availableAchievements.map((ach) => {
               const isSelected = selectedIds.includes(ach.id);
               const rarityProps = getRarityProps(ach.rarityWeight);
               const Icon = iconMap[rarityProps.iconName] || Trophy;

               return (
                 <div 
                   key={ach.id} 
                   onClick={() => toggleSelect(ach.id)}
                   className={`relative flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all border-2 ${
                     isSelected ? "border-plasma-primary bg-plasma-primary/10" : "border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10"
                   }`}
                 >
                   {isSelected && (
                     <div className="absolute -top-2 -right-2 w-5 h-5 bg-plasma-primary rounded-full flex items-center justify-center shadow-lg z-10">
                       <Check className="w-3 h-3 text-white" />
                     </div>
                   )}
                   <div className={`w-12 h-12 rounded-full border-2 ${rarityProps.border} flex items-center justify-center bg-white/5 mb-2 ${rarityProps.shadow}`}>
                     <Icon className={`w-6 h-6 ${rarityProps.color}`} />
                   </div>
                   <p className="text-[10px] font-bold text-plasma-text-primary text-center leading-tight line-clamp-2">{ach.title}</p>
                   <p className={`text-[8px] font-mono mt-0.5 ${rarityProps.color}`}>+{ach.xp} XP</p>
                 </div>
               );
             })}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}
