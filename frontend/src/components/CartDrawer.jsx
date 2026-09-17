import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
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

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
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
        <div className="w-screen max-w-md bg-slate-900 border-l border-spore-800/60 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-spore-800/60 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-spore-950 border border-spore-700/50 flex items-center justify-center text-spore-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-white">Shopping Cart</h2>
                <p className="text-xs text-slate-400">{cart.itemCount || 0} {cart.itemCount === 1 ? 'item' : 'items'}</p>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              aria-label="Close shopping cart drawer"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-spore-950/80 border border-spore-800/60 flex items-center justify-center text-spore-500 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">Your cart is empty</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Explore our fresh mushrooms, laboratory-grade spawn, and cultivation kits.
                </p>
                <button
                  onClick={() => { closeDrawer(); navigate('/products'); }}
                  className="mt-6 bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-spore-800/40 flex gap-4 relative group"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-900 border border-spore-800/40 flex-shrink-0 relative">
                    <MediaImage
                      src={item.imageUrl}
                      alt={item.productTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start pr-6">
                      <h4 className="text-sm font-semibold text-white truncate">{item.productTitle}</h4>
                    </div>
                    <span className="inline-block text-[11px] text-spore-400 font-medium mt-0.5">
                      {item.variantName}
                    </span>

                    <div className="text-xs font-bold text-white mt-1">
                      ₹{item.unitPriceInr} <span className="text-[10px] text-slate-400 font-normal">/ unit</span>
                    </div>

                    {!item.inStock && (
                      <span className="text-[10px] text-red-400 font-semibold flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" /> Exceeds Stock ({item.availableStock} available)
                      </span>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-slate-900 border border-spore-700/40 rounded-lg px-2 py-1">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          disabled={loading}
                          className="text-slate-400 hover:text-white p-0.5 disabled:opacity-40"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={loading || item.quantity >= item.availableStock}
                          className="text-slate-400 hover:text-white p-0.5 disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cart.items.length > 0 && (
            <div className="p-6 border-t border-spore-800/60 bg-slate-950/80 space-y-4">
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
                  <span className="text-spore-400 font-medium">Calculated at Checkout</span>
                </div>
                <div className="border-t border-spore-800/60 pt-2 flex justify-between text-sm font-bold text-white">
                  <span>Estimated Total</span>
                  <span className="text-spore-400 text-base">₹{cart.estimatedTotalInr}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-spore-950/60 p-2.5 rounded-lg border border-spore-800/40">
                <ShieldCheck className="w-4 h-4 text-spore-400 flex-shrink-0" />
                <span>GST Tax Invoice & 100% Cold-Chain Fresh Guarantee</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={clearCart}
                  className="col-span-1 text-xs text-slate-400 hover:text-red-400 border border-spore-800/60 hover:border-red-900/50 py-3 rounded-xl font-medium transition-colors"
                >
                  Clear Cart
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading || !cart.valid}
                  className="col-span-2 bg-gradient-to-r from-spore-500 to-spore-600 hover:from-spore-400 hover:to-spore-500 disabled:opacity-50 text-slate-950 font-bold text-sm py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
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
