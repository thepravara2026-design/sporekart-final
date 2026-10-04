import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Layers } from 'lucide-react';
import MediaImage from './MediaImage';

export default function CategoryCarousel({ categories = [], className = '' }) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-forest-900">
          Shop by Category
        </h2>
        <Link
          to="/products"
          className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 hover-lift"
        >
          All Categories <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Horizontal Swipeable Track */}
      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-3 sm:gap-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((cat) => {
          const IconComp = cat.IconComp || Layers;
          return (
            <Link
              key={cat.id || cat.slug}
              to={`/products/${cat.slug}`}
              className="w-[140px] xs:w-[160px] sm:w-[200px] shrink-0 snap-start bg-surface-white rounded-2xl border border-surface-border p-3.5 hover:border-forest-700/40 hover-lift transition-all shadow-level-1 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-forest-900/10 text-forest-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-forest-700 group-hover:text-white transition-all shadow-sm">
                  <IconComp className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-typography-muted group-hover:text-forest-700 group-hover:translate-x-1 transition-all" />
              </div>

              <div>
                <h3 className="font-display font-bold text-xs sm:text-sm text-forest-900 group-hover:text-forest-700 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-typography-secondary line-clamp-1 mt-0.5">
                  {cat.desc || 'Explore items'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
