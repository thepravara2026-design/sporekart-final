import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { History, Trash2, ArrowRight, Star, GraduationCap, Sprout, ShoppingBag } from 'lucide-react';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

export default function RecentlyViewedSection({ user = null }) {
  const { items, clearItems } = useRecentlyViewed(user);
  const [filterType, setFilterType] = useState('ALL');

  const filteredItems = useMemo(() => {
    if (filterType === 'PRODUCT') return items.filter((i) => i.type === 'product');
    if (filterType === 'TRAINING') return items.filter((i) => i.type === 'training');
    return items;
  }, [items, filterType]);

  const hasProducts = items.some((i) => i.type === 'product');
  const hasTraining = items.some((i) => i.type === 'training');

  return (
    <section 
      aria-label="Recently viewed products and training programs"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest-800 font-sans mb-1 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>PERSONALIZED BROWSING HISTORY</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-forest-950">
            Recently Viewed by You
          </h2>
          <p className="text-typography-secondary text-xs sm:text-sm mt-0.5">
            Pick up right where you left off with your recently explored mushroom products and training courses.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3">
            {/* Filter Tabs if both exist */}
            {hasProducts && hasTraining && (
              <div className="inline-flex rounded-xl bg-surface-cream p-1 border border-surface-border text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterType === 'ALL' ? 'bg-forest-900 text-white shadow-xs' : 'text-forest-800 hover:text-forest-950'
                  }`}
                >
                  All ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('PRODUCT')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterType === 'PRODUCT' ? 'bg-forest-900 text-white shadow-xs' : 'text-forest-800 hover:text-forest-950'
                  }`}
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('TRAINING')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterType === 'TRAINING' ? 'bg-forest-900 text-white shadow-xs' : 'text-forest-800 hover:text-forest-950'
                  }`}
                >
                  Training
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={clearItems}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-white hover:bg-red-50 text-typography-secondary hover:text-red-700 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Clear viewing history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Grid or Empty State */}
      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl p-8 sm:p-12 text-center bg-white/70 border border-surface-border/80 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-forest-900/10 text-forest-800 flex items-center justify-center mx-auto shadow-inner">
            <History className="w-6 h-6 text-forest-800" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg sm:text-xl text-forest-950">
              No Recently Viewed Items Yet
            </h3>
            <p className="text-typography-secondary text-xs sm:text-sm max-w-md mx-auto">
              As you explore our daily harvested fresh mushrooms, laboratory-tested grain spawn, or cultivation training masterclasses, they will appear here for easy access.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold transition-all shadow-level-1"
            >
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span>Explore Products</span>
            </Link>
            <Link
              to="/training"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-surface-cream hover:bg-white text-forest-900 text-xs font-bold border border-surface-border transition-all shadow-xs"
            >
              <GraduationCap className="w-3.5 h-3.5 text-forest-700" />
              <span>Browse Masterclasses</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
          {filteredItems.map((item) => {
            const detailUrl = item.type === 'training' 
              ? `/training/${item.slug}` 
              : `/product/${item.slug}`;

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-surface-border shadow-level-1 hover:shadow-level-2 hover:border-forest-700/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <Link to={detailUrl} className="block relative aspect-square overflow-hidden bg-surface-cream">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    width="400"
                    height="400"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/sporekart-white-button.jpg';
                    }}
                  />
                  {/* Category / Type badge */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-forest-950/80 backdrop-blur-md text-white text-[9px] font-bold tracking-wider uppercase">
                    {item.type === 'training' ? '🎓 Masterclass' : item.categoryName || 'Mushroom'}
                  </span>
                </Link>

                <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-forest-950 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      <Link to={detailUrl}>
                        {item.title}
                      </Link>
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-surface-border/60">
                    {item.priceInr ? (
                      <div className="text-xs sm:text-sm font-extrabold text-forest-900">
                        ₹{Number(item.priceInr).toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-[11px] font-bold text-emerald-700">
                        View Options
                      </div>
                    )}
                    <Link
                      to={detailUrl}
                      className="text-[11px] font-bold text-forest-700 group-hover:text-forest-950 flex items-center gap-0.5"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
