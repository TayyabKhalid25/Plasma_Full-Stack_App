import { useState } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Copy, Link2, Check, Send } from "lucide-react";

export function ShareModal({ isOpen, onClose, shareType = "post", shareId }) {
  const [copied, setCopied] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");

  // Dummy friend list to share with
  const friends = [
    { id: 1, name: "Vanguard", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vanguard" },
    { id: 2, name: "Nebula", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nebula" },
    { id: 3, name: "ApexHunter", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Apex" }
  ];

  const shareLink = `https://plasma.gg/${shareType}/${shareId || "1234"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToFriend = (friendId) => {
    // In a real app, send via apiService
    console.log(`Shared with friend ${friendId}`);
    onClose();
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
              className={`p-3 rounded-lg flex items-center justify-center transition-colors shrink-0 ${copied ? "bg-plasma-success text-white" : "bg-plasma-primary text-white hover:bg-plasma-primary/80"}`}
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
            {friends.filter(f => f.name.toLowerCase().includes(friendSearch.toLowerCase())).map(friend => (
              <div key={friend.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-3">
                  <img src={friend.avatar} alt="" className="w-8 h-8 rounded-full bg-plasma-slate" />
                  <span className="text-sm font-medium text-plasma-text-primary">{friend.name}</span>
                </div>
                <button 
                  onClick={() => handleSendToFriend(friend.id)}
                  className="p-2 rounded-full bg-plasma-primary/20 text-plasma-primary opacity-0 group-hover:opacity-100 transition-all hover:bg-plasma-primary hover:text-white"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
