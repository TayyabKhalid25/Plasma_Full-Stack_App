import { ShieldAlert, RefreshCcw } from "lucide-react";

/**
 * SteamPrivacyWarning Component
 * @component
 * @param {object} props
 */
export function SteamPrivacyWarning({ isPrivate, onSync, syncing }) {
  if (!isPrivate) return null;

  return (
    <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in relative z-[40]">
      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
        <ShieldAlert className="w-6 h-6 text-amber-500" />
      </div>
      
      <div className="flex-1">
        <h4 className="text-amber-500 font-bold text-sm">Steam Profile is Private</h4>
        <p className="text-plasma-text-secondary text-[12px] mt-0.5 leading-relaxed">
          Your Steam privacy settings are preventing us from fetching your latest achievements and library data. 
          Please set your <strong>Game details</strong> to <strong>Public</strong> in your Steam Privacy Settings and then re-sync.
        </p>
      </div>

      <button 
        onClick={onSync}
        disabled={syncing}
        className="px-5 py-2.5 bg-amber-500 text-black font-bold text-xs rounded-full hover:bg-amber-400 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(245,158,11,0.2)] active:scale-95"
      >
        <RefreshCcw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? "Syncing..." : "Re-Sync Now"}
      </button>
    </div>
  );
}
