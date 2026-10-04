import React, { useState, useEffect } from 'react';
import { X, Star, PackageCheck, ChevronRight } from 'lucide-react';
import { reviewApi } from '../api';

export default function ReviewInvitationModal({ user, onWriteReview }) {
  const [pendingItems, setPendingItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check session storage so we don't show the modal on every single route change in a single session if dismissed
    const hasDismissedSession = sessionStorage.getItem('sporekart_review_invitation_dismissed');
    if (hasDismissedSession === 'true') return;

    reviewApi
      .getPendingReviews()
      .then((res) => {
        const items = res.data?.data || [];
        if (items.length > 0) {
          setPendingItems(items);
          setIsOpen(true);
        }
      })
      .catch((err) => {
        // Silent catch for guest or non-auth context
      });
  }, [user]);

  if (!isOpen || !pendingItems.length || currentIndex >= pendingItems.length) {
    return null;
  }

  const currentItem = pendingItems[currentIndex];

  const handleSkip = async () => {
    if (currentItem?.orderItemId) {
      try {
        await reviewApi.skipInvitation(currentItem.orderItemId);
      } catch (e) {
        // continue gracefully
      }
    }

    if (currentIndex + 1 < pendingItems.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsOpen(false);
      sessionStorage.setItem('sporekart_review_invitation_dismissed', 'true');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('sporekart_review_invitation_dismissed', 'true');
  };

  const handleStartReview = () => {
    setIsOpen(false);
    if (onWriteReview) {
      onWriteReview(currentItem);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full p-4 bg-surface-white rounded-2xl shadow-2xl border border-forest-900/15 animate-slideUp">
      <div className="relative space-y-3">
        <button
          onClick={handleClose}
          className="absolute -top-1 -right-1 p-1 text-typography-muted hover:text-typography-primary rounded-full hover:bg-surface-cream transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-forest-800 font-bold text-sm">
          <PackageCheck className="w-5 h-5 text-forest-600 shrink-0" />
          <span>Your Sporekart order has arrived!</span>
        </div>

        <p className="text-xs text-typography-secondary leading-relaxed">
          We would love to know how your purchase went. Your feedback helps other customers make informed decisions.
        </p>

        {/* Product Card */}
        <div className="flex items-center gap-3 p-2.5 bg-surface-cream rounded-xl border border-surface-border">
          <img
            src={currentItem.productImage || '/images/placeholder-product.jpg'}
            alt={currentItem.productTitle}
            className="w-12 h-12 object-cover rounded-lg shrink-0 bg-white"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-typography-primary truncate">
              {currentItem.productTitle}
            </h4>
            {currentItem.variantName && (
              <p className="text-[11px] text-typography-secondary truncate">
                Variant: {currentItem.variantName}
              </p>
            )}
            <p className="text-[10px] text-typography-muted font-mono">
              Order #{currentItem.orderNumber}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-typography-secondary hover:text-typography-primary font-medium px-2 py-1.5"
          >
            Skip for Now
          </button>

          <button
            type="button"
            onClick={handleStartReview}
            className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-sm"
          >
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>Write a Review</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingItems.length > 1 && (
          <div className="text-[10px] text-center text-typography-muted font-medium">
            Pending Item {currentIndex + 1} of {pendingItems.length}
          </div>
        )}
      </div>
    </div>
  );
}
