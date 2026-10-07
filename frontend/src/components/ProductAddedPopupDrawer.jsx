import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  ShoppingBag, 
  ArrowRight, 
  X, 
  Plus, 
  Minus, 
  Truck, 
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import MediaImage from './MediaImage';

export default function ProductAddedPopupDrawer() {
  const { 
    cart, 
    addedProductPopup, 
    closePopupDrawer, 
    openDrawer, 
    updateQuantity, 
    loading 
  } = useCart();
  
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const remainingTimeRef = useRef(5500); // 5.5 seconds total

  // Manage auto-dismiss countdown timer
  useEffect(() => {
    if (!addedProductPopup) {
      setProgress(100);
      remainingTimeRef.current = 5500;
      return;
    }

    if (isPaused) return;

    startTimeRef.current = Date.now();
    const duration = remainingTimeRef.current;

    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTimeRef.current;
      const newRemaining = duration - elapsedTime;
      remainingTimeRef.current = Math.max(0, newRemaining);

      const percent = (remainingTimeRef.current / 5500) * 100;
      setProgress(percent);

      if (remainingTimeRef.current <= 0) {
        clearInterval(interval);
        closePopupDrawer();
      }
    }, 50);

    timerRef.current = interval;

    return () => {
      clearInterval(timerRef.current);
    };
  }, [addedProductPopup, isPaused, closePopupDrawer]);

  if (!addedProductPopup) return null;

  const { item, quantityAdded } = addedProductPopup;

  if (!item) return null;

  const freeDeliveryThreshold = 999;
  const currentTotal = cart.subtotalInr || 0;
  const neededForFreeShipping = freeDeliveryThreshold - currentTotal;
  const deliveryProgress = Math.min(100, Math.round((currentTotal / freeDeliveryThreshold) * 100));

  const handleCheckout = () => {
    closePopupDrawer();
    navigate('/checkout');
  };

  const handleViewFullCart = () => {
    closePopupDrawer();
    openDrawer();
  };

  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-full max-w-sm sm:max-w-md px-3 sm:px-0 animate-slide-in-right"
      role="dialog"
      aria-label="Product Added to Cart Popup"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Outer Floating Glass Card */}
      <div className="relative bg-surface-white/95 backdrop-blur-xl border border-forest-700/25 rounded-2xl shadow-2xl overflow-hidden glow-card">
        
        {/* Top Progress Countdown Bar */}
        <div className="w-full h-1 bg-surface-neutral overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-forest-600 to-emerald-600 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card Content Container */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-300/60 flex items-center justify-center shrink-0 shadow-sm animate-scale-in">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-sm font-display font-extrabold text-forest-900 flex items-center gap-1.5">
                  Added to Basket!
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-900/10 text-forest-800 font-sans font-bold">
                    {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </h3>
                <p className="text-[11px] text-typography-secondary font-medium">
                  {isPaused ? 'Timer paused' : 'Auto-dismissing...'}
                </p>
              </div>
            </div>

            <button
              onClick={closePopupDrawer}
              aria-label="Close notification"
              className="p-1.5 rounded-lg text-typography-muted hover:text-forest-900 hover:bg-surface-neutral transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Product Info Box */}
          <div className="p-3 rounded-xl bg-surface-cream/80 border border-surface-border flex gap-3 items-center group">
            {/* Product Thumbnail */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-white border border-surface-border shrink-0 relative">
              <MediaImage
                src={item.imageUrl}
                alt={item.productTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Title, Variant & Pricing */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-forest-900 truncate">
                {item.productTitle}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-forest-700 font-semibold bg-forest-700/10 px-1.5 py-0.5 rounded">
                  {item.variantName}
                </span>
                {quantityAdded && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                    +{quantityAdded} added
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-extrabold text-forest-900">
                  ₹{item.unitPriceInr} <span className="text-[10px] text-typography-muted font-normal">/ unit</span>
                </span>

                {/* Inline Quick Quantity Tweaker */}
                <div className="flex items-center gap-1.5 bg-surface-white border border-surface-border rounded-lg px-2 py-0.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    disabled={loading || item.quantity <= 1}
                    className="text-typography-secondary hover:text-forest-900 disabled:opacity-30 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-forest-900 px-1">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    disabled={loading || item.quantity >= item.availableStock}
                    className="text-typography-secondary hover:text-forest-900 disabled:opacity-30 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Progress Bar inside Popup */}
          <div className="px-3 py-2 rounded-xl bg-surface-white border border-surface-border/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-typography-secondary flex items-center gap-1.5 font-medium">
                <Truck className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                {neededForFreeShipping <= 0 ? (
                  <strong className="text-emerald-700 font-bold">Free Express Delivery Unlocked! 🎉</strong>
                ) : (
                  <span>Add <strong className="text-forest-900">₹{neededForFreeShipping}</strong> for Free Delivery</span>
                )}
              </span>
              <span className="text-forest-800 font-bold">{deliveryProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-neutral rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${deliveryProgress}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleViewFullCart}
              className="w-full py-2.5 px-3 rounded-xl border border-forest-700 text-forest-700 font-bold text-xs hover:bg-forest-700/10 transition-colors flex items-center justify-center gap-1 button-press min-h-[44px]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View Cart</span>
            </button>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-2.5 px-3 rounded-xl btn-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-level-1 hover:shadow-md transition-all button-press min-h-[44px]"
            >
              <span>Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
