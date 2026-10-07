import React from 'react';
import { ShieldAlert, LogIn, ArrowRight, X, PhoneCall, Mail } from 'lucide-react';

export default function IdentityConflictModal({
  isOpen,
  onClose,
  conflictingValue,
  conflictingField = 'phone',
  onOpenLogin,
}) {
  if (!isOpen) return null;

  const isPhone = conflictingField === 'phone' || (conflictingValue && /^\+?[0-9\s-]+$/.test(conflictingValue));

  const handleLoginClick = () => {
    onClose();
    if (onOpenLogin) {
      onOpenLogin(conflictingValue);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-forest-950/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-surface-white border border-amber-200/80 w-full max-w-lg rounded-[24px] p-6 sm:p-8 relative shadow-level-3 space-y-6 overflow-hidden">
        
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-forest-700/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-typography-muted hover:text-forest-900 p-2 rounded-full hover:bg-surface-cream transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Banner */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0 shadow-sm">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
              Account Security Alert
            </span>
            <h3 className="text-xl font-bold text-forest-900 mt-1">
              Account Already Registered
            </h3>
          </div>
        </div>

        {/* Highlighted Conflicting Credential Card */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-card space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
            {isPhone ? <PhoneCall className="w-4 h-4 text-amber-700" /> : <Mail className="w-4 h-4 text-amber-700" />}
            <span>Registered {isPhone ? 'Phone Number' : 'Email Address'}</span>
          </div>
          <div className="text-lg font-mono font-extrabold text-forest-900 bg-surface-white px-3 py-2 rounded-input border border-amber-300/60 inline-block shadow-sm">
            {conflictingValue || 'Already Registered Identity'}
          </div>
          <p className="text-xs text-typography-secondary leading-relaxed pt-1">
            This {isPhone ? 'phone number' : 'email'} is already linked to an existing Sporekart customer profile. To ensure your order history, digital training certificates, and wallet rewards remain uniform, multiple accounts cannot share the same contact identity.
          </p>
        </div>

        {/* Action Recommendations */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handleLoginClick}
            className="w-full btn-primary py-3.5 px-5 rounded-input text-xs font-bold flex items-center justify-center gap-2 shadow-level-2 bg-gradient-to-r from-forest-800 to-forest-700 hover:from-forest-900 hover:to-forest-800 transition-all text-surface-white"
          >
            <LogIn className="w-4 h-4" />
            <span>Log In With Registered Account</span>
            <ArrowRight className="w-4 h-4 ml-auto opacity-70" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-5 rounded-input text-xs font-bold text-forest-800 hover:text-forest-950 bg-surface-cream hover:bg-forest-900/10 border border-surface-border transition-colors flex items-center justify-center gap-2"
          >
            <span>Use a Different {isPhone ? 'Phone Number' : 'Email Address'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
