"use client";

import { useState, useEffect } from "react";
import { MapPin, Image, Check, X, Loader2, Plus } from "lucide-react";
import { LogoGallery, Logo } from "./LogoGallery";
import { MockupPreview } from "./MockupPreview";

interface PlacementConfig {
  locationId: string;
  locationLabel: string;
  logoId: string | null;
  logoUrl: string | null;
  logoName: string;
}

interface ProductConfiguratorProps {
  productName: string;
  productImage: string | null;
  productCategory: string;
  productProvider: string;
  productBlueprintId?: string;
  storeSlug: string;
  locations: Array<{ id: string; label: string }>;
  onConfigChange: (placements: PlacementConfig[]) => void;
  selectedColor?: string;
  colorImageUrl?: string | null;
}

export function ProductConfigurator({
  productName,
  productImage,
  productCategory,
  productProvider,
  productBlueprintId,
  storeSlug,
  locations,
  onConfigChange,
  selectedColor,
  colorImageUrl,
}: ProductConfiguratorProps) {
  const [placements, setPlacements] = useState<PlacementConfig[]>([]);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [printifyMockups, setPrintifyMockups] = useState<string[]>([]);
  const [generatingMockup, setGeneratingMockup] = useState(false);

  // Notify parent of changes
  useEffect(() => {
    onConfigChange(placements);
  }, [placements]);

  const toggleLocation = (locId: string, locLabel: string) => {
    const existing = placements.find((p) => p.locationId === locId);
    if (existing) {
      // Remove this placement
      setPlacements((prev) => prev.filter((p) => p.locationId !== locId));
    } else {
      // Add placement — open gallery to assign a logo
      setPlacements((prev) => [
        ...prev,
        { locationId: locId, locationLabel: locLabel, logoId: null, logoUrl: null, logoName: "" },
      ]);
      setActiveLocation(locId);
      setShowGallery(true);
    }
  };

  const assignLogo = (locId: string, logo: Logo) => {
    setPlacements((prev) =>
      prev.map((p) =>
        p.locationId === locId
          ? { ...p, logoId: logo.id, logoUrl: logo.url, logoName: logo.name }
          : p
      )
    );
    setShowGallery(false);
    setActiveLocation(null);
  };

  const removeLogo = (locId: string) => {
    setPlacements((prev) =>
      prev.map((p) =>
        p.locationId === locId
          ? { ...p, logoId: null, logoUrl: null, logoName: "" }
          : p
      )
    );
  };

  const generatePrintifyMockup = async () => {
    if (productProvider !== "printify" || !productBlueprintId) return;
    const firstLogo = placements.find((p) => p.logoUrl);
    if (!firstLogo) return;

    setGeneratingMockup(true);
    try {
      let imageUrl = firstLogo.logoUrl!;

      // Upload data URL to Supabase Storage to get a public URL
      if (imageUrl.startsWith("data:")) {
        try {
          // Convert data URL to blob
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const formData = new FormData();
          formData.append("file", blob, "logo.png");
          formData.append("storeId", storeSlug);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              imageUrl = uploadData.url;
            }
          }
        } catch {
          // If upload fails, can't generate mockup with real logo
        }
      }

      // If still a data URL, we can't send to Printify
      if (imageUrl.startsWith("data:")) {
        setGeneratingMockup(false);
        alert("Please try uploading your logo again. The file needs to be accessible online for mockup generation.");
        return;
      }

      const res = await fetch("/api/mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprintId: parseInt(productBlueprintId),
          imageUrl,
          position: ["left_chest", "right_chest"].includes(firstLogo.locationId) ? "front" : firstLogo.locationId,
          placement: firstLogo.locationId,
          color: selectedColor || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const urls = (data.mockups || [])
          .filter((m: { src: string }) => m.src)
          .slice(0, 4)
          .map((m: { src: string }) => m.src);
        setPrintifyMockups(urls);
      }
    } catch {}
    setGeneratingMockup(false);
  };

  const configuredPlacements = placements.filter((p) => p.logoUrl);

  return (
    <div className="space-y-5">
      {/* Step 1: Select Logo Placements */}
      <div>
        <p className="text-xs font-semibold mb-2 flex items-center gap-2">
          <MapPin size={14} className="text-kraft-dark" />
          Select Logo Placements
        </p>
        <p className="text-[10px] text-smoky mb-3">
          Choose where to place your logo. Each location can have a different logo.
        </p>

        <div className="flex flex-wrap gap-2">
          {locations.map((loc) => {
            const placement = placements.find((p) => p.locationId === loc.id);
            const hasLogo = placement?.logoUrl;

            return (
              <button
                key={loc.id}
                onClick={() => toggleLocation(loc.id, loc.label)}
                className={`px-4 py-2.5 text-xs tracking-wide transition-all flex items-center gap-2 ${
                  placement
                    ? hasLogo
                      ? "bg-success/10 text-success border border-success/30"
                      : "bg-kraft/10 text-kraft-dark border border-kraft/30"
                    : "bg-off-white text-smoky hover:bg-gray-200 border border-transparent"
                }`}
              >
                {hasLogo && <Check size={12} />}
                {loc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Assign Logos to Each Placement */}
      {placements.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-3 flex items-center gap-2">
            <Image size={14} className="text-kraft-dark" />
            Assign Logos
          </p>

          <div className="space-y-3">
            {placements.map((placement) => (
              <div
                key={placement.locationId}
                className={`border p-3 flex items-center gap-3 ${
                  placement.logoUrl ? "border-success/30 bg-success/5" : "border-kraft/30 bg-kraft/5"
                }`}
              >
                {/* Logo preview */}
                {placement.logoUrl ? (
                  <div className="w-12 h-12 bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img src={placement.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-white border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                    <Plus size={14} className="text-smoky" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{placement.locationLabel}</p>
                  {placement.logoUrl ? (
                    <p className="text-[10px] text-success truncate">{placement.logoName}</p>
                  ) : (
                    <p className="text-[10px] text-kraft-dark">No logo assigned</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setActiveLocation(placement.locationId);
                      setShowGallery(true);
                    }}
                    className="px-3 py-1.5 text-[9px] tracking-wider uppercase bg-black text-white hover:bg-brown transition-colors"
                  >
                    {placement.logoUrl ? "Change" : "Add Logo"}
                  </button>
                  {placement.logoUrl && (
                    <button
                      onClick={() => removeLogo(placement.locationId)}
                      className="p-1.5 text-smoky hover:text-error transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logo Gallery Modal */}
      {showGallery && activeLocation && (
        <div className="border border-kraft/30 bg-off-white/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold">
              Select Logo for {placements.find((p) => p.locationId === activeLocation)?.locationLabel}
            </p>
            <button onClick={() => { setShowGallery(false); setActiveLocation(null); }}>
              <X size={14} className="text-smoky" />
            </button>
          </div>
          <LogoGallery
            storeSlug={storeSlug}
            selectedLogoId={placements.find((p) => p.locationId === activeLocation)?.logoId || null}
            onSelect={(logo) => assignLogo(activeLocation, logo)}
            onUploadNew={(logo) => assignLogo(activeLocation, logo)}
          />
        </div>
      )}

      {/* Live Mockup Preview */}
      {configuredPlacements.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-3 flex items-center gap-2">
            Preview
          </p>

          {/* Printify: use real mockup API */}
          {productProvider === "printify" && printifyMockups.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {printifyMockups.slice(0, 4).map((url, i) => (
                <div key={i} className="bg-off-white border border-gray-100 overflow-hidden">
                  <img src={url} alt={`Mockup ${i + 1}`} className="w-full h-auto" />
                </div>
              ))}
            </div>
          ) : productProvider === "printify" && !generatingMockup ? (
            <button
              onClick={generatePrintifyMockup}
              className="w-full bg-black text-white py-3 text-xs tracking-[0.1em] uppercase font-medium hover:bg-brown transition-colors"
            >
              Generate Realistic Mockup
            </button>
          ) : productProvider !== "printify" ? (
            /* FE products: canvas overlay mockup */
            <div className={`grid gap-3 ${configuredPlacements.length > 1 ? "grid-cols-2" : "grid-cols-1 max-w-xs"}`}>
              {configuredPlacements.map((placement) => (
                <MockupPreview
                  key={placement.locationId}
                  productImage={colorImageUrl || productImage}
                  productName={productName}
                  logoUrl={placement.logoUrl!}
                  placement={placement.locationId}
                  productCategory={productCategory}
                />
              ))}
            </div>
          ) : null}

          {generatingMockup && (
            <div className="mt-3 bg-off-white p-4 flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-kraft" />
              <span className="text-xs text-smoky">Generating mockup...</span>
            </div>
          )}

          {printifyMockups.length > 0 && productProvider !== "printify" && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {printifyMockups.map((url, i) => (
                <div key={i} className="bg-off-white border border-gray-100 overflow-hidden">
                  <img src={url} alt={`Mockup ${i + 1}`} className="w-full h-auto" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
