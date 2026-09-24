import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { authApi } from '../api';
import GoogleLoginButton from './GoogleLoginButton';
import { useCart } from '../context/CartContext';

export default function AuthForm({ onSuccess, setUser, title = "Login or Register Account", subtitle = "Enter your mobile number or email to continue" }) {
  const { mergeGuestCart } = useCart();
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Auth Custom Profile Name State
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(null);
  const [googleProfileName, setGoogleProfileName] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    if (!identifier || !identifier.trim()) {
      setAuthError('Please enter a valid mobile number or email');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.requestOtp(identifier.trim());
      setOtpSent(true);
      setAuthMessage(`OTP sent to ${identifier}. (Dev code: ${res.data.data})`);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Failed to send OTP. Please check input.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!otpCode || otpCode.trim().length !== 6) {
      setAuthError('Please enter 6-digit OTP code');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(identifier.trim(), otpCode.trim(), fullName.trim());
      const authData = res.data.data;
      localStorage.setItem('sporekart_token', authData.token);
      if (setUser) setUser(authData);
      if (mergeGuestCart) await mergeGuestCart();
      if (onSuccess) onSuccess(authData);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid OTP code. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Triggered when Google Auth payload is received (stops to prompt for profile name)
  const handleGoogleAuthReceived = (googleAuthData) => {
    setAuthError('');
    setAuthMessage('');
    setPendingGoogleAuth(googleAuthData);
    const initialName = googleAuthData.fullName || `${googleAuthData.firstName || ''} ${googleAuthData.lastName || ''}`.trim() || 'Google Grower';
    setGoogleProfileName(initialName);
  };

  // Submits Google Auth using default Google account profile name without forcing custom input
  const handleSkipGoogleProfile = async () => {
    setAuthError('');
    setLoading(true);
    try {
      const defaultName = pendingGoogleAuth.fullName || `${pendingGoogleAuth.firstName || ''} ${pendingGoogleAuth.lastName || ''}`.trim() || 'Google Grower';
      const parts = defaultName.split(' ');
      const firstName = parts[0] || defaultName;
      const lastName = parts.slice(1).join(' ') || '';

      const finalPayload = {
        ...pendingGoogleAuth,
        fullName: defaultName,
        firstName,
        lastName,
      };

      const res = await authApi.loginWithGoogle(finalPayload);
      const authData = res.data.data;
      localStorage.setItem('sporekart_token', authData.token);
      if (setUser) setUser(authData);
      if (mergeGuestCart) await mergeGuestCart();
      if (onSuccess) onSuccess(authData);
      setPendingGoogleAuth(null);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Google Auth Failed');
    } finally {
      setLoading(false);
    }
  };

  // Submits Google Auth with user's confirmed/edited profile name
  const handleConfirmGoogleProfileSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!googleProfileName || !googleProfileName.trim()) {
      setAuthError('Please enter a valid profile name');
      return;
    }

    setLoading(true);
    try {
      const trimmedName = googleProfileName.trim();
      const parts = trimmedName.split(' ');
      const firstName = parts[0] || trimmedName;
      const lastName = parts.slice(1).join(' ') || '';

      const finalPayload = {
        ...pendingGoogleAuth,
        fullName: trimmedName,
        firstName,
        lastName,
      };

      const res = await authApi.loginWithGoogle(finalPayload);
      const authData = res.data.data;
      localStorage.setItem('sporekart_token', authData.token);
      if (setUser) setUser(authData);
      if (mergeGuestCart) await mergeGuestCart();
      if (onSuccess) onSuccess(authData);
      setPendingGoogleAuth(null);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Google Auth Failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Render Google Auth Profile Name Confirmation View
  if (pendingGoogleAuth) {
    return (
      <div className="space-y-4 max-w-md mx-auto animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-br from-spore-900 via-slate-900 to-emerald-950 border border-spore-500/40 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-spore-950/60 relative">
            <UserCheck className="w-6 h-6 text-spore-400" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[9px] font-extrabold text-slate-950">✓</span>
          </div>
          
          <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 px-3 py-1 rounded-full text-xs text-slate-300">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.8-.9-1.3-2.1-1.3-3.6z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
            </svg>
            <span className="font-medium truncate max-w-[200px]">{pendingGoogleAuth.email}</span>
          </div>

          <h3 className="text-xl font-display font-bold text-white tracking-tight">Set Profile Name</h3>
          <p className="text-xs text-slate-400">
            Customize your display name or skip to use your default Google profile name.
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-300">
            ⚠️ {authError}
          </div>
        )}

        <form onSubmit={handleConfirmGoogleProfileSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span>Profile / Display Name (Optional)</span>
              <span className="text-[10px] text-spore-400 flex items-center gap-1 font-normal"><Sparkles className="w-3 h-3" /> Customize</span>
            </label>
            <input
              type="text"
              placeholder="Enter full name (e.g. Suresh Kumar)"
              value={googleProfileName}
              onChange={(e) => setGoogleProfileName(e.target.value)}
              autoFocus
              className="w-full bg-slate-900/90 border border-spore-600/60 focus:border-spore-400 focus:ring-1 focus:ring-spore-400 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              You can edit this now or skip to use your Google account default name.
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all button-press flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span>Saving Profile & Continuing...</span>
              ) : (
                <>
                  <span>Save Profile Name & Continue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSkipGoogleProfile}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-all button-press"
            >
              Skip & Use Default Google Name
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setPendingGoogleAuth(null);
              setAuthError('');
            }}
            className="w-full text-xs text-slate-400 hover:text-white pt-1 transition-colors text-center block"
          >
            ← Change authentication method
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="text-center space-y-1">
        <div className="w-10 h-10 bg-spore-900/80 border border-spore-600/40 rounded-xl mx-auto flex items-center justify-center shadow-inner">
          <ShieldCheck className="w-5 h-5 text-spore-400" />
        </div>
        <h3 className="text-xl font-display font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      {authError && (
        <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-300">
          ⚠️ {authError}
        </div>
      )}

      {authMessage && (
        <div className="p-3 bg-spore-950/90 border border-spore-600/60 rounded-xl text-xs text-spore-300">
          ✅ {authMessage}
        </div>
      )}

      {!otpSent ? (
        <div className="space-y-4">
          <GoogleLoginButton
            onSuccess={handleGoogleAuthReceived}
            onError={(err) => setAuthError(err)}
            loading={loading}
            setLoading={setLoading}
          />

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-950 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider absolute">
              or mobile / email OTP
            </span>
          </div>

          <form onSubmit={handleRequestOtp} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Mobile Number or Email</label>
              <input
                type="text"
                placeholder="e.g. +91 9876543210 or user@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-spore-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-spore-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all button-press flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending OTP...' : 'Send OTP Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1 flex items-center justify-between">
              <span>Full Name (Optional Registration Detail)</span>
              <span className="text-[10px] text-slate-400 font-normal">Fill now or later</span>
            </label>
            <input
              type="text"
              placeholder="Your Full Name (e.g. Praveen Kumar)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-900/90 border border-spore-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-spore-400 mb-3"
            />
            <label className="block text-xs text-slate-300 font-medium mb-1">6-Digit OTP Code</label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              required
              className="w-full bg-slate-900/90 border border-spore-700/50 rounded-xl px-4 py-2.5 text-white text-sm text-center tracking-widest font-mono focus:outline-none focus:border-spore-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all button-press"
          >
            {loading ? 'Verifying Account...' : 'Verify OTP & Complete Account'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setOtpCode('');
            }}
            className="w-full text-xs text-slate-400 hover:text-white pt-1"
          >
            ← Change mobile number / email
          </button>
        </form>
      )}
    </div>
  );
}
