"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Search,
  Plus,
  Check,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { ProductConfigurator } from "@/components/store/ProductConfigurator";
import { supabase } from "@/lib/supabase";

interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  image: string | null;
  category: string;
  provider: "fulfill_engine" | "printify";
  providerId: string;
  printLocations?: Array<{ id: string; label: string }>;
  printMethods?: string[];
  brand?: string;
  colors?: string[];
  clientPrice?: number | null;
  colorImages?: Record<string, string>;
}

export default function CatalogPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [storeName, setStoreName] = useState("Store");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeProvider, setActiveProvider] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [customPrice, setCustomPrice] = useState("");
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [pricing, setPricing] = useState<{
    clientPrice: number;
    clientPriceFormatted: string;
  } | null>(null);
  const [bulkTiers, setBulkTiers] = useState<Array<{
    label: string;
    clientPriceFormatted: string;
    clientPrice: number;
    savings: number;
  }>>([]);
  const [loadingBulk, setLoadingBulk] = useState(false);

  useEffect(() => {
    async function loadStore() {
      const { data: store } = await supabase.from("stores").select("company_name").eq("slug", slug).single();
      if (store) setStoreName(store.company_name || "Store");
    }
    loadStore();
  }, [slug]);

  const fetchBulkPricing = async (product: CatalogProduct, method: string = "dtf", locs: number = 1) => {
    setLoadingBulk(true);
    try {
      const params = new URLSearchParams({
        productId: product.providerId,
        provider: product.provider,
        method,
        locations: String(locs),
        category: product.category,
      });
      const res = await fetch(`/api/catalog/bulk-pricing?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBulkTiers(data.tiers || []);
      }
    } catch {}
    setLoadingBulk(false);
  };


  // Fetch pricing when product selected or locations change
  const fetchPricing = async (productId: string, locations: number, method: string) => {
    try {
      const res = await fetch(
        `/api/catalog/pricing?productId=${productId}&locations=${locations}&method=${method}`
      );
      if (res.ok) {
        const data = await res.json();
        setPricing(data);
        setCustomPrice((data.clientPrice / 100).toFixed(2));
      } else {
        setPricing(null);
      }
    } catch {
      setPricing(null);
    }
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      if (next.has(color)) {
        next.delete(color);
      } else {
        next.add(color);
      }
      return next;
    });
  };


  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(search && { search }),
        ...(activeCategory !== "All" && { category: activeCategory }),
        ...(activeProvider !== "all" && { provider: activeProvider }),
      });

      const res = await fetch(`/api/catalog?${params}`);
      const data = await res.json();

      setProducts(data.products || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.categories?.length) {
        setCategories(data.categories);
      }
    } catch {
      // Catalog fetch failed silently
    }
    setLoading(false);
  }, [page, search, activeCategory, activeProvider]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  const handleAddToStore = async (product: CatalogProduct, price?: number) => {
    setAddingId(product.id);
    try {
      const res = await fetch(
        "/api/stores/a1b2c3d4-e5f6-7890-abcd-ef1234567890/products",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: product.name,
            description: product.description,
            price: price || 2500,
            cost: 1000,
            category: product.category,
            provider: product.provider,
            providerId: product.providerId,
            images: product.image ? [product.image] : [],
            sizes: [],
            colors: Array.from(selectedColors),
            colorImages: product.colorImages || {},
          }),
        }
      );

      if (res.ok) {
        setAddedProducts((prev) => new Set([...prev, product.id]));
        setSelectedProduct(null);
        setCustomPrice("");
      }
    } catch {
      // Failed to add product silently
    }
    setAddingId(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName={storeName}
        logoUrl={null}
        creditBalance={0}
        cartCount={0}
        isAdmin={true}
        storeSlug={slug}
      />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-kraft-dark mb-1">
              Administration
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Product Catalog
            </h1>
            <p className="text-smoky text-sm mt-1">
              {total.toLocaleString()} products available.
              Click a product to see details and set pricing before adding.
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{addedProducts.size}</p>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky">
              Added
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-smoky"
          />
          <input
            type="text"
            placeholder="Search products... (hoodie, mug, tote, hat, blanket...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-kraft transition-colors"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          <button
            onClick={() => handleCategoryChange("All")}
            className={`px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase transition-colors ${
              activeCategory === "All"
                ? "bg-black text-white"
                : "bg-off-white text-smoky hover:text-black"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase transition-colors ${
                activeCategory === cat
                  ? "bg-black text-white"
                  : "bg-off-white text-smoky hover:text-black"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-kraft" />
            <span className="ml-3 text-smoky text-sm">Loading catalog...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-kraft mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-smoky text-sm">
              Try a different search or category
            </p>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {products.map((product) => {
                const isAdded = addedProducts.has(product.id);

                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (!isAdded) {
                        setSelectedProduct(product);
                        setCustomPrice("");
                        setSelectedColors(new Set());
                        setBulkTiers([]);
                        fetchBulkPricing(product);
                        // Auto-set pricing
                        if (product.clientPrice) {
                          setPricing({ clientPrice: product.clientPrice, clientPriceFormatted: `$${(product.clientPrice / 100).toFixed(2)}` });
                          setCustomPrice((product.clientPrice / 100).toFixed(2));
                        } else if (product.provider === "fulfill_engine") {
                          setPricing(null);
                          fetchPricing(product.providerId, 1, "dtf");
                        } else {
                          setPricing(null);
                        }
                      }
                    }}
                    className={`border transition-all text-left ${
                      isAdded
                        ? "border-success/30 bg-success/5"
                        : "border-gray-100 hover:border-kraft hover:shadow-md cursor-pointer"
                    }`}
                  >
                    {/* Product image */}
                    <div className="aspect-square bg-off-white overflow-hidden relative">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain p-2"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <Package size={24} className="text-kraft" />
                          <span className="text-[8px] tracking-wider uppercase text-smoky">
                            {product.brand || product.category}
                          </span>
                        </div>
                      )}

                      {isAdded && (
                        <div className="absolute top-2 right-2 bg-success text-white w-5 h-5 flex items-center justify-center">
                          <Check size={12} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5">
                      <span className="text-[9px] tracking-[0.1em] uppercase text-kraft-dark">
                        {product.category}
                      </span>
                      <h3 className="font-medium text-xs leading-tight mt-0.5 line-clamp-2">
                        {product.name}
                      </h3>
                      {isAdded ? (
                        <p className="mt-2 text-[9px] tracking-wider uppercase text-success font-medium">
                          Added to Store
                        </p>
                      ) : (
                        <p className="mt-2 text-[9px] tracking-wider uppercase text-smoky">
                          Click for details
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 hover:border-kraft disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-smoky">
                  Page <span className="font-medium text-black">{page}</span> of{" "}
                  {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-200 hover:border-kraft disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Configurator Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null); }}
        >
          <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-bold text-lg">{selectedProduct.name}</h2>
                <p className="text-[10px] tracking-[0.15em] uppercase text-kraft-dark mt-0.5">
                  {selectedProduct.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-off-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Top section: image + description */}
              <div className="flex gap-6">
                <div className="w-40 h-40 bg-off-white flex items-center justify-center overflow-hidden flex-shrink-0">
                  {(() => {
                    // Show color-specific image if a color is selected and we have it
                    const firstColor = selectedColors.size > 0 ? Array.from(selectedColors)[0] : null;
                    const colorImg = firstColor && selectedProduct.colorImages?.[firstColor];
                    const displayImg = colorImg || selectedProduct.image;
                    return displayImg ? (
                      <img
                        src={displayImg}
                        alt={selectedProduct.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-center">
                        <Package size={36} className="mx-auto text-kraft mb-2" />
                        <p className="text-[9px] text-smoky">
                          {selectedProduct.brand || selectedProduct.category}
                        </p>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex-1">
                  {selectedProduct.description && (
                    <p className="text-sm text-smoky leading-relaxed mb-3">
                      {selectedProduct.description}
                    </p>
                  )}
                  {selectedProduct.printMethods && selectedProduct.printMethods.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProduct.printMethods.map((method) => (
                        <span
                          key={method}
                          className="px-2 py-1 bg-off-white text-[9px] tracking-wide text-smoky capitalize"
                        >
                          {method.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 1: Choose Colors */}
              {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-black text-white text-xs font-bold flex items-center justify-center">1</span>
                    <p className="text-sm font-semibold">Choose Colors</p>
                    {selectedColors.size > 0 && (
                      <span className="text-[10px] text-kraft-dark ml-auto">
                        {selectedColors.size} selected
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-smoky mb-3">
                    Select which colors you want available for your team
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => toggleColor(color)}
                        className={`px-3 py-2 text-[10px] tracking-wide border transition-all ${
                          selectedColors.has(color)
                            ? "border-black bg-black text-white"
                            : "border-gray-200 text-smoky hover:border-kraft"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                  {selectedProduct.colors.length > 5 && (
                    <button
                      onClick={() => {
                        if (selectedColors.size === selectedProduct.colors!.length) {
                          setSelectedColors(new Set());
                        } else {
                          setSelectedColors(new Set(selectedProduct.colors!));
                        }
                      }}
                      className="text-[10px] text-kraft-dark hover:text-black mt-2 underline"
                    >
                      {selectedColors.size === selectedProduct.colors.length ? "Deselect All" : "Select All Colors"}
                    </button>
                  )}
                </div>
              )}

              {/* Step 2 & 3: Logo + Placement Configurator */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 bg-black text-white text-xs font-bold flex items-center justify-center">2</span>
                  <p className="text-sm font-semibold">Logo & Placement</p>
                </div>

                <ProductConfigurator
                  productName={selectedProduct.name}
                  productImage={selectedProduct.image}
                  productCategory={selectedProduct.category}
                  productProvider={selectedProduct.provider}
                  productBlueprintId={selectedProduct.providerId}
                  storeSlug="acme-corp"
                  locations={
                    selectedProduct.printLocations && selectedProduct.printLocations.length > 0
                      ? selectedProduct.printLocations
                      : getDefaultLocations(selectedProduct.category)
                  }
                  selectedColor={selectedColors.size > 0 ? Array.from(selectedColors)[0] : undefined}
                  onConfigChange={() => {}}
                />
              </div>

              {/* Pricing with Bulk Tiers */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-kraft text-black text-xs font-bold flex items-center justify-center">$</span>
                  <p className="text-sm font-semibold">Pricing</p>
                </div>

                {/* Main price */}
                <div className="bg-off-white p-5 mb-3">
                  <div className="text-center">
                    <p className="text-4xl font-bold">
                      {pricing ? pricing.clientPriceFormatted : customPrice ? `$${parseFloat(customPrice).toFixed(2)}` : "$—"}
                    </p>
                    <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mt-1">
                      per item · includes decoration
                    </p>
                  </div>

                  {!pricing && (
                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-gray-200">
                      <span className="text-xl font-bold">$</span>
                      <input
                        type="number"
                        placeholder="25.00"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-200 text-lg font-semibold focus:outline-none focus:border-kraft"
                        step="0.01"
                        min="0"
                      />
                      <span className="text-sm text-smoky">per item</span>
                    </div>
                  )}
                </div>

                {/* Bulk Volume Pricing Tiers */}
                {bulkTiers.length > 0 && (
                  <div className="border border-kraft/20 bg-off-white/50">
                    <div className="px-4 py-3 bg-kraft/10 border-b border-kraft/20">
                      <p className="text-xs font-bold tracking-wide uppercase">
                        Volume Discounts — Order More, Save More
                      </p>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left px-4 py-2 text-[10px] tracking-wider uppercase text-smoky">Quantity</th>
                          <th className="text-right px-4 py-2 text-[10px] tracking-wider uppercase text-smoky">Price Each</th>
                          <th className="text-right px-4 py-2 text-[10px] tracking-wider uppercase text-smoky">Savings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkTiers.map((tier, i) => (
                          <tr
                            key={i}
                            className={`border-b border-gray-100 ${i === 0 ? "" : "hover:bg-kraft/5"}`}
                          >
                            <td className="px-4 py-2.5 text-sm font-medium">{tier.label}</td>
                            <td className="px-4 py-2.5 text-sm font-bold text-right">
                              {tier.clientPriceFormatted}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {tier.savings > 0 ? (
                                <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5">
                                  Save {tier.savings}%
                                </span>
                              ) : (
                                <span className="text-xs text-smoky">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {loadingBulk && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={16} className="animate-spin text-kraft mr-2" />
                    <span className="text-xs text-smoky">Loading volume pricing...</span>
                  </div>
                )}
              </div>

              {/* Add to Store button */}
              <button
                onClick={() =>
                  handleAddToStore(
                    selectedProduct,
                    customPrice ? Math.round(parseFloat(customPrice) * 100) : 2500
                  )
                }
                disabled={addingId === selectedProduct.id || !customPrice}
                className={`w-full py-4 text-sm tracking-[0.15em] uppercase font-medium flex items-center justify-center gap-2 transition-all ${
                  !customPrice
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : addingId === selectedProduct.id
                      ? "bg-gray-300 text-gray-500"
                      : "bg-black text-white hover:bg-brown"
                }`}
              >
                {addingId === selectedProduct.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={16} />
                    {customPrice
                      ? `Add to Store — $${parseFloat(customPrice).toFixed(2)} per item`
                      : "Set a price to continue"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <StoreFooter companyName={storeName} />
    </div>
  );
}

// Default print locations by product category
function getDefaultLocations(category: string): Array<{ id: string; label: string }> {
  const cat = category.toLowerCase();

  if (cat.includes("shirt") || cat.includes("tee") || cat.includes("top") || cat.includes("polo") || cat.includes("apparel")) {
    return [
      { id: "left_chest", label: "Left Chest" },
      { id: "right_chest", label: "Right Chest" },
      { id: "front", label: "Full Front" },
      { id: "back", label: "Full Back" },
      { id: "left_sleeve_short", label: "Left Sleeve" },
      { id: "right_sleeve_short", label: "Right Sleeve" },
    ];
  }
  if (cat.includes("hoodie") || cat.includes("sweat") || cat.includes("quarter") || cat.includes("outerwear") || cat.includes("jacket") || cat.includes("vest")) {
    return [
      { id: "left_chest", label: "Left Chest" },
      { id: "right_chest", label: "Right Chest" },
      { id: "front", label: "Full Front" },
      { id: "back", label: "Full Back" },
      { id: "left_sleeve_long", label: "Left Sleeve" },
      { id: "right_sleeve_long", label: "Right Sleeve" },
    ];
  }
  if (cat.includes("hat") || cat.includes("cap") || cat.includes("headwear") || cat.includes("beanie")) {
    return [
      { id: "front", label: "Front Center" },
      { id: "back", label: "Back" },
    ];
  }
  if (cat.includes("mug") || cat.includes("drink") || cat.includes("bottle") || cat.includes("tumbler")) {
    return [
      { id: "wrap", label: "Wrap Around" },
      { id: "front", label: "Front" },
      { id: "laser_engrave", label: "Laser Engrave" },
    ];
  }
  if (cat.includes("bag") || cat.includes("tote") || cat.includes("backpack")) {
    return [
      { id: "front", label: "Front" },
      { id: "back", label: "Back" },
    ];
  }
  if (cat.includes("wall") || cat.includes("poster") || cat.includes("canvas") || cat.includes("art") ||
      cat.includes("coaster") || cat.includes("mousepad") || cat.includes("sticker") || cat.includes("patch") ||
      cat.includes("magnet") || cat.includes("keychain") || cat.includes("accessories")) {
    return [{ id: "front", label: "Full Print" }];
  }
  if (cat.includes("blanket") || cat.includes("pillow") || cat.includes("towel") || cat.includes("home")) {
    return [{ id: "front", label: "Full Print" }];
  }
  if (cat.includes("phone") || cat.includes("tech") || cat.includes("case")) {
    return [{ id: "front", label: "Full Print" }];
  }
  if (cat.includes("office") || cat.includes("notebook") || cat.includes("journal")) {
    return [{ id: "front", label: "Front Cover" }, { id: "back", label: "Back Cover" }];
  }
  // Default — single front placement
  return [
    { id: "front", label: "Front" },
  ];
}
