import React, { useState, useEffect } from 'react';
import { 
  Sprout, ShieldCheck, ArrowRight, ShoppingBag, 
  GraduationCap, TrendingUp, MessageCircle, Cpu, CheckCircle2
} from 'lucide-react';

const LIVE_ACTIVITIES = [
  '⚡ Dispatching Batch #SK-849: 20kg Oyster Spawn to Nashik via Cold-Chain',
  '🎓 Pooja from Pune enrolled in Commercial Mushroom Masterclass (9m ago)',
  '🚚 Dispatched 150 PP Autoclave Bags to Satara with 0.2µ Filter Patch',
  '🍄 Rajesh from Belagavi completed 1st flush: 120kg Oyster under Sporekart Buyback',
  '🔬 Lab Batch #SP-902 released: 99.9% Purity 1st Gen Milky Spawn'
];

const TRUST_INDICATORS = [
  {
    icon: ShieldCheck,
    title: '100% Contamination Free',
    subtitle: 'Class 100 Cleanroom Certified',
  },
  {
    icon: Sprout,
    title: 'Daily Fresh Harvest',
    subtitle: 'Zero Pesticides & Chemicals',
  },
  {
    icon: TrendingUp,
    title: 'Guaranteed Buyback',
    subtitle: 'Legally Signed Procurement',
  },
  {
    icon: Cpu,
    title: 'Precision AgriTech',
    subtitle: 'IoT Microclimate Automation',
  },
];

/**
 * HeroSection
 * Modern hero container with user-supplied high-tech oyster mushroom background image,
 * luminous light gradient for maximum text readability, live telemetry ticker, and dual CTAs.
 */
export default function HeroSection() {
  const [tickerIndex, setTickerIndex] = useState(0);

  // Live activity ticker auto-rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_ACTIVITIES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section 
      id="hero" 
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4"
      aria-label="Sporekart Agritech Hero Section"
    >
      {/* Hero Container with Background Image */}
      <div 
        className="relative w-full rounded-[28px] sm:rounded-[36px] overflow-hidden border border-white/80 shadow-2xl bg-white flex flex-col justify-between p-6 sm:p-8 lg:p-10 text-forest-950 transition-all duration-500"
      >
        {/* Background Image Layer with Progressive Right-to-Left Blur (Zero Human Interference) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <img
            src="/sporekart-hero-bg.jpg"
            alt="Sporekart natural commercial mushroom farm with fresh oyster mushroom fruiting clusters"
            width="1920"
            height="1080"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-right md:object-center transform scale-[1.01] transition-transform duration-1000"
          />

          {/* Progressive Optical Blur Layers increasing in strength from right to left */}
          <div 
            className="absolute inset-0 pointer-events-none backdrop-blur-[2px]" 
            style={{
              maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0) 75%)',
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0) 75%)'
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none backdrop-blur-[6px]" 
            style={{
              maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0) 65%)',
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0) 65%)'
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none backdrop-blur-[12px]" 
            style={{
              maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0) 55%)',
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0) 55%)'
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none backdrop-blur-[20px]" 
            style={{
              maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 15%, rgba(0,0,0,0) 45%)',
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 15%, rgba(0,0,0,0) 45%)'
            }}
          />

          {/* Subtle natural gradient to ensure perfect text legibility on the left while keeping mushrooms on the right crystal clear */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/55 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Ambient atmospheric soft light glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col justify-between flex-1 gap-6 lg:gap-8">

          {/* TOP UTILITY ROW: Live Ticker & Trust Verification Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Live Activity Ticker Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/85 border border-forest-900/15 text-forest-900 text-xs font-semibold max-w-full backdrop-blur-md shadow-xs">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span className="truncate font-sans font-medium text-[11px] sm:text-xs">
                {LIVE_ACTIVITIES[tickerIndex]}
              </span>
            </div>

            {/* Standard Verification Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/85 border border-forest-900/15 text-forest-900 font-sans text-xs font-semibold backdrop-blur-md shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>ICAR &amp; FSSAI Protocol Certified</span>
            </div>

          </div>

          {/* CENTER CONTENT: Eyebrow, Main Headline, Supporting Copy, Action CTAs */}
          <div className="max-w-2xl lg:max-w-3xl my-auto py-2 sm:py-4">
            <div className="space-y-5 sm:space-y-6">
              
              {/* Eyebrow */}
              <div className="inline-block">
                <span className="text-[11px] sm:text-xs font-extrabold tracking-[0.24em] text-emerald-800 uppercase font-sans flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse" />
                  <span>INDIA'S PREMIER MUSHROOM AGRITECH &amp; TRAINING PLATFORM</span>
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-[54px] xl:text-[60px] text-forest-950 leading-[1.08] tracking-tight">
                Pure Lab Spawn.<br />
                <span className="text-emerald-700">Fresh Harvest.</span>{' '}
                <span className="text-gold">Guaranteed Buyback.</span>
              </h1>

              {/* Supporting Description */}
              <p className="text-typography-secondary text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-sans font-medium">
                From daily harvested gourmet mushrooms and 1st-generation pure wheat grain spawn to certified commercial grower masterclasses with 100% harvest buyback — powering over 12,000+ Indian farmers and culinary lovers.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
                {/* Button 1: Order Products */}
                <a
                  href="#store"
                  className="group relative overflow-hidden bg-forest-900 hover:bg-forest-800 text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-full inline-flex items-center gap-2.5 shadow-lg shadow-forest-950/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 button-press"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-300 group-hover:text-white transition-colors" />
                  <span>Order Products &amp; Spawn</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </a>

                {/* Button 2: Calculate Profit / Get Trained */}
                <a
                  href="#calculator"
                  className="group relative overflow-hidden bg-gold hover:bg-[#b5893b] text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-full inline-flex items-center gap-2 shadow-lg shadow-gold/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  <GraduationCap className="w-4 h-4 text-white" />
                  <span>Calculate Farm Profit &amp; Training</span>
                </a>

                {/* Button 3: Talk to Agronomist */}
                <a
                  href="https://wa.me/917204709870?text=Hello%20Sporekart,%20I%20want%20to%20know%20more%20about%20mushroom%20spawn%20and%20commercial%20training."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white/90 hover:bg-white text-forest-900 font-bold text-xs sm:text-sm px-4 py-3.5 rounded-full border border-forest-900/20 hover:border-forest-900/40 shadow-xs inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Talk to Agronomist</span>
                </a>
              </div>

            </div>
          </div>

          {/* BOTTOM SECTION: 4 Trust Indicators Strip */}
          <div className="pt-2">
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-forest-900/10 p-4 sm:p-5 shadow-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                {TRUST_INDICATORS.map((ind) => {
                  const Icon = ind.icon;
                  return (
                    <div key={ind.title} className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border border-forest-900/10 bg-forest-900/5 flex items-center justify-center shrink-0 shadow-xs">
                        <Icon className="w-5 h-5 text-forest-900" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-forest-950 leading-tight">
                          {ind.title}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-typography-secondary leading-tight mt-0.5">
                          {ind.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
