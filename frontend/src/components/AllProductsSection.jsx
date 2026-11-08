import React, { useState, useRef } from 'react';
import { Filter, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw, Sprout, ShoppingBag, AlertCircle } from 'lucide-react';
import { useHomeProducts } from '../hooks/useHomeProducts';
import ProductCard from './ProductCard';

const CATEGORIES = [
  { id: 'all', slug: 'all', name: 'All Products' },
  { id: 'fresh-mushrooms', slug: 'fresh-mushrooms', name: 'Fresh Mushrooms' },
  { id: 'spawn-seeds', slug: 'spawn-seeds', name: 'Spawn Seeds' },
  { id: 'growing-kits', slug: 'growing-kits', name: 'Growing Kits' },
  { id: 'dry-mushrooms', slug: 'dry-mushrooms', name: 'Dry Mushrooms' },
  { id: 'equipment-supplies', slug: 'equipment-supplies', name: 'Supplies & Tools' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'relevance', label: 'Recommended' },
];

export default function AllProductsSection({ onAddToCart, onTrackView }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 12;

  const sectionRef = useRef(null);

  const { products, totalElements, totalPages, loading, error } = useHomeProducts({
    category: selectedCategory,
    sortBy: selectedSort,
    page: currentPage,
    pageSize,
  });

  const handleCategoryChange = (slug) => {
    setSelectedCategory(slug);
    setCurrentPage(0);
  };

  const handleSortChange = (e) => {
    setSelectedSort(e.target.value);
    setCurrentPage(0);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      if (sectionRef.current) {
        const yOffset = -90;
        const y = sectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  };

  const startItem = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <section 
      id="all-products"
      ref={sectionRef}
      aria-label="All Sporekart Agricultural Products with Pagination"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 scroll-mt-24"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest-800 font-sans mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            <span>COMMERCIAL GRADE SEED &amp; GOURMET STOREFRONT</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-forest-950">
            Explore All Sporekart Offerings
          </h2>
          <p className="text-typography-secondary text-xs sm:text-sm mt-0.5">
            Browse our laboratory-certified spawn seeds, daily harvested mushrooms, DIY grow kits, and professional tools.
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-end">
          <label htmlFor="product-sort-select" className="text-xs font-bold text-forest-900 shrink-0 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-forest-700" />
            <span>Sort by:</span>
          </label>
          <select
            id="product-sort-select"
            value={selectedSort}
            onChange={handleSortChange}
            className="text-xs font-semibold bg-white border border-surface-border rounded-xl px-3 py-2 text-forest-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-4 border-b border-surface-border/60">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-forest-900 text-white shadow-level-1 scale-[1.02]'
                  : 'bg-white/80 hover:bg-white text-forest-800 border border-surface-border hover:border-forest-700/40 shadow-xs'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Product Count Status */}
      <div className="flex items-center justify-between text-xs font-medium text-typography-secondary py-3">
        <span>
          Showing <strong className="text-forest-900">{startItem}–{endItem}</strong> of <strong className="text-forest-900">{totalElements}</strong> products
        </span>
        {totalPages > 1 && (
          <span>
            Page <strong className="text-forest-900">{currentPage + 1}</strong> of <strong className="text-forest-900">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pt-2">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 border border-surface-border animate-pulse space-y-3">
              <div className="aspect-square bg-surface-cream rounded-xl" />
              <div className="h-4 bg-surface-cream rounded w-3/4" />
              <div className="h-3 bg-surface-cream rounded w-1/2" />
              <div className="h-9 bg-surface-cream rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="my-10 p-8 rounded-3xl bg-red-50/70 border border-red-200 text-center max-w-lg mx-auto space-y-3">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h3 className="font-bold text-base text-red-900">Failed to load products</h3>
          <p className="text-xs text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-forest-900 text-white text-xs font-bold hover:bg-forest-800 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="my-12 p-8 sm:p-12 rounded-3xl bg-white/70 border border-surface-border text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-forest-900/10 text-forest-800 flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6 text-forest-800" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-forest-950">No products found</h3>
            <p className="text-xs text-typography-secondary">
              We couldn't find any items matching your selected category. Try selecting another category or viewing all items.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-forest-900 text-white text-xs font-bold hover:bg-forest-800 transition-all cursor-pointer shadow-level-1"
          >
            <span>View All Products</span>
          </button>
        </div>
      ) : (
        /* Product Grid */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pt-2">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => onTrackView && onTrackView(product)}
            >
              <ProductCard product={product} onAddToCart={onAddToCart} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination Navigation Controls */}
      {totalPages > 1 && (
        <nav
          aria-label="Pagination Navigation"
          className="mt-10 sm:mt-14 pt-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="Previous page"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              currentPage === 0
                ? 'bg-surface-cream/50 text-typography-muted border-surface-border/50 cursor-not-allowed'
                : 'bg-white hover:bg-forest-900 hover:text-white text-forest-900 border-surface-border shadow-xs cursor-pointer hover:border-forest-900'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Numbered Page Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const isCurrent = idx === currentPage;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePageChange(idx)}
                  aria-label={`Go to page ${idx + 1}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border ${
                    isCurrent
                      ? 'bg-forest-900 text-white border-forest-900 shadow-level-1 scale-105'
                      : 'bg-white hover:bg-surface-cream text-forest-900 border-surface-border shadow-xs hover:border-forest-700/40 cursor-pointer'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            aria-label="Next page"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              currentPage === totalPages - 1
                ? 'bg-surface-cream/50 text-typography-muted border-surface-border/50 cursor-not-allowed'
                : 'bg-white hover:bg-forest-900 hover:text-white text-forest-900 border-surface-border shadow-xs cursor-pointer hover:border-forest-900'
            }`}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </section>
  );
}
