"use client";

interface HeroBannerProps {
  companyName: string;
  welcomeMessage?: string | null;
  heroImage?: string | null;
}

export function HeroBanner({
  companyName,
  welcomeMessage,
  heroImage,
}: HeroBannerProps) {
  return (
    <section className="relative bg-black text-white overflow-hidden">
      {/* Background image or gradient */}
      {heroImage ? (
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#3D1C1C] to-black" />
      )}

      {/* Subtle grain overlay for texture */}
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative max-w-7xl mx-auto px-6 py-28 md:py-40">
        <div className="max-w-2xl">
          <p className="text-kraft text-[10px] tracking-[0.4em] uppercase mb-6 font-light">
            Welcome to
          </p>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.95] mb-2">
            {companyName}
          </h1>

          <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.95] text-kraft mb-8">
            Merch Store
          </h2>

          {/* Accent line */}
          <div className="w-16 h-[2px] bg-kraft mb-8" />

          {welcomeMessage && (
            <p className="text-white/60 text-lg mb-10 leading-relaxed max-w-lg">
              {welcomeMessage}
            </p>
          )}

          <a
            href="#products"
            className="inline-flex items-center justify-center bg-kraft text-black px-10 py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-kraft-dark transition-all"
          >
            Shop Now
          </a>
        </div>
      </div>
    </section>
  );
}
