import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Image as ImageIcon, Filter, ChevronDown, MessageSquare, X } from 'lucide-react';
import StarRatingInput from './StarRatingInput';
import { reviewApi } from '../api';

export default function ProductReviewsSection({ productId, productTitle, user, onOpenReviewModal }) {
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedStarFilter, setSelectedStarFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageModal, setActiveImageModal] = useState(null); // { images, activeIndex }

  useEffect(() => {
    if (!productId) return;

    setIsLoading(true);

    // Fetch Summary
    reviewApi
      .getProductReviewSummary(productId)
      .then((res) => {
        setSummary(res.data?.data);
      })
      .catch(() => {});

    // Fetch Reviews
    fetchReviews(0);
  }, [productId]);

  const fetchReviews = (pageNumber) => {
    reviewApi
      .getProductReviews(productId, pageNumber, 10)
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setReviews(data.content || []);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
          setPage(data.number || 0);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  const filteredReviews = reviews.filter((r) => {
    if (selectedStarFilter === 'ALL') return true;
    return r.rating === Number(selectedStarFilter);
  });

  const ratingDistribution = summary?.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalReviewsCount = summary?.totalReviews || totalElements || 0;

  return (
    <section id="reviews-section" className="py-8 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h3 className="text-2xl font-bold text-forest-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-forest-700" />
            <span>Customer Ratings & Reviews</span>
          </h3>
          <p className="text-xs text-typography-secondary mt-1">
            Real feedback from verified purchasers who have cultivated or used this product.
          </p>
        </div>

        {user && onOpenReviewModal && (
          <button
            onClick={onOpenReviewModal}
            className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-sm"
          >
            <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>Write a Review</span>
          </button>
        )}
      </div>

      {/* Summary Card & Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-cream p-6 rounded-3xl border border-surface-border">
        {/* Average Rating Breakdown */}
        <div className="flex flex-col items-center justify-center text-center p-4 bg-surface-white rounded-2xl border border-surface-border space-y-2">
          <div className="text-4xl font-extrabold text-forest-900 font-mono">
            {summary?.averageRating ? summary.averageRating.toFixed(1) : '0.0'}
          </div>
          <StarRatingInput value={Math.round(summary?.averageRating || 0)} readOnly size="md" showLabel={false} />
          <div className="text-xs text-typography-secondary font-medium">
            Based on {totalReviewsCount} published {totalReviewsCount === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        {/* Rating Bars (5 to 1 Star) */}
        <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star] || 0;
            const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-right font-bold text-typography-primary flex items-center justify-end gap-1">
                  {star} <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                </span>

                <div className="flex-1 h-2.5 bg-surface-white rounded-full overflow-hidden border border-surface-border">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-12 text-typography-muted font-mono text-[11px]">
                  {count} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-typography-secondary flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-forest-700" /> Filter:
          </span>
          {['ALL', '5', '4', '3', '2', '1'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStarFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedStarFilter === st
                  ? 'bg-forest-900 text-white shadow-sm'
                  : 'bg-surface-cream text-typography-secondary hover:bg-surface-border'
              }`}
            >
              {st === 'ALL' ? 'All Ratings' : `${st} Stars`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4 py-8 text-center">
          <div className="animate-pulse text-xs text-typography-muted">Loading customer reviews...</div>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 bg-surface-white rounded-2xl border border-surface-border shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-forest-900">{rev.customerName}</span>
                    {rev.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <StarRatingInput value={rev.rating} readOnly size="sm" showLabel={false} />
                </div>

                <span className="text-[11px] text-typography-muted font-mono">
                  {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {rev.reviewTitle && (
                <h4 className="font-bold text-sm text-typography-primary">{rev.reviewTitle}</h4>
              )}

              <p className="text-xs text-typography-secondary leading-relaxed whitespace-pre-line">
                {rev.reviewText}
              </p>

              {/* Customer Photos or Fallback Presentation */}
              {rev.hasCustomerImages && rev.customerImages?.length > 0 ? (
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-typography-secondary mb-1.5 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-forest-700" /> Customer Uploaded Photos ({rev.customerImages.length})
                  </div>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {rev.customerImages.map((img, idx) => (
                      <img
                        key={img.id || idx}
                        src={img.imageUrl}
                        alt="Customer feedback photo"
                        onClick={() => setActiveImageModal({ images: rev.customerImages, activeIndex: idx })}
                        className="w-16 h-16 object-cover rounded-xl border border-surface-border cursor-pointer hover:scale-105 transition-transform"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page === 0}
                onClick={() => fetchReviews(page - 1)}
                className="btn-secondary text-xs font-semibold px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs font-mono text-typography-secondary">
                Page {page + 1} of {totalPages}
              </span>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => fetchReviews(page + 1)}
                className="btn-secondary text-xs font-semibold px-3 py-1.5 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-surface-cream/50 rounded-2xl border border-surface-border space-y-2">
          <Star className="w-8 h-8 text-typography-muted mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-typography-primary">No published reviews for this filter</h4>
          <p className="text-xs text-typography-secondary">Be the first verified customer to share your experience!</p>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {activeImageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-surface-white rounded-3xl overflow-hidden p-4 space-y-3">
            <button
              onClick={() => setActiveImageModal(null)}
              className="absolute top-3 right-3 p-2 text-white bg-black/60 rounded-full hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-96 bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              <img
                src={activeImageModal.images[activeImageModal.activeIndex]?.imageUrl}
                alt="Enlarged review photo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-center gap-2 overflow-x-auto">
              {activeImageModal.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.imageUrl}
                  alt="thumbnail"
                  onClick={() => setActiveImageModal({ ...activeImageModal, activeIndex: idx })}
                  className={`w-12 h-12 object-cover rounded-lg cursor-pointer border-2 ${
                    activeImageModal.activeIndex === idx ? 'border-forest-700 scale-105' : 'border-transparent opacity-70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
