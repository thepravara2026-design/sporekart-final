import React, { useState, useRef } from 'react';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight, PackageCheck } from 'lucide-react';

export default function ProductGrid({
  title,
  subtitle,
  products = [],
  itemsPerPage = 8,
  onAddToCart,
  className = '',
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef(null);

  if (!products || products.length === 0) return null;

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, products.length);
  const paginatedProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div ref={containerRef} className={`space-y-6 ${className}`}>
      {/* Grid Section Header */}
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-surface-border/60">
          <div>
            {title && (
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-forest-900 flex items-center gap-2">
                <PackageCheck className="w-6 h-6 text-forest-700 shrink-0" />
                <span>{title}</span>
              </h2>
            )}
            {subtitle && (
              <p className="text-typography-secondary text-xs sm:text-sm mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <div className="text-xs text-typography-muted font-medium">
            Showing <strong className="text-forest-700">{startIndex + 1}–{endIndex}</strong> of <strong className="text-forest-900">{products.length}</strong> products
          </div>
        </div>
      )}

      {/* 2-Column Mobile & Responsive Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {paginatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-surface-border/80">
          <div className="text-xs text-typography-secondary font-medium">
            Page <strong className="text-forest-900">{currentPage}</strong> of <strong className="text-forest-900">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* Previous Page Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-xl bg-surface-white border border-surface-border text-forest-900 text-xs font-bold hover:bg-forest-700 hover:text-white hover:border-forest-700 disabled:opacity-40 disabled:hover:bg-surface-white disabled:hover:text-forest-900 disabled:hover:border-surface-border disabled:cursor-not-allowed transition-all button-press flex items-center gap-1 shadow-sm"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-9 h-9 rounded-xl text-xs font-bold border transition-all button-press flex items-center justify-center ${
                  currentPage === pageNum
                    ? 'bg-forest-700 text-white border-forest-700 shadow-md'
                    : 'bg-surface-white border-surface-border text-forest-900 hover:bg-surface-cream hover:border-forest-700 shadow-sm'
                }`}
              >
                {pageNum}
              </button>
            ))}

            {/* Next Page Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-xl bg-surface-white border border-surface-border text-forest-900 text-xs font-bold hover:bg-forest-700 hover:text-white hover:border-forest-700 disabled:opacity-40 disabled:hover:bg-surface-white disabled:hover:text-forest-900 disabled:hover:border-surface-border disabled:cursor-not-allowed transition-all button-press flex items-center gap-1 shadow-sm"
              aria-label="Next Page"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
