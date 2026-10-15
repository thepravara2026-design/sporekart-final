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
