import React, { useState, useEffect } from 'react';
import { Star, PackageCheck, Clock, Edit3, GraduationCap, Award, UserCheck, MessageSquarePlus } from 'lucide-react';
import StarRatingInput from './StarRatingInput';
import TrainingReviewFormModal from './TrainingReviewFormModal';
import { reviewApi, trainingApi } from '../api';

export default function MyReviewsTab({ onOpenReviewModal }) {
  const [reviewType, setReviewType] = useState('products'); // 'products' | 'training'
  const [activeSubTab, setActiveSubTab] = useState('submitted'); // 'submitted' | 'pending'
  
  // Product Reviews State
  const [submittedProductReviews, setSubmittedProductReviews] = useState([]);
  const [pendingProductReviews, setPendingProductReviews] = useState([]);
  
  // Training Reviews State
  const [submittedTrainingReviews, setSubmittedTrainingReviews] = useState([]);
  const [pendingTrainingReviews, setPendingTrainingReviews] = useState([]);
  const [selectedTrainingItem, setSelectedTrainingItem] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllReviewsData();
  }, []);

  const loadAllReviewsData = () => {
    setIsLoading(true);

    Promise.all([
      reviewApi.getCustomerReviews(0, 20),
      reviewApi.getPendingReviews(),
      trainingApi.getMyReviews(),
      trainingApi.getPendingReviews(),
    ])
      .then(([prodSubmittedRes, prodPendingRes, trainSubmittedRes, trainPendingRes]) => {
        setSubmittedProductReviews(prodSubmittedRes.data?.data?.content || []);
        setPendingProductReviews(prodPendingRes.data?.data || []);
        setSubmittedTrainingReviews(trainSubmittedRes.data?.data || []);
        setPendingTrainingReviews(trainPendingRes.data?.data || []);
      })
      .catch((err) => console.error('Error loading reviews:', err))
      .finally(() => setIsLoading(false));
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Published</span>;
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Under Review</span>;
      case 'HIDDEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">Hidden</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Category Switcher (Products vs Training) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h3 className="text-xl font-extrabold text-forest-900 flex items-center gap-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            <span>Ratings & Reviews</span>
          </h3>
          <p className="text-xs text-typography-secondary">
            Share authentic feedback for your purchased products and completed masterclasses.
          </p>
        </div>

        {/* Primary Type Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setReviewType('products'); setActiveSubTab('submitted'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              reviewType === 'products'
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-4 h-4 text-emerald-600" /> Product Reviews
          </button>

          <button
            onClick={() => { setReviewType('training'); setActiveSubTab('submitted'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              reviewType === 'training'
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" /> Workshop & Training
            {pendingTrainingReviews.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>
      </div>

      {/* Subtabs Header */}
      <div className="flex items-center justify-between gap-2 bg-surface-cream p-1.5 rounded-xl border border-surface-border">
        <span className="text-xs font-bold text-slate-500 px-2">
          {reviewType === 'products' ? 'Product Items' : 'Training Enrollments'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('submitted')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'submitted'
                ? 'bg-surface-white text-forest-900 shadow-sm'
                : 'text-typography-secondary hover:text-typography-primary'
            }`}
          >
            Submitted ({reviewType === 'products' ? submittedProductReviews.length : submittedTrainingReviews.length})
          </button>
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'pending'
                ? 'bg-surface-white text-forest-900 shadow-sm'
                : 'text-typography-secondary hover:text-typography-primary'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending ({reviewType === 'products' ? pendingProductReviews.length : pendingTrainingReviews.length})</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-typography-muted">Loading ratings & reviews...</div>
      ) : reviewType === 'products' ? (
        /* PRODUCT REVIEWS VIEW */
        activeSubTab === 'submitted' ? (
          submittedProductReviews.length > 0 ? (
            <div className="space-y-4">
              {submittedProductReviews.map((rev) => (
                <div key={rev.id} className="p-5 bg-surface-white rounded-2xl border border-surface-border space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.primaryImageUrl || rev.productImageFallback || '/images/placeholder-product.jpg'}
                        alt={rev.productTitle}
                        className="w-12 h-12 object-cover rounded-xl border border-surface-border"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-typography-primary">{rev.productTitle}</h4>
                        <p className="text-[11px] text-typography-muted font-mono">Order #{rev.orderNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {statusBadge(rev.status)}
                      <span className="text-[11px] text-typography-muted font-mono">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-surface-border space-y-1.5">
                    <StarRatingInput value={rev.rating} readOnly size="sm" showLabel={false} />
                    {rev.reviewTitle && <h5 className="font-bold text-xs text-typography-primary">{rev.reviewTitle}</h5>}
                    <p className="text-xs text-typography-secondary leading-relaxed whitespace-pre-line">{rev.reviewText}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-cream/50 rounded-2xl border border-surface-border space-y-2">
              <Star className="w-8 h-8 text-typography-muted mx-auto opacity-50" />
              <h4 className="text-sm font-bold text-typography-primary">No submitted product reviews yet</h4>
              <p className="text-xs text-typography-secondary">When your orders arrive, write a review to help other mushroom enthusiasts!</p>
            </div>
          )
        ) : (
          pendingProductReviews.length > 0 ? (
            <div className="space-y-3">
              {pendingProductReviews.map((item) => (
                <div key={item.orderItemId} className="p-4 bg-surface-white rounded-2xl border border-surface-border flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.productImage || '/images/placeholder-product.jpg'} alt={item.productTitle} className="w-14 h-14 object-cover rounded-xl border border-surface-border shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-typography-primary truncate">{item.productTitle}</h4>
                      {item.variantName && <p className="text-xs text-typography-secondary truncate">Variant: {item.variantName}</p>}
                      <p className="text-[11px] text-typography-muted font-mono">Order #{item.orderNumber}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenReviewModal?.(item)}
                    className="btn-primary text-xs font-bold px-4 py-2 shrink-0 flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Write Review
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-cream/50 rounded-2xl border border-surface-border space-y-2">
              <PackageCheck className="w-8 h-8 text-typography-muted mx-auto opacity-50" />
              <h4 className="text-sm font-bold text-typography-primary">No pending product reviews</h4>
            </div>
          )
        )
      ) : (
        /* TRAINING REVIEWS VIEW */
        activeSubTab === 'submitted' ? (
          submittedTrainingReviews.length > 0 ? (
            <div className="space-y-4">
              {submittedTrainingReviews.map((rev) => (
                <div key={rev.id} className="p-5 bg-surface-white rounded-2xl border border-surface-border space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-bold text-sm text-typography-primary">{rev.courseTitle}</h4>
                        {rev.isVerifiedTrainee && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <UserCheck className="w-3 h-3 text-emerald-600" /> Verified Trainee
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-typography-muted font-mono mt-0.5">Batch: {rev.batchCode}</p>
                    </div>

                    <div className="text-right">
                      <StarRatingInput value={rev.rating} readOnly size="sm" showLabel={false} />
                      <span className="text-[11px] text-typography-muted font-mono block mt-0.5">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-surface-border space-y-1.5">
                    {rev.reviewTitle && <h5 className="font-bold text-xs text-typography-primary">{rev.reviewTitle}</h5>}
                    <p className="text-xs text-typography-secondary leading-relaxed whitespace-pre-line">{rev.reviewText}</p>
                    
                    {rev.instructorRating && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> Instructor Score:
                        <StarRatingInput value={rev.instructorRating} readOnly size="sm" showLabel={false} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-cream/50 rounded-2xl border border-surface-border space-y-2">
              <GraduationCap className="w-8 h-8 text-typography-muted mx-auto opacity-50" />
              <h4 className="text-sm font-bold text-typography-primary">No submitted training reviews</h4>
              <p className="text-xs text-typography-secondary">
                Reviews you submit for attended workshops will appear here.
              </p>
            </div>
          )
        ) : (
          pendingTrainingReviews.length > 0 ? (
            <div className="space-y-3">
              {pendingTrainingReviews.map((item) => (
                <div key={item.enrollmentId} className="p-4 bg-surface-white rounded-2xl border border-surface-border flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-typography-primary truncate">{item.courseTitle}</h4>
                      <p className="text-xs text-emerald-700 font-medium">Batch: {item.batchCode}</p>
                      <p className="text-[11px] text-typography-muted">Enrolled: {new Date(item.enrolledAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTrainingItem(item)}
                    className="btn-primary text-xs font-bold px-4 py-2 shrink-0 flex items-center gap-1.5"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" /> Rate Masterclass
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-cream/50 rounded-2xl border border-surface-border space-y-2">
              <PackageCheck className="w-8 h-8 text-typography-muted mx-auto opacity-50" />
              <h4 className="text-sm font-bold text-typography-primary">No pending training reviews</h4>
              <p className="text-xs text-typography-secondary">
                All your course enrollments have been reviewed or none are pending right now.
              </p>
            </div>
          )
        )
      )}

      {/* Training Review Modal */}
      {selectedTrainingItem && (
        <TrainingReviewFormModal
          item={selectedTrainingItem}
          onClose={() => setSelectedTrainingItem(null)}
          onSuccess={loadAllReviewsData}
        />
      )}
    </div>
  );
}
