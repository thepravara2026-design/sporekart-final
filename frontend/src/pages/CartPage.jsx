import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, RefreshCw, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import MediaImage from '../components/MediaImage';
import EmptyState from '../components/EmptyState';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, loading, validateCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    validateCart();
  }, []);

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-white">Your Shopping Cart</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your items and proceed to checkout with GST tax invoice support.
        </p>
      </div>

      {cart.items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your shopping cart is empty"
          description="Looking for fresh organic mushrooms, high-yield spawn bags, or growing kits?"
          actionText="Explore Products Catalog"
          actionLink="/products"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-spore-800/60 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-spore-800/60">
                <span className="text-sm font-bold text-slate-200">Items ({cart.itemCount})</span>
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-medium"
                >
                  Clear All Items
                </button>
              </div>

              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl glass-card border border-spore-800/40 gap-4 hover-lift"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-spore-800/50 flex-shrink-0">
                      <MediaImage
                        src={item.imageUrl}
                        alt={item.productTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <Link to={`/product/${item.productSlug}`} className="text-base font-bold text-white hover:text-spore-300 transition-colors line-clamp-1">
                        {item.productTitle}
                      </Link>
                      <div className="text-xs text-spore-400 font-semibold mt-0.5">{item.variantName}</div>
                      <div className="text-[11px] text-slate-400 mt-1">SKU: {item.sku}</div>
                      {!item.inStock && (
                        <div className="text-xs text-rose-400 font-semibold flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Insufficient Stock ({item.availableStock} remaining)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-t-0 border-spore-800/40 pt-3 sm:pt-0">
                    <div className="flex items-center gap-2 bg-slate-900/90 border border-spore-700/50 rounded-xl px-3 py-1.5">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        disabled={loading}
                        className="text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold text-white px-2">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        disabled={loading || item.quantity >= item.availableStock}
                        className="text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <div className="text-base font-extrabold text-white font-display">₹{item.lineTotalInr}</div>
                      <div className="text-[11px] text-slate-400">₹{item.unitPriceInr} each</div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-4 rounded-2xl border border-spore-800/40 flex items-center gap-3 hover-lift">
                <Truck className="w-6 h-6 text-spore-400 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Cold-Chain Shipping</h4>
                  <p className="text-[11px] text-slate-400">Insulated fresh packaging</p>
                </div>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-spore-800/40 flex items-center gap-3 hover-lift">
                <ShieldCheck className="w-6 h-6 text-spore-400 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">GST Tax Invoice</h4>
                  <p className="text-[11px] text-slate-400">5% GST included & compliant</p>
                </div>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-spore-800/40 flex items-center gap-3 hover-lift">
                <RefreshCw className="w-6 h-6 text-spore-400 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Spawn Guarantee</h4>
                  <p className="text-[11px] text-slate-400">100% Contamination-free</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-spore-700/50 space-y-4 shadow-xl">
              <h3 className="text-lg font-display font-bold text-white pb-3 border-b border-spore-800/60">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal ({cart.itemCount} items)</span>
                  <span className="font-semibold text-white">₹{cart.subtotalInr}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>GST Total (5%)</span>
                  <span className="font-semibold text-white">₹{cart.gstTotalInr}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimated Shipping</span>
                  <span className="text-spore-400 font-medium">Calculated at Checkout</span>
                </div>

                <div className="border-t border-spore-800/60 pt-3 flex justify-between text-base font-extrabold text-white">
                  <span>Estimated Total</span>
                  <span className="text-spore-400 text-2xl font-display">₹{cart.estimatedTotalInr}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || !cart.valid}
                className="w-full bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold py-4 rounded-2xl shadow-xl shadow-spore-950/60 flex items-center justify-center gap-2 transition-all button-press hover-lift mt-4"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-[11px] text-slate-400 text-center">
                Prices & stock reserved upon order placement.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
