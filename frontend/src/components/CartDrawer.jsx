import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ShieldCheck, 
  ArrowRight, 
  AlertTriangle, 
  Truck, 
  Tag, 
  ChevronDown 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import MediaImage from './MediaImage';
import PromoCodeSection from './PromoCodeSection';

export default function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, updateQuantity, removeFromCart, clearCart, loading, error } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible promo section: automatically open if promo already applied, collapsed by default for maximum item visibility
  const [showPromoSection, setShowPromoSection] = useState(Boolean(cart?.appliedPromoCode));

  useEffect(() => {
    if (cart?.appliedPromoCode) {
      setShowPromoSection(true);
    }
  }, [cart?.appliedPromoCode]);

  // Close drawer on route change
  useEffect(() => {
    if (isDrawerOpen) {
      closeDrawer();
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const handleCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  const freeDeliveryThreshold = 999;
  const currentTotal = cart.subtotalInr || 0;
  const deliveryProgress = Math.min(100, Math.round((currentTotal / freeDeliveryThreshold) * 100));

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart Drawer"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest-900/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md h-full max-h-screen bg-surface-white border-l border-surface-border shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between bg-surface-offwhite flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-cream border border-surface-border flex items-center justify-center text-forest-700 shadow-level-1">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-display font-bold text-forest-900 leading-tight">Your Shopping Cart</h2>
                <p className="text-xs text-typography-secondary">{cart.itemCount || 0} {cart.itemCount === 1 ? 'item' : 'items'} selected</p>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              aria-label="Close shopping cart drawer"
              className="p-2 rounded-xl text-typography-muted hover:text-typography-primary hover:bg-surface-neutral border border-transparent transition-all min-h-[40px] min-w-[40px] flex items-center justify-center button-press hover:rotate-90 duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in flex-shrink-0">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                {error}
              </span>
            </div>
          )}

          {/* Delivery Incentive Progress */}
          {cart.items.length > 0 && (
            <div className="px-5 py-2.5 bg-surface-cream/80 border-b border-surface-border flex-shrink-0">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-typography-secondary flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                  {currentTotal >= freeDeliveryThreshold ? (
                    <strong className="text-forest-700 font-bold">Unlocked FREE Express Delivery!</strong>
                  ) : (
                    <span>Add <strong className="text-forest-800">₹{freeDeliveryThreshold - currentTotal}</strong> more for Free Shipping</span>
                  )}
                </span>
                <span className="text-forest-700 font-bold ml-2 shrink-0">{deliveryProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-neutral rounded-pill overflow-hidden">
                <div 
                  className="h-full bg-forest-700 rounded-pill transition-all duration-300"
                  style={{ width: `${deliveryProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List Container with smooth scrolling & min-h-0 */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4 space-y-3.5 scroll-smooth overscroll-contain">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-hero bg-surface-cream border border-surface-border flex items-center justify-center text-forest-700 mb-6 shadow-level-1 animate-pulse">
                  <ShoppingBag className="w-10 h-10 opacity-80" />
                </div>
                <h3 className="text-xl font-display font-bold text-forest-900">Your cart is empty</h3>
                <p className="text-sm text-typography-secondary mt-2 max-w-xs leading-relaxed">
                  Discover laboratory-tested spawn, fresh gourmet mushrooms, and cultivation substrate.
                </p>
                <button
                  onClick={() => { closeDrawer(); navigate('/products'); }}
                  className="mt-8 btn-primary px-6 py-3 text-sm shadow-level-1"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              <>
                {cart.items.map((item) => {
                  const stockLimit = item.availableStock !== undefined && item.availableStock !== null ? item.availableStock : 999;
                  const isExceedingStock = item.inStock === false || item.quantity > stockLimit;
                  const isAtMaxStock = item.quantity >= stockLimit;

                  return (
                    <div
                      key={item.variantId || item.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-surface-white border border-surface-border flex gap-3.5 sm:gap-4 relative group hover:border-forest-700/40 hover:shadow-md transition-all duration-200"
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-cream border border-surface-border flex-shrink-0 relative shadow-sm">
                        <MediaImage
                          src={item.imageUrl}
                          alt={item.productTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="text-sm font-semibold text-forest-900 truncate pr-2 group-hover:text-forest-800 transition-colors">
                              {item.productTitle}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.variantId)}
                              className="text-typography-muted hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-colors shrink-0"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="inline-block text-[11px] text-forest-700 font-medium mt-0.5">
                            {item.variantName}
                          </span>

                          <div className="text-sm font-bold text-forest-900 mt-1">
                            ₹{item.unitPriceInr} <span className="text-[10px] text-typography-muted font-normal">/ unit</span>
                          </div>

                          {isExceedingStock ? (
                            <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" /> Exceeds Stock ({item.availableStock} available)
                            </span>
                          ) : isAtMaxStock && item.availableStock !== undefined && item.availableStock !== null ? (
                            <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-1">
                              <span>Max stock reached ({item.availableStock} available)</span>
                            </span>
                          ) : null}
                        </div>

                        {/* Quantity Controls & Line Price */}
                        <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-border/40">
                          <div className="flex items-center gap-1.5 bg-surface-neutral/90 border border-surface-border rounded-lg px-2 py-0.5 shadow-inner">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1, item.availableStock)}
                              disabled={item.quantity <= 1}
                              className="text-typography-secondary hover:text-forest-900 p-1 disabled:opacity-40 transition-colors active:scale-95"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold text-forest-900 px-1.5 min-w-[16px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1, item.availableStock)}
                              disabled={isAtMaxStock}
                              className="text-typography-secondary hover:text-forest-900 p-1 disabled:opacity-40 transition-colors active:scale-95"
                              aria-label="Increase quantity"
                              title={isAtMaxStock ? `Max stock reached (${item.availableStock})` : 'Add one more'}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-xs font-bold text-forest-700">
                            ₹{(item.unitPriceInr * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Bottom spacer for clearance above docked footer */}
                <div className="h-4" />
              </>
            )}
          </div>

          {/* Footer Summary & Checkout (Docked with flex-shrink-0) */}
          {cart.items.length > 0 && (
            <div className="flex-shrink-0 border-t border-surface-border bg-surface-offwhite/95 backdrop-blur-md shadow-[0_-8px_25px_rgba(0,0,0,0.06)] px-5 py-4 space-y-3">
              {/* Collapsible Promo Code Section */}
              <div className="border-b border-surface-border/70 pb-2.5">
                <button
                  type="button"
                  onClick={() => setShowPromoSection(prev => !prev)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-forest-800 hover:text-forest-950 transition-colors py-0.5 group"
                >
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-forest-700 group-hover:rotate-12 transition-transform duration-200" />
                    <span>{cart.appliedPromoCode ? 'Promo Applied' : 'Have a Product Store Promo Code?'}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-forest-700 bg-forest-700/10 hover:bg-forest-700/15 px-2 py-0.5 rounded-md transition-colors">
                    <span>{showPromoSection ? 'Hide' : (cart.appliedPromoCode ? 'Manage' : 'Apply')}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPromoSection ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {showPromoSection && (
                  <div className="mt-2.5 pt-2 border-t border-surface-border/60 animate-fade-in">
                    <PromoCodeSection compact={true} />
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-typography-secondary">
                  <span>Subtotal</span>
                  <span className="text-forest-900 font-medium">₹{cart.subtotalInr}</span>
                </div>
                <div className="flex justify-between text-typography-secondary">
                  <span>GST (5% Compliant)</span>
                  <span className="text-forest-900 font-medium">₹{cart.gstTotalInr}</span>
                </div>
                <div className="flex justify-between text-typography-secondary">
                  <span>Delivery Fee</span>
                  <span className="text-forest-700 font-semibold">
                    {cart.shippingFeeInr === 0 || currentTotal >= freeDeliveryThreshold ? 'FREE' : `₹${cart.shippingFeeInr}`}
                  </span>
                </div>

                {cart.promoDiscountInr > 0 && (
                  <div className="flex justify-between text-green-700 font-semibold bg-green-50/80 p-2 rounded-lg border border-green-200">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Tag className="w-3 h-3 text-green-600" />
                      <span>Promo ({cart.appliedPromoCode})</span>
                    </span>
                    <span className="font-mono font-bold">- ₹{cart.promoDiscountInr}</span>
                  </div>
                )}

                <div className="border-t border-surface-border/80 pt-2 flex justify-between items-baseline text-sm font-bold text-forest-900">
                  <span>Estimated Total</span>
                  <span className="text-forest-700 text-lg font-display">₹{cart.estimatedTotalInr}</span>
                </div>
              </div>

              {/* Tax Invoice & Fresh Guarantee */}
              <div className="flex items-center gap-2 text-[11px] text-typography-secondary bg-surface-cream px-3 py-2 rounded-xl border border-surface-border">
                <ShieldCheck className="w-4 h-4 text-forest-700 flex-shrink-0" />
                <span>Tax Invoice Included & 100% Cold-Chain Fresh Guarantee</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={clearCart}
                  className="col-span-1 text-xs text-typography-muted hover:text-rose-600 hover:bg-rose-50 border border-surface-border hover:border-rose-300 py-3 rounded-xl font-medium transition-all active:scale-95 button-press"
                >
                  Clear Cart
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading || !cart.valid}
                  className="col-span-2 btn-primary disabled:opacity-50 text-sm py-3 flex items-center justify-center gap-2 shadow-level-1 hover:shadow-level-2 active:scale-95 transition-all"
                >
                  <span>Checkout Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
