import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, RefreshCw, AlertTriangle, Tag, CheckCircle2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import MediaImage from '../components/MediaImage';
import EmptyState from '../components/EmptyState';

function PromoCodeInput() {
  const { cart, applyPromotion, removePromotion, loading } = useCart();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    const res = await applyPromotion(code);
    if (res.success) {
      setIsError(false);
      setMessage(res.message || 'Promo code applied!');
    } else {
      setIsError(true);
      setMessage(res.message || 'Invalid promo code');
    }
  };

  const handleRemove = async () => {
    await removePromotion();
    setCode('');
    setMessage('');
  };

  return (
    <div className="space-y-2 pb-3 border-b border-surface-border">
      <label className="block text-xs font-bold text-forest-900 flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5 text-forest-700" /> Have a Promo Code?
      </label>
      
      {cart.appliedPromoCode ? (
        <div className="bg-green-50/80 border border-green-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <div>
              <span className="font-mono font-bold text-xs text-green-900 block">{cart.appliedPromoCode}</span>
              <span className="text-[11px] text-green-700 block">{cart.promoMessage || 'Applied'}</span>
            </div>
          </div>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="text-typography-muted hover:text-rose-600 p-1 transition-colors"
            title="Remove promo code"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. SPORE10, FLAT100"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1 bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-forest-700"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="btn-primary text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-50"
          >
            Apply
          </button>
        </form>
      )}

      {message && !cart.appliedPromoCode && (
        <p className={`text-[11px] font-medium ${isError ? 'text-rose-600' : 'text-green-700'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

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
        <h1 className="text-3xl font-display font-bold text-forest-900">Your Shopping Cart</h1>
        <p className="text-sm text-typography-secondary mt-1">
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
            <div className="bg-surface-white p-6 rounded-container border border-surface-border space-y-4 shadow-level-1">
              <div className="flex justify-between items-center pb-4 border-b border-surface-border">
                <span className="text-sm font-bold text-forest-900">Items ({cart.itemCount})</span>
                <button
                  onClick={clearCart}
                  className="text-xs text-typography-muted hover:text-rose-600 transition-colors font-medium"
                >
                  Clear All Items
                </button>
              </div>

              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-card bg-surface-white border border-surface-border gap-4 shadow-level-1 hover-lift"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-20 h-20 rounded-input overflow-hidden bg-surface-cream border border-surface-border flex-shrink-0">
                      <MediaImage
                        src={item.imageUrl}
                        alt={item.productTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <Link to={`/product/${item.productSlug}`} className="text-base font-bold text-forest-900 hover:text-forest-700 transition-colors line-clamp-1">
                        {item.productTitle}
                      </Link>
                      <div className="text-xs text-forest-700 font-semibold mt-0.5">{item.variantName}</div>
                      <div className="text-[11px] text-typography-muted mt-1">SKU: {item.sku}</div>
                      {!item.inStock && (
                        <div className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Insufficient Stock ({item.availableStock} remaining)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-t-0 border-surface-border pt-3 sm:pt-0">
                    <div className="flex items-center gap-2 bg-surface-neutral border border-surface-border rounded-input px-3 py-1.5">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        disabled={loading}
                        className="text-typography-secondary hover:text-forest-900 disabled:opacity-40 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold text-forest-900 px-2">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        disabled={loading || item.quantity >= item.availableStock}
                        className="text-typography-secondary hover:text-forest-900 disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <div className="text-base font-bold text-forest-900 font-display">₹{item.lineTotalInr}</div>
                      <div className="text-[11px] text-typography-muted">₹{item.unitPriceInr} each</div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-typography-muted hover:text-rose-600 p-1.5 transition-colors"
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
              <div className="bg-surface-white p-4 rounded-card border border-surface-border flex items-center gap-3 shadow-level-1 hover-lift">
                <Truck className="w-6 h-6 text-forest-700 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-forest-900">Cold-Chain Shipping</h4>
                  <p className="text-[11px] text-typography-secondary">Insulated fresh packaging</p>
                </div>
              </div>
              <div className="bg-surface-white p-4 rounded-card border border-surface-border flex items-center gap-3 shadow-level-1 hover-lift">
                <ShieldCheck className="w-6 h-6 text-forest-700 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-forest-900">GST Tax Invoice</h4>
                  <p className="text-[11px] text-typography-secondary">5% GST included & compliant</p>
                </div>
              </div>
              <div className="bg-surface-white p-4 rounded-card border border-surface-border flex items-center gap-3 shadow-level-1 hover-lift">
                <RefreshCw className="w-6 h-6 text-forest-700 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-forest-900">Spawn Guarantee</h4>
                  <p className="text-[11px] text-typography-secondary">100% Contamination-free</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-surface-white p-6 rounded-container border border-surface-border space-y-4 shadow-level-1">
              <h3 className="text-lg font-display font-bold text-forest-900 pb-3 border-b border-surface-border">
                Order Summary
              </h3>

              {/* Promo Code Box */}
              <PromoCodeInput />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-typography-secondary">
                  <span>Subtotal ({cart.itemCount} items)</span>
                  <span className="font-semibold text-forest-900">₹{cart.subtotalInr}</span>
                </div>
                <div className="flex justify-between text-typography-secondary">
                  <span>GST Total (5%)</span>
                  <span className="font-semibold text-forest-900">₹{cart.gstTotalInr}</span>
                </div>
                <div className="flex justify-between text-typography-secondary">
                  <span>Shipping Fee</span>
                  {cart.shippingFeeInr > 0 ? (
                    <span className="font-semibold text-forest-900">₹{cart.shippingFeeInr}</span>
                  ) : (
                    <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">FREE</span>
                  )}
                </div>

                {cart.promoDiscountInr > 0 && (
                  <div className="flex justify-between text-green-700 font-semibold bg-green-50/70 p-2 rounded-lg border border-green-200">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Tag className="w-3.5 h-3.5" /> Promo ({cart.appliedPromoCode})
                    </span>
                    <span>- ₹{cart.promoDiscountInr}</span>
                  </div>
                )}

                <div className="border-t border-surface-border pt-3 flex justify-between text-base font-bold text-forest-900">
                  <span>Estimated Total</span>
                  <span className="text-forest-700 text-2xl font-display">₹{cart.estimatedTotalInr}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || !cart.valid}
                className="w-full btn-primary disabled:opacity-50 py-4 shadow-level-1 flex items-center justify-center gap-2 mt-4"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-[11px] text-typography-muted text-center">
                Prices & stock reserved upon order placement.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
