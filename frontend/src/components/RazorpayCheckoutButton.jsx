import React, { useState } from 'react';
import { CreditCard, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { razorpayApi } from '../api';
import { openRazorpayCheckout } from '../utils/payment';

/**
 * Razorpay Standard Web Checkout Button Component
 * 
 * 1. Calls backend /api/create-order to create order in Razorpay
 * 2. Opens Razorpay Standard Checkout modal
 * 3. On success, sends payment_id, order_id, signature to /api/verify-payment
 * 4. Handles modal dismissal, payment failure, and error feedback
 */
export default function RazorpayCheckoutButton({
  amount = 500, // Amount in INR or paise
  isAmountInPaise = false,
  currency = 'INR',
  receipt = null,
  orderId = null,
  prefill = {},
  notes = {},
  buttonText,
  className = '',
  disabled = false,
  onSuccess,
  onError,
  onDismiss,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Calculate amount in paise (minimum 100 paise)
  const amountPaise = Math.max(100, isAmountInPaise ? Math.round(amount) : Math.round(amount * 100));
  const amountInr = isAmountInPaise ? (amount / 100).toFixed(2) : amount;

  const handleCheckout = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Backend - Create Order via /api/create-order
      const orderRes = await razorpayApi.createOrder(amountPaise, currency, receipt, orderId);
      const orderData = orderRes.data;

      if (!orderData || !orderData.order_id) {
        throw new Error(orderData?.error || orderData?.message || 'Failed to create payment order on server.');
      }

      // Step 2: Frontend - Open Razorpay Checkout Modal
      const keyId = orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;

      await openRazorpayCheckout({
        keyId,
        orderId: orderData.order_id,
        amount: orderData.amount || amountPaise,
        currency: orderData.currency || currency,
        name: 'Sporekart Agritech',
        description: receipt ? `Payment for ${receipt}` : 'Sporekart Online Checkout',
        prefill,
        notes,
        onSuccess: async (rzpResponse) => {
          try {
            // Step 3: Backend - Verify Payment Signature via /api/verify-payment
            const verifyRes = await razorpayApi.verifyPayment(
              rzpResponse.razorpay_order_id,
              rzpResponse.razorpay_payment_id,
              rzpResponse.razorpay_signature,
              orderId
            );

            if (verifyRes.data && verifyRes.data.verified) {
              setPaymentSuccess(true);
              if (onSuccess) {
                onSuccess(verifyRes.data, rzpResponse);
              }
            } else {
              throw new Error(verifyRes.data?.message || 'Payment signature verification failed.');
            }
          } catch (verifyErr) {
            const verifyMsg = verifyErr.response?.data?.message || verifyErr.message || 'Payment verification failed.';
            setError(verifyMsg);
            if (onError) onError(verifyErr);
          } finally {
            setLoading(false);
          }
        },
        onDismiss: () => {
          setError('Payment cancelled by user.');
          setLoading(false);
          if (onDismiss) onDismiss();
        },
        onError: (failErr) => {
          const failMsg = failErr.details?.description || failErr.message || 'Payment failed at gateway.';
          setError(failMsg);
          setLoading(false);
          if (onError) onError(failErr);
        },
      });

    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Payment initialization failed.';
      setError(errMsg);
      setLoading(false);
      if (onError) onError(err);
    }
  };

  return (
    <div className="space-y-2 w-full">
      {error && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Payment Notice</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-700 text-xs font-bold px-1"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {paymentSuccess && (
        <div
          role="status"
          className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center gap-2 animate-fade-in"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
          <span>Payment verified successfully! Order confirmed.</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || loading || paymentSuccess}
        data-testid="razorpay-checkout-button"
        className={
          className ||
          'w-full bg-[#1b4332] hover:bg-[#143326] text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
        }
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing Checkout...</span>
          </>
        ) : paymentSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>Payment Confirmed</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>{buttonText || `Pay ₹${Number(amountInr).toLocaleString('en-IN')} with Razorpay`}</span>
            <Lock className="w-3.5 h-3.5 text-white/70 ml-1" />
          </>
        )}
      </button>
    </div>
  );
}
