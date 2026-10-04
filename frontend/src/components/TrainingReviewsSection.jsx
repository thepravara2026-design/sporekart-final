import React, { useState, useEffect } from 'react';
import { Star, Award, CheckCircle2, GraduationCap, UserCheck, MessageSquarePlus, Filter, ThumbsUp, Sparkles, User } from 'lucide-react';
import StarRatingInput from './StarRatingInput';
import TrainingReviewFormModal from './TrainingReviewFormModal';
import { trainingApi } from '../api';

export default function TrainingReviewsSection({ courseId, pendingReviewItem, onReviewSubmitted }) {
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(0); // 0 = all
  const [showModal, setShowModal] = useState(false);

  const fetchReviewsData = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [summaryRes, reviewsRes] = await Promise.all([
        trainingApi.getCourseReviewSummary(courseId),
        trainingApi.getCourseReviews(courseId),
      ]);
      setSummary(summaryRes.data?.data || null);
      setReviews(reviewsRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load training reviews:', err);
      setError('Could not load course reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, [courseId]);

  const handleReviewSuccess = () => {
    fetchReviewsData();
    onReviewSubmitted?.();
  };

  const filteredReviews = selectedFilter === 0
    ? reviews
    : reviews.filter((r) => r.rating === selectedFilter);

  const totalReviews = summary?.totalReviews || 0;
  const avgRating = summary?.averageRating || 0;
  const avgInstructorRating = summary?.averageInstructorRating || 0;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 my-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold tracking-wider uppercase mb-1">
            <GraduationCap className="w-4 h-4 text-emerald-600" /> Authentic Trainee Ratings & Feedback
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Trainee Reviews & Workshop Ratings
          </h3>
        </div>

        {pendingReviewItem && (
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <MessageSquarePlus className="w-4 h-4" /> Review Masterclass
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm animate-pulse flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500 animate-spin" /> Loading trainee reviews...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/80 rounded-2xl p-6 border border-slate-100">
            {/* Overall Score */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <span className="text-5xl font-black text-slate-900 tracking-tight">
                {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
              </span>
              
              <div className="my-2">
                <StarRatingInput value={Math.round(avgRating)} readOnly size="md" showLabel={false} />
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Based on <strong className="text-slate-800">{totalReviews}</strong> verified trainee review{totalReviews !== 1 ? 's' : ''}
              </p>

              {avgInstructorRating > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50/60 py-1.5 rounded-lg">
                  <Award className="w-4 h-4 text-emerald-600" /> Instructor Score: {avgInstructorRating.toFixed(1)}/5
                </div>
              )}
            </div>

            {/* Rating Bars */}
            <div className="lg:col-span-8 flex flex-col justify-center space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const countKey = star === 5 ? 'fiveStarCount' : star === 4 ? 'fourStarCount' : star === 3 ? 'threeStarCount' : star === 2 ? 'twoStarCount' : 'oneStarCount';
                const count = summary?.[countKey] || 0;
                const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-slate-600 font-semibold flex items-center gap-1">
                      {star} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    </span>
                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-right text-slate-400 font-medium">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Star Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-2">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setSelectedFilter(0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedFilter === 0
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Reviews ({totalReviews})
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setSelectedFilter(star)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  selectedFilter === star
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {star} <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              </button>
            ))}
          </div>

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No reviews found for this filter</p>
              <p className="text-xs text-slate-400 mt-1">Be the first trainee to share your feedback!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {rev.reviewerName ? rev.reviewerName.charAt(0).toUpperCase() : 'T'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{rev.reviewerName}</h4>
                          {rev.isVerifiedTrainee && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                              <UserCheck className="w-3 h-3 text-emerald-600" /> Verified Trainee
                            </span>
                          )}
                        </div>
                        {rev.batchCode && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            Batch: {rev.batchCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <StarRatingInput value={rev.rating} readOnly size="sm" showLabel={false} />
                      {rev.createdAt && (
                        <span className="text-[11px] text-slate-400 block mt-1">
                          {new Date(rev.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Body */}
                  {rev.reviewTitle && (
                    <h5 className="text-sm font-bold text-slate-800 pt-1">
                      {rev.reviewTitle}
                    </h5>
                  )}
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {rev.reviewText}
                  </p>

                  {/* Instructor Rating Highlight */}
                  {rev.instructorRating && (
                    <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> Instructor Rating:
                      <StarRatingInput value={rev.instructorRating} readOnly size="sm" showLabel={false} />
                      <span className="text-slate-400 text-[11px]">({rev.instructorRating}/5)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal for Submitting Review */}
      {showModal && pendingReviewItem && (
        <TrainingReviewFormModal
          item={pendingReviewItem}
          onClose={() => setShowModal(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
