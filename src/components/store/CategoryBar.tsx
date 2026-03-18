"use client";

interface CategoryBarProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}

export function CategoryBar({ categories, active, onSelect }: CategoryBarProps) {
  return (
    <div className="border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-4 scrollbar-hide">
          <button
            onClick={() => onSelect("all")}
            className={`px-4 py-2 text-xs tracking-[0.15em] uppercase whitespace-nowrap transition-colors ${
              active === "all"
                ? "bg-black text-white"
                : "text-smoky hover:text-black hover:bg-off-white"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`px-4 py-2 text-xs tracking-[0.15em] uppercase whitespace-nowrap transition-colors ${
                active === cat
                  ? "bg-black text-white"
                  : "text-smoky hover:text-black hover:bg-off-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
