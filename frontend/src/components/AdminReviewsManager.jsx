import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Search, Filter, Shield, Eye, ThumbsUp, EyeOff, XCircle, AlertCircle, Loader2, X, Image as ImageIcon } from 'lucide-react';
import StarRatingInput from './StarRatingInput';
import { reviewApi } from '../api';

export default function AdminReviewsManager() {
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail / Moderation Modal State
  const [selectedReview, setSelectedReview] = useState(null);
  const [moderationReason, setModerationReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadSummary();
    loadReviews(0);
  }, [statusFilter, ratingFilter]);

  const loadSummary = () => {
    reviewApi
      .getAdminReviewSummary()
      .then((res) => setSummary(res.data?.data))
      .catch(() => {});
  };

  const loadReviews = (pageNumber) => {
    setIsLoading(true);
    const params = {
      page: pageNumber,
      size: 15,
    };
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (ratingFilter !== 'ALL') params.rating = Number(ratingFilter);
    if (searchQuery.trim()) params.q = searchQuery.trim();

    reviewApi
      .getAdminReviews(params)
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReviews(0);
  };

  const handleModerate = async (newStatus) => {
    if (!selectedReview) return;
    setIsActionLoading(true);
    setErrorMsg('');

    try {
      const res = await reviewApi.moderateReview(selectedReview.id, newStatus, moderationReason);
      const updated = res.data?.data;
      if (updated) {
        setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setSelectedReview(null);
        setModerationReason('');
        loadSummary();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update review moderation status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">PUBLISHED</span>;
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">PENDING</span>;
      case 'HIDDEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">HIDDEN</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">REJECTED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            <span>Product Reviews & Moderation</span>
          </h2>
          <p className="text-xs text-typography-secondary">
            Inspect verified customer feedback, manage publication status, and moderate product ratings.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-surface-cream rounded-2xl border border-surface-border text-center">
          <div className="text-xs text-typography-muted font-medium">Total Reviews</div>
          <div className="text-xl font-black text-forest-900 mt-1 font-mono">{summary?.totalReviews || 0}</div>
        </div>

        <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-center">
          <div className="text-xs text-amber-800 font-medium">Pending Moderation</div>
          <div className="text-xl font-black text-amber-900 mt-1 font-mono">{summary?.pendingCount || 0}</div>
        </div>

        <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 text-center">
          <div className="text-xs text-emerald-800 font-medium">Published</div>
          <div className="text-xl font-black text-emerald-900 mt-1 font-mono">{summary?.publishedCount || 0}</div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
          <div className="text-xs text-slate-700 font-medium">Hidden</div>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">{summary?.hiddenCount || 0}</div>
        </div>

        <div className="p-3.5 bg-red-50/60 rounded-2xl border border-red-200/80 text-center">
          <div className="text-xs text-red-800 font-medium">Rejected</div>
          <div className="text-xl font-black text-red-900 mt-1 font-mono">{summary?.rejectedCount || 0}</div>
        </div>

        <div className="p-3.5 bg-amber-100/50 rounded-2xl border border-amber-300/80 text-center">
          <div className="text-xs text-amber-900 font-medium">Avg Rating</div>
          <div className="text-xl font-black text-amber-900 mt-1 font-mono">
            {summary?.averageRating ? summary.averageRating.toFixed(1) : '0.0'} ★
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-white p-4 rounded-2xl border border-surface-border">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-typography-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search review text or headline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-surface-border focus:ring-2 focus:ring-forest-500 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-typography-secondary">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-surface-border bg-surface-cream font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="PENDING">Pending</option>
              <option value="HIDDEN">Hidden</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-typography-secondary">
            <span className="font-semibold">Rating:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-surface-border bg-surface-cream font-medium focus:outline-none"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-surface-white rounded-2xl border border-surface-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-cream border-b border-surface-border text-typography-secondary font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Product & Variant</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Rating</th>
                <th className="p-3.5">Review Excerpt</th>
                <th className="p-3.5">Media</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-typography-muted">
                    Loading reviews data...
                  </td>
                </tr>
              ) : reviews.length > 0 ? (
                reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-surface-cream/50 transition-colors">
                    <td className="p-3.5 max-w-[200px]">
                      <div className="font-bold text-typography-primary truncate">{rev.productTitle}</div>
                      {rev.variantName && (
                        <div className="text-[10px] text-typography-secondary truncate">{rev.variantName}</div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="font-medium text-typography-primary">{rev.customerName}</div>
                      {rev.isVerifiedPurchase && (
                        <div className="text-[9px] font-bold text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" /> Verified
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <StarRatingInput value={rev.rating} readOnly size="sm" showLabel={false} />
                    </td>

                    <td className="p-3.5 max-w-[250px]">
                      {rev.reviewTitle && (
                        <div className="font-bold text-typography-primary truncate">{rev.reviewTitle}</div>
                      )}
                      <div className="text-typography-secondary line-clamp-2 leading-tight">
                        {rev.reviewText}
                      </div>
                    </td>

                    <td className="p-3.5">
                      {rev.hasCustomerImages ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200">
                          <ImageIcon className="w-3 h-3" /> {rev.customerImages.length} Photo(s)
                        </span>
                      ) : (
                        <span className="text-typography-muted text-[10px]">None</span>
                      )}
                    </td>

                    <td className="p-3.5">{renderStatusBadge(rev.status)}</td>

                    <td className="p-3.5 font-mono text-[11px] text-typography-muted whitespace-nowrap">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedReview(rev)}
                        className="btn-secondary text-xs font-semibold px-3 py-1 flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Moderate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-typography-muted">
                    No product reviews found matching the current search & status filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-surface-cream border-t border-surface-border flex items-center justify-between">
            <span className="text-xs font-mono text-typography-secondary">
              Showing {reviews.length} of {totalElements} reviews
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => loadReviews(page - 1)}
                className="btn-secondary text-xs font-semibold px-3 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs font-mono font-bold text-typography-primary">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => loadReviews(page + 1)}
                className="btn-secondary text-xs font-semibold px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Moderation Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-lg bg-surface-white rounded-3xl shadow-2xl border border-surface-border overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-surface-cream border-b border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-forest-900">
                <Shield className="w-5 h-5 text-forest-700" />
                <span>Review Moderation Control</span>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1.5 text-typography-muted hover:text-typography-primary rounded-full hover:bg-surface-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Review Overview */}
              <div className="space-y-2 p-3.5 bg-surface-cream/50 rounded-2xl border border-surface-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-forest-900">{selectedReview.productTitle}</span>
                  {renderStatusBadge(selectedReview.status)}
                </div>

                <div className="flex items-center justify-between text-xs text-typography-secondary">
                  <span>Customer: {selectedReview.customerName}</span>
                  <StarRatingInput value={selectedReview.rating} readOnly size="sm" showLabel={false} />
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-1">
                {selectedReview.reviewTitle && (
                  <h4 className="font-bold text-xs text-typography-primary">{selectedReview.reviewTitle}</h4>
                )}
                <p className="text-xs text-typography-secondary leading-relaxed bg-surface-cream/30 p-3 rounded-xl border border-surface-border whitespace-pre-line">
                  {selectedReview.reviewText}
                </p>
              </div>

              {/* Photos */}
              {selectedReview.hasCustomerImages && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-typography-primary">Customer Uploaded Photos:</span>
                  <div className="flex items-center gap-2 overflow-x-auto pt-1">
                    {selectedReview.customerImages.map((img, i) => (
                      <img
                        key={i}
                        src={img.imageUrl}
                        alt="Customer photo"
                        className="w-16 h-16 object-cover rounded-xl border border-surface-border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Moderation Reason Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-typography-primary">
                  Moderation Note / Reason <span className="text-typography-muted font-normal">(Internal log)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Reason for approving, hiding, or rejecting this review..."
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-surface-border focus:ring-2 focus:ring-forest-500 focus:outline-none resize-none"
                />
              </div>

              {/* Moderation Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => handleModerate('PUBLISHED')}
                  className="btn-primary text-xs font-bold px-3.5 py-2 flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Approve & Publish
                </button>

                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => handleModerate('HIDDEN')}
                  className="btn-secondary text-xs font-bold px-3.5 py-2 flex items-center gap-1.5 text-slate-700"
                >
                  <EyeOff className="w-3.5 h-3.5" /> Hide Review
                </button>

                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => handleModerate('REJECTED')}
                  className="btn-secondary text-xs font-bold px-3.5 py-2 flex items-center gap-1.5 text-red-700 bg-red-50 hover:bg-red-100 border-red-200"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
