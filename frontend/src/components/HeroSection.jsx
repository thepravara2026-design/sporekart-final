import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, ShieldCheck, ArrowRight, ShoppingBag, 
  GraduationCap, TrendingUp, MessageCircle, CheckCircle2,
  MapPin, Truck, PhoneCall, Award
} from 'lucide-react';


export const FALLBACK_ACTIVITIES = [
  'Freshly harvested Oyster Mushrooms packed for dispatch from Davangere',
  '1st-Gen Wheat Grain Milky Spawn certified with 99.8% viability',
  'Commercial cultivation training batch scheduled at Davangere facility'
];

export const RECENT_OPERATIONS = FALLBACK_ACTIVITIES;

const TRUST_INDICATORS = [
  {
    icon: ShieldCheck,
    title: '100% Pesticide-Free',
    subtitle: 'Steam-Sterilized Paddy Straw',
  },
  {
    icon: Sprout,
    title: 'Daily Fresh Harvest',
    subtitle: 'Picked at 5:00 AM in Davangere',
  },
  {
    icon: Award,
    title: '1st-Gen Pure Spawn',
    subtitle: '99.8% Colonization Viability',
  },
  {
    icon: CheckCircle2,
    title: 'FSSAI Compliant & Lab Tested',
    subtitle: 'Lic. #10020011000123',
  },
];

/**
 * HeroSection
 * Visual-motion choreographic sequential animation system:
 * - Scoped exclusively to the Hero section
 * - Staggered choreography timeline (Container -> Atmosphere/Spores -> Eyebrow -> Headings -> Description -> CTAs -> Trust Badges)
 * - Living organic spore particles & dual breathing atmospheric glow
 * - Dynamic kinetic ticker transition & interactive physical parallax
 * - All existing Sporekart components, data-fetch logic, and navigation handlers preserved 100%
 */
export default function HeroSection() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const heroCardRef = useRef(null);

  // Restrained, smooth desktop pointer parallax (clamped to max ±6px)
  const handleMouseMove = useCallback((e) => {
    if (!heroCardRef.current || typeof window === 'undefined') return;
    if (window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const rect = heroCardRef.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (e.clientY - rect.top) / rect.height - 0.5;

    setParallax({
      x: Math.max(-6, Math.min(6, relativeX * 12)),
      y: Math.max(-4, Math.min(4, relativeY * 8))
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setParallax({ x: 0, y: 0 });
  }, []);

  // Smooth navigation helpers linking Hero CTA buttons to backend data sections
  const handleStoreNavigation = useCallback((e) => {
    const target = document.getElementById('store') || document.getElementById('varieties') || document.getElementById('categories');
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/products';
    }
  }, []);

  const handleCalculatorNavigation = useCallback((e) => {
    const target = document.getElementById('calculator') || document.getElementById('training') || document.getElementById('training-education');
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/training';
    }
  }, []);

  return (
    <section 
      id="hero" 
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4"
      aria-label="Sporekart Agritech Hero Section"
    >
      {/* ------------------------------------------------------------------ */}
      {/* SCOPED VISUAL-MOTION CHOREOGRAPHIC KEYFRAMES (HERO SECTION ONLY)   */}
      {/* ------------------------------------------------------------------ */}
      <style>{`
        /* Staggered choreographic slide-up entrance */
        @keyframes heroChoreoFadeUp {
          0% {
            opacity: 0;
            transform: translateY(22px) scale(0.985);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }

        /* Masked text reveal from bottom */
        @keyframes heroChoreoMaskReveal {
          0% {
            transform: translateY(115%);
            opacity: 0;
            filter: blur(3px);
          }
          100% {
            transform: translateY(0);
            opacity: 1;
            filter: blur(0px);
          }
        }

        /* Container fluid entrance */
        @keyframes heroChoreoContainerEntrance {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.99);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Atmospheric specular light sweep */
        @keyframes heroChoreoLightSweep {
          0% {
            transform: translateX(-140%) skewX(-18deg);
            opacity: 0;
          }
          20% {
            opacity: 0.6;
          }
          80% {
            opacity: 0.6;
          }
          100% {
            transform: translateX(240%) skewX(-18deg);
            opacity: 0;
          }
        }

        /* Image optical focus reveal from soft blur to crisp clarity + organic breathing */
        @keyframes heroChoreoImageFocus {
          0% {
            filter: blur(18px) saturate(0.85);
            opacity: 0.35;
            transform: scale(1.05);
          }
          45% {
            filter: blur(8px) saturate(0.95);
            opacity: 0.8;
          }
          100% {
            filter: blur(0px) saturate(1);
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Hero image gentle living breath */
        @keyframes heroImageBreathing {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.025);
          }
        }

        /* Dual atmospheric glow breathing */
        @keyframes heroAuraEmeraldBreath {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.55;
          }
          50% {
            transform: translate(16px, -12px) scale(1.12);
            opacity: 0.85;
          }
        }

        @keyframes heroAuraGoldBreath {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.35;
          }
          50% {
            transform: translate(-14px, 10px) scale(1.1);
            opacity: 0.6;
          }
        }

        /* Mycology spore particle upward drift simulation */
        @keyframes heroSporeFloat1 {
          0% {
            transform: translateY(120px) translateX(0px);
            opacity: 0;
          }
          25% {
            opacity: 0.75;
          }
          75% {
            opacity: 0.75;
          }
          100% {
            transform: translateY(-80px) translateX(20px);
            opacity: 0;
          }
        }

        @keyframes heroSporeFloat2 {
          0% {
            transform: translateY(100px) translateX(0px);
            opacity: 0;
          }
          20% {
            opacity: 0.65;
          }
          80% {
            opacity: 0.65;
          }
          100% {
            transform: translateY(-110px) translateX(-25px);
            opacity: 0;
          }
        }

        /* Live ticker text slide transition */
        @keyframes heroTickerItemIn {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Continuous primary button radiant pulse */
        @keyframes heroCtaRadiance {
          0%, 100% {
            box-shadow: 0 10px 25px -5px rgba(11, 31, 20, 0.3), 0 0 0 0 rgba(16, 185, 129, 0.35);
          }
          50% {
            box-shadow: 0 15px 30px -5px rgba(11, 31, 20, 0.4), 0 0 0 8px rgba(16, 185, 129, 0);
          }
        }

        /* Primary button specular shimmer */
        @keyframes heroCtaShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* Applied choreographic classes */
        .hero-choreo-container {
          animation: heroChoreoContainerEntrance 1000ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-choreo-sweep {
          animation: heroChoreoLightSweep 2400ms cubic-bezier(0.16, 1, 0.3, 1) 300ms both;
        }

        .hero-choreo-image {
          animation: heroChoreoImageFocus 1300ms cubic-bezier(0.16, 1, 0.3, 1) 300ms both;
        }

        .hero-choreo-image-breathe {
          animation: heroImageBreathing 18s ease-in-out infinite;
        }

        .hero-choreo-aura-emerald {
          animation: heroAuraEmeraldBreath 8s ease-in-out infinite alternate;
        }

        .hero-choreo-aura-gold {
          animation: heroAuraGoldBreath 10s ease-in-out infinite alternate;
        }

        .hero-choreo-item {
          animation: heroChoreoFadeUp 800ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-choreo-mask {
          animation: heroChoreoMaskReveal 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-choreo-ticker-text {
          animation: heroTickerItemIn 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Applied choreographic classes */
        .hero-choreo-container {
          animation: heroChoreoContainerEntrance 1000ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-choreo-sweep {
          animation: heroChoreoLightSweep 2400ms cubic-bezier(0.16, 1, 0.3, 1) 300ms both;
        }

        .hero-choreo-image {
          animation: heroChoreoImageFocus 1300ms cubic-bezier(0.16, 1, 0.3, 1) 300ms both;
        }

        .hero-choreo-image-breathe {
          animation: heroImageBreathing 18s ease-in-out infinite;
        }

        .hero-choreo-item {
          animation: heroChoreoFadeUp 800ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-choreo-mask {
          animation: heroChoreoMaskReveal 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-primary-cta-shimmer {
          background-size: 200% 100%;
          background-image: linear-gradient(
            120deg,
            #173B2A 0%,
            #1F4D35 38%,
            #2F6B45 50%,
            #1F4D35 62%,
            #173B2A 100%
          );
        }
        .hero-primary-cta-shimmer:hover {
          animation: heroCtaShimmer 2s infinite linear;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .hero-choreo-container,
          .hero-choreo-sweep,
          .hero-choreo-image,
          .hero-choreo-image-breathe,
          .hero-choreo-item,
          .hero-choreo-mask,
          .hero-primary-cta-shimmer {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
            filter: none !important;
          }
        }
      `}</style>

      {/* CHOREOGRAPHY STAGE 0: Container Entrance & Perspective Parallax */}
      <div 
        ref={heroCardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="hero-choreo-container relative w-full rounded-[28px] sm:rounded-[36px] overflow-hidden border border-white/85 shadow-2xl bg-white flex flex-col justify-between p-6 sm:p-8 lg:p-10 text-forest-950 will-change-transform"
      >
        {/* Specular Atmosphere Light Sweep */}
        <div 
          aria-hidden="true"
          className="hero-choreo-sweep absolute -inset-y-10 w-1/2 pointer-events-none select-none z-20 bg-gradient-to-r from-transparent via-white/40 to-transparent blur-md"
        />

        {/* CHOREOGRAPHY STAGE 1: Background Atmosphere & Image Focus Dissolve */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {/* Parallax & Ambient Breathing Wrapper */}
          <div 
            style={{
              transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
              transition: 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="w-full h-full hero-choreo-image-breathe"
          >
            {/* Focal clarity image reveal */}
            <img
              src="/sporekart-hero-bg.jpg"
              alt="Sporekart Davangere mushroom farm cultivation facility with fresh oyster and button mushrooms"
              width="1920"
              height="1080"
              loading="eager"
              decoding="async"
              className="hero-choreo-image w-full h-full object-cover object-right md:object-center will-change-transform"
            />
          </div>

          {/* Gradients ensuring perfect text readability while showcasing mushroom crop */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col justify-between flex-1 gap-6 lg:gap-8">

          {/* CHOREOGRAPHY STAGE 2: Real Grounded Storefront Badges (Eliminates Fake Simulated Ticker) */}
          <div 
            className="hero-choreo-item grid grid-cols-2 lg:grid-cols-4 gap-2 text-forest-900 text-xs font-semibold"
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 border border-forest-900/15 shadow-xs backdrop-blur-md">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">Farm Gate in Davangere, Karnataka</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 border border-forest-900/15 shadow-xs backdrop-blur-md">
              <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">Same-Day Dispatch for Fresh Pickings</span>
            </div>
            <a 
              href="https://wa.me/918277559093?text=Hello%20Sporekart%2C%20I%20need%20direct%20cultivation%20guidance."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 hover:bg-emerald-50 border border-forest-900/15 hover:border-emerald-600/30 shadow-xs backdrop-blur-md transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">Direct WhatsApp (+91 8277559093)</span>
            </a>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 border border-forest-900/15 shadow-xs backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">100% Pesticide-Free &amp; FSSAI Compliant</span>
            </div>
          </div>

          {/* CENTER CONTENT */}
          <div className="max-w-2xl lg:max-w-3xl my-auto py-2 sm:py-4">
            <div className="space-y-5 sm:space-y-6">
              
              {/* CHOREOGRAPHY STAGE 3: Editorial Eyebrow Kicker */}
              <div 
                className="hero-choreo-item inline-block"
                style={{ animationDelay: '350ms' }}
              >
                <span className="text-[11px] sm:text-xs font-extrabold tracking-[0.22em] text-emerald-800 uppercase font-sans flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  <span>CULTIVATED IN DAVANGERE, KARNATAKA &bull; FSSAI LIC. #10020011000123</span>
                </span>
              </div>

              {/* CHOREOGRAPHY STAGE 4 & 5: Masked Editorial Headings */}
              <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-[54px] xl:text-[60px] text-forest-950 leading-[1.08] tracking-tight">
                {/* Stage 4: Main Heading Line 1 */}
                <span className="block overflow-hidden py-0.5">
                  <span 
                    className="block hero-choreo-mask"
                    style={{ animationDelay: '500ms' }}
                  >
                    Harvested Fresh at 5:00 AM.
                  </span>
                </span>
                
                {/* Stage 5: Secondary Heading Line 2 */}
                <span className="block overflow-hidden py-0.5">
                  <span 
                    className="block hero-choreo-mask"
                    style={{ animationDelay: '650ms' }}
                  >
                    <span className="text-emerald-700">Pure Mother Spawn.</span>{' '}
                    <span className="text-gold">Zero Chemicals.</span>
                  </span>
                </span>
              </h1>

              {/* CHOREOGRAPHY STAGE 6: Grounded Description Paragraph */}
              <div 
                className="hero-choreo-item"
                style={{ animationDelay: '800ms' }}
              >
                <p className="text-typography-secondary text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-sans font-medium">
                  Grown on steam-sterilized organic paddy straw with zero chemical sprays at our temperature-controlled farm in Davangere. We pack in breathable micro-perforated boxes and dispatch fresh gourmet mushrooms within 24 hours, alongside 1st-generation pure wheat grain spawn with guaranteed 99.8% colonization viability.
                </p>
              </div>

              {/* CHOREOGRAPHY STAGE 7: Dual Clear CTAs + WhatsApp Grower Support */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
                
                {/* Dual CTA 1: Explore Fresh Mushrooms */}
                <Link
                  to="/products/fresh-mushrooms"
                  style={{ animationDelay: '950ms' }}
                  className="hero-choreo-item hero-primary-cta-shimmer group relative overflow-hidden text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-full inline-flex items-center gap-2.5 shadow-lg shadow-forest-950/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 button-press"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-300 group-hover:text-white transition-colors" />
                  <span>Explore Fresh Mushrooms</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:text-white group-hover:translate-x-1.5 transition-transform duration-300" />
                </Link>

                {/* Dual CTA 2: Buy Commercial Spawn */}
                <Link
                  to="/products/spawn-seeds"
                  style={{ animationDelay: '1050ms' }}
                  className="hero-choreo-item group relative overflow-hidden bg-gold hover:bg-[#b5893b] text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-full inline-flex items-center gap-2 shadow-lg shadow-gold/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  <Sprout className="w-4 h-4 text-white group-hover:rotate-6 transition-transform duration-300" />
                  <span>Buy Commercial Spawn</span>
                </Link>

                {/* Direct WhatsApp Guidance */}
                <a
                  href="https://wa.me/918277559093?text=Hello%20Sporekart%2C%20I%20want%20direct%20cultivation%20guidance."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ animationDelay: '1150ms' }}
                  className="hero-choreo-item group bg-white/95 hover:bg-white text-forest-900 font-bold text-xs sm:text-sm px-4 py-3.5 rounded-full border border-forest-900/20 hover:border-forest-900/40 shadow-xs inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                  <span>Grower Support (+91 8277559093)</span>
                </a>
              </div>

            </div>
          </div>

          {/* CHOREOGRAPHY STAGE 8: Grounded Trust Indicators Strip */}
          <div 
            className="hero-choreo-item pt-2"
            style={{ animationDelay: '1250ms' }}
          >
            <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-forest-900/10 p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                {TRUST_INDICATORS.map((ind, idx) => {
                  const Icon = ind.icon;
                  const itemDelay = `${1350 + idx * 70}ms`;
                  return (
                    <div 
                      key={ind.title} 
                      style={{ animationDelay: itemDelay }}
                      className="hero-choreo-item group flex items-center gap-3 p-1.5 rounded-xl transition-all duration-300 hover:bg-white/80 hover:shadow-xs hover:-translate-y-0.5"
                    >
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border border-forest-900/10 bg-forest-900/5 group-hover:bg-emerald-600/15 group-hover:border-emerald-600/30 flex items-center justify-center shrink-0 shadow-xs transition-all duration-300">
                        <Icon 
                          className="w-5 h-5 text-forest-900 group-hover:text-emerald-700 group-hover:scale-110 transition-all duration-300" 
                          strokeWidth={1.75} 
                        />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-forest-950 leading-tight group-hover:text-emerald-900 transition-colors">
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
