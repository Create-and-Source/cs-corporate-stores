"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Check,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Printer,
  Upload,
  Image,
  Trash2,
} from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { MockupPreview } from "@/components/store/MockupPreview";

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
}

export default function CatalogPage() {
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
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [artworkName, setArtworkName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [pricing, setPricing] = useState<{
    clientPrice: number;
    clientPriceFormatted: string;
  } | null>(null);
  const [mockupImages, setMockupImages] = useState<string[]>([]);
  const [generatingMockup, setGeneratingMockup] = useState(false);

  const generateMockup = async () => {
    if (!selectedProduct || !artworkUrl || selectedProduct.provider !== "printify") return;

    // Data URLs (local uploads) can't be fetched by Printify
    // Use a placeholder logo for demo, or need real upload first
    let imageToUse = artworkUrl;
    if (artworkUrl.startsWith("data:")) {
      // Use a sample logo for demo mockups
      imageToUse = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png";
    }

    setGeneratingMockup(true);
    setMockupImages([]);

    try {
      const res = await fetch("/api/mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprintId: parseInt(selectedProduct.providerId),
          imageUrl: imageToUse,
          position: "front",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.mockups && data.mockups.length > 0) {
          const urls = data.mockups
            .filter((m: { src: string; position: string }) => m.src && m.position === "front")
            .slice(0, 4)
            .map((m: { src: string }) => m.src);
          setMockupImages(urls.length > 0 ? urls : data.mockups.filter((m: { src: string }) => m.src).slice(0, 4).map((m: { src: string }) => m.src));
        }
      } else {
        const err = await res.json();
        console.error("Mockup error:", err);
      }
    } catch (e) {
      console.error("Mockup generation failed:", e);
    }
    setGeneratingMockup(false);
  };
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Fetch pricing when product selected or locations change
  const fetchPricing = async (productId: string, locations: number, method: string) => {
    setLoadingPrice(true);
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
    setLoadingPrice(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/svg+xml", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a PNG, JPG, SVG, or PDF file");
      return;
    }

    setUploading(true);
    setArtworkName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storeId", "a1b2c3d4-e5f6-7890-abcd-ef1234567890");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setArtworkUrl(data.url);
      } else {
        // If storage isn't set up yet, use a local preview
        const reader = new FileReader();
        reader.onload = (ev) => {
          setArtworkUrl(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      // Fallback to local preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        setArtworkUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    setUploading(false);
  };

  const toggleLocation = (locId: string) => {
    setSelectedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(locId)) {
        next.delete(locId);
      } else {
        next.add(locId);
      }
      // Refetch pricing with new location count
      if (selectedProduct?.provider === "fulfill_engine") {
        fetchPricing(selectedProduct.providerId, next.size || 1, "dtf");
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
    } catch (e) {
      console.error("Failed to fetch catalog:", e);
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
            colors: [],
          }),
        }
      );

      if (res.ok) {
        setAddedProducts((prev) => new Set([...prev, product.id]));
        setSelectedProduct(null);
        setCustomPrice("");
      }
    } catch (e) {
      console.error("Failed to add product:", e);
    }
    setAddingId(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName="ACME Corporation"
        logoUrl={null}
        creditBalance={0}
        cartCount={0}
        isAdmin={true}
        storeSlug="acme-corp"
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
                        setArtworkUrl(null);
                        setArtworkName("");
                        setSelectedLocations(new Set());
                        setSelectedColors(new Set());
                        setMockupImages([]);
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
                  {selectedProduct.image ? (
                    <img
                      src={selectedProduct.image}
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
                  )}
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

              {/* Step 2: Upload Logo */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-black text-white text-xs font-bold flex items-center justify-center">2</span>
                  <p className="text-sm font-semibold">Upload Your Logo</p>
                  {artworkUrl && (
                    <Check size={14} className="text-success ml-auto" />
                  )}
                </div>

                {artworkUrl ? (
                  <div className="border border-kraft/30 bg-off-white p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={artworkUrl} alt="Artwork" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{artworkName}</p>
                        <p className="text-[10px] text-success mt-0.5">Uploaded</p>
                      </div>
                      <button
                        onClick={() => { setArtworkUrl(null); setArtworkName(""); }}
                        className="p-1.5 hover:bg-white transition-colors"
                      >
                        <Trash2 size={14} className="text-smoky" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-200 hover:border-kraft p-8 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <input type="file" accept=".png,.jpg,.jpeg,.svg,.pdf" onChange={handleFileUpload} className="hidden" />
                    {uploading ? (
                      <Loader2 size={28} className="text-kraft animate-spin mb-2" />
                    ) : (
                      <Upload size={28} className="text-kraft mb-2" />
                    )}
                    <p className="text-sm font-medium">
                      {uploading ? "Uploading..." : "Click to upload your logo"}
                    </p>
                    <p className="text-[10px] text-smoky mt-1">PNG, JPG, SVG, or PDF — high resolution recommended</p>
                  </label>
                )}
              </div>

              {/* Mockup Preview — works for both Printify and FE */}
              {artworkUrl && (
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-kraft text-black text-xs font-bold flex items-center justify-center">
                        {"\u2728"}
                      </span>
                      <p className="text-sm font-semibold">Preview Your Product</p>
                    </div>
                    {selectedProduct.provider === "printify" && !generatingMockup && mockupImages.length === 0 && (
                      <button
                        onClick={generateMockup}
                        className="bg-black text-white px-4 py-2 text-xs tracking-[0.1em] uppercase font-medium hover:bg-brown transition-colors"
                      >
                        Generate Mockup
                      </button>
                    )}
                  </div>

                  {/* Printify: API-generated mockups */}
                  {generatingMockup && (
                    <div className="bg-off-white p-8 flex flex-col items-center justify-center">
                      <Loader2 size={32} className="text-kraft animate-spin mb-3" />
                      <p className="text-sm font-medium">Generating your mockup...</p>
                      <p className="text-[10px] text-smoky mt-1">This may take 10-15 seconds</p>
                    </div>
                  )}

                  {mockupImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {mockupImages.slice(0, 4).map((url, i) => (
                        <div key={i} className="bg-off-white overflow-hidden border border-gray-100">
                          <img src={url} alt={`Mockup ${i + 1}`} className="w-full h-auto" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FE products: Canvas mockup generator */}
                  {selectedProduct.provider === "fulfill_engine" && (
                    <div>
                      {selectedLocations.size > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {Array.from(selectedLocations).map((loc) => (
                            <MockupPreview
                              key={loc}
                              productImage={selectedProduct.image}
                              productName={selectedProduct.name}
                              logoUrl={artworkUrl}
                              placement={loc}
                              productCategory={selectedProduct.category}
                            />
                          ))}
                        </div>
                      ) : (
                        <MockupPreview
                          productImage={selectedProduct.image}
                          productName={selectedProduct.name}
                          logoUrl={artworkUrl}
                          placement="front"
                          productCategory={selectedProduct.category}
                        />
                      )}
                      <p className="text-[9px] text-smoky text-center mt-2">
                        Preview — select logo placements below to see different positions
                      </p>
                    </div>
                  )}

                  {/* Printify: Show quick preview before generating full mockup */}
                  {selectedProduct.provider === "printify" && !generatingMockup && mockupImages.length === 0 && (
                    <MockupPreview
                      productImage={selectedProduct.image}
                      productName={selectedProduct.name}
                      logoUrl={artworkUrl}
                      placement="front"
                      productCategory={selectedProduct.category}
                    />
                  )}
                </div>
              )}

              {/* Step 3: Logo Placement */}
              {selectedProduct.printLocations && selectedProduct.printLocations.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-black text-white text-xs font-bold flex items-center justify-center">3</span>
                    <p className="text-sm font-semibold">Logo Placement</p>
                    {selectedLocations.size > 0 && (
                      <span className="text-[10px] text-kraft-dark ml-auto">
                        {selectedLocations.size} location{selectedLocations.size > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-smoky mb-3">
                    Where should the logo go? Select one or more locations.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.printLocations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => toggleLocation(loc.id)}
                        className={`px-4 py-2 text-xs tracking-wide transition-all ${
                          selectedLocations.has(loc.id)
                            ? "bg-black text-white"
                            : "bg-off-white text-smoky hover:bg-gray-200"
                        }`}
                      >
                        {loc.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-kraft text-black text-xs font-bold flex items-center justify-center">$</span>
                  <p className="text-sm font-semibold">Pricing</p>
                </div>

                {loadingPrice ? (
                  <div className="bg-off-white p-6 flex items-center justify-center">
                    <Loader2 size={18} className="animate-spin text-kraft mr-2" />
                    <span className="text-sm text-smoky">Calculating price...</span>
                  </div>
                ) : (
                  <div className="bg-off-white p-5 space-y-4">
                    {/* Main price */}
                    <div className="text-center">
                      <p className="text-4xl font-bold">
                        {pricing ? pricing.clientPriceFormatted : customPrice ? `$${parseFloat(customPrice).toFixed(2)}` : "$—"}
                      </p>
                      <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mt-1">
                        per item · includes decoration
                      </p>
                    </div>

                    {/* If no auto-price, let them enter manually */}
                    {!pricing && (
                      <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
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

                    {/* Volume estimates */}
                    {(pricing || customPrice) && (
                      <div className="text-xs space-y-1.5 pt-3 border-t border-gray-200">
                        <p className="text-[10px] tracking-[0.1em] uppercase text-smoky font-medium mb-2">
                          Budget Estimates
                        </p>
                        {[10, 25, 50, 100].map((qty) => {
                          const price = pricing
                            ? pricing.clientPrice / 100
                            : parseFloat(customPrice || "0");
                          return (
                            <div key={qty} className="flex justify-between">
                              <span className="text-smoky">{qty} employees</span>
                              <span className="font-medium text-black">
                                ${(price * qty).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

      <StoreFooter companyName="ACME Corporation" />
    </div>
  );
}
