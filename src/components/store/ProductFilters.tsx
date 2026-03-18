"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

interface FilterState {
  gender: string;
  fit: string;
  fabric: string;
  brand: string;
  priceRange: string;
  feature: string;
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  activeFilters: FilterState;
  category: string;
}

const GENDERS = ["All", "Unisex", "Men's", "Women's", "Youth"];

const FITS: Record<string, string[]> = {
  default: ["All", "Regular", "Slim", "Relaxed", "Oversized"],
  "Headwear": ["All", "Structured", "Unstructured", "Snapback", "Fitted", "Trucker"],
  "Drinkware": ["All"],
};

const FABRICS: Record<string, string[]> = {
  default: ["All", "100% Cotton", "Cotton Blend", "Polyester", "Tri-Blend", "Performance", "Fleece", "Ring-Spun"],
  "Headwear": ["All", "Cotton", "Polyester", "Mesh", "Wool Blend", "Acrylic"],
  "Drinkware": ["All", "Stainless Steel", "Ceramic", "Glass", "Plastic"],
  "Bags": ["All", "Canvas", "Polyester", "Nylon", "Cotton"],
  "Outerwear": ["All", "Fleece", "Softshell", "Down", "Polyester", "Nylon", "Wool Blend"],
};

const FEATURES: Record<string, string[]> = {
  default: ["All"],
  "T-Shirts & Tops": ["All", "Breathable", "Moisture-Wicking", "Lightweight", "Heavyweight", "Pocket Tee", "Long Sleeve", "V-Neck", "Crew Neck"],
  "Polos": ["All", "Breathable", "Moisture-Wicking", "Performance", "Pique Knit", "Jersey Knit", "Long Sleeve", "Pocket"],
  "Hoodies & Sweats": ["All", "Full Zip", "Pullover", "Quarter Zip", "Heavyweight", "Midweight", "Lightweight", "Fleece Lined"],
  "Outerwear": ["All", "Waterproof", "Windproof", "Insulated", "Lightweight", "Heavyweight", "Packable", "Reflective"],
  "Headwear": ["All", "Snapback", "Fitted", "Adjustable", "Mesh Back", "Pom Pom", "Cuffed", "Low Profile", "High Profile"],
  "Drinkware": ["All", "Insulated", "Double Wall", "Handle", "Straw", "Flip Lid", "Wide Mouth"],
};

const BRANDS = ["All", "Nike", "Adidas", "Under Armour", "Carhartt", "The North Face", "Columbia", "Champion", "Bella+Canvas", "Gildan", "Next Level", "Port Authority", "Sport-Tek", "Richardson", "OGIO", "Eddie Bauer", "Puma", "Brooks Brothers", "TravisMathew"];

const PRICE_RANGES = [
  { label: "All Prices", value: "all" },
  { label: "Under $20", value: "0-20" },
  { label: "$20 - $35", value: "20-35" },
  { label: "$35 - $50", value: "35-50" },
  { label: "$50 - $75", value: "50-75" },
  { label: "$75+", value: "75-999" },
];

export function ProductFilters({ onFilterChange, activeFilters, category }: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const fits = FITS[category] || FITS.default;
  const fabrics = FABRICS[category] || FABRICS.default;
  const features = FEATURES[category] || FEATURES.default;

  const activeCount = Object.values(activeFilters).filter((v) => v && v !== "All" && v !== "all").length;

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...activeFilters, [key]: value });
  };

  const clearAll = () => {
    onFilterChange({
      gender: "All",
      fit: "All",
      fabric: "All",
      brand: "All",
      priceRange: "all",
      feature: "All",
    });
  };

  return (
    <div className="mb-6">
      {/* Filter toggle button */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.1em] uppercase font-medium border transition-colors ${
            isOpen || activeCount > 0 ? "bg-black text-white border-black" : "border-gray-200 hover:border-kraft"
          }`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeCount > 0 && (
            <span className="bg-kraft text-black w-5 h-5 flex items-center justify-center text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-smoky hover:text-black flex items-center gap-1">
            <X size={12} /> Clear all filters
          </button>
        )}
      </div>

      {/* Quick filter pills — always visible */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {GENDERS.slice(1).map((g) => (
          <button
            key={g}
            onClick={() => updateFilter("gender", activeFilters.gender === g ? "All" : g)}
            className={`px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase transition-colors ${
              activeFilters.gender === g ? "bg-black text-white" : "bg-off-white text-smoky hover:text-black"
            }`}
          >
            {g}
          </button>
        ))}
        <span className="w-px h-6 bg-gray-200 self-center mx-1" />
        {(features.length > 1 ? features.slice(1, 5) : []).map((f) => (
          <button
            key={f}
            onClick={() => updateFilter("feature", activeFilters.feature === f ? "All" : f)}
            className={`px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase transition-colors ${
              activeFilters.feature === f ? "bg-black text-white" : "bg-off-white text-smoky hover:text-black"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Expanded filters */}
      {isOpen && (
        <div className="border border-gray-100 p-5 space-y-5 bg-off-white/30">
          {/* Brand */}
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-2 font-medium">Brand</p>
            <div className="flex flex-wrap gap-1.5">
              {BRANDS.map((b) => (
                <button
                  key={b}
                  onClick={() => updateFilter("brand", activeFilters.brand === b ? "All" : b)}
                  className={`px-2.5 py-1 text-[10px] tracking-wide transition-colors ${
                    activeFilters.brand === b && b !== "All" ? "bg-black text-white" : "bg-white border border-gray-200 text-smoky hover:border-kraft"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Fabric */}
          {fabrics.length > 1 && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-2 font-medium">Fabric</p>
              <div className="flex flex-wrap gap-1.5">
                {fabrics.map((f) => (
                  <button
                    key={f}
                    onClick={() => updateFilter("fabric", activeFilters.fabric === f ? "All" : f)}
                    className={`px-2.5 py-1 text-[10px] tracking-wide transition-colors ${
                      activeFilters.fabric === f && f !== "All" ? "bg-black text-white" : "bg-white border border-gray-200 text-smoky hover:border-kraft"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {features.length > 1 && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-2 font-medium">Features</p>
              <div className="flex flex-wrap gap-1.5">
                {features.map((f) => (
                  <button
                    key={f}
                    onClick={() => updateFilter("feature", activeFilters.feature === f ? "All" : f)}
                    className={`px-2.5 py-1 text-[10px] tracking-wide transition-colors ${
                      activeFilters.feature === f && f !== "All" ? "bg-black text-white" : "bg-white border border-gray-200 text-smoky hover:border-kraft"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fit */}
          {fits.length > 1 && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-2 font-medium">Fit / Style</p>
              <div className="flex flex-wrap gap-1.5">
                {fits.map((f) => (
                  <button
                    key={f}
                    onClick={() => updateFilter("fit", activeFilters.fit === f ? "All" : f)}
                    className={`px-2.5 py-1 text-[10px] tracking-wide transition-colors ${
                      activeFilters.fit === f && f !== "All" ? "bg-black text-white" : "bg-white border border-gray-200 text-smoky hover:border-kraft"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-2 font-medium">Price Range</p>
            <div className="flex flex-wrap gap-1.5">
              {PRICE_RANGES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => updateFilter("priceRange", activeFilters.priceRange === p.value ? "all" : p.value)}
                  className={`px-2.5 py-1 text-[10px] tracking-wide transition-colors ${
                    activeFilters.priceRange === p.value && p.value !== "all" ? "bg-black text-white" : "bg-white border border-gray-200 text-smoky hover:border-kraft"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to apply filters to product names (client-side filtering)
export function matchesFilters(productName: string, filters: FilterState): boolean {
  const name = productName.toLowerCase();

  // Gender
  if (filters.gender !== "All") {
    const g = filters.gender.toLowerCase().replace("'s", "");
    if (g === "unisex" && (name.includes("women") || name.includes("ladies") || name.includes("youth"))) return false;
    if (g === "men" && (name.includes("women") || name.includes("ladies") || name.includes("girl"))) return false;
    if (g === "women" && !name.includes("women") && !name.includes("ladies") && !name.includes("girl")) return false;
    if (g === "youth" && !name.includes("youth") && !name.includes("kid") && !name.includes("boy") && !name.includes("girl") && !name.includes("toddler")) return false;
  }

  // Brand
  if (filters.brand !== "All") {
    const brand = filters.brand.toLowerCase();
    if (!name.includes(brand) && !name.includes(brand.replace("+", " "))) return false;
  }

  // Fabric
  if (filters.fabric !== "All") {
    const fabric = filters.fabric.toLowerCase();
    if (!name.includes(fabric.split(" ")[0])) return false;
  }

  // Feature
  if (filters.feature !== "All") {
    const feature = filters.feature.toLowerCase();
    if (!name.includes(feature.split("-")[0].trim())) return false;
  }

  // Fit
  if (filters.fit !== "All") {
    const fit = filters.fit.toLowerCase();
    if (!name.includes(fit)) return false;
  }

  // Price range is handled separately since we need the price value

  return true;
}

export function matchesPriceRange(price: number | null, range: string): boolean {
  if (range === "all" || !price) return true;
  const [min, max] = range.split("-").map(Number);
  const dollars = price / 100;
  return dollars >= min && dollars <= max;
}

export const DEFAULT_FILTERS: FilterState = {
  gender: "All",
  fit: "All",
  fabric: "All",
  brand: "All",
  priceRange: "all",
  feature: "All",
};

export type { FilterState };
