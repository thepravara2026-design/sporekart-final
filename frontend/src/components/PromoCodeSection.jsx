import React, { useState, useEffect } from 'react';
import { Tag, CheckCircle2, X, Sparkles, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { cartApi } from '../api';

export default function PromoCodeSection({ compact = false, showAvailable = true }) {
  const { cart, applyPromotion, removePromotion, loading } = useCart();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [availablePromos, setAvailablePromos] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (showAvailable) {
      fetchPromotions();
    }
  }, [showAvailable]);

  const fetchPromotions = async () => {
    try {
      const res = await cartApi.getAvailablePromotions();
      if (res.data && res.data.success) {
        setAvailablePromos(res.data.data || []);
      }
    } catch (err) {
      // Fallback default coupons if API fails
      setAvailablePromos([
        { code: 'SPORE10', name: '10% OFF', description: 'Min order ₹299 (Max ₹200)' },
        { code: 'WELCOME50', name: 'FLAT ₹50 OFF', description: 'Min order ₹199' },
        { code: 'FREESHIP', name: 'FREE SHIPPING', description: 'Free cold-chain delivery' },
        { code: 'FUNGI20', name: '20% OFF', description: 'Min order ₹499 (Max ₹500)' },
      ]);
    }
  };

  const handleApply = async (promoCodeToApply) => {
    const targetCode = (promoCodeToApply || code).trim();
    if (!targetCode) return;
    
    const res = await applyPromotion(targetCode);
    if (res.success) {
      setIsError(false);
      setMessage(res.message || `Promo code '${targetCode}' applied successfully!`);
      setCode('');
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

  const copyAndFill = (promoCode) => {
    setCode(promoCode);
    setCopiedCode(promoCode);
    setTimeout(() => setCopiedCode(null), 2000);
    handleApply(promoCode);
  };

  return (
    <div className={`space-y-2.5 ${compact ? 'py-2 border-y border-surface-border' : 'pb-3 border-b border-surface-border'}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-forest-700" />
          <span>Have a Promo Code?</span>
        </label>
        {availablePromos.length > 0 && !cart.appliedPromoCode && showAvailable && (
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-[11px] text-forest-700 font-semibold hover:text-forest-900 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{showDropdown ? 'Hide Offers' : 'View Offers'}</span>
            {showDropdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {cart.appliedPromoCode ? (
        <div className="bg-green-50/90 border border-green-300 rounded-xl p-3 flex items-center justify-between shadow-level-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-green-900 tracking-wider uppercase">
                  {cart.appliedPromoCode}
                </span>
                <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                  APPLIED
                </span>
              </div>
              <span className="text-[11px] text-green-700 block truncate mt-0.5 font-medium">
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
      ) : (
        <div className="space-y-2">
          <form onSubmit={(e) => { e.preventDefault(); handleApply(); }} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Code (e.g. SPORE10)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex-1 bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-forest-700 shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn-primary text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-50 shadow-level-1 shrink-0"
            >
              Apply
            </button>
          </form>

          {/* Available Promo Chips */}
          {showAvailable && availablePromos.length > 0 && !showDropdown && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {availablePromos.slice(0, 3).map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => copyAndFill(p.code)}
                  className="text-[10px] font-mono font-bold bg-forest-700/10 hover:bg-forest-700/20 text-forest-800 border border-forest-700/30 px-2 py-0.5 rounded-lg transition-all flex items-center gap-1"
                  title={p.description || p.name}
                >
                  <Tag className="w-2.5 h-2.5" />
                  <span>{p.code}</span>
                </button>
              ))}
            </div>
          )}

          {/* Expanded Available Offers Dropdown */}
          {showDropdown && availablePromos.length > 0 && (
            <div className="bg-surface-cream border border-surface-border rounded-xl p-3 space-y-2 text-xs max-h-48 overflow-y-auto animate-fade-in">
              <div className="font-bold text-forest-900 flex items-center gap-1 text-[11px] pb-1 border-b border-surface-border">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Available Coupons & Offers</span>
              </div>
              {availablePromos.map((p) => (
                <div key={p.code} className="bg-surface-white p-2.5 rounded-lg border border-surface-border flex items-center justify-between hover:border-forest-700/40 transition-all">
                  <div>
                    <div className="font-mono font-bold text-forest-900 text-xs flex items-center gap-1.5">
                      <span>{p.code}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded">
                        {p.name || p.type}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-[10px] text-typography-secondary mt-0.5">{p.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyAndFill(p.code)}
                    className="text-[11px] font-bold text-forest-700 hover:text-forest-900 bg-surface-neutral hover:bg-forest-700/10 px-2.5 py-1 rounded-md border border-surface-border transition-colors flex items-center gap-1 shrink-0"
                  >
                    {copiedCode === p.code ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === p.code ? 'Applied' : 'Apply'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {message && !cart.appliedPromoCode && (
        <p className={`text-[11px] font-medium px-1 ${isError ? 'text-rose-600' : 'text-green-700'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
