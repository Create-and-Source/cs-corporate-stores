"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { StoreHeader } from "@/components/store/StoreHeader";
import { HeroBanner } from "@/components/store/HeroBanner";
import { CategoryBar } from "@/components/store/CategoryBar";
import { ProductCard } from "@/components/store/ProductCard";
import { StoreFooter } from "@/components/store/StoreFooter";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  colors: string[];
}

interface Store {
  slug: string;
  company_name: string;
  logo_url: string | null;
  welcome_message: string | null;
  hero_image_url: string | null;
}

export default function StorePage() {
  const params = useParams();
  const slug = params.slug as string;
  const cart = useCart();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [creditBalance, setCreditBalance] = useState(0);

  useEffect(() => {
    async function load() {
      // Load store
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .single();

      if (storeData) {
        setStore(storeData);

        // Load products for this store
        const { data: productData } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", storeData.id)
          .eq("is_active", true);

        if (productData) {
          setProducts(productData);
          const cats = [...new Set(productData.map((p: Product) => p.category).filter(Boolean))];
          setCategories(cats as string[]);
        }

        // Load credit balance (using first user for demo)
        const { data: creditData } = await supabase
          .from("credit_balances")
          .select("balance")
          .eq("store_id", storeData.id)
          .limit(1)
          .single();

        if (creditData) {
          setCreditBalance(creditData.balance);
        }
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-smoky">Loading store...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Package size={48} className="mx-auto text-kraft mb-4" />
          <h2 className="text-xl font-bold mb-2">Store Not Found</h2>
          <a href="/" className="text-kraft-dark hover:text-black text-sm">Go Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName={store.company_name}
        logoUrl={store.logo_url}
        creditBalance={creditBalance}
        cartCount={cart.count}
        isAdmin={true}
        storeSlug={store.slug}
      />

      <HeroBanner
        companyName={store.company_name}
        welcomeMessage={store.welcome_message}
        heroImage={store.hero_image_url}
      />

      <div id="products">
        <CategoryBar
          categories={categories}
          active={activeCategory}
          onSelect={setActiveCategory}
        />

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              {activeCategory === "all" ? "All Products" : activeCategory}
            </h2>
            <p className="text-sm text-smoky">
              {filteredProducts.length} products
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package size={48} className="mx-auto text-kraft mb-4" />
              <p className="text-smoky">No products in this category yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.images?.[0] || ""}
                  category={product.category}
                  colors={product.colors || []}
                  href={`/store/${store.slug}/products/${product.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <StoreFooter companyName={store.company_name} />
    </div>
  );
}
