import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductCarousel({
  title,
  subtitle,
  products = [],
  viewAllLink = '/products',
  onAddToCart,
  className = '',
}) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          {title && (
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-forest-900">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-typography-secondary text-xs sm:text-sm mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll Control Arrows for Desktop */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <button
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-full bg-surface-white border border-surface-border text-forest-900 flex items-center justify-center hover:bg-surface-cream hover:border-forest-700 transition shadow-sm"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-full bg-surface-white border border-surface-border text-forest-900 flex items-center justify-center hover:bg-surface-cream hover:border-forest-700 transition shadow-sm"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 hover-lift shrink-0"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-3.5 sm:gap-5 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[200px] xs:w-[230px] sm:w-[270px] shrink-0 snap-start"
          >
            <ProductCard product={product} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>
    </div>
  );
}
