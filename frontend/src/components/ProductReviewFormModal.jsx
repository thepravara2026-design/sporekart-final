import React, { useState } from 'react';
import { X, Star, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import StarRatingInput from './StarRatingInput';
import ReviewImageUploader from './ReviewImageUploader';
import { reviewApi } from '../api';

export default function ProductReviewFormModal({ item, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!rating || rating < 1 || rating > 5) {
      setErrorMsg('Please select a star rating between 1 and 5.');
      return;
    }

    if (!reviewText.trim() || reviewText.trim().length < 10) {
      setErrorMsg('Please provide a written review of at least 10 characters.');
      return;
    }

    if (reviewText.trim().length > 2000) {
      setErrorMsg('Review text must not exceed 2000 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        orderId: item.orderId,
        orderItemId: item.orderItemId,
        rating,
        reviewTitle: reviewTitle.trim() || null,
        reviewText: reviewText.trim(),
        imageUrls: imageUrls.length > 0 ? imageUrls : null,
      };

      await reviewApi.createReview(payload);
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to submit review. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-surface-white rounded-3xl shadow-2xl border border-surface-border overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-cream border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-forest-900 font-bold text-base">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            <span>Write a Verified Product Review</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-typography-muted hover:text-typography-primary rounded-full hover:bg-surface-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-forest-900">Thank You for Your Review!</h3>
            <p className="text-xs text-typography-secondary max-w-sm mx-auto leading-relaxed">
              Your feedback helps fellow mushroom growers and enthusiasts make confident choices on Sporekart.
            </p>
            <button
              onClick={onClose}
              className="btn-primary text-xs font-bold px-6 py-2.5 rounded-xl"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Delivered Product Preview */}
            <div className="flex items-center gap-4 p-3 bg-surface-cream/60 rounded-2xl border border-surface-border">
              <img
                src={item.productImage || item.primaryImageUrl || '/images/placeholder-product.jpg'}
                alt={item.productTitle}
                className="w-16 h-16 object-cover rounded-xl border border-surface-border bg-white"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-typography-primary truncate">
                  {item.productTitle}
                </h4>
                {item.variantName && (
                  <p className="text-xs text-typography-secondary">
                    Variant: {item.variantName}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-[11px] text-typography-muted font-mono">
                  <span>Order #{item.orderNumber}</span>
                  {item.quantity && <span>Qty: {item.quantity}</span>}
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Star Rating Section */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-typography-primary">
                Overall Rating <span className="text-red-500">*</span>
              </label>
              <StarRatingInput value={rating} onChange={setRating} size="lg" />
            </div>

            {/* Optional Title */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-typography-primary">
                Review Headline <span className="text-typography-muted font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Fresh yield, easy cultivation kit!"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                maxLength={100}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-surface-border focus:ring-2 focus:ring-forest-500 focus:outline-none"
              />
            </div>

            {/* Review Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-typography-primary">
                  How was your experience with this product? <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-typography-muted font-mono">
                  {reviewText.trim().length} / 2000
                </span>
              </div>
              <textarea
                rows={4}
                required
                placeholder="Describe product quality, freshness, packaging, pinhead growth speed, or overall experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={2000}
                className="w-full p-3 text-xs rounded-xl border border-surface-border focus:ring-2 focus:ring-forest-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Customer Photo Upload */}
            <ReviewImageUploader images={imageUrls} onChange={setImageUrls} />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn-secondary text-xs font-bold px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-xs font-bold px-6 py-2.5 flex items-center gap-2 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 fill-amber-300 text-amber-300" /> Submit Verified Review
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
