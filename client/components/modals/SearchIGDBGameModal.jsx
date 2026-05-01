import { useState, useEffect } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Search, Loader2, Gamepad2, Plus } from "lucide-react";
import { apiService } from "@/services/apiService";

export function SearchIGDBGameModal({ isOpen, onClose, onAddGame }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        setError(null);
        try {
          const res = await apiService.searchIGDB(query);
          setResults(res);
        } catch (err) {
          setError("Failed to fetch games. Try again.");
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500); // debounce

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleAddGame = async (game) => {
    setAddingId(game.id);
    try {
      await apiService.addGameToLibrary(game);
      if (onAddGame) onAddGame(game);
      onClose();
    } catch (err) {
      setError(err.errors?.main || "Failed to add game.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Add Game to Library" maxWidth="max-w-xl">
      <div className="flex flex-col h-[500px]">
        <div className="relative shrink-0 mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-plasma-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search IGDB for a game..."
            className="w-full bg-plasma-bg border border-white/10 rounded-xl py-3 pl-12 pr-4 text-plasma-text-primary focus:border-plasma-primary outline-none transition-colors"
          />
          {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-plasma-primary animate-spin" />}
        </div>

        {error && <p className="text-plasma-error text-sm mb-4">{error}</p>}

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {query.trim().length > 0 && results.length === 0 && !loading && (
            <div className="text-center py-10 text-plasma-text-secondary">
              <Gamepad2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No games found for "{query}"</p>
            </div>
          )}

          {query.trim().length === 0 && (
            <div className="text-center py-10 text-plasma-text-secondary">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Type to start searching</p>
            </div>
          )}

          {results.map((game) => (
            <div key={game.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors group">
              <img src={game.cover} alt="" className="w-12 h-16 object-cover rounded-md bg-plasma-slate shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-plasma-text-primary truncate">{game.title}</h4>
                <p className="text-xs text-plasma-text-secondary mt-1">{game.platform}</p>
              </div>
              <button
                onClick={() => handleAddGame(game)}
                disabled={addingId === game.id}
                className="p-2 rounded-lg bg-plasma-primary/20 text-plasma-primary hover:bg-plasma-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {addingId === game.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </ModalWrapper>
  );
}
