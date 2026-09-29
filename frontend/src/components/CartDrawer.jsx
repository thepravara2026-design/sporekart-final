import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight, AlertTriangle, Truck, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import MediaImage from './MediaImage';
import PromoCodeSection from './PromoCodeSection';

export default function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, updateQuantity, removeFromCart, clearCart, loading } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Close drawer on route change
  React.useEffect(() => {
    if (isDrawerOpen) {
      closeDrawer();
    }
  }, [location.pathname]);

  React.useEffect(() => {
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
        className="fixed inset-0 bg-forest-900/45 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface-white border-l border-surface-border shadow-level-3 flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="p-6 border-b border-surface-border flex items-center justify-between bg-surface-offwhite">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-cream border border-surface-border flex items-center justify-center text-forest-700 shadow-level-1">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-forest-900">Your Shopping Cart</h2>
                <p className="text-xs text-typography-secondary">{cart.itemCount || 0} {cart.itemCount === 1 ? 'item' : 'items'} selected</p>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              aria-label="Close shopping cart drawer"
              className="p-2.5 rounded-xl text-typography-muted hover:text-typography-primary hover:bg-surface-neutral border border-transparent transition-all min-h-[44px] min-w-[44px] flex items-center justify-center button-press"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Incentive Progress */}
          {cart.items.length > 0 && (
            <div className="px-6 py-3 bg-surface-cream border-b border-surface-border">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-typography-secondary flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-forest-700" />
                  {currentTotal >= freeDeliveryThreshold ? (
                    <strong className="text-forest-700 font-bold">Unlocked FREE Express Delivery!</strong>
                  ) : (
                    <span>Add <strong className="text-forest-800">₹{freeDeliveryThreshold - currentTotal}</strong> more for Free Shipping</span>
                  )}
                </span>
                <span className="text-forest-700 font-bold">{deliveryProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-neutral rounded-pill overflow-hidden">
                <div 
                  className="h-full bg-forest-700 rounded-pill transition-all duration-300"
                  style={{ width: `${deliveryProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
              cart.items.map((item) => (
                <div
                  key={item.variantId || item.id}
                  className="p-4 rounded-card bg-surface-white border border-surface-border flex gap-4 relative group hover:border-forest-700/40 shadow-level-1 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-input overflow-hidden bg-surface-cream border border-surface-border flex-shrink-0 relative">
                    <MediaImage
                      src={item.imageUrl}
                      alt={item.productTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-forest-900 truncate pr-2">{item.productTitle}</h4>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-typography-muted hover:text-rose-600 p-1 transition-colors"
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

                    {!item.inStock && (
                      <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" /> Exceeds Stock ({item.availableStock} available)
                      </span>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-surface-neutral border border-surface-border rounded-input px-2.5 py-1">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          disabled={loading}
                          className="text-typography-secondary hover:text-forest-900 p-1 disabled:opacity-40 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-forest-900 px-1.5">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={loading || item.quantity >= item.availableStock}
                          className="text-typography-secondary hover:text-forest-900 p-1 disabled:opacity-40 transition-colors"
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
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cart.items.length > 0 && (
            <div className="p-6 border-t border-surface-border bg-surface-offwhite space-y-4">
              <PromoCodeSection compact={true} />

              <div className="space-y-2 text-xs">
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

                <div className="border-t border-surface-border pt-2 flex justify-between text-sm font-bold text-forest-900">
                  <span>Estimated Total</span>
                  <span className="text-forest-700 text-lg font-display">₹{cart.estimatedTotalInr}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-typography-secondary bg-surface-cream p-3 rounded-input border border-surface-border">
                <ShieldCheck className="w-4 h-4 text-forest-700 flex-shrink-0" />
                <span>Tax Invoice Included & 100% Cold-Chain Fresh Guarantee</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={clearCart}
                  className="col-span-1 text-xs text-typography-muted hover:text-rose-600 border border-surface-border hover:border-rose-300 py-3.5 rounded-input font-medium transition-all button-press"
                >
                  Clear Cart
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading || !cart.valid}
                  className="col-span-2 btn-primary disabled:opacity-50 text-sm py-3.5 flex items-center justify-center gap-2 shadow-level-1"
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
