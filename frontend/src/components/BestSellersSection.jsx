import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ChevronLeft, ChevronRight, ArrowRight, ShoppingBag, Star, CheckCircle2 } from 'lucide-react';
import { useBestSellers } from '../hooks/useBestSellers';
import ProductCard from './ProductCard';
import { useCart } from '../context/CartContext';

export default function BestSellersSection({ onAddToCart, onTrackView }) {
  const { bestsellers, loading, error } = useBestSellers(10);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
  }, [bestsellers]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(updateScrollButtons, 350);
    }
  };

  if (!loading && (!bestsellers || bestsellers.length === 0)) {
    return null;
  }

  return (
    <section 
      id="bestsellers"
      aria-label="Sporekart best selling agricultural products"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 scroll-mt-24"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-700 font-sans mb-1 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />
            <span>AUTHENTIC COMPLETED ORDER DATA • DAVANGERE FARM</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-forest-950">
            Sporekart Best Sellers
          </h2>
          <p className="text-typography-secondary text-xs sm:text-sm mt-0.5">
            The 6–10 most demanded fresh mushroom harvests, 1st-gen wheat grain spawns, and indoor cultivation kits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Carousel Navigation Arrows */}
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous best sellers"
            className={`hidden md:flex w-9 h-9 rounded-full border border-surface-border items-center justify-center transition-all ${
              canScrollLeft 
                ? 'bg-white text-forest-900 hover:bg-forest-900 hover:text-white shadow-level-1 cursor-pointer' 
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
            className={`hidden md:flex w-9 h-9 rounded-full border border-surface-border items-center justify-center transition-all ${
              canScrollRight 
                ? 'bg-white text-forest-900 hover:bg-forest-900 hover:text-white shadow-level-1 cursor-pointer' 
                : 'bg-white/40 text-forest-300 border-surface-border/50 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <Link
            to="/products"
            className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 hover-lift shrink-0 bg-surface-cream px-3 py-2 rounded-xl border border-surface-border shadow-xs ml-2"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="mt-6 flex gap-4 overflow-hidden py-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="w-[260px] sm:w-[280px] shrink-0 bg-white rounded-2xl p-4 border border-surface-border animate-pulse space-y-3">
              <div className="aspect-square bg-surface-cream rounded-xl" />
              <div className="h-4 bg-surface-cream rounded w-3/4" />
              <div className="h-3 bg-surface-cream rounded w-1/2" />
              <div className="h-8 bg-surface-cream rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : (
        /* Horizontal Scroll Carousel */
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="mt-6 flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {bestsellers.map((product) => (
            <div
              key={product.id}
              className="w-[260px] sm:w-[280px] md:w-[300px] shrink-0 flex flex-col"
              onClick={() => onTrackView && onTrackView(product)}
            >
              <ProductCard product={product} onAddToCart={onAddToCart} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
