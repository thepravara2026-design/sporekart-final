import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, CreditCard, Smartphone, Building2, CheckCircle2, 
  AlertCircle, Lock, ArrowLeft, Loader2, Sparkles, Wallet
} from 'lucide-react';
import { paymentApi, walletApi } from '../api';
import { useCart } from '../context/CartContext';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchCart } = useCart();

  const type = searchParams.get('type') || 'order';
  const id = searchParams.get('id');

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [wallet, setWallet] = useState({ availableBalance: 0 });
  const [useWallet, setUseWallet] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI', 'CARD', 'NETBANKING'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Invalid payment session. Missing ID.');
      setLoading(false);
      return;
    }
    loadSummary();
    loadWallet();
  }, [type, id]);

  const loadWallet = async () => {
    try {
      const res = await walletApi.getWallet();
      if (res.data && res.data.success) {
        setWallet(res.data.data);
      }
    } catch (ignored) {}
  };

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await paymentApi.getPaymentSummary(type, id);
      if (res.data && res.data.success) {
        setSummary(res.data.data);
      } else {
        setError('Failed to load payment details.');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Error loading payment details');
    } finally {
      setLoading(false);
    }
  };

  // Financial calculation for Wallet & Gateway contributions
  const orderTotal = summary?.amountInr || 0;
  const availableBal = wallet?.availableBalance || 0;
  const walletDeduction = useWallet ? Math.min(availableBal, orderTotal) : 0;
  const remainingGatewayAmount = Math.max(0, orderTotal - walletDeduction);
  const isFullyPaidByWallet = useWallet && walletDeduction >= orderTotal;

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      if (useWallet && walletDeduction > 0) {
        // Execute wallet deduction or partial wallet payment
        const walletPayRes = await walletApi.checkoutPay({
          orderId: type === 'order' ? id : null,
          enrollmentId: type === 'enrollment' ? id : null,
          type,
          amountFromWallet: walletDeduction,
          amountFromGateway: remainingGatewayAmount,
        });

        if (!walletPayRes.data || !walletPayRes.data.success) {
          setError(walletPayRes.data?.message || 'Wallet payment deduction failed');
          setProcessing(false);
          return;
        }

        if (isFullyPaidByWallet) {
          // If fully paid by wallet, complete checkout immediately!
          if (type === 'enrollment') {
            await paymentApi.verifyEnrollmentPayment(id, 'SPOREKART_WALLET', `WALLET_TXN_${Date.now()}`);
          } else {
            const initRes = await paymentApi.initiatePayment(id);
            const razorpayOrderId = initRes.data?.data?.razorpayOrderId || `order_wallet_${Date.now()}`;
            await paymentApi.verifyPayment(id, razorpayOrderId, `pay_wallet_${Date.now()}`, 'mock_wallet_sig');
          }
          await fetchCart();
          setPaymentSuccess(true);
          setTimeout(() => {
            navigate(type === 'enrollment' ? `/training/confirmation/${id}` : `/order-confirmation/${id}`);
          }, 1200);
          setProcessing(false);
          return;
        }
      }

      // Process remaining amount via Gateway
      setTimeout(async () => {
        try {
          if (type === 'enrollment') {
            const res = await paymentApi.verifyEnrollmentPayment(
              id,
              useWallet ? `MIXED_WALLET_${paymentMethod}` : `MOCK_${paymentMethod}`,
              `TXN-${Date.now()}`
            );
            if (res.data && res.data.success) {
              setPaymentSuccess(true);
              setTimeout(() => {
                navigate(`/training/confirmation/${id}`);
              }, 1200);
            } else {
              setError(res.data?.message || 'Payment verification failed');
            }
          } else {
            const initRes = await paymentApi.initiatePayment(id);
            const razorpayOrderId = initRes.data?.data?.razorpayOrderId || `order_mock_${Date.now()}`;
            const mockPaymentId = `pay_mock_${Date.now()}`;

            const verifyRes = await paymentApi.verifyPayment(
              id,
              razorpayOrderId,
              mockPaymentId,
              'mock_signature_bypass'
            );

            if (verifyRes.data && verifyRes.data.success) {
              await fetchCart();
              setPaymentSuccess(true);
              setTimeout(() => {
                navigate(`/order-confirmation/${id}`);
              }, 1200);
            } else {
              setError(verifyRes.data?.message || 'Payment verification failed');
            }
          }
        } catch (err) {
          setError(err.response?.data?.error?.message || err.response?.data?.message || 'Payment transaction failed. Please try again.');
        } finally {
          setProcessing(false);
        }
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed processing checkout payment.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-forest-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-forest-700 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-typography-secondary">Connecting to Gateway...</p>
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="min-h-screen py-16 px-4 text-center max-w-md mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-200 rounded-card flex items-center justify-center mx-auto mb-4 text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-forest-900 mb-2">Payment Session Error</h2>
        <p className="text-xs text-typography-secondary mb-6">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary text-xs px-6 py-2.5 shadow-level-1"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto animate-fade-in text-forest-900">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-semibold text-typography-muted hover:text-forest-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header Banner */}
      <div className="bg-forest-900 text-white border border-forest-800 p-6 sm:p-8 rounded-container mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-level-2">
        <div>
          <div className="flex items-center gap-2 text-leaf text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> 256-Bit Encrypted Gateway
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Complete Payment</h1>
          <p className="text-xs text-sage mt-1">
            {type === 'enrollment' ? 'Confirm your training course enrollment fee.' : 'Confirm payment for your Sporekart order.'}
          </p>
        </div>

        <div className="bg-forest-800 border border-forest-700 p-4 rounded-card text-right shadow-level-1">
          <span className="text-xs text-sage block font-medium">Total Amount Payable</span>
          <span className="text-2xl font-bold text-white font-mono">₹{summary?.amountInr?.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Payment Methods Section */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-surface-white border border-surface-border rounded-container p-6 shadow-level-1 space-y-6">
            {/* Sporekart Wallet Option Card */}
            <div className="mb-6 p-4 bg-surface-cream rounded-card border border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useWallet}
                    onChange={(e) => setUseWallet(e.target.checked)}
                    disabled={availableBal <= 0}
                    className="w-4 h-4 text-forest-700 rounded border-surface-border focus:ring-forest-700"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-typography-primary text-xs flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-forest-700" /> Use Sporekart Wallet Balance
                    </span>
                    <span className="text-[11px] text-typography-muted block">
                      Available Balance: <strong className="text-forest-800 font-mono">₹{availableBal.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>
                </label>

                {useWallet && (
                  <span className="px-2.5 py-1 bg-green-600/10 text-green-700 border border-green-600/20 text-[10px] font-bold rounded-lg uppercase">
                    {isFullyPaidByWallet ? '100% COVERED BY WALLET' : `₹${walletDeduction} APPLIED`}
                  </span>
                )}
              </div>

              {useWallet && (
                <div className="p-3 bg-surface-white rounded-xl border border-surface-border text-xs text-typography-secondary space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Order Total:</span>
                    <span>₹{orderTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-bold">
                    <span>Wallet Contribution:</span>
                    <span>-₹{walletDeduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-typography-primary font-bold border-t border-surface-border pt-1">
                    <span>Remaining Gateway Amount:</span>
                    <span>₹{remainingGatewayAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>

            <h3 className="text-sm font-bold text-forest-900 mb-4 uppercase tracking-wider">
              {isFullyPaidByWallet ? 'Confirm Checkout' : 'Select Gateway Payment Method'}
            </h3>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-card border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all button-press ${
                  paymentMethod === 'UPI'
                    ? 'bg-surface-cream border-forest-700 text-forest-900 shadow-level-1'
                    : 'bg-surface-white border-surface-border text-typography-secondary hover:border-surface-border'
                }`}
              >
                <Smartphone className="w-5 h-5 text-forest-700" />
                <span>UPI / GPay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-card border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all button-press ${
                  paymentMethod === 'CARD'
                    ? 'bg-surface-cream border-forest-700 text-forest-900 shadow-level-1'
                    : 'bg-surface-white border-surface-border text-typography-secondary hover:border-surface-border'
                }`}
              >
                <CreditCard className="w-5 h-5 text-forest-700" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('NETBANKING')}
                className={`p-3 rounded-card border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all button-press ${
                  paymentMethod === 'NETBANKING'
                    ? 'bg-surface-cream border-forest-700 text-forest-900 shadow-level-1'
                    : 'bg-surface-white border-surface-border text-typography-secondary hover:border-surface-border'
                }`}
              >
                <Building2 className="w-5 h-5 text-forest-700" />
                <span>Net Banking</span>
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {paymentMethod === 'UPI' && (
                <div className="space-y-3 bg-surface-cream p-4 rounded-card border border-surface-border">
                  <label className="block text-xs font-semibold text-typography-primary">
                    VPA / UPI ID (Optional for Mock)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. user@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-surface-white border border-surface-border rounded-input px-4 py-2.5 text-xs text-forest-900 placeholder-typography-muted focus:outline-none focus:border-forest-700 shadow-level-1"
                  />
                  <p className="text-[10px] text-typography-muted">Instant authorization using Google Pay, PhonePe, Paytm, or BHIM.</p>
                </div>
              )}

              {paymentMethod === 'CARD' && (
                <div className="space-y-3 bg-surface-cream p-4 rounded-card border border-surface-border">
                  <div>
                    <label className="block text-xs font-semibold text-typography-primary mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8892"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-surface-white border border-surface-border rounded-input px-4 py-2.5 text-xs text-forest-900 placeholder-typography-muted focus:outline-none focus:border-forest-700 shadow-level-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-typography-primary mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-surface-white border border-surface-border rounded-input px-4 py-2.5 text-xs text-forest-900 placeholder-typography-muted focus:outline-none focus:border-forest-700 shadow-level-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-typography-primary mb-1">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength="4"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-surface-white border border-surface-border rounded-input px-4 py-2.5 text-xs text-forest-900 placeholder-typography-muted focus:outline-none focus:border-forest-700 shadow-level-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'NETBANKING' && (
                <div className="space-y-3 bg-surface-cream p-4 rounded-card border border-surface-border">
                  <label className="block text-xs font-semibold text-typography-primary">Select Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full bg-surface-white border border-surface-border rounded-input px-4 py-2.5 text-xs text-forest-900 focus:outline-none focus:border-forest-700 shadow-level-1"
                  >
                    <option value="">-- Choose Popular Bank --</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="SBI">State Bank of India</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="KOTAK">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-input text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={processing || paymentSuccess}
                className="w-full btn-primary font-bold py-3.5 px-6 shadow-level-2 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...
                  </>
                ) : paymentSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" /> Payment Success! Redirecting...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-white" /> Pay ₹{summary?.amountInr?.toLocaleString('en-IN')} Securely
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Summary Details Section */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-surface-white border border-surface-border rounded-container p-6 shadow-level-1 space-y-4">
            <h3 className="text-sm font-bold text-forest-900 uppercase tracking-wider">
              Summary
            </h3>

            <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-pill bg-forest-700/10 text-forest-700 border border-forest-700/30">
                {summary?.type}
              </span>
              <h4 className="text-base font-bold text-forest-900">{summary?.title}</h4>
              {summary?.subtitle && <p className="text-xs text-typography-secondary">{summary?.subtitle}</p>}
            </div>

            <div className="border-t border-surface-border pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-typography-secondary">
                <span>Subtotal</span>
                <span className="text-forest-900 font-mono">₹{summary?.amountInr?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-typography-secondary">
                <span>Gateway Service Fee</span>
                <span className="text-green-600 font-semibold">FREE</span>
              </div>
              <div className="border-t border-surface-border pt-2 flex justify-between font-bold text-sm text-forest-900">
                <span>Total Amount</span>
                <span className="text-forest-700 font-mono">₹{summary?.amountInr?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-3 bg-surface-cream border border-surface-border rounded-input text-[11px] text-typography-secondary flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-forest-700 mt-0.5" />
              <span>
                Mock Gateway active. Click <strong>Pay Securely</strong> to immediately complete authorization and confirm your order/enrollment.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
