"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Demo auth: email + password must match a user in the store
    // In production, this would use Supabase Auth with proper password hashing
    try {
      const { supabase } = await import("@/lib/supabase");

      // Verify user exists in this specific store
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!store) {
        setError("Store not found.");
        setLoading(false);
        return;
      }

      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .eq("store_id", store.id)
        .eq("is_active", true)
        .single();

      if (user && password) {
        // Store user session in localStorage (demo auth)
        localStorage.setItem(`cs-user-${slug}`, JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          storeId: user.store_id,
        }));
        router.push(`/store/${slug}`);
      } else {
        setError("Invalid email or password.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        {/* Logo area */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500 text-sm">
            Sign in to access your merch store
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.15em] uppercase text-gray-500 block mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-kraft placeholder-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] tracking-[0.15em] uppercase text-gray-500 block mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-kraft placeholder-gray-600"
              />
            </div>
          </div>

          {error && (
            <p className="text-error text-xs bg-error/10 px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-kraft text-black py-3.5 text-sm tracking-[0.12em] uppercase font-bold hover:bg-kraft-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Demo hint */}
        <div className="mt-8 p-4 border border-white/5 bg-white/5">
          <p className="text-[10px] text-gray-500 mb-2 tracking-wider uppercase">Demo Accounts</p>
          <div className="space-y-1">
            <button
              onClick={() => { setEmail("admin@acmecorp.com"); setPassword("demo"); }}
              className="text-xs text-gray-400 hover:text-white transition-colors block"
            >
              admin@acmecorp.com (Admin)
            </button>
            <button
              onClick={() => { setEmail("sarah.j@acmecorp.com"); setPassword("demo"); }}
              className="text-xs text-gray-400 hover:text-white transition-colors block"
            >
              sarah.j@acmecorp.com (Employee)
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-xs text-gray-600">
          Powered by <span className="text-kraft">Create & Source</span>
        </p>
      </div>
    </div>
  );
}
