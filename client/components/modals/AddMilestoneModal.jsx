import { useState, useRef } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Plus, Trophy, Upload, X, Link as LinkIcon, ImageIcon } from "lucide-react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { upload } from '@vercel/blob/client';

export function AddMilestoneModal({ isOpen, onClose, onAdded, gameId }) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      setProofUrl(newBlob.url);
    } catch (err) {
      console.error(err);
      setError("Failed to upload image. Try a link instead.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

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
        setPreview(null);
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
        disabled={loading || uploading || !title.trim()} 
        className="px-6 py-2 rounded-xl bg-primary-gradient text-white text-sm font-bold flex items-center gap-2 hover:shadow-card-glow transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Milestone</>}
      </button>
    </div>
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Add Manual Milestone" footer={footer}>
      <div className="space-y-4">
        <p className="text-sm text-plasma-text-secondary mb-2">
          Achieved something outside of Steam? Track it here.
        </p>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-plasma-text-secondary uppercase tracking-widest">Milestone Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Defeated Malenia level 1"
            className="w-full bg-plasma-bg border border-white/10 rounded-lg p-3 text-plasma-text-primary placeholder:text-plasma-text-secondary/50 focus:outline-none focus:border-plasma-primary transition-colors"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-plasma-text-secondary uppercase tracking-widest">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any extra details..."
            rows={2}
            className="w-full bg-plasma-bg border border-white/10 rounded-lg p-3 text-plasma-text-primary placeholder:text-plasma-text-secondary/50 focus:outline-none focus:border-plasma-primary transition-colors resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-plasma-text-secondary uppercase tracking-widest">Proof of Achievement</label>
          
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <LinkIcon className="w-4 h-4 text-plasma-text-secondary" />
                </div>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => {
                    setProofUrl(e.target.value);
                    setPreview(null);
                  }}
                  placeholder="Paste URL (YouTube/Twitch/Image)..."
                  className="w-full bg-plasma-bg border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-sm text-plasma-text-primary placeholder:text-plasma-text-secondary/50 focus:outline-none focus:border-plasma-primary transition-colors"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] font-bold text-plasma-text-secondary uppercase">Or</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-plasma-slate rounded-lg border border-white/5 text-sm font-bold text-plasma-text-primary hover:bg-plasma-slate-hover transition-colors"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-plasma-primary" />}
                {uploading ? "Uploading..." : "Upload Image Proof"}
              </button>
            </div>

            {preview && (
              <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => { setPreview(null); setProofUrl(""); }}
                  className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {error && <p className="text-plasma-error text-[11px] font-bold text-center bg-plasma-error/10 py-2 rounded-lg border border-plasma-error/20">{error}</p>}
      </div>
    </ModalWrapper>
  );
}
