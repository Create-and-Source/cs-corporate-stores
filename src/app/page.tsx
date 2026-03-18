"use client";

import {
  ArrowRight,
  Package,
  Users,
  Palette,
  CreditCard,
  Truck,
  BarChart3,
  Shield,
  Zap,
  Store,
  Gift,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">
            Create<span className="text-kraft">&</span>Source
          </span>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-smoky hover:text-black transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-smoky hover:text-black transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-smoky hover:text-black transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/store/acme-corp"
              className="text-sm text-smoky hover:text-black transition-colors hidden md:block"
            >
              View Demo
            </a>
            <a
              href="/store/acme-corp"
              className="bg-black text-white px-5 py-2.5 text-sm font-medium tracking-wide hover:bg-brown transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-black text-white overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-brown/30 to-black" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        <div className="relative max-w-7xl mx-auto px-6 py-28 md:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-kraft animate-pulse" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-gray-300">
                Now Accepting Corporate Clients
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
              Your brand.
              <br />
              Their merch.
              <br />
              <span className="text-kraft">Zero hassle.</span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl mt-8 max-w-xl leading-relaxed">
              We build custom branded merchandise stores for your company.
              Employees shop with credits. We handle production and shipping.
              You look like a hero.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <a
                href="/store/acme-corp"
                className="bg-kraft text-black px-8 py-4 text-sm font-bold tracking-[0.1em] uppercase hover:bg-kraft-light transition-colors inline-flex items-center justify-center gap-2"
              >
                See a Live Store
                <ArrowRight size={16} />
              </a>
              <a
                href="#how-it-works"
                className="border border-white/20 text-white px-8 py-4 text-sm font-medium tracking-[0.1em] uppercase hover:bg-white/5 transition-colors inline-flex items-center justify-center"
              >
                How It Works
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 mt-16 pt-8 border-t border-white/10">
              <div>
                <p className="text-3xl font-bold text-kraft">8,000+</p>
                <p className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mt-1">Products Available</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-3xl font-bold text-kraft">2</p>
                <p className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mt-1">Fulfillment Partners</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-3xl font-bold text-kraft">48hr</p>
                <p className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mt-1">Store Setup</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / Trust bar */}
      <section className="bg-off-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center gap-12">
          <p className="text-[10px] tracking-[0.2em] uppercase text-smoky">
            Decoration Methods
          </p>
          {["Embroidery", "DTG Print", "DTF Print", "Screen Print", "Laser Engrave", "Heat Transfer"].map((m) => (
            <span key={m} className="text-xs tracking-wide text-smoky-light hidden md:block">
              {m}
            </span>
          ))}
        </div>
      </section>

      {/* What You Get */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-kraft-dark mb-3">
            Everything Included
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            A complete merch program,<br />built for your brand
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Store,
              title: "Custom Branded Store",
              desc: "A beautiful online store with your logo, colors, and curated products. Looks like it was built in-house.",
            },
            {
              icon: CreditCard,
              title: "Employee Credit System",
              desc: "Load credits for new hires, bonuses, holidays, or milestones. Employees shop without a credit card.",
            },
            {
              icon: Palette,
              title: "Curated Product Catalog",
              desc: "Choose from 8,000+ products — apparel, headwear, drinkware, bags, tech accessories, and more.",
            },
            {
              icon: Truck,
              title: "Direct-to-Door Shipping",
              desc: "Orders are produced and shipped directly to each employee. No inventory to manage, no boxes to ship.",
            },
            {
              icon: Users,
              title: "Employee + Admin Portal",
              desc: "Your HR team manages employees and credits. Employees browse, shop, and track orders.",
            },
            {
              icon: BarChart3,
              title: "Full Analytics",
              desc: "See spending, popular items, order status, and credit utilization across your entire team.",
            },
            {
              icon: Shield,
              title: "Brand Control",
              desc: "You approve every product before it goes in the store. No off-brand surprises.",
            },
            {
              icon: Zap,
              title: "Fast Setup",
              desc: "Your store is live within 48 hours. We handle the tech, you provide the logo and product picks.",
            },
            {
              icon: Gift,
              title: "Flexible Credit Types",
              desc: "New hire kits, quarterly bonuses, holiday gifts, anniversary rewards — any reason to give.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group border border-gray-100 p-6 hover:border-kraft transition-all"
            >
              <feature.icon
                size={24}
                className="text-kraft-dark mb-4 group-hover:text-kraft transition-colors"
              />
              <h3 className="font-bold text-sm mb-2">{feature.title}</h3>
              <p className="text-smoky text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <p className="text-[11px] tracking-[0.3em] uppercase text-kraft mb-3">
              Simple Process
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Pick Your Products",
                desc: "Browse our catalog and choose the merch that fits your brand. Tees, hoodies, hats, drinkware — you name it.",
              },
              {
                step: "02",
                title: "We Build Your Store",
                desc: "We create a custom branded store with your logo, colors, and approved product lineup. Live in 48 hours.",
              },
              {
                step: "03",
                title: "Load Employee Credits",
                desc: "Assign credits to your team — new hire bonuses, holiday gifts, performance rewards. You set the budget.",
              },
              {
                step: "04",
                title: "They Shop, We Ship",
                desc: "Employees pick their favorite items, we produce and ship directly to them. You just watch it happen.",
              },
            ].map((step) => (
              <div key={step.step}>
                <span className="text-5xl font-bold text-kraft/30">
                  {step.step}
                </span>
                <h3 className="font-bold text-lg mt-4 mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Store Preview */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-kraft-dark mb-3">
              See It In Action
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              This is what your<br />employees will see
            </h2>
            <p className="text-smoky leading-relaxed mb-8">
              A clean, premium shopping experience with your branding front and center.
              Credit balance visible at all times. Simple checkout.
              Order tracking built in. No clunky corporate portals.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                "Branded storefront with your logo and colors",
                "Employee login with credit balance",
                "Size and color selection on every product",
                "Real-time order tracking with shipping updates",
                "Admin panel to manage employees and credits",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-kraft-dark mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>

            <a
              href="/store/acme-corp"
              className="bg-black text-white px-8 py-4 text-sm font-bold tracking-[0.1em] uppercase hover:bg-brown transition-colors inline-flex items-center gap-2"
            >
              Explore the Demo Store
              <ChevronRight size={16} />
            </a>
          </div>

          {/* Store preview mock */}
          <div className="bg-off-white border border-gray-200 p-2">
            {/* Browser chrome */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <div className="w-3 h-3 rounded-full bg-gray-200" />
              </div>
              <div className="flex-1 mx-8">
                <div className="bg-off-white rounded-full px-4 py-1.5 text-[11px] text-smoky text-center">
                  acme-corp.createandsource.com
                </div>
              </div>
            </div>

            {/* Mock store content */}
            <div className="bg-white p-6">
              {/* Mock header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                <span className="font-bold text-sm">ACME Corporation</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-off-white px-2 py-1 text-smoky">$150.00 credit</span>
                  <Package size={16} className="text-smoky" />
                </div>
              </div>

              {/* Mock hero */}
              <div className="bg-gradient-to-r from-black to-brown text-white p-8 mb-6">
                <p className="text-[9px] tracking-[0.2em] uppercase text-kraft mb-2">Welcome to</p>
                <p className="text-xl font-bold">ACME Corporation</p>
                <p className="text-xl font-bold text-kraft">Merch Store</p>
              </div>

              {/* Mock products */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "Logo Tee", price: "$28.00" },
                  { name: "Hoodie", price: "$55.00" },
                  { name: "Cap", price: "$22.00" },
                ].map((p) => (
                  <div key={p.name}>
                    <div className="aspect-square bg-off-white mb-2" />
                    <p className="text-[10px] text-smoky">Apparel</p>
                    <p className="text-xs font-medium">{p.name}</p>
                    <p className="text-xs font-semibold mt-1">{p.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section id="pricing" className="bg-off-white">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-kraft-dark mb-3">
              Simple Pricing
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              No setup fees.<br />No monthly minimums.
            </h2>
            <p className="text-smoky text-lg leading-relaxed mb-10">
              You only pay for what your employees order.
              Product cost + decoration + shipping = your price.
              Set your own credit values and manage your budget.
            </p>

            <div className="bg-white border border-gray-200 p-8 md:p-12 text-left max-w-lg mx-auto">
              <h3 className="font-bold text-xl mb-6">What&apos;s included</h3>
              <ul className="space-y-4">
                {[
                  "Custom branded store",
                  "Employee login system",
                  "Credit management dashboard",
                  "Admin portal for your HR team",
                  "8,000+ product catalog",
                  "Order tracking + notifications",
                  "Direct-to-door shipping",
                  "Dedicated support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-success flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="/store/acme-corp"
                className="bg-black text-white w-full mt-8 py-4 text-sm font-bold tracking-[0.1em] uppercase hover:bg-brown transition-colors flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <span className="text-xl font-bold tracking-tight">
                Create<span className="text-kraft">&</span>Source
              </span>
              <p className="text-gray-500 text-sm mt-3 max-w-sm leading-relaxed">
                Premium corporate merchandise stores. We build the store, manage the products, and ship directly to your team.
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-4">
                Platform
              </p>
              <ul className="space-y-3">
                <li><a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/store/acme-corp" className="text-sm text-gray-400 hover:text-white transition-colors">Demo Store</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-4">
                Contact
              </p>
              <ul className="space-y-3">
                <li className="text-sm text-gray-400">hello@createandsource.com</li>
                <li className="text-sm text-gray-400">Scottsdale, AZ</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 flex items-center justify-between">
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} Create & Source. All rights reserved.
            </p>
            <p className="text-xs text-gray-600">
              A Get Stoa LLC company
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
