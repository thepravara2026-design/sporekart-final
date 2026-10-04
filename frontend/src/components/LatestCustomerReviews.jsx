import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, CheckCircle2, Quote, ArrowRight, X, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import StarRatingInput from './StarRatingInput';
import { reviewApi } from '../api';

export default function LatestCustomerReviews() {
  const [latestReviews, setLatestReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // All Reviews Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allReviews, setAllReviews] = useState([]);
  const [modalPage, setModalPage] = useState(0);
  const [modalTotalPages, setModalTotalPages] = useState(0);
  const [modalTotalElements, setModalTotalElements] = useState(0);
  const [isModalLoading, setIsModalLoading] = useState(false);

  useEffect(() => {
    reviewApi
      .getLatestReviews(5)
      .then((res) => {
        setLatestReviews(res.data?.data || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const fetchAllReviews = (pageNumber) => {
    setIsModalLoading(true);
    reviewApi
      .getAllPublishedReviews(pageNumber, 6)
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setAllReviews(data.content || []);
          setModalTotalPages(data.totalPages || 0);
          setModalTotalElements(data.totalElements || 0);
          setModalPage(data.number || 0);
        }
      })
      .catch(() => {})
      .finally(() => setIsModalLoading(false));
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    fetchAllReviews(0);
  };

  if (!isLoading && latestReviews.length === 0) {
    return null; // Gracefully hide section if no reviews published yet
  }

  return (
    <section className="py-16 bg-surface-cream/70 border-y border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold rounded-full text-xs uppercase tracking-wider">
            Authentic Feedback
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-900 tracking-tight">
            Loved by Our Customers
          </h2>
          <p className="text-sm text-typography-secondary leading-relaxed">
            Real experiences from customers who have grown, cooked, and explored with Sporekart.
          </p>
        </div>

        {/* Reviews Cards Carousel / Grid */}
        <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 gap-4 sm:gap-6 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          {latestReviews.map((rev) => (
            <div
              key={rev.id}
              className="w-[270px] sm:w-[310px] md:w-auto shrink-0 snap-start bg-surface-white rounded-3xl p-5 sm:p-6 border border-surface-border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-4">
                {/* Product Card Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-surface-border">
                  <img
                    src={rev.primaryImageUrl || rev.productImageFallback || '/images/placeholder-product.jpg'}
                    alt={rev.productTitle}
                    className="w-14 h-14 object-cover rounded-2xl border border-surface-border bg-surface-cream group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={rev.productSlug ? `/product/${rev.productSlug}` : '/products'}
                      className="font-bold text-sm text-forest-900 hover:text-forest-700 line-clamp-1 flex items-center gap-1"
                    >
                      <span>{rev.productTitle}</span>
                      <ArrowRight className="w-3 h-3 text-forest-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>
                    {rev.variantName && (
                      <span className="text-[11px] text-typography-secondary block truncate">
                        {rev.variantName}
                      </span>
                    )}
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRatingInput value={rev.rating} readOnly size="sm" showLabel={false} />
                      <span className="text-xs font-bold text-amber-700 ml-1 font-mono">
                        {rev.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                <div className="relative pt-1">
                  <Quote className="w-8 h-8 text-forest-900/10 absolute -top-3 -left-2 rotate-180" />
                  {rev.reviewTitle && (
                    <h4 className="font-bold text-xs text-typography-primary mb-1">
                      "{rev.reviewTitle}"
                    </h4>
                  )}
                  <p className="text-xs text-typography-secondary leading-relaxed line-clamp-4 relative z-10 italic">
                    "{rev.reviewText}"
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-forest-950">{rev.customerName}</div>
                  {rev.isVerifiedPurchase && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Purchase
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-mono text-typography-muted">
                  {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* View All Reviews CTA Button */}
        <div className="text-center pt-4">
          <button
            onClick={handleOpenModal}
            className="btn-secondary font-bold text-xs px-6 py-3 rounded-full border border-forest-900/20 hover:border-forest-900 hover:bg-forest-900 hover:text-white transition-all shadow-sm inline-flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>View All Customer Reviews</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ALL REVIEWS PAGINATED MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-typography-primary/45 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-white rounded-card border border-surface-border max-w-4xl w-full max-h-[85vh] flex flex-col shadow-level-3 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-surface-border flex items-center justify-between bg-surface-cream/50">
              <div>
                <h3 className="text-xl font-bold font-display text-forest-900 flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  <span>All Customer Reviews & Ratings</span>
                </h3>
                <p className="text-xs text-typography-secondary mt-0.5 font-mono">
                  Showing {modalTotalElements} verified customer reviews
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-typography-muted hover:text-typography-primary hover:bg-surface-border rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Reviews List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {isModalLoading ? (
                <div className="py-12 text-center text-xs text-typography-muted animate-pulse">
                  Loading reviews...
                </div>
              ) : allReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-surface-cream/50 p-4 rounded-2xl border border-surface-border space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={rev.primaryImageUrl || rev.productImageFallback || '/images/placeholder-product.jpg'}
                            alt={rev.productTitle}
                            className="w-12 h-12 object-cover rounded-xl border border-surface-border bg-white"
                          />
                          <div className="min-w-0 flex-1">
                            <Link
                              to={rev.productSlug ? `/product/${rev.productSlug}` : '/products'}
                              onClick={() => setIsModalOpen(false)}
                              className="font-bold text-xs text-forest-900 hover:underline line-clamp-1"
                            >
                              {rev.productTitle}
                            </Link>
                            <div className="flex items-center gap-1 mt-0.5">
                              <StarRatingInput value={rev.rating} readOnly size="sm" showLabel={false} />
                              <span className="text-[11px] font-bold text-amber-700 ml-1 font-mono">
                                {rev.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {rev.reviewTitle && (
                          <h4 className="font-bold text-xs text-typography-primary">{rev.reviewTitle}</h4>
                        )}
                        <p className="text-xs text-typography-secondary leading-relaxed line-clamp-3 italic">
                          "{rev.reviewText}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-forest-950">{rev.customerName}</span>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-0.5 ml-2 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-typography-muted text-[10px]">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-typography-muted">
                  No published reviews found.
                </div>
              )}
            </div>

            {/* Modal Footer - Pagination Controls */}
            {modalTotalPages > 1 && (
              <div className="p-4 border-t border-surface-border bg-surface-cream/50 flex items-center justify-between">
                <button
                  disabled={modalPage === 0 || isModalLoading}
                  onClick={() => fetchAllReviews(modalPage - 1)}
                  className="btn-secondary text-xs font-semibold px-4 py-2 flex items-center gap-1 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-xs font-mono font-bold text-typography-secondary">
                  Page {modalPage + 1} of {modalTotalPages}
                </span>
                <button
                  disabled={modalPage + 1 >= modalTotalPages || isModalLoading}
                  onClick={() => fetchAllReviews(modalPage + 1)}
                  className="btn-secondary text-xs font-semibold px-4 py-2 flex items-center gap-1 disabled:opacity-50"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
