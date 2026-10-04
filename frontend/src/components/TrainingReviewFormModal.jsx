import React, { useState } from 'react';
import { X, Award, CheckCircle, GraduationCap, AlertCircle, Loader2, Sparkles, UserCheck } from 'lucide-react';
import StarRatingInput from './StarRatingInput';
import { trainingApi } from '../api';

export default function TrainingReviewFormModal({ item, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [instructorRating, setInstructorRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      setError('Please select a overall course rating.');
      return;
    }
    if (!reviewText.trim()) {
      setError('Please share your detailed feedback for the masterclass.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await trainingApi.createReview({
        enrollmentId: item.enrollmentId,
        rating,
        instructorRating,
        reviewTitle: reviewTitle.trim() || undefined,
        reviewText: reviewText.trim(),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit review. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white hover:bg-emerald-800/50 rounded-full p-1.5 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold tracking-wider uppercase mb-1">
            <GraduationCap className="w-4 h-4" /> Verified Trainee Masterclass Review
          </div>
          <h2 className="text-xl font-bold leading-tight text-white">
            {item.courseTitle || 'Mushroom Cultivation Masterclass'}
          </h2>
          {item.batchCode && (
            <p className="text-xs text-emerald-200 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              Batch: <span className="font-semibold">{item.batchCode}</span>
            </p>
          )}
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Overall Rating */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              Overall Course Experience <span className="text-rose-500">*</span>
            </label>
            <StarRatingInput
              value={rating}
              onChange={setRating}
              size="lg"
              showLabel={true}
            />
          </div>

          {/* Instructor Rating */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              Instructor & Live Mentorship Rating <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <StarRatingInput
              value={instructorRating}
              onChange={setInstructorRating}
              size="md"
              showLabel={true}
            />
          </div>

          {/* Review Title */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <label htmlFor="reviewTitle" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Headline / Summary Title
            </label>
            <input
              id="reviewTitle"
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="e.g., Incredible practical insights! Best cultivation workshop ever."
              maxLength={150}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          {/* Detailed Feedback Text */}
          <div className="space-y-1">
            <label htmlFor="reviewText" className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              Detailed Trainee Feedback <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="reviewText"
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share what you learned, the practical hands-on experience, quality of course materials, and trainer support..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition resize-none"
            />
            <p className="text-[11px] text-slate-400 text-right">
              {reviewText.length} characters
            </p>
          </div>

          {/* Verified Badge Note */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Your feedback will feature a <strong className="text-emerald-900 font-semibold">Verified Trainee</strong> badge to help future mushroom enthusiasts.
            </span>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Submit Masterclass Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
