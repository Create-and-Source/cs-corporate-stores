"use client";

import { Button } from "../ui/Button";

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
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-black via-brown to-black" />
      )}

      <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="max-w-xl">
          <p className="text-kraft text-[11px] tracking-[0.3em] uppercase mb-4">
            Welcome to
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            {companyName}
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-kraft mb-6">
            Merch Store
          </h2>
          {welcomeMessage && (
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              {welcomeMessage}
            </p>
          )}
          <Button variant="secondary" size="lg">
            <a href="#products">Shop Now</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
