"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Check, Package } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { Button } from "@/components/ui/Button";
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
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId as string;
  const slug = params.slug as string;
  const cart = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (data) {
        setProduct(data);
        if (data.sizes?.length) setSelectedSize(data.sizes[0]);
        if (data.colors?.length) setSelectedColor(data.colors[0]);
      }
      setLoading(false);
    }
    load();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    cart.addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || null,
      size: selectedSize,
      color: selectedColor,
      quantity,
      category: product.category,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-smoky">Loading...</div>
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
        companyName="ACME Corporation"
        logoUrl={null}
        creditBalance={15000}
        cartCount={cart.count}
        isAdmin={false}
        storeSlug={slug}
      />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back link */}
        <a
          href={`/store/${slug}`}
          className="inline-flex items-center gap-2 text-smoky text-sm hover:text-black transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Store
        </a>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-square bg-off-white flex items-center justify-center overflow-hidden">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package size={64} className="text-kraft" />
            )}
          </div>

          {/* Product Info */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-kraft-dark mb-2">
              {product.category}
            </p>
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              {product.name}
            </h1>

            <p className="text-2xl font-bold mb-6">
              ${(product.price / 100).toFixed(2)}
              <span className="text-sm text-smoky ml-2 font-normal uppercase tracking-wider">
                credits
              </span>
            </p>

            {product.description && (
              <p className="text-smoky leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            {/* Color Picker */}
            {product.colors?.length > 0 && (
              <div className="mb-6">
                <p className="text-xs tracking-[0.15em] uppercase text-smoky mb-3">
                  Color — <span className="text-black font-medium">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-xs tracking-wide border transition-all ${
                        selectedColor === color
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-kraft text-smoky"
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
                <p className="text-xs tracking-[0.15em] uppercase text-smoky mb-3">
                  Size — <span className="text-black font-medium">{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 flex items-center justify-center text-xs font-medium border transition-all ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-kraft"
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
              <p className="text-xs tracking-[0.15em] uppercase text-smoky mb-3">
                Quantity
              </p>
              <div className="flex items-center border border-gray-200 w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-off-white transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="px-6 text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-off-white transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className={`w-full py-4 text-sm tracking-[0.15em] uppercase font-medium flex items-center justify-center gap-2 transition-all ${
                added
                  ? "bg-success text-white"
                  : "bg-black text-white hover:bg-brown"
              }`}
            >
              {added ? (
                <>
                  <Check size={18} />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  Add to Cart — ${((product.price * quantity) / 100).toFixed(2)}
                </>
              )}
            </button>

            <p className="text-[10px] text-smoky text-center mt-3 tracking-wide">
              Ships directly to your address
            </p>
          </div>
        </div>
      </div>

      <StoreFooter companyName="ACME Corporation" />
    </div>
  );
}
