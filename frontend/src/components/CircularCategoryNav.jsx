import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sprout, Layers, Zap, Award, Wrench } from 'lucide-react';
import { catalogApi } from '../api';

const CATEGORY_FALLBACK_MAP = {
  'fresh-mushrooms': {
    name: 'Fresh Mushrooms',
    image: '/sporekart-white-button.jpg',
  },
  'spawn-seeds': {
    name: 'Spawn Seeds',
    image: '/sporekart-cultivation-stage1-lab.jpg',
  },
  'growing-kits': {
    name: 'Growing Kits',
    image: '/sporekart-oyster-cluster.jpg',
  },
  'dry-mushrooms': {
    name: 'Dry Mushrooms',
    image: '/sporekart-shiitake.jpg',
  },
  'equipment-supplies': {
    name: 'Supplies & Tools',
    image: '/sporekart-farm-scientist.jpg',
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
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let isMounted = true;
    catalogApi.getCategories()
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
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(updateScrollButtons, 350);
    }
  };

  return (
    <nav 
      aria-label="Product categories navigation" 
      className="w-full bg-surface-white/80 border-b border-surface-border/70 backdrop-blur-sm py-3 sm:py-4 px-3 sm:px-6 relative z-30 shadow-xs"
    >
      <div className="max-w-7xl mx-auto relative flex items-center">
        {/* Left Scroll Button (Desktop) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll categories left"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 border border-surface-border shadow-level-2 items-center justify-center text-forest-800 hover:text-forest-950 hover:scale-105 transition-all duration-200 cursor-pointer -ml-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Scrollable Categories Row */}
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex items-center gap-4 sm:gap-8 overflow-x-auto scrollbar-none py-1 px-1 w-full scroll-smooth justify-start md:justify-center"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.id || cat.slug}
              to={`/products/${cat.slug}`}
              className="flex flex-col items-center group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-2xl p-1 transition-all"
              title={`Explore ${cat.name}`}
            >
              {/* Circular Image Container */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-emerald-600/30 via-forest-700/20 to-emerald-400/40 group-hover:from-emerald-600 group-hover:to-forest-800 transition-all duration-300 shadow-sm group-hover:shadow-level-2 group-hover:scale-105">
                <div className="w-full h-full rounded-full overflow-hidden bg-surface-cream border-2 border-white shadow-inner flex items-center justify-center">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    width="80"
                    height="80"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/sporekart-white-button.jpg';
                    }}
                  />
                </div>
              </div>

              {/* Category Name Label */}
              <span className="text-[11px] sm:text-xs font-bold text-forest-900 group-hover:text-emerald-700 mt-2 text-center max-w-[85px] sm:max-w-[105px] truncate transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Right Scroll Button (Desktop) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll categories right"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 border border-surface-border shadow-level-2 items-center justify-center text-forest-800 hover:text-forest-950 hover:scale-105 transition-all duration-200 cursor-pointer -mr-2"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </nav>
  );
}
