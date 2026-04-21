import { useState, useEffect } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, ImageIcon, X } from "lucide-react";
import { UploadMediaModal } from "./UploadMediaModal";
import { useModal } from "@/hooks/useModal";

export function EditPostModal({ isOpen, onClose, post, onSave }) {
  const [content, setContent] = useState("");
  const [mediaURL, setMediaURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const uploadModal = useModal();

  // Sync state when post changes or modal opens
  useEffect(() => {
    if (isOpen && post) {
      setContent(post.text || "");
      setMediaURL(post.image || null);
    }
  }, [isOpen, post]);

  const handleSave = async () => {
    if (!content.trim() && !mediaURL) return;
    setLoading(true);
    try {
      await onSave(post.id, content, mediaURL);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isVideo = (url) => url?.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <>
      <ModalWrapper isOpen={isOpen} onClose={onClose} title="Edit Post" maxWidth="max-w-lg">
        <div className="flex flex-col gap-5 p-2">
          {/* Text Input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full bg-plasma-slate-hover rounded-xl p-4 text-sm text-plasma-text-primary placeholder:text-plasma-text-secondary outline-none border border-white/5 focus:border-plasma-primary/50 transition-colors resize-none"
          />

          {/* Media Preview */}
          {mediaURL && (
            <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center min-h-[120px]">
              {isVideo(mediaURL) ? (
                <video src={mediaURL} controls className="w-full max-h-[250px] object-contain" />
              ) : (
                <img src={mediaURL} alt="Post media" className="w-full max-h-[250px] object-contain" />
              )}
              <button
                onClick={() => setMediaURL(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => uploadModal.open()}
              data-tooltip={mediaURL ? "Replace Media" : "Add Media"}
              className="flex items-center gap-2 text-plasma-text-secondary hover:text-plasma-text-primary transition-colors cursor-pointer text-sm"
            >
              <ImageIcon className="w-5 h-5" />
              {mediaURL ? "Replace Media" : "Add Media"}
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2 rounded-xl text-sm font-bold text-plasma-text-primary bg-plasma-slate border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || (!content.trim() && !mediaURL)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-plasma-primary hover:bg-plasma-primary/80 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </ModalWrapper>

      <UploadMediaModal
        isOpen={uploadModal.isOpen}
        onClose={uploadModal.close}
        onUploadComplete={(url) => setMediaURL(url)}
      />
    </>
  );
}
