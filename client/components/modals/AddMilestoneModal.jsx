import { useState } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Plus, Trophy } from "lucide-react";
import { useAuth, API_BASE } from "@/context/AuthContext";

export function AddMilestoneModal({ isOpen, onClose, onAdded, gameId }) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/prestige/milestones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: title.trim(), 
          description: description.trim(), 
          gameId: gameId,
          proofUrl: proofUrl.trim() 
        })
      });

      const data = await res.json();
      if (data.success) {
        setTitle("");
        setDescription("");
        setProofUrl("");
        onAdded();
        onClose();
      } else {
        setError(data.message || "Failed to add milestone");
      }
    } catch (err) {
      setError("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex gap-3 justify-end">
      <button 
        onClick={onClose} 
        className="px-5 py-2 rounded-xl text-sm font-bold text-plasma-text-secondary hover:text-white transition-colors"
      >
        Cancel
      </button>
      <button 
        onClick={handleSubmit} 
        disabled={loading || !title.trim()} 
        className="px-6 py-2 rounded-xl bg-primary-gradient text-white text-sm font-bold flex items-center gap-2 hover:shadow-card-glow transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Milestone</>}
      </button>
    </div>
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Add Manual Milestone" footer={footer}>
      <div className="space-y-4">
        <p className="text-sm text-plasma-text-secondary mb-4">
          Achieved something outside of Steam? Track it here.
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium text-plasma-text-secondary">Milestone Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Defeated Malenia level 1"
            className="w-full bg-plasma-bg border border-white/10 rounded-lg p-3 text-plasma-text-primary placeholder:text-plasma-text-secondary/50 focus:outline-none focus:border-plasma-primary transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-plasma-text-secondary">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any extra details..."
            rows={2}
            className="w-full bg-plasma-bg border border-white/10 rounded-lg p-3 text-plasma-text-primary placeholder:text-plasma-text-secondary/50 focus:outline-none focus:border-plasma-primary transition-colors resize-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-plasma-text-secondary">Proof URL (YouTube/Twitch/Screenshot)</label>
          <input
            type="url"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-plasma-bg border border-white/10 rounded-lg p-3 text-plasma-text-primary placeholder:text-plasma-text-secondary/50 focus:outline-none focus:border-plasma-primary transition-colors"
          />
        </div>

        {error && <p className="text-plasma-error text-sm text-center">{error}</p>}
      </div>
    </ModalWrapper>
  );
}
