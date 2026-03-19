"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Check, Package } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sizes: string[];
  colors: string[];
  color_images?: Record<string, string>;
}

interface Store {
  company_name: string;
  logo_url: string | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId as string;
  const slug = params.slug as string;
  const cart = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);

  useEffect(() => {
    async function load() {
      const [{ data: productData }, { data: storeData }] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).single(),
        supabase.from("stores").select("company_name, logo_url, id").eq("slug", slug).single(),
      ]);

      if (productData) {
        setProduct(productData);
        if (productData.sizes?.length) setSelectedSize(productData.sizes[0]);
        if (productData.colors?.length) setSelectedColor(productData.colors[0]);
      }

      if (storeData) {
        setStore(storeData);
        const { data: creditData } = await supabase
          .from("credit_balances")
          .select("balance")
          .eq("store_id", storeData.id)
          .limit(1)
          .single();
        if (creditData) setCreditBalance(creditData.balance);
      }

      setLoading(false);
    }
    load();
  }, [productId, slug]);

  const handleAddToCart = () => {
    if (!product) return;
    cart.addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: (selectedColor && product.color_images?.[selectedColor]) || product.images?.[0] || null,
      size: selectedSize,
      color: selectedColor,
      quantity,
      category: product.category,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const companyName = store?.company_name || "Store";

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-smoky text-sm tracking-wide">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Package size={48} className="mx-auto text-kraft mb-4" />
          <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
          <a href={`/store/${slug}`} className="text-kraft-dark hover:text-black text-sm">
            Back to Store
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName={companyName}
        logoUrl={store?.logo_url || null}
        creditBalance={creditBalance}
        cartCount={cart.count}
        isAdmin={false}
        storeSlug={slug}
      />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back link */}
        <a
          href={`/store/${slug}`}
          className="inline-flex items-center gap-2 text-smoky text-[11px] tracking-[0.1em] uppercase hover:text-black transition-colors mb-10"
        >
          <ArrowLeft size={14} />
          Back to Store
        </a>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Product Image */}
          <div className="aspect-square bg-off-white flex items-center justify-center overflow-hidden">
            {(() => {
              const colorImg = selectedColor && product.color_images?.[selectedColor];
              const displayImg = colorImg || product.images?.[0];
              return displayImg ? (
                <img
                  src={displayImg}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Package size={64} className="text-kraft" />
              );
            })()}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <p className="text-[10px] tracking-[0.25em] uppercase text-smoky mb-3">
              {product.category}
            </p>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-8">
              <p className="text-3xl font-bold">
                ${(product.price / 100).toFixed(2)}
              </p>
              <span className="text-[10px] text-smoky uppercase tracking-[0.2em]">
                credits
              </span>
            </div>

            {/* Accent line */}
            <div className="w-10 h-[2px] bg-kraft mb-8" />

            {product.description && (
              <p className="text-smoky leading-relaxed mb-8 text-[15px]">
                {product.description}
              </p>
            )}

            {/* Color Picker */}
            {product.colors?.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] tracking-[0.2em] uppercase text-smoky mb-3">
                  Color &mdash; <span className="text-black font-medium">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2.5 text-[11px] tracking-wide uppercase border transition-all ${
                        selectedColor === color
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-black text-smoky hover:text-black"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Picker */}
            {product.sizes?.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] tracking-[0.2em] uppercase text-smoky mb-3">
                  Size &mdash; <span className="text-black font-medium">{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 flex items-center justify-center text-xs font-medium border transition-all ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-black"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.2em] uppercase text-smoky mb-3">
                Quantity
              </p>
              <div className="flex items-center border border-gray-200 w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-off-white transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="px-6 text-sm font-medium tabular-nums">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-off-white transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className={`w-full py-4 text-xs tracking-[0.2em] uppercase font-medium flex items-center justify-center gap-3 transition-all ${
                added
                  ? "bg-success text-white"
                  : "bg-black text-white hover:bg-brown"
              }`}
            >
              {added ? (
                <>
                  <Check size={16} />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBag size={16} />
                  Add to Cart &mdash; ${((product.price * quantity) / 100).toFixed(2)}
                </>
              )}
            </button>

            <p className="text-[10px] text-smoky text-center mt-4 tracking-[0.1em] uppercase">
              Ships directly to your address
            </p>
          </div>
        </div>
      </div>

      <StoreFooter companyName={companyName} />
    </div>
  );
}
