"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ArrowRight, Sparkles, Package } from "lucide-react";

interface Suggestion {
  query: string;
  category: string;
  icon: string;
}

const SUGGESTIONS: Suggestion[] = [
  { query: "breathable polos for the sales team", category: "Polos", icon: "" },
  { query: "women's performance polo", category: "Polos", icon: "" },
  { query: "men's heavyweight hoodie", category: "Hoodies & Sweats", icon: "" },
  { query: "lightweight tee for a summer event", category: "T-Shirts & Tops", icon: "" },
  { query: "premium jacket for executives", category: "Outerwear", icon: "" },
  { query: "Nike or Under Armour polo", category: "Polos", icon: "" },
  { query: "Carhartt workwear for the crew", category: "Outerwear", icon: "" },
  { query: "structured trucker hat with logo", category: "Headwear", icon: "" },
  { query: "insulated tumbler or water bottle", category: "Drinkware", icon: "" },
  { query: "soft cotton tee for everyday wear", category: "T-Shirts & Tops", icon: "" },
  { query: "fleece quarter zip for fall", category: "Quarter Zips", icon: "" },
  { query: "new hire welcome kit essentials", category: "T-Shirts & Tops", icon: "" },
  { query: "holiday gifts under $30", category: "Hoodies & Sweats", icon: "" },
  { query: "women's fitted v-neck", category: "T-Shirts & Tops", icon: "" },
  { query: "canvas tote for trade shows", category: "Bags", icon: "" },
  { query: "moisture-wicking athletic wear", category: "T-Shirts & Tops", icon: "" },
  { query: "beanie for winter giveaway", category: "Headwear", icon: "" },
  { query: "laptop sleeve or tech accessories", category: "Tech", icon: "" },
];

// Map natural language to search terms
const KEYWORD_MAP: Record<string, string[]> = {
  "new hire": ["t-shirt", "hoodie", "hat", "mug"],
  "welcome": ["t-shirt", "hoodie", "hat"],
  "holiday": ["hoodie", "blanket", "beanie", "mug"],
  "executive": ["jacket", "vest", "polo", "quarter zip"],
  "premium": ["jacket", "vest", "polo", "north face", "nike", "carhartt"],
  "summer": ["t-shirt", "polo", "hat", "water bottle", "tank"],
  "winter": ["hoodie", "jacket", "beanie", "fleece", "vest"],
  "outdoor": ["jacket", "vest", "hat", "water bottle", "backpack"],
  "office": ["polo", "mug", "notebook", "mouse pad"],
  "event": ["t-shirt", "hat", "tote", "water bottle"],
  "gift": ["hoodie", "jacket", "mug", "blanket", "tumbler"],
  "team": ["t-shirt", "hoodie", "polo", "hat"],
};

interface SmartSearchProps {
  onSearch: (query: string) => void;
  onCategorySelect: (category: string) => void;
}

export function SmartSearch({ onSearch, onCategorySelect }: SmartSearchProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [matchedSuggestions, setMatchedSuggestions] = useState<Suggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!input) {
      setMatchedSuggestions(SUGGESTIONS.slice(0, 6));
      return;
    }

    const lower = input.toLowerCase();
    const matches = SUGGESTIONS.filter(
      (s) =>
        s.query.includes(lower) ||
        s.category.toLowerCase().includes(lower) ||
        lower.split(" ").some((word) => s.query.includes(word))
    );

    if (matches.length > 0) {
      setMatchedSuggestions(matches.slice(0, 6));
    } else {
      // Map natural language to product suggestions
      const keywords = Object.entries(KEYWORD_MAP).filter(([key]) =>
        lower.includes(key)
      );
      if (keywords.length > 0) {
        const terms = keywords.flatMap(([, v]) => v);
        setMatchedSuggestions(
          SUGGESTIONS.filter((s) =>
            terms.some((t) => s.query.includes(t) || s.category.toLowerCase().includes(t))
          ).slice(0, 6)
        );
      } else {
        setMatchedSuggestions([]);
      }
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input) {
      onSearch(input);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInput(suggestion.query);
    onCategorySelect(suggestion.category);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Sparkles
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-kraft"
          />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="I'm looking for..."
            className="w-full pl-12 pr-12 py-4 border-2 border-gray-100 text-sm focus:outline-none focus:border-kraft transition-colors bg-off-white/50"
          />
          {input && (
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white p-2 hover:bg-brown transition-colors"
            >
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSuggestions(false)}
          />
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 shadow-lg mt-1">
            <p className="px-4 py-2 text-[9px] tracking-[0.15em] uppercase text-smoky border-b border-gray-100">
              {input ? "Suggestions" : "Popular Searches"}
            </p>
            {matchedSuggestions.length > 0 ? (
              matchedSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-off-white transition-colors text-left border-b border-gray-50 last:border-0"
                >
                  <Search size={12} className="text-smoky flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm">{s.query}</p>
                    <p className="text-[10px] text-kraft-dark">{s.category}</p>
                  </div>
                  <ArrowRight size={12} className="text-smoky" />
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <Package size={24} className="mx-auto text-kraft mb-2" />
                <p className="text-sm text-smoky">
                  Try searching for &quot;hoodie&quot;, &quot;mug&quot;, or &quot;new hire kit&quot;
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
