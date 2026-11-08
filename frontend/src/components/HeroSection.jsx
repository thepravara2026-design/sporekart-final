import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, ShieldCheck, ArrowRight, ShoppingBag, 
  Award, CheckCircle2, MapPin, Truck, PhoneCall, 
  MessageCircle, Zap, ChevronDown, Sparkles
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger);
}

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

const SPORE_PARTICLES = [
  { id: 1, top: '22%', left: '12%', size: 7, delay: '0s', duration: '7s', color: 'bg-emerald-400/45', speed: 1.4 },
  { id: 2, top: '48%', left: '28%', size: 5, delay: '1.2s', duration: '9s', color: 'bg-amber-300/40', speed: 0.9 },
  { id: 3, top: '68%', left: '18%', size: 9, delay: '2.5s', duration: '8s', color: 'bg-emerald-300/35', speed: 1.8 },
  { id: 4, top: '28%', left: '72%', size: 6, delay: '0.8s', duration: '6.5s', color: 'bg-gold/45', speed: 1.2 },
  { id: 5, top: '74%', left: '82%', size: 8, delay: '2.0s', duration: '10s', color: 'bg-emerald-400/30', speed: 1.6 },
  { id: 6, top: '52%', left: '55%', size: 5, delay: '3.5s', duration: '7.5s', color: 'bg-amber-400/35', speed: 1.0 },
];

/**
 * HeroSection
 * 
 * Cinematic Pinned Hero with Scroll Transformation:
 * - GSAP ScrollTrigger pinned timeline on desktop/tablet with buttery scrub animation
 * - Multi-stage storytelling: Initial appearance -> Pinned scrub transformation ->
 *   Focal product elevation -> Masked narrative reveal -> Seamless exit into trust standards
 * - Responsive: Full pinned cinematic flow on desktop, balanced on tablet, natural vertical on mobile
 * - Accessible: Complete static layout fallback on prefers-reduced-motion
 * - High-performance: Transform & opacity only, hardware accelerated, zero layout shifts
 * - 100% preservation of all existing CTA links, routes, SEO headings, and business logic
 */
export default function HeroSection() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [scrollHintStage, setScrollHintStage] = useState('initial'); // 'initial' | 'transformed' | 'exit'
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Refs for GSAP animation targets
  const pinContainerRef = useRef(null);
  const stickyStageRef = useRef(null);
  const bgImageWrapperRef = useRef(null);
  const phase1ContentRef = useRef(null);
  const phase2ContentRef = useRef(null);
  const productVisualRef = useRef(null);
  const specChipsRef = useRef(null);
  const sporesContainerRef = useRef(null);
  const bottomBarRef = useRef(null);

  // Check prefers-reduced-motion on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setIsReducedMotion(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Restrained pointer parallax on initial hero card (desktop only, ±6px)
  const handleMouseMove = useCallback((e) => {
    if (!stickyStageRef.current || typeof window === 'undefined' || isReducedMotion) return;
    if (window.innerWidth < 768) return;

    const rect = stickyStageRef.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (e.clientY - rect.top) / rect.height - 0.5;

    setParallax({
      x: Math.max(-6, Math.min(6, relativeX * 12)),
      y: Math.max(-4, Math.min(4, relativeY * 8))
    });
  }, [isReducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setParallax({ x: 0, y: 0 });
  }, []);

  // Smooth scroll handler for transition pill into #trust-standards
  const handleScrollToNext = useCallback((e) => {
    e.preventDefault();
    const target = document.getElementById('trust-standards') || document.getElementById('categories');
    if (target) {
      const yOffset = -76;
      const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }, []);

  // GSAP ScrollTrigger Pinned Animation Setup
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function' || isReducedMotion) return;
    if (!pinContainerRef.current || !stickyStageRef.current) return;

    gsap.registerPlugin(ScrollTrigger);
    // Use GSAP matchMedia for clean breakpoint-aware scoping
    const mm = gsap.matchMedia();

    // Desktop (>= 1024px) & Tablet (>= 768px)
    mm.add('(min-width: 768px)', (context) => {
      const isTablet = window.innerWidth < 1024;
      const pinDistance = isTablet ? '+=120%' : '+=160%';

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinContainerRef.current,
          start: 'top 76px', // Align precisely beneath sticky navigation header
          end: pinDistance,
          pin: stickyStageRef.current,
          pinSpacing: true,
          scrub: 0.8, // 0.8s buttery smooth interpolation
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            if (p < 0.3) {
              setScrollHintStage('initial');
            } else if (p < 0.75) {
              setScrollHintStage('transformed');
            } else {
              setScrollHintStage('exit');
            }
          }
        }
      });

      // ---------------------------------------------------------
      // STAGE 1 -> STAGE 2: Background scaling, Spores drift, Text fade & Product glide
      // (Progress 0.0 -> 0.45)
      // ---------------------------------------------------------
      tl.to(bgImageWrapperRef.current, {
        scale: 1.14,
        ease: 'power1.inOut',
        duration: 0.45,
      }, 0);

      // Organic Spore Particles vertical parallax drift
      if (sporesContainerRef.current) {
        const spores = sporesContainerRef.current.querySelectorAll('.hero-spore-particle');
        spores.forEach((spore, idx) => {
          const speed = parseFloat(spore.getAttribute('data-speed') || '1');
          tl.to(spore, {
            y: -120 * speed,
            x: (idx % 2 === 0 ? 30 : -30) * speed,
            opacity: 0.85,
            ease: 'none',
            duration: 0.7,
          }, 0);
        });
      }

      // Phase 1 Content (Headline, description, initial CTAs) softly lifts and fades
      if (phase1ContentRef.current) {
        tl.to(phase1ContentRef.current, {
          y: -40,
          opacity: 0,
          pointerEvents: 'none',
          ease: 'power2.out',
          duration: 0.35,
        }, 0.05);
      }

      // Focal Product Visual transitions to central prominence and scales with depth
      if (productVisualRef.current) {
        tl.to(productVisualRef.current, {
          xPercent: isTablet ? 0 : -20,
          yPercent: 0,
          scale: 1.14,
          boxShadow: '0 30px 60px -12px rgba(11, 31, 20, 0.45)',
          ease: 'power2.inOut',
          duration: 0.45,
        }, 0.05);
      }

      // ---------------------------------------------------------
      // STAGE 3: Secondary Narrative Reveal & Floating Spec Cards
      // (Progress 0.35 -> 0.75)
      // ---------------------------------------------------------
      if (phase2ContentRef.current) {
        tl.fromTo(phase2ContentRef.current, 
          { 
            opacity: 0, 
            y: 45, 
            pointerEvents: 'none' 
          },
          { 
            opacity: 1, 
            y: 0, 
            pointerEvents: 'auto',
            ease: 'power2.out', 
            duration: 0.35 
          }, 
          0.35
        );
      }

      // Floating Agronomy Spec Chips stagger entrance around focal product
      if (specChipsRef.current) {
        const chips = specChipsRef.current.querySelectorAll('.hero-spec-chip');
        tl.fromTo(chips,
          {
            opacity: 0,
            scale: 0.88,
            y: 18,
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            stagger: 0.06,
            ease: 'back.out(1.4)',
            duration: 0.3,
          },
          0.42
        );
      }

      // ---------------------------------------------------------
      // STAGE 4: Graceful Exit Transition to Next Section (#trust-standards)
      // (Progress 0.75 -> 1.0)
      // ---------------------------------------------------------
      tl.to(stickyStageRef.current, {
        y: -10,
        opacity: 0.96,
        ease: 'power1.in',
        duration: 0.25,
      }, 0.75);

      if (phase2ContentRef.current) {
        tl.to(phase2ContentRef.current, {
          y: -15,
          opacity: 0.85,
          ease: 'power1.in',
          duration: 0.25,
        }, 0.75);
      }

      if (bottomBarRef.current) {
        tl.to(bottomBarRef.current, {
          y: -5,
          opacity: 0.95,
          ease: 'power1.in',
          duration: 0.25,
        }, 0.75);
      }
    });

    return () => {
      mm.revert();
    };
  }, [isReducedMotion]);

  return (
    <div 
      ref={pinContainerRef}
      className="relative w-full"
      aria-label="Sporekart Agritech Pinned Hero Experience"
    >
      {/* SCOPED VISUAL-MOTION KEYFRAMES */}
      <style>{`
        /* Staggered choreographic slide-up entrance */
        @keyframes heroFadeUp {
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
        @keyframes heroMaskReveal {
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
        @keyframes heroContainerEntrance {
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
        @keyframes heroLightSweep {
          0% {
            transform: translateX(-140%) skewX(-18deg);
            opacity: 0;
          }
          20% {
            opacity: 0.55;
          }
          80% {
            opacity: 0.55;
          }
          100% {
            transform: translateX(240%) skewX(-18deg);
            opacity: 0;
          }
        }

        /* Image optical focus reveal */
        @keyframes heroImageFocus {
          0% {
            filter: blur(14px) saturate(0.85);
            opacity: 0.35;
            transform: scale(1.05);
          }
          50% {
            filter: blur(6px) saturate(0.95);
            opacity: 0.85;
          }
          100% {
            filter: blur(0px) saturate(1);
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Hero image gentle organic breathing */
        @keyframes heroLivingBreath {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        /* Particle subtle organic float */
        @keyframes sporeFloatMote {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-12px) translateX(6px);
          }
        }

        /* Continuous primary button radiant shimmer */
        @keyframes heroCtaShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* Class assignments */
        .hero-anim-container {
          animation: heroContainerEntrance 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-anim-sweep {
          animation: heroLightSweep 2400ms cubic-bezier(0.16, 1, 0.3, 1) 250ms both;
        }

        .hero-anim-image {
          animation: heroImageFocus 1200ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both;
        }

        .hero-anim-breathe {
          animation: heroLivingBreath 16s ease-in-out infinite;
        }

        .hero-anim-item {
          animation: heroFadeUp 750ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-anim-mask {
          animation: heroMaskReveal 850ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-spore-mote {
          animation: sporeFloatMote 6s ease-in-out infinite;
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
          .hero-anim-container,
          .hero-anim-sweep,
          .hero-anim-image,
          .hero-anim-breathe,
          .hero-anim-item,
          .hero-anim-mask,
          .hero-spore-mote,
          .hero-primary-cta-shimmer {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
            filter: none !important;
          }
        }
      `}</style>

      {/* PINNED STAGE (Locks into position during scroll on desktop/tablet) */}
      <div 
        ref={stickyStageRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="hero-anim-container relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4"
      >
        <div className="relative w-full rounded-[28px] sm:rounded-[36px] overflow-hidden border border-white/85 shadow-2xl bg-white flex flex-col justify-between p-5 sm:p-7 lg:p-9 text-forest-950 will-change-transform min-h-[580px] sm:min-h-[640px] lg:min-h-[690px]">
          
          {/* Specular Atmosphere Light Sweep */}
          <div 
            aria-hidden="true"
            className="hero-anim-sweep absolute -inset-y-10 w-1/2 pointer-events-none select-none z-20 bg-gradient-to-r from-transparent via-white/40 to-transparent blur-md"
          />

          {/* BACKGROUND ATMOSPHERE & SCROLL-ZOOM LAYER */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
            <div 
              ref={bgImageWrapperRef}
              style={{
                transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
                transition: isReducedMotion ? 'none' : 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="w-full h-full hero-anim-breathe will-change-transform"
            >
              <img
                src="/sporekart-hero-bg.jpg"
                alt="Sporekart Davangere mushroom farm cultivation facility with fresh oyster and button mushrooms"
                width="1920"
                height="1080"
                loading="eager"
                decoding="async"
                className="hero-anim-image w-full h-full object-cover object-right md:object-center"
              />
            </div>

            {/* Readability & Cinematic Ambience Gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent pointer-events-none" />
            
            {/* Soft Emerald and Gold Atmospheric Glows */}
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 right-10 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
          </div>

          {/* LIVING ORGANIC SPORE PARTICLES */}
          <div 
            ref={sporesContainerRef}
            aria-hidden="true" 
            className="absolute inset-0 z-10 pointer-events-none overflow-hidden select-none"
          >
            {SPORE_PARTICLES.map((particle) => (
              <div
                key={particle.id}
                data-speed={particle.speed}
                style={{
                  top: particle.top,
                  left: particle.left,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  animationDelay: particle.delay,
                  animationDuration: particle.duration,
                }}
                className={`hero-spore-particle hero-spore-mote absolute rounded-full ${particle.color} shadow-sm backdrop-blur-[1px]`}
              />
            ))}
          </div>

          {/* MAIN FOREGROUND CONTAINER */}
          <div className="relative z-20 flex flex-col justify-between flex-1 gap-6 lg:gap-8">

            {/* TOP BAR: Real Grounded Storefront Badges */}
            <div 
              className="hero-anim-item grid grid-cols-2 lg:grid-cols-4 gap-2 text-forest-900 text-xs font-semibold"
              style={{ animationDelay: '150ms' }}
            >
              <div className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/95 border border-forest-900/15 shadow-xs backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">Farm Gate in Davangere, Karnataka</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/95 border border-forest-900/15 shadow-xs backdrop-blur-md">
                <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">Same-Day Dispatch for Fresh Pickings</span>
              </div>
              <a 
                href="https://wa.me/917204709870?text=Hello%20Sporekart%2C%20I%20need%20direct%20cultivation%20guidance."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/95 hover:bg-emerald-50 border border-forest-900/15 hover:border-emerald-600/30 shadow-xs backdrop-blur-md transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">Direct WhatsApp (+91 7204709870)</span>
              </a>
              <div className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/95 border border-forest-900/15 shadow-xs backdrop-blur-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">100% Pesticide-Free &amp; FSSAI Compliant</span>
              </div>
            </div>

            {/* DUAL-STAGE STORYTELLING CENTERPIECE */}
            <div className="relative my-auto py-2 sm:py-4 min-h-[380px] sm:min-h-[400px] flex items-center">
              
              {/* ------------------------------------------------------------- */}
              {/* STAGE A (PHASE 1): Initial Hero Content (Headline + CTAs)     */}
              {/* ------------------------------------------------------------- */}
              <div 
                ref={phase1ContentRef}
                className="max-w-2xl lg:max-w-3xl space-y-5 sm:space-y-6 will-change-transform z-10"
              >
                {/* Eyebrow Kicker */}
                <div 
                  className="hero-anim-item inline-block"
                  style={{ animationDelay: '250ms' }}
                >
                  <span className="text-[11px] sm:text-xs font-extrabold tracking-[0.22em] text-emerald-800 uppercase font-sans flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse" />
                    <span>CULTIVATED IN DAVANGERE, KARNATAKA &bull; FSSAI LIC. #10020011000123</span>
                  </span>
                </div>

                {/* Primary H1 Heading (Preserved for SEO Hierarchy) */}
                <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-[54px] xl:text-[60px] text-forest-950 leading-[1.08] tracking-tight">
                  <span className="block overflow-hidden py-0.5">
                    <span 
                      className="block hero-anim-mask"
                      style={{ animationDelay: '350ms' }}
                    >
                      Harvested Fresh at 5:00 AM.
                    </span>
                  </span>
                  
                  <span className="block overflow-hidden py-0.5">
                    <span 
                      className="block hero-anim-mask"
                      style={{ animationDelay: '500ms' }}
                    >
                      <span className="text-emerald-700">Pure Mother Spawn.</span>{' '}
                      <span className="text-gold">Zero Chemicals.</span>
                    </span>
                  </span>
                </h1>

                {/* Grounded Description */}
                <div 
                  className="hero-anim-item"
                  style={{ animationDelay: '650ms' }}
                >
                  <p className="text-typography-secondary text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-sans font-medium">
                    Grown on steam-sterilized organic paddy straw with zero chemical sprays at our temperature-controlled farm in Davangere. We pack in breathable micro-perforated boxes and dispatch fresh gourmet mushrooms within 24 hours, alongside 1st-generation pure wheat grain spawn with guaranteed 99.8% colonization viability.
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
                  <Link
                    to="/products/fresh-mushrooms"
                    style={{ animationDelay: '800ms' }}
                    className="hero-anim-item hero-primary-cta-shimmer group relative overflow-hidden text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-full inline-flex items-center gap-2.5 shadow-lg shadow-forest-950/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 button-press"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-300 group-hover:text-white transition-colors" />
                    <span>Explore Fresh Mushrooms</span>
                    <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:text-white group-hover:translate-x-1.5 transition-transform duration-300" />
                  </Link>

                  <Link
                    to="/products/spawn-seeds"
                    style={{ animationDelay: '900ms' }}
                    className="hero-anim-item group relative overflow-hidden bg-gold hover:bg-[#b5893b] text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-full inline-flex items-center gap-2 shadow-lg shadow-gold/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    <Sprout className="w-4 h-4 text-white group-hover:rotate-6 transition-transform duration-300" />
                    <span>Buy Commercial Spawn</span>
                  </Link>

                  <a
                    href="https://wa.me/917204709870?text=Hello%20Sporekart%2C%20I%20want%20direct%20cultivation%20guidance."
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ animationDelay: '1000ms' }}
                    className="hero-anim-item group bg-white/95 hover:bg-white text-forest-900 font-bold text-xs sm:text-sm px-4 py-3.5 rounded-full border border-forest-900/20 hover:border-forest-900/40 shadow-xs inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                    <span>Grower Support (+91 7204709870)</span>
                  </a>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* STAGE B (PHASE 2 & 3): Focal Mushroom Product Elevation        */}
              {/* ------------------------------------------------------------- */}
              <div 
                ref={productVisualRef}
                className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[340px] lg:w-[420px] xl:w-[480px] pointer-events-none select-none z-15 will-change-transform"
              >
                {/* Product Card Container with Specular Sheen */}
                <div className="relative rounded-[28px] overflow-hidden border border-white/90 shadow-2xl bg-white/90 backdrop-blur-md p-3 group transition-transform duration-500">
                  <div className="relative aspect-[4/3] rounded-[22px] overflow-hidden">
                    <img
                      src="/sporekart-hero-crate.jpg"
                      alt="Sporekart daily morning fresh mushroom harvest in organic wooden crate"
                      width="800"
                      height="600"
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Top Quality Pill Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-forest-950/80 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 border border-white/20 shadow-md">
                      <Sparkles className="w-3.5 h-3.5 text-gold" />
                      <span>Davangere Farm Gate &bull; 5:00 AM Harvest</span>
                    </div>

                    {/* Bottom Viability Pill Badge */}
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-forest-900 text-[11px] font-bold flex items-center gap-1.5 border border-forest-900/15 shadow-md">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>99.8% Colonization Viability</span>
                    </div>
                  </div>
                </div>

                {/* Floating Agronomy Spec Chips (Scrub Reveal in Phase 3) */}
                <div 
                  ref={specChipsRef}
                  className="absolute inset-0 pointer-events-none"
                  aria-hidden="true"
                >
                  {/* Chip 1: Top-Left */}
                  <div className="hero-spec-chip absolute -top-5 -left-8 px-3.5 py-1.5 rounded-full bg-white/95 border border-emerald-600/30 shadow-lg text-[11px] font-bold text-forest-900 flex items-center gap-1.5 backdrop-blur-md opacity-0">
                    <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Organic Paddy Straw</span>
                  </div>

                  {/* Chip 2: Bottom-Left */}
                  <div className="hero-spec-chip absolute -bottom-4 -left-6 px-3.5 py-1.5 rounded-full bg-white/95 border border-emerald-600/30 shadow-lg text-[11px] font-bold text-forest-900 flex items-center gap-1.5 backdrop-blur-md opacity-0">
                    <Award className="w-3.5 h-3.5 text-gold" />
                    <span>1st-Gen Pure Wheat Grain</span>
                  </div>

                  {/* Chip 3: Top-Right */}
                  <div className="hero-spec-chip absolute -top-4 -right-4 px-3.5 py-1.5 rounded-full bg-white/95 border border-emerald-600/30 shadow-lg text-[11px] font-bold text-forest-900 flex items-center gap-1.5 backdrop-blur-md opacity-0">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Zero Chemical Sprays</span>
                  </div>

                  {/* Chip 4: Bottom-Right */}
                  <div className="hero-spec-chip absolute -bottom-5 -right-6 px-3.5 py-1.5 rounded-full bg-white/95 border border-emerald-600/30 shadow-lg text-[11px] font-bold text-forest-900 flex items-center gap-1.5 backdrop-blur-md opacity-0">
                    <Truck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Insulated Cold Chain</span>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* STAGE C (PHASE 4): Secondary Cinematic Storytelling Overlay   */}
              {/* ------------------------------------------------------------- */}
              <div 
                ref={phase2ContentRef}
                className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 max-w-xl lg:max-w-2xl opacity-0 pointer-events-none z-20 space-y-4"
              >
                <div className="inline-block">
                  <span className="text-[11px] sm:text-xs font-extrabold tracking-[0.24em] text-emerald-800 uppercase font-sans flex items-center gap-2 bg-emerald-50/80 px-3 py-1 rounded-full border border-emerald-600/20">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>BIOLOGICAL EXCELLENCE &bull; DAVANGERE</span>
                  </span>
                </div>

                <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-forest-950 leading-[1.12] tracking-tight">
                  Engineered by Nature.{' '}
                  <span className="text-emerald-700 block sm:inline">Perfected by Science.</span>
                </h2>

                <p className="text-typography-secondary text-sm sm:text-base lg:text-lg leading-relaxed font-sans font-medium">
                  From sterile cleanrooms in Davangere directly to commercial cultivators and home gourmet kitchens across India. Cultivated on steam-sterilized organic substrate with guaranteed 99.8% colonization vigor and complete traceability.
                </p>

                {/* Quick Action Navigation in Transformed Phase */}
                <div className="flex items-center gap-3 pt-2 pointer-events-auto">
                  <Link
                    to="/products/fresh-mushrooms"
                    className="bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <span>View Fresh Harvest</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to="/products/spawn-seeds"
                    className="bg-gold hover:bg-[#b5893b] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <span>Order Pure Spawn</span>
                  </Link>
                </div>
              </div>

            </div>

            {/* BOTTOM BAR: Trust Indicators & Scroll Progression Indicator */}
            <div 
              ref={bottomBarRef}
              className="hero-anim-item pt-2 space-y-3"
              style={{ animationDelay: '1100ms' }}
            >
              {/* Grounded Trust Indicators Strip */}
              <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-forest-900/10 p-3.5 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
                  {TRUST_INDICATORS.map((ind, idx) => {
                    const Icon = ind.icon;
                    return (
                      <div 
                        key={ind.title} 
                        className="group flex items-center gap-2.5 sm:gap-3 p-1 rounded-xl transition-all duration-300 hover:bg-white/80 hover:shadow-xs hover:-translate-y-0.5"
                      >
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl border border-forest-900/10 bg-forest-900/5 group-hover:bg-emerald-600/15 group-hover:border-emerald-600/30 flex items-center justify-center shrink-0 shadow-xs transition-all duration-300">
                          <Icon 
                            className="w-4 h-4 sm:w-5 sm:h-5 text-forest-900 group-hover:text-emerald-700 group-hover:scale-110 transition-all duration-300" 
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

              {/* Cinematic Scroll Progression Indicator Pill (Desktop Only) */}
              <div className="hidden md:flex items-center justify-between text-xs text-typography-muted px-2 py-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-ping" />
                  <span className="font-semibold text-forest-900">
                    {scrollHintStage === 'initial' && 'Scroll to explore cultivation craft'}
                    {scrollHintStage === 'transformed' && 'Stage 2: Biological Purity & Spawn Standards'}
                    {scrollHintStage === 'exit' && 'Transitioning to Farm Gate Standards'}
                  </span>
                </div>

                <button
                  onClick={handleScrollToNext}
                  className="group flex items-center gap-1.5 font-bold text-forest-800 hover:text-emerald-700 transition-colors px-2.5 py-1 rounded-full hover:bg-forest-900/5"
                  aria-label="Scroll to Quality Standards Section"
                >
                  <span>Explore Quality Standards</span>
                  <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
