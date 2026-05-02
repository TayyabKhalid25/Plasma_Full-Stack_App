import { useState, useEffect } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Copy, Link2, Check, Send, Loader2 } from "lucide-react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { getAvatarUrl } from "@/lib/utils";

export function ShareModal({ isOpen, onClose, shareType = "post", shareId }) {
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sentTo, setSentTo] = useState(new Set());

  // Fetch real friends when modal opens
  useEffect(() => {
    if (!isOpen || !token) return;
    const fetchFriends = async () => {
      setLoadingFriends(true);
      try {
        const res = await fetch(`${API_BASE}/api/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const all = [...(data.data.online || []), ...(data.data.offline || [])];
          setFriends(all.map(f => ({
            id: f.id,
            name: f.name,
            avatar: getAvatarUrl(f.avatar, f.name),
          })));
        }
      } catch (err) {
        console.error("Failed to fetch friends", err);
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchFriends();
    setSentTo(new Set());
  }, [isOpen, token]);

  const shareLink = `https://plasma.gg/${shareType}/${shareId || "1234"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToFriend = async (friendId) => {
    try {
      const isRally = shareType === "rally";
      await fetch(`${API_BASE}/api/messages/${friendId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: isRally ? `Invited you to a Rally!` : `Check this out: ${shareLink}`,
          isLobbyInvite: isRally,
          lobbyLink: isRally ? shareLink : null
        })
      });
      setSentTo(prev => new Set(prev).add(friendId));
    } catch (err) {
      console.error("Failed to share with friend", err);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Share">
      <div className="space-y-6">
        
        {/* Copy Link Section */}
        <div>
          <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">Copy Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-plasma-bg border border-white/10 rounded-lg px-4 py-3 flex items-center gap-3">
              <Link2 className="w-4 h-4 text-plasma-text-secondary shrink-0" />
              <input 
                readOnly 
                value={shareLink} 
                className="bg-transparent border-none text-sm text-plasma-text-primary w-full outline-none" 
              />
            </div>
            <button 
              onClick={handleCopy}
              className={`p-3 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer ${copied ? "bg-plasma-success text-white" : "bg-plasma-primary text-white hover:bg-plasma-primary/80"}`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Share via DM Section */}
        <div>
          <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">Send to Friend</label>
          <input 
            type="text" 
            placeholder="Search friends..." 
            value={friendSearch}
            onChange={(e) => setFriendSearch(e.target.value)}
            className="w-full bg-plasma-bg border border-white/10 rounded-lg px-4 py-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary mb-3"
          />
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {loadingFriends ? (
              <div className="flex items-center justify-center py-4 text-plasma-text-secondary text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading friends...
              </div>
            ) : friends.filter(f => f.name.toLowerCase().includes(friendSearch.toLowerCase())).length === 0 ? (
              <p className="text-sm text-plasma-text-secondary text-center py-4">No friends found.</p>
            ) : (
              friends.filter(f => f.name.toLowerCase().includes(friendSearch.toLowerCase())).map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <img src={friend.avatar} alt="" className="w-8 h-8 rounded-full bg-plasma-slate" />
                    <span className="text-sm font-medium text-plasma-text-primary">{friend.name}</span>
                  </div>
                  {sentTo.has(friend.id) ? (
                    <span className="text-[10px] font-bold text-plasma-success bg-plasma-success/10 px-3 py-1.5 rounded-lg">Sent!</span>
                  ) : (
                    <button 
                      onClick={() => handleSendToFriend(friend.id)}
                      className="p-2 rounded-full bg-plasma-primary/20 text-plasma-primary opacity-0 group-hover:opacity-100 transition-all hover:bg-plasma-primary hover:text-white cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
