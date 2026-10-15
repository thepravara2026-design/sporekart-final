import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Layers, Sparkles, ArrowRight } from 'lucide-react';
import MediaImage from './MediaImage';

export default function CategoryCarousel({ categories = [], className = '' }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!categories || categories.length === 0) return null;

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header Section */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-900/10 border border-forest-900/20 text-forest-800 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-forest-700" />
            <span>Curated Mushroom Agritech</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-forest-900">
            Explore Categories
          </h2>
          <p className="text-typography-secondary text-xs sm:text-sm mt-0.5">
            Swipe to discover fresh mushrooms, grain spawn, growing kits, and supplies
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-full bg-surface-white border border-surface-border text-forest-900 flex items-center justify-center hover:bg-forest-700 hover:text-white hover:border-forest-700 transition-all shadow-sm button-press"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-full bg-surface-white border border-surface-border text-forest-900 flex items-center justify-center hover:bg-forest-700 hover:text-white hover:border-forest-700 transition-all shadow-sm button-press"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <Link
            to="/products"
            className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 hover-lift shrink-0 bg-surface-cream px-3 py-2 rounded-xl border border-surface-border shadow-level-1"
          >
            All Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Creative Circular Category Track */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 sm:gap-6 md:gap-8 pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-2 items-start"
      >
        {categories.map((cat, idx) => {
          const IconComp = cat.IconComp || Layers;
          const ringGradients = [
            'from-forest-800 via-leaf to-gold',
            'from-amber-700 via-gold to-forest-800',
            'from-emerald-800 via-leaf to-teal-700',
            'from-forest-900 via-moss to-leaf',
            'from-soil via-gold to-forest-800',
          ];
          const ringGradient = ringGradients[idx % ringGradients.length];

          return (
            <Link
              key={cat.id || cat.slug}
              to={`/products/${cat.slug}`}
              className="w-[120px] sm:w-[150px] md:w-[170px] shrink-0 snap-start flex flex-col items-center text-center group focus:outline-none transition-transform duration-300"
            >
              {/* Circular Card Graphic with Concentric Rings */}
              <div className="relative">
                {/* Outer Ambient Glow Effect on Hover */}
                <div className="absolute inset-0 rounded-full blur-md bg-leaf/20 group-hover:bg-gold/30 transition-all duration-500 scale-95 group-hover:scale-105 pointer-events-none" />

                {/* Gradient Ring Frame */}
                <div className={`relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full p-1 sm:p-1.5 bg-gradient-to-tr ${ringGradient} shadow-level-2 group-hover:shadow-glow transition-all duration-300 transform group-hover:scale-105 group-hover:-rotate-1`}>
                  {/* Inner White Bezel */}
                  <div className="w-full h-full rounded-full p-0.5 sm:p-1 bg-surface-white overflow-hidden shadow-inner">
                    {/* Inner Circular Image Container */}
                    <div className="w-full h-full rounded-full overflow-hidden relative bg-gradient-to-br from-forest-800 to-forest-950 flex items-center justify-center">
                      {/* Artistic Botanical Icon Watermark if image is loading or blocked by network */}
                      <IconComp className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-leaf/40 absolute transition-transform duration-500 group-hover:scale-110 group-hover:text-gold/50" />

                      <img
                        src={cat.imgUrl}
                        alt={cat.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full rounded-full object-cover group-hover:scale-115 transition-transform duration-700 ease-out brightness-95 group-hover:brightness-105 relative z-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {/* Subtle Vignette Gradient for Depth */}
                      <div className="absolute inset-0 z-2 rounded-full bg-gradient-to-t from-forest-950/40 via-transparent to-transparent opacity-40 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Floating Category Icon Badge */}
                <div className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-forest-900 text-gold border-2 border-surface-white flex items-center justify-center shadow-level-2 group-hover:bg-gold group-hover:text-forest-950 group-hover:scale-110 transition-all duration-300">
                  <IconComp className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
              </div>

              {/* Category Name & Action (Description Excluded) */}
              <div className="mt-3 space-y-1 w-full px-1">
                <h3 className="font-display font-bold text-xs sm:text-sm md:text-base text-forest-900 group-hover:text-forest-700 transition-colors line-clamp-2 leading-tight">
                  {cat.name}
                </h3>
                <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-leaf group-hover:text-forest-700 transition-colors">
                  <span>Explore</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
