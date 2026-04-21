import { useState } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Check } from "lucide-react";
import { apiService } from "@/services/apiService";
import { gamesProgress } from "@/data/dummy"; // using dummy achievements for selection

export function EditHallOfFameModal({ isOpen, onClose, onUpdate }) {
  const [selectedIds, setSelectedIds] = useState(["1", "3", "5"]); // Dummy initial state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Flatten dummy achievements to make them selectable
  const availableAchievements = gamesProgress.flatMap(game => 
    game.achievements.filter(ach => ach.unlocked).map(ach => ({
      id: ach.title, // Dummy id
      ...ach
    }))
  );

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
      <span className="text-xs font-bold text-plasma-text-secondary">{selectedIds.length} / 5 Selected</span>
      <div className="flex gap-3">
        <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold text-plasma-text-secondary hover:text-white transition-colors">
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="px-6 py-2 rounded-xl bg-primary-gradient text-white text-sm font-bold flex items-center gap-2 hover:shadow-card-glow transition-all disabled:opacity-50"
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

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 overflow-y-auto custom-scrollbar p-1">
          {availableAchievements.map((ach) => {
            const isSelected = selectedIds.includes(ach.id);
            return (
              <div 
                key={ach.id} 
                onClick={() => toggleSelect(ach.id)}
                className={`relative flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all border-2 ${
                  isSelected ? "border-plasma-primary bg-plasma-primary/10" : "border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10"
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-plasma-primary rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-full border-2 ${ach.border} flex items-center justify-center bg-white/5 mb-2`}>
                  <div className={`w-6 h-6 ${ach.color} bg-current rounded-sm`} style={{ maskImage: "url('/icon.svg')", maskSize: "contain", WebkitMaskImage: "url('/icon.svg')", WebkitMaskSize: "contain" }} />
                </div>
                <p className="text-[10px] font-bold text-plasma-text-primary text-center leading-tight line-clamp-2">{ach.title}</p>
              </div>
            );
          })}
        </div>
      </div>
    </ModalWrapper>
  );
}
