"use client";

import { useState, useEffect } from "react";
import { Upload, Check, Plus, Trash2, Image, Loader2 } from "lucide-react";

export interface Logo {
  id: string;
  url: string;
  name: string;
  uploadedAt: string;
}

interface LogoGalleryProps {
  storeSlug: string;
  selectedLogoId: string | null;
  onSelect: (logo: Logo) => void;
  onUploadNew: (logo: Logo) => void;
}

export function LogoGallery({ storeSlug, selectedLogoId, onSelect, onUploadNew }: LogoGalleryProps) {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [uploading, setUploading] = useState(false);

  // Load logos from localStorage (per store)
  useEffect(() => {
    const saved = localStorage.getItem(`cs-logos-${storeSlug}`);
    if (saved) {
      try {
        setLogos(JSON.parse(saved));
      } catch {}
    }
  }, [storeSlug]);

  // Save logos to localStorage
  const saveLogos = (updated: Logo[]) => {
    setLogos(updated);
    localStorage.setItem(`cs-logos-${storeSlug}`, JSON.stringify(updated));
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/svg+xml", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a PNG, JPG, SVG, or PDF file");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newLogo: Logo = {
        id: `logo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        url: ev.target?.result as string,
        name: file.name,
        uploadedAt: new Date().toISOString(),
      };

      const updated = [newLogo, ...logos];
      saveLogos(updated);
      onUploadNew(newLogo);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (logoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = logos.filter((l) => l.id !== logoId);
    saveLogos(updated);
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {/* Upload new button */}
        <label className="aspect-square border-2 border-dashed border-gray-200 hover:border-kraft flex flex-col items-center justify-center cursor-pointer transition-colors">
          <input type="file" accept=".png,.jpg,.jpeg,.svg,.pdf" onChange={handleUpload} className="hidden" />
          {uploading ? (
            <Loader2 size={18} className="text-kraft animate-spin" />
          ) : (
            <>
              <Plus size={18} className="text-kraft mb-1" />
              <span className="text-[8px] tracking-wider uppercase text-smoky">Upload</span>
            </>
          )}
        </label>

        {/* Logo thumbnails */}
        {logos.map((logo) => (
          <button
            key={logo.id}
            onClick={() => onSelect(logo)}
            className={`relative aspect-square border-2 flex items-center justify-center overflow-hidden group transition-all ${
              selectedLogoId === logo.id
                ? "border-black ring-2 ring-kraft/30"
                : "border-gray-200 hover:border-kraft"
            }`}
          >
            <img src={logo.url} alt={logo.name} className="max-w-full max-h-full object-contain p-2" />

            {/* Selected indicator */}
            {selectedLogoId === logo.id && (
              <div className="absolute top-1 right-1 bg-black text-white w-4 h-4 flex items-center justify-center">
                <Check size={10} />
              </div>
            )}

            {/* Delete button on hover */}
            <button
              onClick={(e) => handleDelete(logo.id, e)}
              className="absolute bottom-1 right-1 bg-white/90 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/10"
            >
              <Trash2 size={10} className="text-error" />
            </button>

            {/* Name tooltip */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[7px] text-white truncate">{logo.name}</p>
            </div>
          </button>
        ))}

        {/* Empty state */}
        {logos.length === 0 && !uploading && (
          <div className="col-span-3 flex items-center justify-center py-4">
            <p className="text-xs text-smoky">No logos uploaded yet. Click + to add your first logo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
