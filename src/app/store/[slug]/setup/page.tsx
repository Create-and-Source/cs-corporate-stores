"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Building2,
  Palette,
  ShoppingBag,
  Upload,
  Check,
  ChevronRight,
  ChevronLeft,
  Package,
  Loader2,
  Plus,
  Search,
  Image,
  Users,
  Sparkles,
  ArrowRight,
  X,
  HelpCircle,
  MapPin,
  DollarSign,
  Layers,
} from "lucide-react";
import { StoreFooter } from "@/components/store/StoreFooter";
import { SmartSearch } from "@/components/store/SmartSearch";
import { ProductConfigurator } from "@/components/store/ProductConfigurator";

// Steps
const STEPS = [
  { id: 1, title: "Your Company", icon: Building2, description: "Tell us about your brand" },
  { id: 2, title: "Pick Products", icon: ShoppingBag, description: "Choose merch for your team" },
  { id: 3, title: "Upload Logo", icon: Upload, description: "Add your artwork" },
  { id: 4, title: "Review", icon: Check, description: "Confirm and launch" },
];

interface SetupData {
  companyName: string;
  industry: string;
  teamSize: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  logoName: string;
  selectedProducts: Array<{
    id: string;
    name: string;
    image: string | null;
    category: string;
    price: number | null;
  }>;
}

interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  image: string | null;
  category: string;
  clientPrice: number | null;
  hasImage: boolean;
  provider: string;
  providerId: string;
  colors?: string[];
}

export default function SetupPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Setup data with localStorage persistence
  const [data, setData] = useState<SetupData>({
    companyName: "",
    industry: "",
    teamSize: "",
    primaryColor: "#000000",
    secondaryColor: "#C4A882",
    logoUrl: null,
    logoName: "",
    selectedProducts: [],
  });

  // Catalog state (step 2)
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [catalogPage, setCatalogPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [previewProduct, setPreviewProduct] = useState<CatalogProduct | null>(null);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(`cs-setup-${slug}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed.data || parsed);
        if (parsed.step) setStep(parsed.step);
      } catch {}
    }
  }, [slug]);

  // Auto-save progress
  useEffect(() => {
    localStorage.setItem(`cs-setup-${slug}`, JSON.stringify({ data, step }));
  }, [data, step, slug]);

  // Fetch catalog for step 2
  useEffect(() => {
    if (step === 2) {
      fetchCatalog();
    }
  }, [step, searchInput, activeCategory, catalogPage]);

  const fetchCatalog = async () => {
    setCatalogLoading(true);
    const params = new URLSearchParams({
      page: String(catalogPage),
      ...(searchInput && { search: searchInput }),
      ...(activeCategory !== "All" && { category: activeCategory }),
    });

    try {
      const res = await fetch(`/api/catalog?${params}`);
      const result = await res.json();
      setProducts(result.products || []);
      setTotalPages(result.totalPages || 1);
      if (result.categories?.length) setCategories(result.categories);
    } catch {}
    setCatalogLoading(false);
  };

  const toggleProduct = (product: CatalogProduct) => {
    setData((prev) => {
      const exists = prev.selectedProducts.find((p) => p.id === product.id);
      if (exists) {
        return {
          ...prev,
          selectedProducts: prev.selectedProducts.filter((p) => p.id !== product.id),
        };
      }
      return {
        ...prev,
        selectedProducts: [
          ...prev.selectedProducts,
          {
            id: product.id,
            name: product.name,
            image: product.image,
            category: product.category,
            price: product.clientPrice,
          },
        ],
      };
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setData((prev) => ({
        ...prev,
        logoUrl: ev.target?.result as string,
        logoName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleLaunch = async () => {
    setSaving(true);
    // In production, this would create the store in Supabase
    await new Promise((r) => setTimeout(r, 2000));
    setSaving(false);
    setStep(5); // Completion
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!data.companyName;
      case 2: return data.selectedProducts.length > 0;
      case 3: return !!data.logoUrl;
      case 4: return true;
      default: return false;
    }
  };

  const handleStartOver = () => {
    localStorage.removeItem(`cs-setup-${slug}`);
    setStep(1);
    setData({
      companyName: "",
      industry: "",
      teamSize: "",
      primaryColor: "#000000",
      secondaryColor: "#C4A882",
      logoUrl: null,
      logoName: "",
      selectedProducts: [],
    });
  };

  // Completion screen
  if (step === 5) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-lg mx-auto px-6 text-center">
          <div className="w-20 h-20 bg-success/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles size={40} className="text-success" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Your Store is Ready!
          </h1>
          <p className="text-smoky text-lg mb-2">
            {data.companyName} Merch Store is set up with {data.selectedProducts.length} products.
          </p>
          <p className="text-smoky text-sm mb-10">
            Your team can start shopping as soon as you add employees and load credits.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href={`/store/${slug}`}
              className="bg-black text-white px-8 py-4 text-sm tracking-[0.1em] uppercase font-medium hover:bg-brown transition-colors inline-flex items-center gap-2"
            >
              View Your Store
              <ArrowRight size={16} />
            </a>
            <a
              href={`/store/${slug}/admin/employees`}
              className="border border-gray-200 px-8 py-4 text-sm tracking-[0.1em] uppercase font-medium hover:border-kraft transition-colors inline-flex items-center gap-2"
            >
              <Users size={16} />
              Add Employees
            </a>
          </div>
          <button
            onClick={handleStartOver}
            className="mt-8 text-xs text-smoky hover:text-black transition-colors underline"
          >
            Set up a different store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
              Create<span className="text-kraft">&</span>Source
            </span>
            <span className="text-[10px] tracking-[0.15em] uppercase text-smoky bg-off-white px-2 py-1">
              Store Setup
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-smoky">Progress saved automatically</span>
            <a href={`/store/${slug}`} className="text-xs text-smoky hover:text-black">
              Exit Setup
            </a>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  onClick={() => { if (s.id < step || canProceed()) setStep(s.id); }}
                  className={`flex items-center gap-2 py-3 transition-colors ${
                    s.id === step
                      ? "text-black"
                      : s.id < step
                        ? "text-success"
                        : "text-gray-300"
                  }`}
                >
                  <div
                    className={`w-7 h-7 flex items-center justify-center text-xs font-bold ${
                      s.id < step
                        ? "bg-success text-white"
                        : s.id === step
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {s.id < step ? <Check size={14} /> : s.id}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s.title}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${s.id < step ? "bg-success" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Step 1: Company Info */}
        {step === 1 && (
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Tell us about your company
            </h2>
            <p className="text-smoky mb-8">
              This helps us personalize your merch store.
            </p>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Company Name *
                  <Tooltip text="This will appear on your store header" />
                </label>
                <input
                  type="text"
                  value={data.companyName}
                  onChange={(e) => setData((d) => ({ ...d, companyName: e.target.value }))}
                  placeholder="ACME Corporation"
                  className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Industry</label>
                <select
                  value={data.industry}
                  onChange={(e) => setData((d) => ({ ...d, industry: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                >
                  <option value="">Select your industry</option>
                  {["Technology", "Healthcare", "Finance", "Education", "Real Estate", "Marketing", "Legal", "Construction", "Non-Profit", "Hospitality", "Retail", "Manufacturing", "Media & Entertainment", "Sports & Fitness", "Automotive", "Insurance", "Government", "Agriculture", "Energy", "Consulting", "Staffing & HR", "Logistics", "Restaurant & Food", "Beauty & Wellness", "Other"].map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Team Size
                  <Tooltip text="Helps us recommend the right products and quantities" />
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["1-25", "25-50", "50-100", "100+"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setData((d) => ({ ...d, teamSize: size }))}
                      className={`py-3 text-sm font-medium border transition-colors ${
                        data.teamSize === size
                          ? "bg-black text-white border-black"
                          : "border-gray-200 hover:border-kraft"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Brand Colors
                  <Tooltip text="We'll use these to customize your store" />
                </label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={data.primaryColor}
                      onChange={(e) => setData((d) => ({ ...d, primaryColor: e.target.value }))}
                      className="w-10 h-10 border border-gray-200 cursor-pointer"
                    />
                    <span className="text-xs text-smoky">Primary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={data.secondaryColor}
                      onChange={(e) => setData((d) => ({ ...d, secondaryColor: e.target.value }))}
                      className="w-10 h-10 border border-gray-200 cursor-pointer"
                    />
                    <span className="text-xs text-smoky">Secondary</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pick Products */}
        {step === 2 && (
          <div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">
                  Pick products for your team
                </h2>
                <p className="text-smoky">
                  Click products to add them to your store. You can always change this later.
                </p>
              </div>
              {data.selectedProducts.length > 0 && (
                <div className="bg-off-white px-4 py-2 text-right">
                  <p className="text-2xl font-bold">{data.selectedProducts.length}</p>
                  <p className="text-[10px] tracking-[0.1em] uppercase text-smoky">Selected</p>
                </div>
              )}
            </div>

            {/* Selected products bar */}
            {data.selectedProducts.length > 0 && (
              <div className="bg-off-white border border-kraft/20 p-3 mb-6 flex items-center gap-3 overflow-x-auto">
                {data.selectedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 flex-shrink-0"
                  >
                    <span className="text-xs font-medium truncate max-w-[120px]">{p.name}</span>
                    <button
                      onClick={() => toggleProduct(p as unknown as CatalogProduct)}
                      className="text-smoky hover:text-error"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Smart Search */}
            <div className="mb-4">
              <SmartSearch
                onSearch={(q) => { setSearchInput(q); setCatalogPage(1); }}
                onCategorySelect={(cat) => { setActiveCategory(cat); setCatalogPage(1); }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5 mb-6">
              <button
                onClick={() => { setActiveCategory("All"); setCatalogPage(1); }}
                className={`px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase ${
                  activeCategory === "All" ? "bg-black text-white" : "bg-off-white text-smoky hover:text-black"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setCatalogPage(1); }}
                  className={`px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase ${
                    activeCategory === cat ? "bg-black text-white" : "bg-off-white text-smoky hover:text-black"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            {catalogLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-kraft" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {products.map((product) => {
                    const isSelected = data.selectedProducts.some((p) => p.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className={`border text-left transition-all ${
                          isSelected
                            ? "border-success bg-success/5 ring-2 ring-success/20"
                            : "border-gray-100 hover:border-kraft"
                        }`}
                      >
                        <button
                          onClick={() => setPreviewProduct(product)}
                          className="w-full"
                        >
                          <div className="aspect-square bg-off-white overflow-hidden relative">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={20} className="text-kraft" />
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-success text-white w-5 h-5 flex items-center justify-center">
                                <Check size={12} />
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-[9px] tracking-wider uppercase text-kraft-dark">{product.category}</p>
                            <p className="text-xs font-medium line-clamp-2 mt-0.5">{product.name}</p>
                            {product.clientPrice && (
                              <p className="text-xs font-bold mt-1">${(product.clientPrice / 100).toFixed(2)}</p>
                            )}
                          </div>
                        </button>
                        <div className="px-2 pb-2">
                          <button
                            onClick={() => toggleProduct(product)}
                            className={`w-full py-1.5 text-[9px] tracking-[0.1em] uppercase font-medium flex items-center justify-center gap-1 transition-all ${
                              isSelected
                                ? "bg-success/10 text-success"
                                : "bg-black text-white hover:bg-brown"
                            }`}
                          >
                            {isSelected ? (
                              <><Check size={10} /> Selected</>
                            ) : (
                              <><Plus size={10} /> Add</>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                      disabled={catalogPage === 1}
                      className="px-3 py-2 border border-gray-200 text-sm disabled:opacity-30"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-smoky">
                      Page {catalogPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCatalogPage((p) => Math.min(totalPages, p + 1))}
                      disabled={catalogPage === totalPages}
                      className="px-3 py-2 border border-gray-200 text-sm disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3: Upload Logo */}
        {step === 3 && (
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Upload your logo
            </h2>
            <p className="text-smoky mb-8">
              This will be used for decoration on all your products. High resolution recommended.
            </p>

            {data.logoUrl ? (
              <div className="border border-kraft/30 bg-off-white p-6">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                    <img src={data.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{data.logoName}</p>
                    <p className="text-sm text-success mt-1">Uploaded successfully</p>
                    <button
                      onClick={() => setData((d) => ({ ...d, logoUrl: null, logoName: "" }))}
                      className="text-xs text-smoky hover:text-error mt-2 underline"
                    >
                      Remove and upload different file
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-success/5 border border-success/20">
                  <p className="text-xs text-success font-medium">
                    Logo will be applied to all {data.selectedProducts.length} selected product{data.selectedProducts.length !== 1 ? "s" : ""}.
                    You can customize placement per product in the catalog after setup.
                  </p>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-200 hover:border-kraft p-12 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <input type="file" accept=".png,.jpg,.jpeg,.svg,.pdf" onChange={handleLogoUpload} className="hidden" />
                <Image size={40} className="text-kraft mb-3" />
                <p className="text-lg font-medium">Click to upload your logo</p>
                <p className="text-sm text-smoky mt-2">PNG, JPG, SVG, or PDF</p>
                <p className="text-xs text-smoky mt-1">Minimum 300 DPI recommended for print</p>
              </label>
            )}

            <div className="mt-8 bg-off-white p-4">
              <p className="text-xs font-medium mb-2">Logo Tips</p>
              <ul className="text-xs text-smoky space-y-1">
                <li>• Use a transparent PNG for best results</li>
                <li>• Vector files (SVG) work best for embroidery</li>
                <li>• Keep it simple — fine details may not print well on small items</li>
                <li>• Dark logos work best on light garments and vice versa</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Review your store
            </h2>
            <p className="text-smoky mb-8">
              Everything looks good? Let&apos;s launch your merch store.
            </p>

            <div className="space-y-6">
              {/* Company */}
              <div className="border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Building2 size={16} className="text-kraft-dark" />
                    Company
                  </h3>
                  <button onClick={() => setStep(1)} className="text-xs text-kraft-dark hover:text-black">Edit</button>
                </div>
                <p className="text-lg font-bold">{data.companyName}</p>
                {data.industry && <p className="text-sm text-smoky">{data.industry}</p>}
                {data.teamSize && <p className="text-sm text-smoky">{data.teamSize} employees</p>}
                <div className="flex gap-2 mt-2">
                  <div className="w-6 h-6 border border-gray-200" style={{ backgroundColor: data.primaryColor }} />
                  <div className="w-6 h-6 border border-gray-200" style={{ backgroundColor: data.secondaryColor }} />
                </div>
              </div>

              {/* Products */}
              <div className="border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <ShoppingBag size={16} className="text-kraft-dark" />
                    Products ({data.selectedProducts.length})
                  </h3>
                  <button onClick={() => setStep(2)} className="text-xs text-kraft-dark hover:text-black">Edit</button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {data.selectedProducts.slice(0, 8).map((p) => (
                    <div key={p.id} className="bg-off-white p-2 text-center">
                      <div className="w-full aspect-square flex items-center justify-center overflow-hidden mb-1">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <Package size={16} className="text-kraft" />
                        )}
                      </div>
                      <p className="text-[9px] line-clamp-1">{p.name}</p>
                    </div>
                  ))}
                  {data.selectedProducts.length > 8 && (
                    <div className="bg-off-white p-2 flex items-center justify-center">
                      <p className="text-xs text-smoky">+{data.selectedProducts.length - 8} more</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo */}
              <div className="border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Image size={16} className="text-kraft-dark" />
                    Logo
                  </h3>
                  <button onClick={() => setStep(3)} className="text-xs text-kraft-dark hover:text-black">Edit</button>
                </div>
                {data.logoUrl && (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-off-white border border-gray-200 flex items-center justify-center overflow-hidden">
                      <img src={data.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{data.logoName}</p>
                      <p className="text-xs text-success">Ready for decoration</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Launch button */}
            <button
              onClick={handleLaunch}
              disabled={saving}
              className="w-full mt-8 bg-black text-white py-5 text-sm tracking-[0.15em] uppercase font-bold hover:bg-brown transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Setting up your store...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Launch Your Merch Store
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      {step < 5 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-100 py-4">
          <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 text-sm text-smoky hover:text-black disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <div className="text-xs text-smoky">
              Step {step} of {STEPS.length}
            </div>

            {step < 4 ? (
              <button
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                disabled={!canProceed()}
                className="flex items-center gap-2 bg-black text-white px-6 py-2.5 text-sm font-medium hover:bg-brown disabled:opacity-30 transition-colors"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      )}

      {/* Product Detail Modal — Full Info */}
      {previewProduct && (
        <ProductDetailModal
          product={previewProduct}
          isSelected={data.selectedProducts.some((p) => p.id === previewProduct.id)}
          onClose={() => setPreviewProduct(null)}
          onToggle={() => {
            toggleProduct(previewProduct);
            setPreviewProduct(null);
          }}
          storeSlug={slug}
        />
      )}

      <StoreFooter companyName={data.companyName || "Create & Source"} />
    </div>
  );
}

// Comprehensive product detail modal for the setup wizard
function ProductDetailModal({ product, isSelected, onClose, onToggle, storeSlug }: {
  product: CatalogProduct;
  isSelected: boolean;
  onClose: () => void;
  onToggle: () => void;
  storeSlug: string;
}) {
  const [bulkTiers, setBulkTiers] = useState<Array<{ label: string; clientPriceFormatted: string; savings: number }>>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(1); // Skip first image (often a template)
  const [detailedColors, setDetailedColors] = useState<string[]>([]);
  const [detailedSizes, setDetailedSizes] = useState<string[]>([]);
  const [fullDescription, setFullDescription] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [selectedProductColors, setSelectedProductColors] = useState<Set<string>>(new Set());
  const [colorImages, setColorImages] = useState<Record<string, string>>({});

  const toggleColor = (color: string) => {
    setSelectedProductColors((prev) => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
  };

  // Fetch bulk pricing + product details on mount
  useEffect(() => {
    async function fetchData() {
      // Bulk pricing
      try {
        const params = new URLSearchParams({
          productId: product.providerId,
          provider: product.provider,
          category: product.category,
        });
        const res = await fetch(`/api/catalog/bulk-pricing?${params}`);
        if (res.ok) {
          const data = await res.json();
          setBulkTiers(data.tiers || []);
        }
      } catch {}
      setLoadingTiers(false);

      // Printify product details (colors, sizes, all images)
      if (product.provider === "printify") {
        setLoadingDetails(true);
        try {
          const res = await fetch(`/api/catalog/product-details?blueprintId=${product.providerId}&provider=printify`);
          if (res.ok) {
            const data = await res.json();
            if (data.images?.length) setProductImages(data.images);
            if (data.colors?.length) setDetailedColors(data.colors);
            if (data.sizes?.length) setDetailedSizes(data.sizes);
            if (data.description) setFullDescription(data.description);
            if (data.colorImages) setColorImages(data.colorImages);
          }
        } catch {}
        setLoadingDetails(false);
      }
    }
    fetchData();
  }, [product]);

  // Default locations by category
  const locations = getDefaultLocations(product.category);

  // Decoration methods by category
  const getDecorationMethods = (cat: string, name: string) => {
    const c = cat.toLowerCase();
    const n = name.toLowerCase();

    if (n.includes("notebook") || n.includes("journal") || n.includes("planner"))
      return ["Full Cover Print"];
    if (n.includes("sticker") || n.includes("patch"))
      return ["Die Cut Print"];
    if (n.includes("mouse") || n.includes("mousepad"))
      return ["Full Surface Print"];
    if (n.includes("poster") || n.includes("canvas") || n.includes("art print"))
      return ["High-Quality Print"];
    if (n.includes("phone") || n.includes("case") || n.includes("laptop sleeve"))
      return ["Full Wrap Print"];
    if (n.includes("puzzle") || n.includes("playing card"))
      return ["Full Print"];

    if (c.includes("shirt") || c.includes("tee") || c.includes("hoodie") || c.includes("sweat") || c.includes("polo") || c.includes("top"))
      return ["DTG Print", "DTF Print", "Embroidery", "Screen Print", "Heat Transfer"];
    if (c.includes("hat") || c.includes("cap") || c.includes("headwear") || c.includes("beanie"))
      return ["Embroidery", "Heat Transfer", "DTF Print"];
    if (c.includes("mug") || c.includes("drink") || c.includes("bottle") || c.includes("tumbler"))
      return ["Dye Sublimation", "UV Print", "Laser Engrave"];
    if (c.includes("bag") || c.includes("tote") || c.includes("backpack"))
      return ["Screen Print", "DTF Print", "Embroidery"];
    if (c.includes("jacket") || c.includes("vest") || c.includes("outerwear") || c.includes("quarter"))
      return ["Embroidery", "Heat Transfer", "DTF Print"];
    if (c.includes("blanket") || c.includes("towel") || c.includes("pillow"))
      return ["All-Over Print", "Dye Sublimation"];
    if (c.includes("office") || c.includes("tech") || c.includes("accessori"))
      return ["Full Print", "UV Print"];
    return ["Print", "Embroidery"];
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-lg">{product.name}</h3>
            <p className="text-[10px] tracking-[0.15em] uppercase text-kraft-dark">{product.category}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-off-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Gallery + Description */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              {/* Main image */}
              <div className="w-52 h-52 bg-off-white flex items-center justify-center overflow-hidden mb-2">
                {(productImages.length > 0 ? productImages[activeImageIndex] : product.image) ? (
                  <img
                    src={productImages.length > 0 ? productImages[activeImageIndex] : product.image!}
                    alt={product.name}
                    className="w-full h-full object-contain p-3"
                  />
                ) : (
                  <Package size={40} className="text-kraft" />
                )}
              </div>
              {/* Thumbnail strip — different colors */}
              {productImages.length > 1 && (
                <div className="flex gap-1 overflow-x-auto">
                  {productImages.slice(0, 8).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-10 h-10 bg-off-white flex-shrink-0 overflow-hidden border-2 transition-colors ${
                        activeImageIndex === i ? "border-black" : "border-transparent hover:border-kraft"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1">
              {product.clientPrice && (
                <p className="text-3xl font-bold mb-2">
                  ${(product.clientPrice / 100).toFixed(2)}
                  <span className="text-sm text-smoky ml-2 font-normal">per item</span>
                </p>
              )}
              {(fullDescription || product.description) ? (
                <div className="mb-3">
                  <p className={`text-xs text-smoky leading-relaxed ${showFullDesc ? "" : "line-clamp-3"}`}>
                    {(fullDescription || product.description || "").replace(/Disclaimer:.*$/i, "").replace(/\.\.:/g, ". ").replace(/\.:/g, ". ")}
                  </p>
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="text-[10px] text-kraft-dark hover:text-black mt-1 underline"
                  >
                    {showFullDesc ? "Show less" : "See more"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-smoky italic">Loading details...</p>
              )}

              {/* Available sizes */}
              {detailedSizes.length > 0 && (
                <div className="mb-2">
                  <p className="text-[9px] tracking-wider uppercase text-smoky mb-1">Sizes</p>
                  <p className="text-xs">{detailedSizes.join(", ")}</p>
                </div>
              )}

              {loadingDetails && (
                <p className="text-[10px] text-kraft-dark animate-pulse">Loading full details...</p>
              )}
            </div>
          </div>

          {/* Available Colors */}
          {(detailedColors.length > 0 || (product.colors && product.colors.length > 0)) && (
            <div>
              <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                <Palette size={14} className="text-kraft-dark" />
                Available Colors ({(detailedColors.length || product.colors?.length || 0)})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(detailedColors.length > 0 ? detailedColors : product.colors || []).map((color) => {
                  const isColorSelected = selectedProductColors.has(color);
                  const hasColorImage = !!colorImages[color];

                  return (
                    <button
                      key={color}
                      onClick={() => {
                        toggleColor(color);
                        // If we have a real Printify image for this color, show it
                        if (hasColorImage) {
                          // Add color image to productImages if not already there and switch to it
                          const existingIdx = productImages.indexOf(colorImages[color]);
                          if (existingIdx >= 0) {
                            setActiveImageIndex(existingIdx);
                          } else {
                            setProductImages((prev) => [...prev, colorImages[color]]);
                            setActiveImageIndex(productImages.length); // will be the new last index
                          }
                        }
                      }}
                      className={`px-2.5 py-1.5 text-[10px] tracking-wide transition-colors cursor-pointer flex items-center gap-1 ${
                        isColorSelected
                          ? "bg-black text-white"
                          : "bg-off-white hover:bg-kraft/10"
                      }`}
                    >
                      {isColorSelected && <Check size={10} />}
                      {color}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[9px] text-smoky">
                  {selectedProductColors.size > 0
                    ? `${selectedProductColors.size} color${selectedProductColors.size > 1 ? "s" : ""} selected`
                    : "Click colors to select for your store"}
                </p>
                <button
                  onClick={() => {
                    const allColors = detailedColors.length > 0 ? detailedColors : product.colors || [];
                    if (selectedProductColors.size === allColors.length) {
                      setSelectedProductColors(new Set());
                    } else {
                      setSelectedProductColors(new Set(allColors));
                    }
                  }}
                  className="text-[9px] text-kraft-dark hover:text-black underline"
                >
                  {selectedProductColors.size === (detailedColors.length || product.colors?.length || 0)
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>
            </div>
          )}

          {/* Decoration Locations */}
          <div>
            <p className="text-xs font-semibold mb-2 flex items-center gap-2">
              <MapPin size={14} className="text-kraft-dark" />
              Logo Placement Options
            </p>
            <div className="flex flex-wrap gap-1.5">
              {locations.map((loc) => (
                <span key={loc.id} className="px-3 py-1.5 bg-off-white text-[10px] tracking-wide">
                  {loc.label}
                </span>
              ))}
            </div>
          </div>

          {/* Decoration Methods */}
          <div>
            <p className="text-xs font-semibold mb-2 flex items-center gap-2">
              <Layers size={14} className="text-kraft-dark" />
              Decoration Methods
            </p>
            <div className="flex flex-wrap gap-1.5">
              {getDecorationMethods(product.category, product.name).map((method) => (
                <span key={method} className="px-3 py-1.5 bg-off-white text-[10px] tracking-wide">
                  {method}
                </span>
              ))}
            </div>
          </div>

          {/* Volume Pricing */}
          <div>
            <p className="text-xs font-semibold mb-2 flex items-center gap-2">
              <DollarSign size={14} className="text-kraft-dark" />
              Volume Pricing — Order More, Save More
            </p>
            {loadingTiers ? (
              <div className="bg-off-white p-4 text-center">
                <Loader2 size={16} className="animate-spin text-kraft mx-auto" />
              </div>
            ) : bulkTiers.length > 0 ? (
              <div className="border border-kraft/20">
                <table className="w-full">
                  <thead>
                    <tr className="bg-off-white border-b border-kraft/20">
                      <th className="text-left px-3 py-2 text-[9px] tracking-wider uppercase text-smoky">Quantity</th>
                      <th className="text-right px-3 py-2 text-[9px] tracking-wider uppercase text-smoky">Price Each</th>
                      <th className="text-right px-3 py-2 text-[9px] tracking-wider uppercase text-smoky">Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkTiers.slice(0, 6).map((tier, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-xs font-medium">{tier.label}</td>
                        <td className="px-3 py-2 text-xs font-bold text-right">{tier.clientPriceFormatted}</td>
                        <td className="px-3 py-2 text-right">
                          {tier.savings > 0 ? (
                            <span className="text-[10px] text-success font-medium">Save {tier.savings}%</span>
                          ) : (
                            <span className="text-[10px] text-smoky">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : product.clientPrice ? (
              <div className="bg-off-white p-4">
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[10, 25, 50, 100].map((qty) => (
                    <div key={qty}>
                      <p className="text-lg font-bold">${((product.clientPrice! / 100) * qty).toFixed(0)}</p>
                      <p className="text-[9px] text-smoky uppercase">{qty} items</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Logo & Placement Configurator */}
          <div>
            <p className="text-xs font-semibold mb-2">Upload Logo & Choose Placement</p>
            <p className="text-[10px] text-smoky mb-4">
              Select where you want your logo, then upload or choose from your gallery. You&apos;ll see a preview before adding.
            </p>
            <ProductConfigurator
              productName={product.name}
              productImage={product.image}
              productCategory={product.category}
              productProvider={product.provider}
              productBlueprintId={product.providerId}
              storeSlug={storeSlug}
              locations={getDefaultLocations(product.category)}
              onConfigChange={() => {}}
              selectedColor={selectedProductColors.size > 0 ? [...selectedProductColors][0] : undefined}
              selectedColors={selectedProductColors.size > 0 ? [...selectedProductColors] : undefined}
              colorImageUrl={
                // Prefer real Printify color image, fall back to current gallery image
                selectedProductColors.size > 0 && colorImages[[...selectedProductColors][0]]
                  ? colorImages[[...selectedProductColors][0]]
                  : productImages.length > 0 ? productImages[activeImageIndex] : null
              }
            />
          </div>

          {/* Pricing */}
          {product.clientPrice && (
            <div className="bg-kraft/10 border border-kraft/20 p-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-smoky">Price per item (includes decoration)</span>
                <span className="font-bold text-xl">${(product.clientPrice / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Add/Remove Button */}
          <button
            onClick={onToggle}
            className={`w-full py-4 text-sm tracking-[0.15em] uppercase font-medium flex items-center justify-center gap-2 transition-all ${
              isSelected
                ? "bg-error/10 text-error border border-error/20 hover:bg-error/20"
                : "bg-black text-white hover:bg-brown"
            }`}
          >
            {isSelected ? (
              <><X size={16} /> Remove from Store</>
            ) : (
              <><Plus size={16} /> Add to Store{product.clientPrice ? ` — $${(product.clientPrice / 100).toFixed(2)}/item` : ""}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Default locations helper
function getDefaultLocations(category: string): Array<{ id: string; label: string }> {
  const cat = category.toLowerCase();
  if (cat.includes("shirt") || cat.includes("tee") || cat.includes("top") || cat.includes("polo"))
    return [{ id: "left_chest", label: "Left Chest" }, { id: "right_chest", label: "Right Chest" }, { id: "front", label: "Full Front" }, { id: "back", label: "Full Back" }, { id: "left_sleeve", label: "Left Sleeve" }, { id: "right_sleeve", label: "Right Sleeve" }];
  if (cat.includes("hoodie") || cat.includes("sweat") || cat.includes("quarter") || cat.includes("outerwear") || cat.includes("jacket") || cat.includes("vest"))
    return [{ id: "left_chest", label: "Left Chest" }, { id: "front", label: "Full Front" }, { id: "back", label: "Full Back" }, { id: "left_sleeve", label: "Left Sleeve" }];
  if (cat.includes("hat") || cat.includes("cap") || cat.includes("headwear") || cat.includes("beanie"))
    return [{ id: "front", label: "Front Center" }, { id: "back", label: "Back" }];
  if (cat.includes("mug") || cat.includes("drink") || cat.includes("bottle") || cat.includes("tumbler"))
    return [{ id: "wrap", label: "Wrap Around" }, { id: "front", label: "Front" }, { id: "laser_engrave", label: "Laser Engrave" }];
  if (cat.includes("bag") || cat.includes("tote") || cat.includes("backpack"))
    return [{ id: "front", label: "Front" }, { id: "back", label: "Back" }];
  return [{ id: "front", label: "Front" }, { id: "back", label: "Back" }, { id: "left_chest", label: "Left Chest" }];
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-smoky hover:text-kraft-dark"
      >
        <HelpCircle size={13} />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-[10px] px-3 py-1.5 whitespace-nowrap z-50">
          {text}
        </span>
      )}
    </span>
  );
}
