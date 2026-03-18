"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Save,
  Upload,
  Palette,
  Type,
  Image,
  Loader2,
  Check,
  ArrowLeft,
  Eye,
  Store,
} from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { supabase } from "@/lib/supabase";

interface StoreSettings {
  id: string;
  slug: string;
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  welcome_message: string | null;
  hero_image_url: string | null;
  is_active: boolean;
}

export default function StoreSettingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .single();
      if (data) {
        setSettings(data);
        if (data.logo_url) setLogoPreview(data.logo_url);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    const { error } = await supabase
      .from("stores")
      .update({
        company_name: settings.company_name,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        welcome_message: settings.welcome_message,
        hero_image_url: settings.hero_image_url,
        logo_url: settings.logo_url,
      })
      .eq("id", settings.id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setLogoPreview(url);
      setSettings((s) => s ? { ...s, logo_url: url } : null);
    };
    reader.readAsDataURL(file);
  };

  const update = (field: keyof StoreSettings, value: string | null) => {
    setSettings((s) => s ? { ...s, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-smoky">Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-smoky">Store not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName={settings.company_name}
        logoUrl={logoPreview}
        creditBalance={0}
        cartCount={0}
        isAdmin={true}
        storeSlug={slug}
      />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <a
          href={`/store/${slug}/admin`}
          className="inline-flex items-center gap-1 text-xs text-smoky hover:text-black mb-4"
        >
          <ArrowLeft size={12} /> Back to Dashboard
        </a>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
            <p className="text-sm text-smoky mt-1">Customize how your store looks and feels</p>
          </div>
          <div className="flex gap-3">
            <a
              href={`/store/${slug}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-sm hover:border-kraft transition-colors"
            >
              <Eye size={14} />
              Preview Store
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-sm font-medium hover:bg-brown transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saved ? (
                <Check size={14} />
              ) : (
                <Save size={14} />
              )}
              {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Form */}
          <div className="space-y-8">
            {/* Store Name */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Store size={16} className="text-kraft-dark" />
                <label className="text-sm font-semibold">Store Name</label>
              </div>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => update("company_name", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
              />
            </div>

            {/* Logo */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image size={16} className="text-kraft-dark" />
                <label className="text-sm font-semibold">Company Logo</label>
              </div>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="w-20 h-20 bg-off-white border border-gray-200 flex items-center justify-center overflow-hidden">
                    <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-off-white border border-gray-200 flex items-center justify-center">
                    <Image size={24} className="text-kraft" />
                  </div>
                )}
                <div>
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm cursor-pointer hover:border-kraft transition-colors">
                    <Upload size={14} />
                    Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {logoPreview && (
                    <button
                      onClick={() => { setLogoPreview(null); update("logo_url", null); }}
                      className="text-xs text-smoky hover:text-error mt-2"
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Brand Colors */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Palette size={16} className="text-kraft-dark" />
                <label className="text-sm font-semibold">Brand Colors</label>
              </div>
              <div className="flex gap-6">
                <div>
                  <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-2">Primary</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => update("primary_color", e.target.value)}
                      className="w-12 h-12 border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => update("primary_color", e.target.value)}
                      className="w-24 px-2 py-1.5 border border-gray-200 text-xs font-mono focus:outline-none focus:border-kraft"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-2">Secondary</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => update("secondary_color", e.target.value)}
                      className="w-12 h-12 border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => update("secondary_color", e.target.value)}
                      className="w-24 px-2 py-1.5 border border-gray-200 text-xs font-mono focus:outline-none focus:border-kraft"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Welcome Message */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Type size={16} className="text-kraft-dark" />
                <label className="text-sm font-semibold">Welcome Message</label>
              </div>
              <textarea
                value={settings.welcome_message || ""}
                onChange={(e) => update("welcome_message", e.target.value || null)}
                placeholder="Welcome to our merch store! Browse and use your credits to gear up."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-kraft resize-none"
              />
              <p className="text-[10px] text-smoky mt-1">Shown on the store hero banner</p>
            </div>

            {/* Store URL */}
            <div>
              <label className="text-sm font-semibold block mb-2">Store URL</label>
              <div className="flex items-center bg-off-white border border-gray-200 px-4 py-3">
                <span className="text-sm text-smoky">cs-corporate-stores.vercel.app/store/</span>
                <span className="text-sm font-medium">{settings.slug}</span>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Eye size={16} className="text-kraft-dark" />
              Live Preview
            </p>
            <div className="border border-gray-200 bg-off-white p-2 sticky top-24">
              {/* Mini browser chrome */}
              <div className="bg-white border-b border-gray-100 px-3 py-2 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-gray-200" />
                <div className="w-2 h-2 bg-gray-200" />
                <div className="w-2 h-2 bg-gray-200" />
                <div className="flex-1 mx-4 bg-off-white px-3 py-1 text-[9px] text-smoky text-center">
                  {settings.slug}.createandsource.com
                </div>
              </div>

              {/* Preview content */}
              <div className="bg-white">
                {/* Header preview */}
                <div className="border-b border-gray-50 px-4 py-3 flex items-center justify-between">
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="h-6 object-contain" />
                  ) : (
                    <span className="text-sm font-bold uppercase">{settings.company_name}</span>
                  )}
                  <div className="flex items-center gap-2 text-[8px] text-smoky">
                    <span>SHOP</span>
                    <span>ORDERS</span>
                  </div>
                </div>

                {/* Hero preview */}
                <div
                  className="p-8 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${settings.primary_color}, #3D1C1C)`,
                  }}
                >
                  <p className="text-[7px] tracking-[0.3em] uppercase mb-1" style={{ color: settings.secondary_color }}>
                    Welcome to
                  </p>
                  <p className="text-lg font-bold leading-tight">{settings.company_name}</p>
                  <p className="text-lg font-bold leading-tight" style={{ color: settings.secondary_color }}>
                    Merch Store
                  </p>
                  {settings.welcome_message && (
                    <p className="text-[8px] text-white/50 mt-2 line-clamp-2">
                      {settings.welcome_message}
                    </p>
                  )}
                  <div
                    className="inline-block mt-3 px-3 py-1.5 text-[7px] uppercase tracking-wider font-medium"
                    style={{ backgroundColor: settings.secondary_color, color: settings.primary_color }}
                  >
                    Shop Now
                  </div>
                </div>

                {/* Products preview */}
                <div className="p-4">
                  <p className="text-[8px] font-bold mb-2">All Products</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i}>
                        <div className="aspect-square bg-off-white mb-1" />
                        <div className="h-1 bg-gray-200 w-3/4 mb-0.5" />
                        <div className="h-1 bg-gray-100 w-1/2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StoreFooter companyName={settings.company_name} />
    </div>
  );
}
