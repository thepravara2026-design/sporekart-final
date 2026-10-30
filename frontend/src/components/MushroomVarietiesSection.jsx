import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Pause, RotateCcw, Check, Sparkles } from 'lucide-react';

export const SHUFFLE_INTERVAL_MS = 2000;
export const TRANSITION_DURATION_MS = 500;

export const CATEGORIES = [
  {
    id: 'fresh-mushrooms',
    name: 'Fresh Mushrooms',
    subtitle: 'Daily Farm Harvest',
    image: '/sporekart-white-button.jpg',
    link: '/products/fresh-mushrooms',
  },
  {
    id: 'dry-mushrooms',
    name: 'Dry Mushrooms',
    subtitle: 'Rich Umami & Dried',
    image: '/sporekart-shiitake.jpg',
    link: '/products/dry-mushrooms',
  },
  {
    id: 'spawn-seeds',
    name: 'Grain Spawn',
    subtitle: '1st Gen Pure Seeds',
    image: '/sporekart-hands-oyster.jpg',
    link: '/products/spawn-seeds',
  },
  {
    id: 'growing-kits',
    name: 'Growing Kits',
    subtitle: 'Ready-to-Fruit DIY',
    image: '/sporekart-oyster-cluster.jpg',
    link: '/products/growing-kits',
  },
  {
    id: 'equipment-supplies',
    name: 'Equipment & Supplies',
    subtitle: 'Lab Tools & Hygiene',
    image: '/sporekart-farm-scientist.jpg',
    link: '/products/equipment-supplies',
  },
  {
    id: 'training',
    name: 'Agritech Training',
    subtitle: 'Certified Masterclasses',
    image: '/sporekart-training-workshop.jpg',
    link: '/training',
  },
];

/**
 * Reusable Mushroom Variety Card Component
 * Preserves the canonical design, image sizing, typography, and hover effects.
 */
export function VarietyCard({
  cat,
  isFeatured = false,
  isDealing = false,
  className = '',
  style = {},
  onFocus,
  onBlur,
}) {
  return (
    <Link
      to={cat.link}
      style={style}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={`Explore ${cat.name} category`}
      className={`group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl bg-surface-white border border-surface-border/80 shadow-[0_2px_8px_rgba(23,59,42,0.04)] hover:shadow-level-2 hover:border-forest-700/40 hover-lift transition-all duration-300 text-center select-none ${className}`}
    >
      {/* Featured Spotlight Badge */}
      {isFeatured && (
        <span className="absolute top-2 left-2 z-20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-forest-900/90 backdrop-blur-sm text-white rounded-full shadow-sm flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
          <span>Active</span>
        </span>
      )}

      {/* Card Image */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-cream/50 mb-2">
        <img
          src={cat.image}
          alt={`${cat.name} Sporekart`}
          width="240"
          height="180"
          loading="lazy"
          className="w-full h-full object-cover rounded-xl transform group-hover:scale-108 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Title & Subtitle */}
      <div className="flex-1 flex flex-col justify-between space-y-1">
        <div>
          <h3 className="text-xs sm:text-xs xl:text-sm font-bold text-forest-900 group-hover:text-forest-700 transition-colors leading-snug line-clamp-2 min-h-[1.85rem] sm:min-h-[2.2rem] flex items-center justify-center">
            {cat.name}
          </h3>
          <p className="text-[10px] sm:text-[11px] text-typography-muted line-clamp-1 mt-0.5">
            {cat.subtitle}
          </p>
        </div>

        {/* Micro Action Button */}
        <div className="pt-1.5 flex items-center justify-between text-forest-800/70 group-hover:text-forest-900 transition-colors">
          <span className="text-[10px] font-semibold tracking-wide text-forest-700 uppercase group-hover:underline">
            Explore
          </span>
          <div className="w-5 h-5 rounded-full bg-forest-900/5 group-hover:bg-forest-900 group-hover:text-white flex items-center justify-center transition-all">
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Calculate physical card offsets for realistic organic deck stacking
 */
function getStackTransform(depth, isDealing) {
  if (depth === 0) {
    if (isDealing) {
      return {
        transform: 'translate3d(48px, -18px, 0) rotate(9deg) scale(0.92)',
        opacity: 0,
        zIndex: 35,
        transition: `all ${TRANSITION_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      };
    }
    return {
      transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
      opacity: 1,
      zIndex: 30,
      transition: `all ${TRANSITION_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
    };
  }

  // Pre-calculated organic natural offsets for cards in the deck
  const offsets = [
    { x: 6, y: 7, rot: 2.5, scale: 0.96, op: 0.92, z: 24 },
    { x: -6, y: 14, rot: -3.0, scale: 0.92, op: 0.82, z: 18 },
    { x: 5, y: 21, rot: 1.8, scale: 0.88, op: 0.70, z: 12 },
    { x: -4, y: 27, rot: -2.0, scale: 0.84, op: 0.55, z: 8 },
    { x: 3, y: 32, rot: 2.2, scale: 0.80, op: 0.40, z: 4 },
  ];

  const conf = offsets[depth - 1] || offsets[offsets.length - 1];

  return {
    transform: `translate3d(${conf.x}px, ${conf.y}px, 0) rotate(${conf.rot}deg) scale(${conf.scale})`,
    opacity: conf.op,
    zIndex: conf.z,
    transition: `all ${TRANSITION_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
  };
}

export default function MushroomVarietiesSection({
  shuffleInterval = SHUFFLE_INTERVAL_MS,
  autoStart = true,
}) {
  const sectionRef = useRef(null);
  const dealingTimeoutRef = useRef(null);

  // Animation State
  const [revealedCount, setRevealedCount] = useState(0);
  const [isDealing, setIsDealing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // 1. Accessibility: Detect user's prefers-reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (mediaQuery.matches) {
      setIsReducedMotion(true);
      setIsCompleted(true);
      setRevealedCount(CATEGORIES.length);
    }

    const handler = (e) => {
      if (e.matches) {
        setIsReducedMotion(true);
        setIsCompleted(true);
        setRevealedCount(CATEGORIES.length);
      } else {
        setIsReducedMotion(false);
      }
    };

    mediaQuery.addEventListener?.('change', handler);
    return () => mediaQuery.removeEventListener?.('change', handler);
  }, []);

  // 2. Viewport Detection: Start animation only when Section C enters the viewport
  useEffect(() => {
    if (typeof window === 'undefined' || isReducedMotion || !autoStart) return;

    if (!('IntersectionObserver' in window)) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isReducedMotion, autoStart]);

  // 3. Sequential Shuffle Interval Timer
  useEffect(() => {
    if (!hasStarted || isPaused || isCompleted || isReducedMotion) return;

    const timer = setInterval(() => {
      setIsDealing(true);

      dealingTimeoutRef.current = setTimeout(() => {
        setRevealedCount((prev) => {
          const next = prev + 1;
          if (next >= CATEGORIES.length) {
            setIsCompleted(true);
          }
          return next;
        });
        setIsDealing(false);
      }, TRANSITION_DURATION_MS);
    }, shuffleInterval);

    return () => {
      clearInterval(timer);
      if (dealingTimeoutRef.current) {
        clearTimeout(dealingTimeoutRef.current);
      }
    };
  }, [hasStarted, isPaused, isCompleted, isReducedMotion, shuffleInterval]);

  // Controls Handlers
  const handleTogglePlayPause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleSkipToAll = useCallback(() => {
    if (dealingTimeoutRef.current) clearTimeout(dealingTimeoutRef.current);
    setIsDealing(false);
    setRevealedCount(CATEGORIES.length);
    setIsCompleted(true);
  }, []);

  const handleReplay = useCallback(() => {
    if (dealingTimeoutRef.current) clearTimeout(dealingTimeoutRef.current);
    setIsDealing(false);
    setRevealedCount(0);
    setIsCompleted(false);
    setIsPaused(false);
    setHasStarted(true);
  }, []);

  // Separate remaining undealt deck vs revealed cards
  const remainingDeck = CATEGORIES.slice(revealedCount);
  const revealedCards = CATEGORIES.slice(0, revealedCount);

  // Active top card in deck
  const activeDeckCard = remainingDeck.length > 0 ? remainingDeck[0] : null;

  return (
    <section
      ref={sectionRef}
      id="varieties"
      className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-7 sm:py-12"
      aria-label="Product Categories Showcase"
    >
      {/* Screen Reader Live Region for Accessibility */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isCompleted
          ? 'All 6 mushroom varieties are now displayed.'
          : activeDeckCard
          ? `Presenting variety: ${activeDeckCard.name}. ${revealedCount} of ${CATEGORIES.length} varieties revealed.`
          : 'Mushroom Varieties Showcase'}
      </div>

      {/* Mobile Compressed Header (Visible on < lg screens) */}
      <div className="lg:hidden flex items-end justify-between gap-3 mb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-[0.2em] text-forest-800 uppercase font-sans block">
            OUR CATEGORIES &amp; VARIETIES
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-forest-900 leading-tight">
            Explore Varieties
          </h2>
          <p className="text-[11px] sm:text-xs text-typography-secondary line-clamp-1">
            Fresh mushrooms, pure spawn seeds &amp; DIY kits.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/products"
            className="shrink-0 bg-forest-900 hover:bg-forest-800 text-white font-semibold text-xs px-3.5 py-2 rounded-full inline-flex items-center gap-1.5 shadow-sm transition-all button-press"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Responsive Showcase Controls Bar (Interactive Motion & Accessibility Status) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 px-3 py-2 rounded-xl bg-surface-cream/40 border border-surface-border/60 text-xs text-typography-secondary">
        {/* Status indicator */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            {!isCompleted && !isPaused && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isCompleted
                  ? 'bg-forest-700'
                  : isPaused
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
            />
          </span>

          <span className="font-medium text-forest-950 text-[11px] sm:text-xs">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-forest-800 font-semibold">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> All 6 Varieties Revealed
              </span>
            ) : isPaused ? (
              <span className="text-amber-800 font-medium">Shuffle Paused</span>
            ) : (
              <span>
                Shuffling Variety <span className="font-bold text-forest-900">{Math.min(revealedCount + 1, CATEGORIES.length)}</span> of {CATEGORIES.length}
              </span>
            )}
          </span>

          {/* Progress Indicators (6 Steps) */}
          <div className="hidden sm:flex items-center gap-1 ml-1" aria-hidden="true">
            {CATEGORIES.map((cat, idx) => (
              <span
                key={cat.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx < revealedCount
                    ? 'w-4 bg-forest-700'
                    : idx === revealedCount && !isCompleted
                    ? 'w-4 bg-emerald-500 animate-pulse'
                    : 'w-1.5 bg-forest-900/15'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isCompleted ? (
            <>
              <button
                type="button"
                onClick={handleTogglePlayPause}
                aria-label={isPaused ? 'Resume card shuffle' : 'Pause card shuffle'}
                className="px-2.5 py-1 rounded-lg bg-surface-white hover:bg-forest-50 border border-surface-border text-forest-900 text-[11px] font-medium inline-flex items-center gap-1 transition-colors button-press"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3 h-3 text-emerald-700 fill-emerald-700" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-forest-800" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkipToAll}
                className="px-2.5 py-1 rounded-lg bg-surface-white hover:bg-forest-50 border border-surface-border text-forest-800 text-[11px] font-medium transition-colors button-press"
              >
                Show All
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleReplay}
              className="px-3 py-1 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all button-press"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Replay Shuffle</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Desktop Left Column: Heading, Description & CTA (>= lg screens) */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-3.5">
          <span className="text-xs font-bold tracking-[0.2em] text-forest-800 uppercase font-sans">
            OUR CATEGORIES &amp; VARIETIES
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-forest-900 leading-[1.15]">
            Explore Nature’s<br />Finest Categories
          </h2>
          <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
            From farm-fresh mushrooms and pure grain spawn to ready-to-fruit kits, cultivation supplies, and certified grower training.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="bg-forest-900 hover:bg-forest-800 text-white font-medium text-xs sm:text-sm px-6 py-3 rounded-full inline-flex items-center gap-2 shadow-level-1 hover-lift transition-all button-press"
            >
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right Stage: Stacked Deck + Sequential Reveal Area */}
        <div className="lg:col-span-8 xl:col-span-9">
          {/* Completed State or Reduced Motion: Full Canonical Responsive Grid */}
          {isCompleted || isReducedMotion ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 lg:gap-3 transition-opacity duration-500">
              {CATEGORIES.map((cat) => (
                <VarietyCard
                  key={cat.id}
                  cat={cat}
                />
              ))}
            </div>
          ) : (
            /* Active Dealing State: Stacked Deck + Revealed Queue */
            <div className="flex flex-col md:flex-row gap-5 lg:gap-6 items-stretch justify-start min-h-[300px]">
              {/* 1. Stacked Deck Stage (Undealt Cards) */}
              <div
                className="relative w-full md:w-[220px] lg:w-[230px] xl:w-[245px] shrink-0 flex flex-col items-center"
                aria-label="Stacked Variety Deck"
              >
                <div className="text-[10px] uppercase font-bold tracking-wider text-forest-800/80 mb-2 flex items-center gap-1">
                  <span>Stack Deck</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-forest-900/10 text-forest-900">
                    {remainingDeck.length} left
                  </span>
                </div>

                <div className="relative w-full aspect-[4/5] max-w-[240px] md:max-w-none">
                  {remainingDeck.slice(0, 4).map((cat, depth) => {
                    const stackStyle = getStackTransform(depth, isDealing);
                    const isFront = depth === 0;

                    return (
                      <div
                        key={cat.id}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          ...stackStyle,
                        }}
                        className="pointer-events-auto"
                      >
                        <VarietyCard
                          cat={cat}
                          isFeatured={isFront}
                          isDealing={isDealing && isFront}
                          className={isFront ? 'shadow-[0_12px_28px_rgba(23,59,42,0.12)]' : ''}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Revealed Queue (Dealt Cards Grid) */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="text-[10px] uppercase font-bold tracking-wider text-forest-800/80 mb-2 flex items-center justify-between">
                  <span>Revealed Queue ({revealedCards.length} / {CATEGORIES.length})</span>
                  <span className="text-[10px] text-typography-muted">
                    Auto-dealing into queue
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                  {/* Render already revealed cards */}
                  {revealedCards.map((cat) => (
                    <div
                      key={cat.id}
                      className="animate-in fade-in zoom-in-95 duration-500 ease-out"
                    >
                      <VarietyCard
                        cat={cat}
                      />
                    </div>
                  ))}

                  {/* Render dashed placeholder slots for upcoming varieties */}
                  {Array.from({ length: CATEGORIES.length - revealedCards.length - 1 }).map((_, idx) => (
                    <div
                      key={`placeholder-${idx}`}
                      className="hidden sm:flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-forest-900/10 bg-surface-cream/20 text-forest-800/40 min-h-[160px] text-center"
                    >
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
                        Slot {revealedCards.length + idx + 2}
                      </span>
                      <span className="text-[9px] text-forest-900/30 mt-1">Upcoming</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
