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
        <div className="w-screen max-w-md bg-white border-l border-gray-200 shadow-2xl flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-[#f2f8f4]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#e2f2e6] border border-[#b8e2c2] flex items-center justify-center text-[#16532f] shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-gray-900">Your Shopping Cart</h2>
                <p className="text-xs text-gray-500">{cart.itemCount || 0} {cart.itemCount === 1 ? 'item' : 'items'} selected</p>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              aria-label="Close shopping cart drawer"
              className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-transparent transition-all min-h-[44px] min-w-[44px] flex items-center justify-center button-press"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Incentive Progress */}
          {cart.items.length > 0 && (
            <div className="px-6 py-3 bg-[#f4f8f4] border-b border-gray-200">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#16532f]" />
                  {currentTotal >= freeDeliveryThreshold ? (
                    <strong className="text-[#16532f]">Unlocked FREE Express Delivery!</strong>
                  ) : (
                    <span>Add <strong className="text-[#16532f]">₹{freeDeliveryThreshold - currentTotal}</strong> more for Free Shipping</span>
                  )}
                </span>
                <span className="text-[#16532f] font-bold">{deliveryProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#16532f] rounded-full transition-all duration-300"
                  style={{ width: `${deliveryProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-3xl bg-[#f4f8f4] border border-gray-200 flex items-center justify-center text-[#16532f] mb-6 shadow-sm">
                  <ShoppingBag className="w-10 h-10 opacity-80" />
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900">Your cart is empty</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">
                  Discover laboratory-tested spawn, fresh gourmet mushrooms, and cultivation substrate.
                </p>
                <button
                  onClick={() => { closeDrawer(); navigate('/products'); }}
                  className="mt-8 bg-[#16532f] hover:bg-[#124426] text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md transition-all button-press"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white border border-gray-200 flex gap-4 relative shadow-sm hover:border-gray-300"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#f4f8f4] border border-gray-200 flex-shrink-0 relative">
                    <MediaImage
                      src={item.imageUrl}
                      alt={item.productTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-gray-900 truncate pr-2">{item.productTitle}</h4>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="inline-block text-[11px] text-[#16532f] font-semibold mt-0.5">
                      {item.variantName}
                    </span>

                    <div className="text-sm font-bold text-gray-900 mt-1">
                      ₹{item.unitPriceInr} <span className="text-[10px] text-gray-400 font-normal">/ unit</span>
                    </div>

                    {!item.inStock && (
                      <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" /> Exceeds Stock ({item.availableStock} available)
                      </span>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-[#f4f8f4] border border-gray-200 rounded-xl px-2.5 py-1">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          disabled={loading}
                          className="text-gray-500 hover:text-gray-900 p-1 disabled:opacity-40 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-gray-900 px-1.5">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={loading || item.quantity >= item.availableStock}
                          className="text-gray-500 hover:text-gray-900 p-1 disabled:opacity-40 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-xs font-bold text-[#16532f]">
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
            <div className="p-6 border-t border-gray-200 bg-[#f2f8f4] space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="text-gray-900 font-medium">₹{cart.subtotalInr}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (5% Compliant)</span>
                  <span className="text-gray-900 font-medium">₹{cart.gstTotalInr}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="text-[#16532f] font-bold">
                    {currentTotal >= freeDeliveryThreshold ? 'FREE' : 'Calculated at Checkout'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-gray-900">
                  <span>Estimated Total</span>
                  <span className="text-[#16532f] text-lg font-display font-extrabold">₹{cart.estimatedTotalInr}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-gray-700 bg-[#e2f2e6] p-3 rounded-xl border border-[#b8e2c2]">
                <ShieldCheck className="w-4 h-4 text-[#16532f] flex-shrink-0" />
                <span>Tax Invoice Included & 100% Cold-Chain Fresh Guarantee</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={clearCart}
                  className="col-span-1 text-xs text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-300 py-3.5 rounded-xl font-medium transition-all button-press"
                >
                  Clear Cart
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading || !cart.valid}
                  className="col-span-2 bg-[#16532f] hover:bg-[#124426] disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all button-press"
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
