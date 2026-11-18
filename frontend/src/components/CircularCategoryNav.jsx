import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Layers, Sparkles, Sprout } from 'lucide-react';
import * as api from '../api';

const CATEGORY_FALLBACK_MAP = {
  'fresh-mushrooms': {
    name: 'Fresh Mushrooms',
    image: '/sporekart-white-button.jpg',
    accentRing: 'from-emerald-500 to-forest-700',
  },
  'spawn-seeds': {
    name: 'Spawn Seeds',
    image: '/sporekart-cultivation-stage1-lab.jpg',
    accentRing: 'from-amber-500 to-forest-800',
  },
  'growing-kits': {
    name: 'Growing Kits',
    image: '/sporekart-oyster-cluster.jpg',
    accentRing: 'from-teal-500 to-forest-800',
  },
  'dry-mushrooms': {
    name: 'Dry Mushrooms',
    image: '/sporekart-shiitake.jpg',
    accentRing: 'from-orange-500 to-soil',
  },
  'equipment-supplies': {
    name: 'Equipment & Supplies',
    image: '/sporekart-farm-scientist.jpg',
    accentRing: 'from-blue-500 to-forest-900',
  },
};

const DEFAULT_CATEGORIES = [
  { id: 'fresh-mushrooms', slug: 'fresh-mushrooms', name: 'Fresh Mushrooms', imageUrl: '/sporekart-white-button.jpg' },
  { id: 'spawn-seeds', slug: 'spawn-seeds', name: 'Spawn Seeds', imageUrl: '/sporekart-cultivation-stage1-lab.jpg' },
  { id: 'growing-kits', slug: 'growing-kits', name: 'Growing Kits', imageUrl: '/sporekart-oyster-cluster.jpg' },
  { id: 'dry-mushrooms', slug: 'dry-mushrooms', name: 'Dry Mushrooms', imageUrl: '/sporekart-shiitake.jpg' },
  { id: 'equipment-supplies', slug: 'equipment-supplies', name: 'Equipment & Supplies', imageUrl: '/sporekart-farm-scientist.jpg' },
];

export default function CircularCategoryNav() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let catalogApi = null;
    try {
      if (api && 'catalogApi' in api) {
        catalogApi = api.catalogApi;
      }
    } catch (e) {
      catalogApi = null;
    }

    if (catalogApi && typeof catalogApi.getCategories === 'function') {
      try {
        const promise = catalogApi.getCategories();
        if (promise && typeof promise.then === 'function') {
          promise
            .then((res) => {
              if (isMounted && res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
                const mapped = res.data.data.map((cat) => {
                  const fallback = CATEGORY_FALLBACK_MAP[cat.slug] || {};
                  return {
                    id: cat.id || cat.slug,
                    slug: cat.slug,
                    name: cat.name || fallback.name || cat.slug,
                    imageUrl: cat.imageUrl || fallback.image || '/sporekart-white-button.jpg',
                  };
                });
                setCategories(mapped);
              }
            })
            .catch(() => {
              // Retain verified fallback categories
            });
        }
      } catch (e) {
        // Fallback cleanly
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [categories]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(updateScrollButtons, 350);
    }
  };

  return (
    <nav
      aria-label="Product categories navigation"
      className="w-full bg-surface-white/95 backdrop-blur-md border-t border-surface-border/50 border-b border-surface-border/70 py-1 sm:py-1.5 px-3 sm:px-6 relative z-30 shadow-2xs transition-all duration-200"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Amazon-style "All Products" Pill on Left */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-forest-950 hover:text-emerald-700 bg-surface-neutral/90 hover:bg-forest-900/10 border border-surface-border/80 shrink-0 transition-all shadow-2xs group"
            title="Browse all products"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-700 group-hover:rotate-12 transition-transform duration-200" />
            <span className="tracking-tight">All</span>
          </Link>
          <span className="hidden sm:inline-block h-3.5 w-px bg-surface-border/80 shrink-0 mx-0.5" />
        </div>

        {/* Scroll Left Button (if overflowed) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll categories left"
            className="hidden sm:flex w-6 h-6 rounded-full bg-white hover:bg-forest-900 text-forest-900 hover:text-white border border-surface-border shadow-2xs items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Amazon-style Compact Horizontal Category Strip */}
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex-1 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 px-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => {
            const fallback = CATEGORY_FALLBACK_MAP[cat.slug] || {};
            const accentRing = fallback.accentRing || 'from-emerald-500 to-forest-700';

            return (
              <Link
                key={cat.id || cat.slug}
                to={`/products/${cat.slug}`}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full hover:bg-forest-900/6 border border-transparent hover:border-emerald-500/25 transition-all duration-200 shrink-0 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600"
                title={`Explore ${cat.name}`}
              >
                {/* Smaller Circular Icon (Amazon style, 24px-28px diameter) */}
                <div className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full p-[1.5px] bg-gradient-to-tr ${accentRing} shadow-2xs shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.35)] transition-all duration-300`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-surface-cream border border-white flex items-center justify-center">
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      width="28"
                      height="28"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/sporekart-white-button.jpg';
                      }}
                    />
                  </div>
                </div>

                {/* Category Label */}
                <span className="text-[11px] sm:text-xs font-semibold text-forest-950 group-hover:text-emerald-700 transition-colors whitespace-nowrap">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Scroll Right Button (if overflowed) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll categories right"
            className="hidden sm:flex w-6 h-6 rounded-full bg-white hover:bg-forest-900 text-forest-900 hover:text-white border border-surface-border shadow-2xs items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Right Quick Telemetry Tag (Desktop >= 1024px) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0 pl-2 border-l border-surface-border/70">
          <Link
            to="/training"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-soil hover:text-forest-950 bg-gold/15 hover:bg-gold/25 border border-gold/30 px-2.5 py-0.5 rounded-full transition-colors"
          >
            <Sparkles className="w-3 h-3 text-gold" />
            <span>Workshops & Training</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
