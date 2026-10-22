/**
 * Razorpay Checkout SDK Loader
 * Securely and dynamically injects https://checkout.razorpay.com/v1/checkout.js
 * PCI-DSS SAQ A Compliant — guarantees no raw cardholder data touches application DOM/inputs
 */

let scriptLoadingPromise = null;

export const loadRazorpayCheckoutScript = () => {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true);
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve) => {
    const existingScript = document.getElementById('razorpay-checkout-sdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptLoadingPromise = null;
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
};

/**
 * Open Razorpay Standard Checkout modal with complete event handling
 * Handles:
 * - create-order receipt/order_id
 * - payment success callback
 * - modal ondismiss (user cancelled)
 * - payment.failed event
 */
export const openRazorpayCheckout = async ({
  keyId,
  orderId,
  amount,
  currency = 'INR',
  name = 'Sporekart Agritech',
  description = 'Order Payment',
  prefill = {},
  notes = {},
  theme = { color: '#1a4332' },
  onSuccess,
  onDismiss,
  onError,
}) => {
  await loadRazorpayCheckoutScript();

  if (typeof window === 'undefined' || !window.Razorpay) {
    const err = new Error('Razorpay Checkout SDK could not be loaded.');
    if (onError) onError(err);
    throw err;
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount,
      currency,
      name,
      description,
      order_id: orderId,
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: prefill.contact || '',
      },
      notes,
      theme,
      modal: {
        ondismiss: () => {
          const dismissErr = new Error('Payment cancelled by user.');
          dismissErr.code = 'MODAL_DISMISSED';
          if (onDismiss) onDismiss();
          if (onError) onError(dismissErr);
          reject(dismissErr);
        },
      },
      handler: (response) => {
        // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
        if (onSuccess) onSuccess(response);
        resolve(response);
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (failResponse) => {
      const errorMsg = failResponse.error?.description || 'Payment failed at gateway.';
      const failErr = new Error(errorMsg);
      failErr.details = failResponse.error;
      if (onError) onError(failErr);
      reject(failErr);
    });

    rzp.open();
  });
};
