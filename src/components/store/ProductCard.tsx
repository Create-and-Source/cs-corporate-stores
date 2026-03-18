"use client";

import { ShoppingBag } from "lucide-react";

interface ProductCardProps {
  name: string;
  price: number; // in cents
  image: string;
  category: string;
  colors: string[];
  href: string;
}

export function ProductCard({
  name,
  price,
  image,
  category,
  colors,
  href,
}: ProductCardProps) {
  return (
    <a href={href} className="group block">
      {/* Image */}
      <div className="relative aspect-square bg-off-white overflow-hidden mb-4">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={32} className="text-kraft" />
          </div>
        )}

        {/* Quick add overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-end justify-center">
          <div className="translate-y-full group-hover:translate-y-0 transition-transform duration-300 mb-4">
            <button className="bg-black text-white px-6 py-3 text-xs tracking-[0.15em] uppercase flex items-center gap-2 hover:bg-brown transition-colors">
              <ShoppingBag size={14} />
              Quick Add
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1.5">
        <p className="text-[10px] tracking-[0.2em] uppercase text-smoky">
          {category}
        </p>
        <h3 className="font-medium text-sm tracking-wide">{name}</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">
            ${(price / 100).toFixed(2)}
            <span className="text-[10px] text-smoky ml-1 uppercase tracking-wider">
              credits
            </span>
          </p>
          {colors.length > 0 && (
            <div className="flex gap-1">
              {colors.slice(0, 4).map((color) => (
                <div
                  key={color}
                  className="w-3 h-3 rounded-full border border-gray-200"
                  style={{ backgroundColor: color }}
                />
              ))}
              {colors.length > 4 && (
                <span className="text-[10px] text-smoky">
                  +{colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
