import { useState } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, AlertTriangle } from "lucide-react";
import { apiService } from "@/services/apiService";

export function ConfirmActionModal({ isOpen, onClose, title, message, requiredString, onConfirm, actionType = "danger" }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiService.confirmDangerAction(input, requiredString);
      if (onConfirm) onConfirm();
      onClose();
    } catch (err) {
      setError(err.errors?.confirmation || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const isDanger = actionType === "danger";

  const footer = (
    <div className="flex justify-end gap-3">
      <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold text-plasma-text-secondary hover:text-white transition-colors">
        Cancel
      </button>
      <button 
        onClick={handleSubmit} 
        disabled={loading || input !== requiredString}
        className={`px-6 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          isDanger ? "bg-plasma-error hover:bg-plasma-error/80" : "bg-plasma-primary hover:bg-plasma-primary/80"
        }`}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Confirm
      </button>
    </div>
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <div className="space-y-4">
        <div className={`p-4 rounded-xl flex gap-3 items-start ${isDanger ? "bg-plasma-error/10 border border-plasma-error/20" : "bg-plasma-warning/10 border border-plasma-warning/20"}`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 ${isDanger ? "text-plasma-error" : "text-plasma-warning"}`} />
          <p className="text-sm text-plasma-text-primary leading-relaxed">{message}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-plasma-text-secondary mb-2 block">
            To confirm, type <span className="font-mono text-plasma-text-primary bg-white/10 px-1 py-0.5 rounded select-all">{requiredString}</span> below:
          </label>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`w-full bg-plasma-bg border ${error ? 'border-plasma-error' : 'border-white/10'} rounded-lg px-4 py-2.5 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary transition-colors`}
            placeholder={requiredString}
          />
          {error && <span className="text-xs text-plasma-error mt-1 block">{error}</span>}
        </div>
      </div>
    </ModalWrapper>
  );
}
