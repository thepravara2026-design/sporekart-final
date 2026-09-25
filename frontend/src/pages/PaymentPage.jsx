import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, CreditCard, Smartphone, Building2, CheckCircle2, 
  AlertCircle, Lock, ArrowLeft, Loader2, Sparkles
} from 'lucide-react';
import { paymentApi } from '../api';
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
  }, [type, id]);

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

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    // Simulate payment gateway authorization delay
    setTimeout(async () => {
      try {
        if (type === 'enrollment') {
          const res = await paymentApi.verifyEnrollmentPayment(
            id,
            `MOCK_${paymentMethod}`,
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
          // For product order mock payment verification:
          // Initiate payment order and verify with mock payment ID
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
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-spore-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Connecting to Gateway...</p>
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="min-h-screen py-16 px-4 text-center max-w-md mx-auto">
        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Payment Session Error</h2>
        <p className="text-xs text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto animate-fade-in text-white">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-spore-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-spore-400 text-xs font-extrabold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> 256-Bit Encrypted Gateway
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold">Complete Payment</h1>
          <p className="text-xs text-slate-400 mt-1">
            {type === 'enrollment' ? 'Confirm your training course enrollment fee.' : 'Confirm payment for your Sporekart order.'}
          </p>
        </div>

        <div className="bg-slate-950/80 border border-spore-500/30 p-4 rounded-2xl text-right">
          <span className="text-xs text-slate-400 block font-medium">Total Amount Payable</span>
          <span className="text-2xl font-black text-spore-400 font-mono">₹{summary?.amountInr?.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Payment Methods Section */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-slate-400">
              Select Payment Method
            </h3>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-spore-500/10 border-spore-400 text-spore-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>UPI / GPay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${
                  paymentMethod === 'CARD'
                    ? 'bg-spore-500/10 border-spore-400 text-spore-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('NETBANKING')}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${
                  paymentMethod === 'NETBANKING'
                    ? 'bg-spore-500/10 border-spore-400 text-spore-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Building2 className="w-5 h-5 text-sky-400" />
                <span>Net Banking</span>
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {paymentMethod === 'UPI' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300">
                    VPA / UPI ID (Optional for Mock)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. user@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-spore-400"
                  />
                  <p className="text-[10px] text-slate-500">Instant authorization using Google Pay, PhonePe, Paytm, or BHIM.</p>
                </div>
              )}

              {paymentMethod === 'CARD' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8892"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-spore-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-spore-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength="4"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-spore-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'NETBANKING' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300">Select Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-spore-400"
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
                <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={processing || paymentSuccess}
                className="w-full bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-lg transition-all button-press flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...
                  </>
                ) : paymentSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-slate-950" /> Payment Success! Redirecting...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-950" /> Pay ₹{summary?.amountInr?.toLocaleString('en-IN')} Securely
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Summary Details Section */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
              Summary
            </h3>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-spore-500/20 text-spore-400 border border-spore-500/30">
                {summary?.type}
              </span>
              <h4 className="text-base font-extrabold text-white">{summary?.title}</h4>
              {summary?.subtitle && <p className="text-xs text-slate-400">{summary?.subtitle}</p>}
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-white font-mono">₹{summary?.amountInr?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gateway Service Fee</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm text-white">
                <span>Total Amount</span>
                <span className="text-spore-400 font-mono">₹{summary?.amountInr?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/30 border border-emerald-800/30 rounded-xl text-[11px] text-emerald-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
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
