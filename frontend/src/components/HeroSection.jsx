import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Leaf, Cpu, ArrowRight } from 'lucide-react';

const TRUST_INDICATORS = [
  {
    icon: Sprout,
    title: 'Natural Freshness',
    subtitle: '100% Chemical-Free',
  },
  {
    icon: ShieldCheck,
    title: 'Farm to Table',
    subtitle: 'Traceable Quality',
  },
  {
    icon: Leaf,
    title: 'Sustainable Practices',
    subtitle: 'Farming Practices',
  },
  {
    icon: Cpu,
    title: 'Technology Driven',
    subtitle: 'Better Yields',
  },
];

export default function HeroSection() {
  return (
    <section 
      id="hero" 
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4"
      aria-label="Sporekart Agritech Hero Section"
    >
      {/* Soft warm ivory hero container matching GreenSpore reference aesthetic */}
      <div className="relative w-full rounded-[28px] sm:rounded-[36px] bg-gradient-to-b from-[#FAF8F3] via-[#F6F2E8] to-[#EFE8DD] border border-surface-border p-6 sm:p-10 lg:p-12 overflow-hidden shadow-level-1">
        
        {/* Ambient natural lighting glows */}
        <div className="absolute top-0 right-1/4 w-[520px] h-[520px] bg-emerald-100/40 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-amber-100/35 rounded-full blur-[110px] pointer-events-none" />

        {/* Two-Column Hero Content */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
          
          {/* Left Column: Eyebrow, Main Headline, Description, CTAs, Trust Indicators */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-5 sm:space-y-6">
            
            {/* Eyebrow */}
            <div className="inline-block">
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.22em] text-forest-800/85 uppercase font-sans">
                PREMIUM MUSHROOMS / SUSTAINABLE AGRITECH
              </span>
            </div>

            {/* Main Headline in DM Serif Display */}
            <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-[58px] xl:text-[66px] text-forest-900 leading-[1.08] tracking-tight">
              Nature’s Goodness.<br className="hidden sm:inline" /> Grown Smarter.
            </h1>

            {/* Supporting Description */}
            <p className="text-typography-secondary text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-sans">
              We bring you farm-fresh mushrooms using thoughtful growing practices and modern agritech, bringing nature’s goodness to your table.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
              <Link
                to="/products"
                className="bg-forest-900 hover:bg-forest-800 text-white font-semibold text-sm sm:text-base px-7 py-3.5 rounded-full inline-flex items-center gap-2.5 shadow-level-1 hover-lift transition-all button-press"
              >
                <span>Explore Our Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/#farm"
                className="text-forest-900 hover:text-forest-700 font-semibold text-sm sm:text-base px-4 py-3.5 inline-flex items-center gap-2 transition-colors group"
              >
                <span>Discover Our Farm</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* 4 Trust Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 pt-6 border-t border-forest-900/10">
              {TRUST_INDICATORS.map((ind) => {
                const Icon = ind.icon;
                return (
                  <div key={ind.title} className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-forest-900/15 bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
                      <Icon className="w-5 h-5 text-forest-800" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-forest-900 leading-tight">
                        {ind.title}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-typography-muted leading-tight mt-0.5">
                        {ind.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column: Hero Crate Visual with Sporekart Branding */}
          <div className="lg:col-span-6 xl:col-span-5 relative w-full flex items-center justify-center">
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/11] lg:aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden shadow-level-2 border border-surface-border/70 group">
              <img
                src="/sporekart-hero-crate.jpg"
                alt="Sporekart farm-fresh gourmet mushrooms in branded wooden crate"
                width="1280"
                height="720"
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover object-center transform group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
              {/* Subtle natural lighting gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />

              {/* Handwritten "Fresh from our farms" badge overlay */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 pointer-events-none text-white select-none text-right drop-shadow-md">
                <span
                  className="text-base sm:text-xl md:text-2xl font-normal tracking-wide block italic"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Fresh from<br />our farms
                </span>
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 ml-auto mt-0.5 text-white/90 drop-shadow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M8 4c4 0 9 2 9 8m0 0l-3-3m3 3l3-3"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
