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
} from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";

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
                          className="w-full h-full object-cover"
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-lg">Product Details</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-off-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image */}
                <div className="aspect-square bg-off-white flex items-center justify-center overflow-hidden">
                  {selectedProduct.image ? (
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Package size={48} className="mx-auto text-kraft mb-3" />
                      <p className="text-xs text-smoky">
                        {selectedProduct.brand || selectedProduct.category}
                      </p>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <span className="text-[10px] tracking-[0.15em] uppercase text-kraft-dark">
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-xl font-bold mt-1 mb-3">
                    {selectedProduct.name}
                  </h3>

                  {selectedProduct.description && (
                    <p className="text-sm text-smoky leading-relaxed mb-4">
                      {selectedProduct.description}
                    </p>
                  )}

                  {/* Print locations */}
                  {selectedProduct.printLocations && selectedProduct.printLocations.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-2 flex items-center gap-1">
                        <MapPin size={12} />
                        Print Locations
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.printLocations.map((loc) => (
                          <span
                            key={loc.id}
                            className="px-2.5 py-1 bg-off-white text-[10px] tracking-wide text-smoky"
                          >
                            {loc.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Print methods */}
                  {selectedProduct.printMethods && selectedProduct.printMethods.length > 0 && (
                    <div className="mb-6">
                      <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-2 flex items-center gap-1">
                        <Printer size={12} />
                        Decoration Methods
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.printMethods.map((method) => (
                          <span
                            key={method}
                            className="px-2.5 py-1 bg-off-white text-[10px] tracking-wide text-smoky capitalize"
                          >
                            {method.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Set price */}
                  <div className="bg-off-white p-4 mb-4">
                    <p className="text-xs font-semibold mb-2">
                      Set Credit Price for Employees
                    </p>
                    <p className="text-[10px] text-smoky mb-3">
                      This is what employees will &quot;pay&quot; in credits
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">$</span>
                      <input
                        type="number"
                        placeholder="25.00"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Add button */}
                  <button
                    onClick={() =>
                      handleAddToStore(
                        selectedProduct,
                        customPrice ? Math.round(parseFloat(customPrice) * 100) : 2500
                      )
                    }
                    disabled={addingId === selectedProduct.id}
                    className="w-full bg-black text-white py-3.5 text-sm tracking-[0.12em] uppercase font-medium flex items-center justify-center gap-2 hover:bg-brown transition-colors disabled:opacity-50"
                  >
                    {addingId === selectedProduct.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Plus size={16} />
                        Add to Store
                        {customPrice && ` — $${parseFloat(customPrice).toFixed(2)}`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <StoreFooter companyName="ACME Corporation" />
    </div>
  );
}
