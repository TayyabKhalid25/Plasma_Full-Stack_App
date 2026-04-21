import { useState, useRef, useEffect } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Upload, X, Loader2 } from "lucide-react";
import { upload } from '@vercel/blob/client';

export function UploadMediaModal({ isOpen, onClose, onUploadComplete }) {
  const inputFileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPreview(null);
      setError(null);
      setUploading(false);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      onUploadComplete(newBlob.url);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to upload file");
      setUploading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Upload Media">
      <div className="flex flex-col items-center justify-center p-4">
        {!preview ? (
          <div 
            className="w-full h-48 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-plasma-primary hover:bg-plasma-primary/5 transition-colors"
            onClick={() => inputFileRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-plasma-text-secondary mb-3" />
            <p className="text-sm font-medium text-plasma-text-primary">Click to select a file</p>
            <p className="text-xs text-plasma-text-secondary mt-1">Supports JPG, PNG, GIF, WEBP, MP4, WEBM</p>
          </div>
        ) : (
          <div className="relative w-full rounded-xl overflow-hidden border border-white/10 group bg-black flex items-center justify-center min-h-[150px]">
            {file && file.type.startsWith('video/') ? (
              <video src={preview} controls className="w-full h-auto max-h-[300px] object-contain" />
            ) : (
              <img src={preview} alt="Preview" className="w-full h-auto max-h-[300px] object-contain" />
            )}
            <button 
              onClick={() => {
                setFile(null);
                setPreview(null);
                if (inputFileRef.current) inputFileRef.current.value = '';
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <input 
          type="file" 
          ref={inputFileRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*,video/*"
        />

        {error && <p className="text-plasma-error text-sm mt-3 w-full text-center font-medium bg-plasma-error/10 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 w-full mt-6">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 rounded-full font-bold text-sm bg-plasma-slate border border-white/10 text-plasma-text-secondary hover:text-white transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className={`flex-1 py-2.5 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 transition-all ${
              !file || uploading 
                ? "bg-plasma-slate-hover text-plasma-text-secondary cursor-not-allowed opacity-50" 
                : "bg-primary-gradient hover:scale-[1.02] shadow-card-glow"
            }`}
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : (
              "Upload Media"
            )}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
