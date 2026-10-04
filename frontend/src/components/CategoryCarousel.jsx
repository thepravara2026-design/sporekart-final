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

      {/* Creative Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-3.5 sm:gap-5 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {categories.map((cat, idx) => {
          const IconComp = cat.IconComp || Layers;
          const bgGradients = [
            'from-emerald-900/90 via-forest-900/80 to-forest-950',
            'from-amber-900/90 via-stone-900/80 to-stone-950',
            'from-teal-900/90 via-emerald-950/80 to-stone-950',
            'from-purple-900/90 via-indigo-950/80 to-slate-950',
            'from-stone-900/90 via-forest-950/80 to-slate-950',
          ];
          const gradientStyle = bgGradients[idx % bgGradients.length];

          return (
            <Link
              key={cat.id || cat.slug}
              to={`/products/${cat.slug}`}
              className="w-[160px] xs:w-[180px] sm:w-[220px] shrink-0 snap-start relative rounded-2xl overflow-hidden group shadow-level-2 hover:shadow-level-3 transition-all duration-300 border border-surface-border/80 flex flex-col justify-between h-[210px] sm:h-[240px]"
            >
              {/* Background Thumbnail Image with Gradient Overlay */}
              <div className="absolute inset-0 z-0">
                <MediaImage
                  src={cat.imgUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${gradientStyle} opacity-85 group-hover:opacity-75 transition-opacity duration-300`} />
              </div>

              {/* Top Badge & Icon */}
              <div className="relative z-10 p-3.5 flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-forest-900 transition-all duration-300 shadow-sm">
                  <IconComp className="w-5 h-5" />
                </div>

                <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider border border-white/25">
                  Explore
                </span>
              </div>

              {/* Bottom Details & CTA */}
              <div className="relative z-10 p-3.5 pt-0 space-y-1">
                <h3 className="font-display font-extrabold text-sm sm:text-base text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-white/80 line-clamp-2 leading-tight">
                  {cat.desc || 'Lab certified offerings'}
                </p>

                <div className="pt-2 flex items-center text-[10px] sm:text-[11px] font-bold text-emerald-300 group-hover:text-white transition-all">
                  <span>Browse Products</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
