import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ChevronLeft, ChevronRight, ArrowRight, Star, ShieldCheck, Sparkles } from 'lucide-react';
import { useBestSellers } from '../hooks/useBestSellers';
import MinimalBestSellerCard from './MinimalBestSellerCard';

export default function BestSellersSection({ onAddToCart, onTrackView }) {
  const { bestsellers, loading } = useBestSellers(10);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [bestsellers, activeFilter]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(updateScrollButtons, 350);
    }
  };

  // Derive unique categories present in the bestsellers list for quick filtering
  const availableCategories = useMemo(() => {
    if (!bestsellers) return [];
    const cats = new Set();
    bestsellers.forEach(p => {
      if (p.categoryName) cats.add(p.categoryName);
    });
    return Array.from(cats);
  }, [bestsellers]);

  // Filtered products based on user selection
  const displayedProducts = useMemo(() => {
    if (!bestsellers) return [];
    if (activeFilter === 'ALL') return bestsellers;
    if (activeFilter === 'MOST_SOLD') {
      const filtered = bestsellers.filter(p => p.isBestSeller || (p.totalUnitsSold && p.totalUnitsSold > 0));
      return filtered.length > 0 ? filtered : bestsellers;
    }
    if (activeFilter === 'POPULAR') {
      const filtered = bestsellers.filter(p => p.isPopular || (p.averageRating && p.averageRating >= 4.5));
      return filtered.length > 0 ? filtered : bestsellers;
    }
    return bestsellers.filter(p => p.categoryName === activeFilter);
  }, [bestsellers, activeFilter]);

  if (!loading && (!bestsellers || bestsellers.length === 0)) {
    return null;
  }

  return (
    <section 
      id="bestsellers"
      aria-label="Sporekart best selling agricultural products"
      className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-12 scroll-mt-24"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-surface-border">
        <div>
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-orange-700 font-sans mb-0.5 sm:mb-1 flex items-center gap-1.5">
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600 fill-orange-600" />
            <span>AUTHENTIC COMPLETED ORDERS • 100% COLD-CHAIN DELIVERED • DAVANGERE FARM</span>
          </div>
          <h2 className="font-display font-extrabold text-xl sm:text-3xl lg:text-4xl text-forest-950">
            Sporekart Best Sellers
          </h2>
          <p className="text-typography-secondary text-[11px] sm:text-sm mt-0.5 max-w-2xl">
            Real-time top demanded fresh mushroom harvests, 1st-generation pure wheat grain spawns, and indoor kits ranked by verified customer deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Carousel Navigation Arrows */}
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous best sellers"
            className={`hidden md:flex w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-surface-border items-center justify-center transition-all ${
              canScrollLeft 
                ? 'bg-white text-forest-900 hover:bg-forest-900 hover:text-white shadow-xs cursor-pointer' 
                : 'bg-white/40 text-forest-300 border-surface-border/50 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Next best sellers"
            className={`hidden md:flex w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-surface-border items-center justify-center transition-all ${
              canScrollRight 
                ? 'bg-white text-forest-900 hover:bg-forest-900 hover:text-white shadow-xs cursor-pointer' 
                : 'bg-white/40 text-forest-300 border-surface-border/50 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <Link
            to="/products"
            className="text-[11px] sm:text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 hover-lift shrink-0 bg-surface-cream px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-surface-border shadow-2xs ml-1 sm:ml-2"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Creative Interactive Filter Tabs */}
      {!loading && bestsellers && bestsellers.length > 0 && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-2.5 sm:py-3" style={{ scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-tight transition-all duration-150 shrink-0 flex items-center gap-1 cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-forest-900 text-white shadow-xs'
                : 'bg-surface-neutral/80 text-forest-900 border border-surface-border hover:bg-surface-cream'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>All Top Sellers ({bestsellers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('MOST_SOLD')}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-tight transition-all duration-150 shrink-0 flex items-center gap-1 cursor-pointer ${
              activeFilter === 'MOST_SOLD'
                ? 'bg-orange-700 text-white shadow-xs'
                : 'bg-surface-neutral/80 text-forest-900 border border-surface-border hover:bg-surface-cream'
            }`}
          >
            <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
            <span>Most Sold</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('POPULAR')}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-tight transition-all duration-150 shrink-0 flex items-center gap-1 cursor-pointer ${
              activeFilter === 'POPULAR'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-neutral/80 text-forest-900 border border-surface-border hover:bg-surface-cream'
            }`}
          >
            <Star className="w-3 h-3 text-amber-200 fill-amber-200" />
            <span>Customer Favorites</span>
          </button>

          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-tight transition-all duration-150 shrink-0 cursor-pointer ${
                activeFilter === cat
                  ? 'bg-forest-900 text-white shadow-xs'
                  : 'bg-surface-neutral/80 text-forest-800 border border-surface-border hover:bg-surface-cream'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="mt-3 sm:mt-5 flex gap-2.5 sm:gap-4 overflow-hidden py-1.5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="w-[155px] min-[390px]:w-[175px] sm:w-[210px] md:w-[230px] lg:w-[250px] shrink-0 bg-white rounded-2xl p-2.5 sm:p-3 border border-surface-border animate-pulse space-y-2 sm:space-y-3">
              <div className="aspect-square bg-surface-cream rounded-xl" />
              <div className="h-3 bg-surface-cream rounded w-1/3" />
              <div className="h-3.5 bg-surface-cream rounded w-3/4" />
              <div className="h-3 bg-surface-cream rounded w-1/2" />
              <div className="h-7 sm:h-8 bg-surface-cream rounded-lg w-full" />
            </div>
          ))}
        </div>
      ) : (
        /* Minimal Card Horizontal Scroll Carousel */
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="mt-2 sm:mt-4 flex gap-2.5 sm:gap-4 overflow-x-auto scrollbar-none py-1.5 px-0.5 scroll-smooth overscroll-x-contain"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayedProducts.map((product, index) => (
            <div
              key={product.id}
              className="w-[155px] min-[390px]:w-[175px] sm:w-[210px] md:w-[230px] lg:w-[250px] shrink-0 flex flex-col"
            >
              <MinimalBestSellerCard 
                product={product} 
                rank={index + 1}
                onAddToCart={onAddToCart} 
                onTrackView={onTrackView} 
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
