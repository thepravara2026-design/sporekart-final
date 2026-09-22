import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight, AlertTriangle, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import MediaImage from './MediaImage';

export default function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, updateQuantity, removeFromCart, clearCart, loading } = useCart();
  const navigate = useNavigate();

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
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-950 border-l border-spore-800/60 shadow-2xl flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="p-6 border-b border-spore-800/60 flex items-center justify-between bg-slate-950/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-spore-900 to-spore-950 border border-spore-700/50 flex items-center justify-center text-spore-400 shadow-inner">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-white">Your Shopping Cart</h2>
                <p className="text-xs text-slate-400">{cart.itemCount || 0} {cart.itemCount === 1 ? 'item' : 'items'} selected</p>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              aria-label="Close shopping cart drawer"
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center button-press"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Incentive Progress */}
          {cart.items.length > 0 && (
            <div className="px-6 py-3 bg-spore-950/90 border-b border-spore-800/40">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-spore-400" />
                  {currentTotal >= freeDeliveryThreshold ? (
                    <strong className="text-emerald-400">Unlocked FREE Express Delivery!</strong>
                  ) : (
                    <span>Add <strong className="text-spore-300">₹{freeDeliveryThreshold - currentTotal}</strong> more for Free Shipping</span>
                  )}
                </span>
                <span className="text-spore-400 font-bold">{deliveryProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-spore-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${deliveryProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-3xl bg-spore-950/80 border border-spore-800/60 flex items-center justify-center text-spore-400 mb-6 shadow-inner animate-pulse">
                  <ShoppingBag className="w-10 h-10 opacity-80" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-200">Your cart is empty</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
                  Discover laboratory-tested spawn, fresh gourmet mushrooms, and cultivation substrate.
                </p>
                <button
                  onClick={() => { closeDrawer(); navigate('/products'); }}
                  className="mt-8 bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm shadow-lg shadow-spore-950/50 transition-all button-press hover-lift"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl glass-card border border-spore-800/40 flex gap-4 relative group hover:border-spore-700/60"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-spore-800/50 flex-shrink-0 relative">
                    <MediaImage
                      src={item.imageUrl}
                      alt={item.productTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-white truncate pr-2">{item.productTitle}</h4>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="inline-block text-[11px] text-spore-400 font-medium mt-0.5">
                      {item.variantName}
                    </span>

                    <div className="text-sm font-bold text-white mt-1">
                      ₹{item.unitPriceInr} <span className="text-[10px] text-slate-400 font-normal">/ unit</span>
                    </div>

                    {!item.inStock && (
                      <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" /> Exceeds Stock ({item.availableStock} available)
                      </span>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-slate-900/90 border border-spore-700/50 rounded-xl px-2.5 py-1">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          disabled={loading}
                          className="text-slate-400 hover:text-white p-1 disabled:opacity-40 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-white px-1.5">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={loading || item.quantity >= item.availableStock}
                          className="text-slate-400 hover:text-white p-1 disabled:opacity-40 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-xs font-bold text-spore-300">
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
            <div className="p-6 border-t border-spore-800/60 bg-slate-950/95 backdrop-blur-md space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-200 font-medium">₹{cart.subtotalInr}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST (5% Compliant)</span>
                  <span className="text-slate-200 font-medium">₹{cart.gstTotalInr}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee</span>
                  <span className="text-spore-400 font-medium">
                    {currentTotal >= freeDeliveryThreshold ? 'FREE' : 'Calculated at Checkout'}
                  </span>
                </div>
                <div className="border-t border-spore-800/60 pt-2 flex justify-between text-sm font-bold text-white">
                  <span>Estimated Total</span>
                  <span className="text-spore-400 text-lg font-display">₹{cart.estimatedTotalInr}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-spore-950/80 p-3 rounded-xl border border-spore-800/50">
                <ShieldCheck className="w-4 h-4 text-spore-400 flex-shrink-0" />
                <span>Tax Invoice Included & 100% Cold-Chain Fresh Guarantee</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={clearCart}
                  className="col-span-1 text-xs text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 py-3.5 rounded-xl font-medium transition-all button-press"
                >
                  Clear Cart
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading || !cart.valid}
                  className="col-span-2 bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-spore-950/60 flex items-center justify-center gap-2 transition-all button-press hover-lift"
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
