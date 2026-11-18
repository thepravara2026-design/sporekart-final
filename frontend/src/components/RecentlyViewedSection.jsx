import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { History, Trash2, ArrowRight } from 'lucide-react';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

export default function RecentlyViewedSection({ user = null }) {
  const { items, clearItems } = useRecentlyViewed(user);
  const [filterType, setFilterType] = useState('ALL');

  const filteredItems = useMemo(() => {
    if (filterType === 'PRODUCT') return items.filter((i) => i.type === 'product');
    if (filterType === 'TRAINING') return items.filter((i) => i.type === 'training');
    return items;
  }, [items, filterType]);

  // Hide the section completely until and unless the user has browsed products or training
  if (!items || items.length === 0) {
    return null;
  }

  const hasProducts = items.some((i) => i.type === 'product');
  const hasTraining = items.some((i) => i.type === 'training');

  return (
    <section 
      aria-label="Recently viewed products and training programs"
      className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-10"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-surface-border">
        <div>
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-forest-800 font-sans mb-0.5 sm:mb-1 flex items-center gap-1.5">
            <History className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
            <span>PERSONALIZED BROWSING HISTORY</span>
          </div>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl lg:text-3xl text-forest-950">
            Recently Viewed by You
          </h2>
          <p className="text-typography-secondary text-[11px] sm:text-sm mt-0.5">
            Pick up right where you left off with your recently explored mushroom products and training courses.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Filter Tabs if both products and training exist */}
          {hasProducts && hasTraining && (
            <div className="inline-flex rounded-xl bg-surface-cream p-0.5 sm:p-1 border border-surface-border text-[10px] sm:text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg transition-all ${
                  filterType === 'ALL' ? 'bg-forest-900 text-white shadow-2xs' : 'text-forest-800 hover:text-forest-950'
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('PRODUCT')}
                className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg transition-all ${
                  filterType === 'PRODUCT' ? 'bg-forest-900 text-white shadow-2xs' : 'text-forest-800 hover:text-forest-950'
                }`}
              >
                Products
              </button>
              <button
                type="button"
                onClick={() => setFilterType('TRAINING')}
                className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg transition-all ${
                  filterType === 'TRAINING' ? 'bg-forest-900 text-white shadow-2xs' : 'text-forest-800 hover:text-forest-950'
                }`}
              >
                Training
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={clearItems}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-surface-border bg-white hover:bg-red-50 text-typography-secondary hover:text-red-700 text-[10px] sm:text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Clear viewing history"
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Content Grid on Desktop, Sleek Horizontal Swipe on Mobile */}
      <div 
        className="mt-3.5 sm:mt-6 flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 overflow-x-auto sm:overflow-visible scrollbar-none gap-2.5 sm:gap-5 pb-2 sm:pb-0 scroll-smooth overscroll-x-contain"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {filteredItems.map((item) => {
          const detailUrl = item.type === 'training' 
            ? `/training/${item.slug}` 
            : `/product/${item.slug}`;

          return (
            <div
              key={`${item.type}-${item.id}`}
              className="w-[135px] min-[390px]:w-[150px] shrink-0 sm:w-auto sm:shrink bg-surface-white rounded-xl sm:rounded-2xl overflow-hidden border border-surface-border/80 shadow-2xs hover:shadow-level-1 hover:border-forest-700/30 transition-all duration-200 flex flex-col justify-between group h-full"
            >
              <Link to={detailUrl} className="block relative aspect-square overflow-hidden bg-surface-cream/50">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  width="300"
                  height="300"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/sporekart-white-button.jpg';
                  }}
                />
                {/* Category / Type badge */}
                <span className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 px-1.5 py-0.5 rounded bg-forest-950/80 backdrop-blur-md text-white text-[7.5px] sm:text-[8.5px] font-bold tracking-wider uppercase">
                  {item.type === 'training' ? '🎓 Masterclass' : item.categoryName || 'Mushroom'}
                </span>
              </Link>

              <div className="p-2 sm:p-3 flex flex-col justify-between flex-1 gap-1 sm:gap-1.5">
                <div>
                  <h3 className="font-semibold sm:font-bold text-[11px] sm:text-xs text-forest-950 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors min-h-[1.75rem] sm:min-h-[2rem]">
                    <Link to={detailUrl}>
                      {item.title}
                    </Link>
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-surface-border/60">
                  {item.priceInr ? (
                    <div className="text-[11px] sm:text-xs font-extrabold text-forest-900">
                      ₹{Number(item.priceInr).toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-[10px] sm:text-[11px] font-bold text-emerald-700">
                      View Options
                    </div>
                  )}
                  <Link
                    to={detailUrl}
                    className="text-[10px] sm:text-[11px] font-bold text-forest-700 group-hover:text-forest-950 flex items-center gap-0.5"
                  >
                    <span>View</span>
                    <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
