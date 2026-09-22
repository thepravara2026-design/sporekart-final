import React, { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
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

  const handleGoogleSuccess = async (googleAuthData) => {
    setAuthError('');
    setAuthMessage('');
    setLoading(true);
    try {
      const res = await authApi.loginWithGoogle(googleAuthData);
      const authData = res.data.data;
      localStorage.setItem('sporekart_token', authData.token);
      if (setUser) setUser(authData);
      if (mergeGuestCart) await mergeGuestCart();
      if (onSuccess) onSuccess(authData);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Google Auth Failed');
    } finally {
      setLoading(false);
    }
  };

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
            onSuccess={handleGoogleSuccess}
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
            <label className="block text-xs text-slate-300 font-medium mb-1">Full Name (New Registrations)</label>
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
            {loading ? 'Verifying Account...' : 'Verify OTP & Continue'}
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
