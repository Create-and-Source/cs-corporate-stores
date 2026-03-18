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
} from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { Button } from "@/components/ui/Button";

interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  image: string | null;
  category: string;
  provider: "fulfill_engine" | "printify";
  providerId: string;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(search && { search }),
        ...(activeCategory !== "All" && { category: activeCategory }),
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
  }, [page, search, activeCategory]);

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

  const handleAddToStore = (product: CatalogProduct) => {
    setAddingId(product.id);
    setTimeout(() => {
      setAddedProducts((prev) => new Set([...prev, product.id]));
      setAddingId(null);
    }, 600);
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
              {total.toLocaleString()} products available from Printify.
              Add items to your client stores.
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
            {/* Product Grid — compact cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {products.map((product) => {
                const isAdded = addedProducts.has(product.id);
                const isAdding = addingId === product.id;

                return (
                  <div
                    key={product.id}
                    className={`border transition-all ${
                      isAdded
                        ? "border-success/30 bg-success/5"
                        : "border-gray-100 hover:border-kraft"
                    }`}
                  >
                    {/* Small product image */}
                    <div className="aspect-square bg-off-white overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={20} className="text-kraft" />
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

                      {/* Add button */}
                      <button
                        onClick={() => handleAddToStore(product)}
                        disabled={isAdded || isAdding}
                        className={`w-full mt-2 py-1.5 text-[9px] tracking-[0.12em] uppercase font-medium flex items-center justify-center gap-1 transition-all ${
                          isAdded
                            ? "bg-success/10 text-success"
                            : isAdding
                              ? "bg-gray-100 text-smoky"
                              : "bg-black text-white hover:bg-brown"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check size={10} />
                            Added
                          </>
                        ) : isAdding ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <>
                            <Plus size={10} />
                            Add to Store
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 hover:border-kraft disabled:opacity-30 disabled:hover:border-gray-200 transition-colors"
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
                  className="p-2 border border-gray-200 hover:border-kraft disabled:opacity-30 disabled:hover:border-gray-200 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <StoreFooter companyName="ACME Corporation" />
    </div>
  );
}
