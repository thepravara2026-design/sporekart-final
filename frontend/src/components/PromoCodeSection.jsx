import React, { useState, useEffect } from 'react';
import { Tag, CheckCircle2, X, Sparkles, ChevronDown, ChevronUp, Copy, Check, Eye, EyeOff, ShoppingBag, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { cartApi } from '../api';

export default function PromoCodeSection({ compact = false, showAvailable = true }) {
  const { cart, applyPromotion, removePromotion, loading } = useCart();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [availablePromos, setAvailablePromos] = useState([]);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [revealedCodes, setRevealedCodes] = useState({});
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (showAvailable) {
      fetchPromotions();
    }
  }, [showAvailable]);

  const fetchPromotions = async () => {
    try {
      const res = await cartApi.getAvailablePromotions('CUSTOMER');
      if (res.data && res.data.success) {
        setAvailablePromos(res.data.data || []);
      }
    } catch (err) {
      // Fallback default customer coupons if API offline
      setAvailablePromos([
        { code: 'SPORE10', name: 'Welcome Harvest 10% Off', description: '10% off on product store orders', type: 'PERCENTAGE', discountValue: 10, minimumOrderValue: 299, targetAudience: 'CUSTOMER' },
        { code: 'FLAT100', name: 'Flat ₹100 Off Festive Special', description: 'Flat ₹100 discount on orders above ₹799', type: 'FIXED_AMOUNT', discountValue: 100, minimumOrderValue: 799, targetAudience: 'CUSTOMER' },
        { code: 'FREESHIP', name: 'Free Delivery Express', description: 'Complimentary temperature-controlled shipping', type: 'FREE_SHIPPING', minimumOrderValue: 499, targetAudience: 'CUSTOMER' },
        { code: 'GLOBAL15', name: 'Universal Fungi Offer 15% Off', description: '15% discount eligible on store & courses', type: 'PERCENTAGE', discountValue: 15, minimumOrderValue: 350, targetAudience: 'BOTH' }
      ]);
    }
  };

  const toggleRevealCode = (promoCode) => {
    setRevealedCodes(prev => ({
      ...prev,
      [promoCode]: !prev[promoCode]
    }));
  };

  const handleApply = async (promoCodeToApply) => {
    const targetCode = (promoCodeToApply || code).trim();
    if (!targetCode) return;
    
    const res = await applyPromotion(targetCode);
    if (res.success) {
      setIsError(false);
      setMessage(res.message || `Promo code '${targetCode}' applied successfully!`);
      setCode('');
      setShowOffersModal(false);
    } else {
      setIsError(true);
      setMessage(res.message || 'Invalid or non-applicable promo code');
    }
  };

  const handleRemove = async () => {
    await removePromotion();
    setCode('');
    setMessage('');
  };

  const handleCopyOnly = (promoCode, e) => {
    if (e) e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(promoCode);
    }
    setCopiedCode(promoCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyAndFill = (promoCode) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(promoCode);
    }
    setCode(promoCode);
    setCopiedCode(promoCode);
    setTimeout(() => setCopiedCode(null), 2000);
    handleApply(promoCode);
  };

  const cartSubtotal = cart?.subtotal || 0;

  return (
    <div className={`space-y-3 ${compact ? 'py-2 border-y border-surface-border' : 'pb-3 border-b border-surface-border'}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-forest-700" />
          <span>Have a Product Store Promo Code?</span>
        </label>
        {showAvailable && (
          <button
            type="button"
            onClick={() => setShowOffersModal(true)}
            className="text-[11px] text-forest-700 font-bold hover:text-forest-900 flex items-center gap-1 bg-forest-700/10 hover:bg-forest-700/20 px-2 py-1 rounded-lg transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{cart.appliedPromoCode ? 'Swap Offer' : 'View Store Coupons'}</span>
          </button>
        )}
      </div>

      {cart.appliedPromoCode ? (
        <div className="space-y-2">
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3 flex items-center justify-between shadow-level-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-emerald-950 tracking-wider">
                    {cart.appliedPromoCode}
                  </span>
                  <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-md tracking-wider">
                    APPLIED
                  </span>
                </div>
                <span className="text-[11px] text-emerald-800 block truncate mt-0.5 font-medium">
                  {cart.promoMessage || 'Promo code applied successfully'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className="text-typography-muted hover:text-rose-600 p-1.5 transition-colors rounded-lg hover:bg-rose-50"
              title="Remove promo code"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <form onSubmit={(e) => { e.preventDefault(); handleApply(); }} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Code (e.g. SPORE10)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-forest-700 shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn-primary text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-50 shadow-level-1 shrink-0"
            >
              Apply
            </button>
          </form>
        </div>
      )}

      {(message || (cart.promoMessage && !cart.appliedPromoCode)) && !cart.appliedPromoCode && (
        <div className={`p-2.5 rounded-xl border text-xs font-medium flex items-start gap-1.5 ${
          isError || cart.promoMessage ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <span className="shrink-0">{isError || cart.promoMessage ? '⚠️' : '✅'}</span>
          <span>{message || cart.promoMessage}</span>
        </div>
      )}

      {/* Amazon / Flipkart Style Store Coupons Reveal Modal */}
      {showOffersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-white rounded-card border border-surface-border p-5 max-w-md w-full space-y-4 shadow-level-3">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-typography-primary">
                    Product Store Available Coupons
                  </h3>
                  <p className="text-[11px] text-typography-muted">
                    Case-sensitive codes. Copy code or click Apply directly!
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowOffersModal(false)}
                className="text-typography-muted hover:text-typography-primary p-1 rounded-lg hover:bg-surface-cream"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {availablePromos.length === 0 ? (
                <div className="text-center p-6 text-xs text-typography-muted">
                  No active store promotions right now. Check back soon!
                </div>
              ) : (
                availablePromos.map((p) => {
                  const isRevealed = revealedCodes[p.code];
                  const minOrder = p.minimumOrderValue || 0;
                  const isEligible = cartSubtotal >= minOrder;
                  const isCurrentlyApplied = cart.appliedPromoCode === p.code;

                  return (
                    <div 
                      key={p.code}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                        isCurrentlyApplied 
                          ? 'bg-emerald-50/90 border-emerald-300' 
                          : isEligible 
                            ? 'bg-surface-white border-surface-border hover:border-forest-700/50 shadow-sm'
                            : 'bg-surface-cream/40 border-surface-border opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-forest-950">{p.name}</span>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                              🛒 Store Offer
                            </span>
                            {p.targetAudience === 'BOTH' && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                🌐 Store & Training
                              </span>
                            )}
                          </div>
                          {p.description && (
                            <p className="text-[11px] text-typography-secondary mt-1">{p.description}</p>
                          )}
                        </div>

                        {isCurrentlyApplied && (
                          <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-md shrink-0">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      {/* Code Masking / Copy & Apply Section */}
                      <div className="bg-surface-cream/70 border border-dashed border-forest-700/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                          {isRevealed ? (
                            <button
                              type="button"
                              onClick={() => isEligible && copyAndFill(p.code)}
                              className="font-mono font-extrabold text-sm text-forest-900 tracking-wider hover:underline focus:outline-none select-all truncate text-left"
                              title="Click to copy and apply"
                            >
                              {p.code}
                            </button>
                          ) : (
                            <span className="font-mono text-xs text-typography-muted tracking-widest select-none">
                              ••••••••
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Copy Code Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              if (!isRevealed) toggleRevealCode(p.code);
                              handleCopyOnly(p.code, e);
                            }}
                            className="text-[11px] font-bold text-forest-800 hover:bg-forest-100 flex items-center gap-1 bg-surface-white px-2.5 py-1 rounded-lg border border-forest-300 transition-colors shadow-xs"
                            title="Copy Promo Code"
                          >
                            {copiedCode === p.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-forest-700" />}
                            <span>{copiedCode === p.code ? 'Copied!' : 'Copy'}</span>
                          </button>

                          {/* Reveal / Hide Button */}
                          <button
                            type="button"
                            onClick={() => toggleRevealCode(p.code)}
                            className="text-[11px] font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 bg-surface-white px-2 py-1 rounded-md border border-surface-border"
                            title={isRevealed ? 'Hide Code' : 'Click to Reveal Code'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-typography-muted" /> : <Eye className="w-3.5 h-3.5 text-forest-700" />}
                            <span>{isRevealed ? 'Hide Code' : 'Click to Reveal Code'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Action & Eligibility Section */}
                      <div className="pt-1 border-t border-surface-border text-[11px] space-y-2">
                        <div className={`p-2 rounded-lg flex items-center justify-between gap-2 ${
                          isEligible ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isEligible ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                            <span className="font-semibold truncate">
                              {isEligible 
                                ? 'Eligible for your cart!'
                                : `Min order ₹${minOrder} required. Add ₹${(minOrder - cartSubtotal).toFixed(0)} more.`}
                            </span>
                          </div>

                          {!isCurrentlyApplied && (
                            <button
                              type="button"
                              onClick={() => copyAndFill(p.code)}
                              disabled={!isEligible}
                              className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                                isEligible 
                                  ? 'bg-forest-700 hover:bg-forest-800 text-white shadow-sm'
                                  : 'bg-surface-neutral text-typography-muted cursor-not-allowed opacity-60'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>Apply Code</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
