import { useState } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Search, Link2, UserPlus, Check } from "lucide-react";

export function InviteFriendsModal({ isOpen, onClose }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [invitedIds, setInvitedIds] = useState([]);
  
  // Dummy users to invite
  const searchResults = [
    { id: "u1", name: "CyberNinja", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CyberNinja" },
    { id: "u2", name: "GhostRider", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GhostRider" },
    { id: "u3", name: "PlasmaFan", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PlasmaFan" },
  ];

  const filtered = searchResults.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const inviteLink = "https://plasma.gg/invite/wahaj-1234";

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (userId) => {
    setLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 500));
    setInvitedIds(prev => [...prev, userId]);
    setLoading(false);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Invite Friends">
      <div className="flex flex-col h-[400px]">
        {/* Copy Invite Link */}
        <div className="mb-6 shrink-0">
          <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">Your Invite Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-plasma-bg border border-white/10 rounded-lg px-4 py-3 flex items-center gap-3">
              <Link2 className="w-4 h-4 text-plasma-text-secondary shrink-0" />
              <input 
                readOnly 
                value={inviteLink} 
                className="bg-transparent border-none text-sm text-plasma-text-primary w-full outline-none" 
              />
            </div>
            <button 
              onClick={handleCopy}
              className={`p-3 rounded-lg flex items-center justify-center transition-colors shrink-0 ${copied ? "bg-plasma-success text-white" : "bg-plasma-primary text-white hover:bg-plasma-primary/80"}`}
            >
              {copied ? <Check className="w-5 h-5" /> : "Copy"}
            </button>
          </div>
        </div>

        {/* Search Users */}
        <div className="relative shrink-0 mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-plasma-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for users by username..."
            className="w-full bg-plasma-slate border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-plasma-text-primary focus:border-plasma-primary outline-none transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {search.length > 0 && filtered.length === 0 ? (
            <div className="text-center py-6 text-plasma-text-secondary">
              <p className="text-sm">No users found.</p>
            </div>
          ) : search.length > 0 ? (
            filtered.map((user) => {
              const isInvited = invitedIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt="" className="w-10 h-10 rounded-full bg-plasma-slate" />
                    <span className="text-sm font-bold text-plasma-text-primary">{user.name}</span>
                  </div>
                  <button 
                    onClick={() => handleInvite(user.id)}
                    disabled={isInvited || loading}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 ${isInvited ? "bg-plasma-success/20 text-plasma-success" : "bg-plasma-primary/20 text-plasma-primary hover:bg-plasma-primary hover:text-white"}`}
                  >
                    {isInvited ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isInvited ? "Sent" : "Invite"}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-plasma-text-secondary">
              <p className="text-sm">Search for users to invite directly.</p>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
