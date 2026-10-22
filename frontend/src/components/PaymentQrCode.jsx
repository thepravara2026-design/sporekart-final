import React, { useState, useEffect } from 'react';
import { Smartphone, Copy, Check, Clock, ShieldCheck, Sparkles, QrCode } from 'lucide-react';

export default function PaymentQrCode({ amount, orderId, onSimulateSuccess }) {
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCopyVpa = () => {
    navigator.clipboard?.writeText('sporekart.agro@razorpay');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upiIntentUri = `upi://pay?pa=sporekart.agro@razorpay&pn=Sporekart%20Agritech&am=${amount}&cu=INR&tr=${orderId || 'spk_' + Date.now()}`;

  return (
    <div className="bg-surface-white border border-surface-border rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header with live timer */}
      <div className="flex items-center justify-between border-b border-surface-border/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-700">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-forest-900">Instant Dynamic UPI QR</h4>
            <p className="text-[10px] text-typography-muted">Scan using any UPI application</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 text-xs font-mono font-bold">
          <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600" />
          <span>{formatTimer(secondsLeft)}</span>
        </div>
      </div>

      {/* High-res Crisp QR Code Presentation */}
      <div className="flex flex-col sm:flex-row items-center gap-5 justify-center py-2">
        <div className="relative p-3 bg-white rounded-2xl border-2 border-forest-800/20 shadow-md">
          {/* Authentic SVG QR Code with Position Detection Corners */}
          <svg
            className="w-44 h-44 sm:w-48 sm:h-48"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background */}
            <rect width="160" height="160" fill="white" rx="8" />

            {/* Top-Left Position Marker */}
            <rect x="12" y="12" width="40" height="40" rx="6" fill="#143e2b" />
            <rect x="20" y="20" width="24" height="24" rx="3" fill="white" />
            <rect x="26" y="26" width="12" height="12" rx="2" fill="#143e2b" />

            {/* Top-Right Position Marker */}
            <rect x="108" y="12" width="40" height="40" rx="6" fill="#143e2b" />
            <rect x="116" y="20" width="24" height="24" rx="3" fill="white" />
            <rect x="122" y="26" width="12" height="12" rx="2" fill="#143e2b" />

            {/* Bottom-Left Position Marker */}
            <rect x="12" y="108" width="40" height="40" rx="6" fill="#143e2b" />
            <rect x="20" y="116" width="24" height="24" rx="3" fill="white" />
            <rect x="26" y="122" width="12" height="12" rx="2" fill="#143e2b" />

            {/* Timing Patterns & High Density QR Matrix Bars */}
            <g fill="#1a4332">
              <rect x="60" y="16" width="6" height="6" rx="1" />
              <rect x="72" y="16" width="6" height="6" rx="1" />
              <rect x="84" y="16" width="6" height="6" rx="1" />
              <rect x="96" y="16" width="6" height="6" rx="1" />

              <rect x="60" y="28" width="6" height="6" rx="1" />
              <rect x="78" y="28" width="12" height="6" rx="1" />
              <rect x="96" y="28" width="6" height="6" rx="1" />

              <rect x="16" y="60" width="6" height="6" rx="1" />
              <rect x="28" y="60" width="6" height="6" rx="1" />
              <rect x="40" y="60" width="6" height="6" rx="1" />
              <rect x="60" y="60" width="6" height="6" rx="1" />
              <rect x="72" y="60" width="18" height="6" rx="1" />
              <rect x="96" y="60" width="6" height="6" rx="1" />
              <rect x="108" y="60" width="6" height="6" rx="1" />
              <rect x="120" y="60" width="6" height="6" rx="1" />
              <rect x="138" y="60" width="6" height="6" rx="1" />

              <rect x="60" y="72" width="12" height="6" rx="1" />
              <rect x="88" y="72" width="6" height="6" rx="1" />
              <rect x="102" y="72" width="12" height="6" rx="1" />
              <rect x="126" y="72" width="6" height="6" rx="1" />

              <rect x="60" y="84" width="6" height="6" rx="1" />
              <rect x="78" y="84" width="6" height="6" rx="1" />
              <rect x="96" y="84" width="12" height="6" rx="1" />
              <rect x="114" y="84" width="6" height="6" rx="1" />
              <rect x="132" y="84" width="12" height="6" rx="1" />

              <rect x="60" y="96" width="18" height="6" rx="1" />
              <rect x="90" y="96" width="6" height="6" rx="1" />
              <rect x="108" y="96" width="18" height="6" rx="1" />
              <rect x="138" y="96" width="6" height="6" rx="1" />

              <rect x="60" y="108" width="6" height="6" rx="1" />
              <rect x="72" y="108" width="12" height="6" rx="1" />
              <rect x="96" y="108" width="6" height="6" rx="1" />
              <rect x="120" y="108" width="6" height="6" rx="1" />
              <rect x="138" y="108" width="10" height="6" rx="1" />

              <rect x="60" y="120" width="12" height="6" rx="1" />
              <rect x="84" y="120" width="6" height="6" rx="1" />
              <rect x="102" y="120" width="6" height="6" rx="1" />
              <rect x="114" y="120" width="18" height="6" rx="1" />

              <rect x="60" y="132" width="6" height="6" rx="1" />
              <rect x="78" y="132" width="18" height="6" rx="1" />
              <rect x="108" y="132" width="6" height="6" rx="1" />
              <rect x="126" y="132" width="18" height="6" rx="1" />

              <rect x="60" y="144" width="18" height="6" rx="1" />
              <rect x="90" y="144" width="12" height="6" rx="1" />
              <rect x="114" y="144" width="6" height="6" rx="1" />
              <rect x="132" y="144" width="12" height="6" rx="1" />
            </g>

            {/* Central Sporekart Brand Insignia */}
            <circle cx="80" cy="80" r="16" fill="white" />
            <circle cx="80" cy="80" r="14" fill="#143e2b" />
            <path
              d="M75 75 C75 72, 85 72, 85 75 C87 77, 85 81, 80 81 C75 81, 73 77, 75 75 Z"
              fill="#d4af37"
            />
            <rect x="78" y="81" width="4" height="6" rx="1" fill="#f8fafc" />
          </svg>

          {/* Amount Badge in Center of bottom card */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-forest-900 text-gold text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-gold/40 shadow-sm whitespace-nowrap">
            ₹{amount?.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Scan Instructions & Supported Apps */}
        <div className="space-y-3 text-left max-w-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase">
              BHIM UPI 2.0 Dynamic
            </span>
            <p className="text-xs font-semibold text-forest-900 pt-1">
              Scan with GPay, PhonePe, Paytm, or any UPI App to pay ₹{amount?.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-2.5 bg-surface-cream rounded-xl border border-surface-border space-y-1.5 text-[11px] text-typography-secondary">
            <div className="flex items-center justify-between">
              <span className="font-mono text-typography-muted">UPI ID:</span>
              <button
                type="button"
                onClick={handleCopyVpa}
                className="font-mono font-bold text-forest-900 hover:text-forest-700 flex items-center gap-1 transition-colors"
              >
                <span>sporekart.agro@razorpay</span>
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-typography-muted">Convenience Fee:</span>
              <span className="font-bold text-green-700">₹0 (Free)</span>
            </div>
          </div>

          {/* Supported UPI Apps Badges */}
          <div className="pt-1">
            <div className="text-[10px] text-typography-muted mb-1 font-semibold uppercase tracking-wider">
              Supported Payment Apps
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'CRED', 'Amazon Pay'].map((app) => (
                <span
                  key={app}
                  className="px-2 py-0.5 bg-surface-neutral border border-surface-border text-[10px] font-semibold text-typography-secondary rounded-md"
                >
                  {app}
                </span>
              ))}
            </div>
          </div>

          {/* Fallback Intent link on Mobile */}
          <div className="pt-1">
            <a
              href={upiIntentUri}
              className="inline-flex sm:hidden items-center justify-center gap-1.5 w-full py-2 px-3 bg-forest-900 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5 text-gold" /> Pay via Installed UPI App
            </a>
          </div>
        </div>
      </div>

      {/* Dev Mode Simulation Action */}
      {onSimulateSuccess && (
        <div className="pt-2 border-t border-surface-border/70 flex items-center justify-between text-[11px]">
          <span className="text-typography-muted flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Test Mode Gateway Simulator
          </span>
          <button
            type="button"
            onClick={onSimulateSuccess}
            className="text-xs font-bold text-forest-800 hover:text-forest-900 bg-forest-700/10 hover:bg-forest-700/20 px-2.5 py-1 rounded-md transition-colors"
          >
            Simulate Instant QR Scan Success →
          </button>
        </div>
      )}
    </div>
  );
}
