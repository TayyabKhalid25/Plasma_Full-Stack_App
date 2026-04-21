import { useState } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Trash2, Edit2, AlertTriangle } from "lucide-react";

export function PostOptionsModal({ isOpen, onClose, post, onDelete, onEdit }) {
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    if (onDelete) onDelete(post.id);
    onClose();
  };

  const handleEdit = () => {
    if (onEdit) onEdit(post);
    onClose();
  };

  if (!post) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Post Options" maxWidth="max-w-sm">
      <div className="space-y-2">
        {!confirmDelete ? (
          <>
            <button 
              onClick={handleEdit}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors text-left"
            >
              <Edit2 className="w-5 h-5 text-plasma-text-secondary" />
              <div>
                <p className="text-sm font-bold text-plasma-text-primary">Edit Post</p>
                <p className="text-xs text-plasma-text-secondary">Modify the text or attachments</p>
              </div>
            </button>
            <div className="h-px bg-white/5 w-full" />
            <button 
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-plasma-error/10 transition-colors text-left group"
            >
              <Trash2 className="w-5 h-5 text-plasma-error opacity-80 group-hover:opacity-100" />
              <div>
                <p className="text-sm font-bold text-plasma-error opacity-90 group-hover:opacity-100">Delete Post</p>
                <p className="text-xs text-plasma-error/70">Permanently remove this post</p>
              </div>
            </button>
          </>
        ) : (
          <div className="p-4 bg-plasma-error/10 border border-plasma-error/20 rounded-xl space-y-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-plasma-error shrink-0" />
              <p className="text-sm text-plasma-text-primary">Are you sure you want to delete this post? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setConfirmDelete(false)} 
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-bold text-plasma-text-primary bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-bold text-white bg-plasma-error hover:bg-plasma-error/80 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}
