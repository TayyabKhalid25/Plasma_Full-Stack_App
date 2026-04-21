import { useState } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Search, MessageSquare } from "lucide-react";

export function NewMessageModal({ isOpen, onClose, onStartChat }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Dummy friend list
  const friends = [
    { id: "f1", name: "Vanguard", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vanguard", online: true },
    { id: "f2", name: "Nebula", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nebula", online: false },
    { id: "f3", name: "ApexHunter", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Apex", online: true },
    { id: "f4", name: "Wraith", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wraith", online: false },
  ];

  const filtered = friends.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = async (friend) => {
    setLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 400));
    setLoading(false);
    if (onStartChat) onStartChat(friend);
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
          {filtered.length === 0 ? (
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
