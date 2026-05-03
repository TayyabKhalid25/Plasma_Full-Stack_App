import { useState, useRef } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, UploadCloud, ImageIcon } from "lucide-react";
import { apiService } from "@/services/apiService";

export function UploadAvatarModal({ isOpen, onClose, currentAvatar, onUpload }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("File size must be less than 2MB.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("File must be an image.");
        return;
      }
      setError(null);
      setSelectedImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setError(null);
    try {
      // Simulate an API call to upload the image
      // Normally this would be a FormData post
      await new Promise(r => setTimeout(r, 1000));
      if (onUpload) onUpload(preview);
      onClose();
    } catch (err) {
      setError("Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      fileInputRef.current.files = e.dataTransfer.files;
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold text-plasma-text-secondary hover:text-white transition-colors">
        Cancel
      </button>
      <button
        onClick={handleUpload}
        disabled={loading || !selectedImage}
        className="px-6 py-2 rounded-xl bg-primary-gradient text-white text-sm font-bold flex items-center gap-2 hover:shadow-card-glow transition-all disabled:opacity-50"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Save Changes
      </button>
    </div>
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Change Avatar" footer={footer}>
      <div className="space-y-6 flex flex-col items-center">
        {error && <div className="p-3 bg-plasma-error/10 border border-plasma-error/30 rounded-lg text-plasma-error text-sm w-full">{error}</div>}

        <div className="flex gap-6 items-center w-full justify-center">
          <div className="text-center">
            <p className="text-xs font-bold text-plasma-text-secondary uppercase mb-2">Current</p>
            <img src={currentAvatar} alt="Current" className="w-24 h-24 rounded-full border-2 border-plasma-slate bg-plasma-slate" />
          </div>

          <div className="h-12 w-px bg-white/10" />

          <div className="text-center">
            <p className="text-xs font-bold text-plasma-text-secondary uppercase mb-2">New</p>
            {preview ? (
              <img src={preview} alt="New" className="w-24 h-24 rounded-full border-2 border-plasma-primary bg-plasma-slate object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5">
                <ImageIcon className="w-6 h-6 text-plasma-text-secondary" />
              </div>
            )}
          </div>
        </div>

        <div
          className="w-full border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <UploadCloud className="w-8 h-8 text-plasma-primary mx-auto mb-3" />
          <p className="text-sm font-medium text-plasma-text-primary">Click or drag an image here to upload</p>
          <p className="text-xs text-plasma-text-secondary mt-1">JPG or PNG. Max size 2MB.</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg"
            className="hidden"
          />
        </div>
      </div>
    </ModalWrapper>
  );
}
