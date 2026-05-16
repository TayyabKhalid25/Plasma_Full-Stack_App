import { useState, useEffect } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Search, Link2, UserPlus, Check } from "lucide-react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { getAvatarUrl } from "@/lib/utils";

/**
 * InviteFriendsModal Component
 * @component
 * @param {object} props
 */
export function InviteFriendsModal({ isOpen, onClose }) {
  const { token, user } = useAuth();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [invitedIds, setInvitedIds] = useState(new Set());
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const inviteLink = `https://plasma.gg/invite/${user?.username || "user"}-${user?.id?.split('-')[0] || "1234"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Search API
  useEffect(() => {
    if (!search || !token) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(search)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data.map(u => ({
            id: u.plasmaUserID,
            name: u.username,
            avatar: getAvatarUrl(u.avatarURL, u.username),
            isRequested: u.isRequested,
            isMutual: u.isMutual
          })));
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, token]);

  const handleInvite = async (userId) => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/users/${userId}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvitedIds(prev => new Set(prev).add(userId));
    } catch (err) {
      console.error("Invite failed", err);
    } finally {
      setLoading(false);
    }
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
              className={`p-3 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer ${copied ? "bg-plasma-success text-white" : "bg-plasma-primary text-white hover:bg-plasma-primary/80"}`}
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
          {search.length > 0 && searching ? (
            <div className="text-center py-6 text-plasma-text-secondary flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-sm">Searching...</span>
            </div>
          ) : search.length > 0 && searchResults.length === 0 ? (
            <div className="text-center py-6 text-plasma-text-secondary">
              <p className="text-sm">No users found.</p>
            </div>
          ) : search.length > 0 ? (
            searchResults.map((user) => {
              const isInvited = invitedIds.has(user.id) || user.isRequested;
              return (
                <div
                  key={user.id}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt="" className="w-10 h-10 rounded-full bg-plasma-slate" />
                    <span className="text-sm font-bold text-plasma-text-primary">{user.name}</span>
                  </div>
                  {user.isMutual ? (
                    <span className="text-[10px] font-bold text-plasma-success bg-plasma-success/10 px-3 py-1.5 rounded-lg">Friends</span>
                  ) : (
                    <button 
                      onClick={() => handleInvite(user.id)}
                      disabled={isInvited || loading}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${isInvited ? "bg-plasma-success/20 text-plasma-success" : "bg-plasma-primary/20 text-plasma-primary hover:bg-plasma-primary hover:text-white"}`}
                    >
                      {isInvited ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {isInvited ? "Sent" : "Invite"}
                    </button>
                  )}
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
