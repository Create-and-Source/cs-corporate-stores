"use client";

import { useState } from "react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { HeroBanner } from "@/components/store/HeroBanner";
import { CategoryBar } from "@/components/store/CategoryBar";
import { ProductCard } from "@/components/store/ProductCard";
import { StoreFooter } from "@/components/store/StoreFooter";

// Demo data — will be replaced with Supabase queries
const DEMO_STORE = {
  slug: "acme-corp",
  company_name: "ACME Corporation",
  logo_url: null,
  welcome_message:
    "Celebrate your achievements with premium company merch. Use your credits to gear up.",
};

const DEMO_PRODUCTS = [
  {
    id: "1",
    name: "Classic Logo Tee",
    price: 2800,
    images: ["/placeholder-tee.jpg"],
    category: "Apparel",
    colors: ["#000000", "#FFFFFF", "#1a365d", "#7A6A5B"],
  },
  {
    id: "2",
    name: "Performance Hoodie",
    price: 5500,
    images: ["/placeholder-hoodie.jpg"],
    category: "Apparel",
    colors: ["#000000", "#1a365d", "#3D1C1C"],
  },
  {
    id: "3",
    name: "Structured Cap",
    price: 2200,
    images: ["/placeholder-cap.jpg"],
    category: "Headwear",
    colors: ["#000000", "#FFFFFF", "#C4A882"],
  },
  {
    id: "4",
    name: "Insulated Water Bottle",
    price: 3200,
    images: ["/placeholder-bottle.jpg"],
    category: "Drinkware",
    colors: ["#000000", "#FFFFFF"],
  },
  {
    id: "5",
    name: "Quarter Zip Pullover",
    price: 6200,
    images: ["/placeholder-quarterzip.jpg"],
    category: "Apparel",
    colors: ["#000000", "#1a365d"],
  },
  {
    id: "6",
    name: "Embroidered Beanie",
    price: 1800,
    images: ["/placeholder-beanie.jpg"],
    category: "Headwear",
    colors: ["#000000", "#3D1C1C", "#7A6A5B"],
  },
  {
    id: "7",
    name: "Canvas Tote Bag",
    price: 2400,
    images: ["/placeholder-tote.jpg"],
    category: "Accessories",
    colors: ["#F5F2EE", "#000000"],
  },
  {
    id: "8",
    name: "Premium Notebook Set",
    price: 1600,
    images: ["/placeholder-notebook.jpg"],
    category: "Office",
    colors: ["#000000"],
  },
];

const CATEGORIES = ["Apparel", "Headwear", "Drinkware", "Accessories", "Office"];

export default function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredProducts =
    activeCategory === "all"
      ? DEMO_PRODUCTS
      : DEMO_PRODUCTS.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName={DEMO_STORE.company_name}
        logoUrl={DEMO_STORE.logo_url}
        creditBalance={15000}
        cartCount={2}
        isAdmin={true}
        storeSlug={DEMO_STORE.slug}
      />

      <HeroBanner
        companyName={DEMO_STORE.company_name}
        welcomeMessage={DEMO_STORE.welcome_message}
      />

      {/* Products Section */}
      <div id="products">
        <CategoryBar
          categories={CATEGORIES}
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                price={product.price}
                image={product.images[0]}
                category={product.category}
                colors={product.colors}
                href={`/store/${DEMO_STORE.slug}/products/${product.id}`}
              />
            ))}
          </div>
        </div>
      </div>

      <StoreFooter companyName={DEMO_STORE.company_name} />
    </div>
  );
}
