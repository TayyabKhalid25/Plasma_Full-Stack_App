import { useState, useEffect } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Search, MessageSquare } from "lucide-react";
import { useAuth, API_BASE } from "@/context/AuthContext";

export function NewMessageModal({ isOpen, onClose, onStartChat }) {
  const { token, user } = useAuth();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Fetch mutual friends when modal opens
  useEffect(() => {
    if (!isOpen || !token || !user) return;
    const fetchFriends = async () => {
      setLoadingFriends(true);
      try {
        const res = await fetch(`${API_BASE}/api/users/${user.id}/following`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          // Only show mutual follows (they can DM each other)
          setFriends(data.data
            .filter(f => f.isMutual)
            .map(f => ({
              id: f.plasmaUserID,
              name: f.username,
              avatar: f.avatarURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`,
              online: false,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch friends", err);
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchFriends();
  }, [isOpen, token, user]);

  const filtered = friends.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = async (friend) => {
    setLoading(true);
    if (onStartChat) onStartChat(friend);
    setLoading(false);
    onClose();
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="New Message">
      <div className="flex flex-col h-[400px]">
        <div className="relative shrink-0 mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-plasma-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="w-full bg-plasma-bg border border-white/10 rounded-xl py-3 pl-12 pr-4 text-plasma-text-primary focus:border-plasma-primary outline-none transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {loadingFriends ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <div className="w-10 h-10 rounded-full bg-plasma-slate-hover" />
                  <div className="w-24 h-4 rounded bg-plasma-slate-hover" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-plasma-text-secondary">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No friends found.</p>
            </div>
          ) : (
            filtered.map((friend) => (
              <button
                key={friend.id}
                onClick={() => handleSelect(friend)}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={friend.avatar} alt="" className="w-10 h-10 rounded-full bg-plasma-slate" />
                    {friend.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-plasma-success rounded-full border-2 border-plasma-slate" />}
                  </div>
                  <span className="text-sm font-bold text-plasma-text-primary">{friend.name}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
