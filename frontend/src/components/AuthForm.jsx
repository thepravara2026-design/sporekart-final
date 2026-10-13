import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, UserCheck, Sparkles, Lock } from 'lucide-react';
import { authApi } from '../api';
import GoogleLoginButton from './GoogleLoginButton';
import { useCart } from '../context/CartContext';

export default function AuthForm({
  onSuccess,
  setUser,
  initialAdminMode = false,
  title,
  subtitle,
}) {
  const { mergeGuestCart } = useCart();
  const [isAdminMode] = useState(initialAdminMode);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(null);
  const [googleProfileName, setGoogleProfileName] = useState('');

  // Triggered when Google Auth payload is received (logs in immediately and merges cart)
  const handleGoogleAuthReceived = async (googleAuthData) => {
    setAuthError('');
    setAuthMessage('');
    if (isAdminMode && googleAuthData.email?.toLowerCase() !== 'thepravara2026@gmail.com') {
      setAuthError('Access Denied: Only thepravara2026@gmail.com is authorized to access the Admin Control Plane.');
      return;
    }
    setLoading(true);
    try {
      const defaultName = googleAuthData.fullName || `${googleAuthData.firstName || ''} ${googleAuthData.lastName || ''}`.trim() || 'Google Grower';
      const parts = defaultName.split(' ');
      const firstName = parts[0] || defaultName;
      const lastName = parts.slice(1).join(' ') || '';

      const finalPayload = {
        ...googleAuthData,
        fullName: defaultName,
        firstName,
        lastName,
      };

      const res = await authApi.loginWithGoogle(finalPayload);
      const authData = res.data.data;
      localStorage.setItem('sporekart_token', authData.token);
      if (mergeGuestCart && authData.role !== 'ROLE_ADMIN') await mergeGuestCart();
      if (setUser) setUser(authData);
      if (onSuccess) onSuccess(authData);

      // If logged in as Admin, redirect to Admin dashboard
      if (authData.role === 'ROLE_ADMIN' || authData.email?.toLowerCase() === 'thepravara2026@gmail.com' || isAdminMode) {
        window.location.href = '/admin';
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Google Auth Failed. Please ensure your Google account is registered or authorized.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipGoogleProfile = async () => {
    if (!pendingGoogleAuth) return;
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
      if (mergeGuestCart && authData.role !== 'ROLE_ADMIN') await mergeGuestCart();
      if (setUser) setUser(authData);
      if (onSuccess) onSuccess(authData);
      setPendingGoogleAuth(null);

      if (authData.role === 'ROLE_ADMIN' || isAdminMode) {
        window.location.href = '/admin';
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Google Auth Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGoogleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!pendingGoogleAuth) return;
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
      if (mergeGuestCart && authData.role !== 'ROLE_ADMIN') await mergeGuestCart();
      if (setUser) setUser(authData);
      if (onSuccess) onSuccess(authData);
      setPendingGoogleAuth(null);

      if (authData.role === 'ROLE_ADMIN' || isAdminMode) {
        window.location.href = '/admin';
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Google Auth Failed');
    } finally {
      setLoading(false);
    }
  };

  const displayTitle = title || (isAdminMode ? 'Admin Portal Sign-In' : 'Sign In to Sporekart');
  const displaySubtitle = subtitle || (isAdminMode
    ? 'Sign in with your authorized Google Admin Account'
    : 'Continue securely with your Google Account');

  if (pendingGoogleAuth) {
    return (
      <div className="space-y-4 max-w-md mx-auto animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-surface-cream border border-surface-border rounded-container mx-auto flex items-center justify-center shadow-level-1 relative">
            <UserCheck className="w-6 h-6 text-forest-700" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-600 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-extrabold text-white">✓</span>
          </div>
          
          <div className="inline-flex items-center gap-2 bg-surface-neutral border border-surface-border px-3 py-1 rounded-pill text-xs text-typography-secondary">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.8-.9-1.3-2.1-1.3-3.6z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
            </svg>
            <span className="font-medium truncate max-w-[200px]">{pendingGoogleAuth.email}</span>
          </div>

          <h3 className="text-xl font-display font-bold text-forest-900 tracking-tight">Confirm Profile Name</h3>
          <p className="text-xs text-typography-secondary">
            Customize your display name or continue with your default Google account name.
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-input text-xs text-rose-700">
            ⚠️ {authError}
          </div>
        )}

        <form onSubmit={handleConfirmGoogleProfileSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-typography-primary mb-1 flex items-center justify-between">
              <span>Display Name</span>
              <span className="text-[10px] text-forest-700 flex items-center gap-1 font-normal"><Sparkles className="w-3 h-3" /> Optional</span>
            </label>
            <input
              type="text"
              placeholder="Enter full name"
              value={googleProfileName}
              onChange={(e) => setGoogleProfileName(e.target.value)}
              autoFocus
              className="w-full bg-surface-white border border-surface-border focus:border-forest-700 rounded-input px-4 py-2.5 text-forest-900 text-sm outline-none transition-all shadow-level-1"
            />
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 group shadow-level-1"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Save Name & Continue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSkipGoogleProfile}
              className="w-full btn-secondary py-2.5 text-xs"
            >
              Use Default Google Name
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-1">
        <div
          className={`w-10 h-10 rounded-input mx-auto flex items-center justify-center shadow-level-1 transition-colors ${
            isAdminMode
              ? 'bg-gold/15 border border-gold/40 text-soil'
              : 'bg-surface-cream border border-surface-border text-forest-700'
          }`}
        >
          {isAdminMode ? <Lock className="w-5 h-5 text-gold" /> : <ShieldCheck className="w-5 h-5 text-forest-700" />}
        </div>
        <h3 className="text-xl font-display font-bold text-forest-900 flex items-center justify-center gap-2">
          <span>{displayTitle}</span>
          {isAdminMode && (
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-pill bg-gold/20 text-soil border border-gold/40">
              ROLE_ADMIN
            </span>
          )}
        </h3>
        <p className="text-xs text-typography-secondary">{displaySubtitle}</p>
      </div>

      {authError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-input text-xs text-rose-700">
          ⚠️ {authError}
        </div>
      )}

      {authMessage && (
        <div className="p-3 bg-green-600/10 border border-green-600/30 text-green-700 text-xs rounded-input">
          ✅ {authMessage}
        </div>
      )}

      <div className="space-y-4 pt-2">
        <GoogleLoginButton
          onSuccess={handleGoogleAuthReceived}
          onError={(err) => setAuthError(err)}
          loading={loading}
          setLoading={setLoading}
          isAdminMode={isAdminMode}
        />

        <p className="text-center text-[11px] text-typography-muted">
          Sporekart supports secure Google OAuth 2.0 authentication exclusively.
        </p>
      </div>
    </div>
  );
}
