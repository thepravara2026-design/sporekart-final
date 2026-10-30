import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, X } from 'lucide-react';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return !localStorage.getItem('sporekart_cookie_consent');
    } catch {
      return false;
    }
  });

  const handleAccept = () => {
    try {
      localStorage.setItem('sporekart_cookie_consent', 'accepted');
    } catch {}
    setIsVisible(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('sporekart_cookie_consent', 'dismissed');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie and storage preferences notice"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-40 animate-slide-up"
    >
      <div className="bg-forest-950/95 text-white p-4 rounded-2xl border border-emerald-500/30 shadow-level-3 backdrop-blur-md space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-white">
                Cache &amp; Cookie Transparency
              </h4>
              <p className="text-[10px] text-emerald-400/90 font-medium">
                High-Performance Web &amp; Security
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss cookie notice"
            className="text-sage/60 hover:text-white transition-colors p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-sage/90 leading-relaxed">
          We use high-speed browser caching and essential cookies for persistent cart storage, sub-second page rendering, and PCI-DSS Razorpay checkout security. Zero third-party ad tracking.
        </p>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-forest-800/80">
          <Link
            to="/cookie-policy"
            onClick={() => setIsVisible(false)}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 transition-colors"
          >
            Read Policy Details
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAccept}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all duration-200"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
