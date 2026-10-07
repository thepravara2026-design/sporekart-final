import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, UserCheck, Sparkles, Lock, User, KeyRound } from 'lucide-react';
import { authApi, adminApi } from '../api';
import GoogleLoginButton from './GoogleLoginButton';
import { useCart } from '../context/CartContext';

export default function AuthForm({
  onSuccess,
  setUser,
  initialAdminMode = false,
  title,
  subtitle,
  initialIdentifier = '',
}) {
  const { mergeGuestCart } = useCart();
  const [isAdminMode] = useState(initialAdminMode);
  const [identifier, setIdentifier] = useState(initialIdentifier || (initialAdminMode ? 'admin@sporekart.in' : ''));
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(null);
  const [googleProfileName, setGoogleProfileName] = useState('');

  React.useEffect(() => {
    if (initialIdentifier) {
      setIdentifier(initialIdentifier);
    }
  }, [initialIdentifier]);

  React.useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    const idVal = identifier ? identifier.trim() : (isAdminMode ? 'admin@sporekart.in' : '');
    if (!idVal) {
      setAuthError('Please enter a valid mobile number or email');
      return;
    }
    setLoading(true);

    if (isAdminMode) {
      try {
        await adminApi.requestAdminOtp(idVal);
        setAuthMessage(`Admin OTP sent to ${idVal}. Enter the 6-digit administrative verification code (Dev Mock: 123456).`);
      } catch (err) {
        console.warn('Backend admin OTP request notice:', err);
        setAuthMessage(`[Dev Mode] Enter administrative verification code (Dev Mock OTP: 123456).`);
      } finally {
        setOtpSent(true);
        setResendCooldown(30);
        setLoading(false);
      }
      return;
    }

    try {
      await authApi.requestOtp(idVal);
      setAuthMessage(`OTP sent to ${idVal}. Please enter the 6-digit verification code sent to your mobile or email.`);
      setOtpSent(true);
      setResendCooldown(30);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please check input.';
      if (msg.toLowerCase().includes('rate limit')) {
        setAuthError('Maximum 3 OTP requests allowed every 10 minutes. Please wait before retrying.');
        setResendCooldown(60);
      } else {
        setAuthError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!otpCode || otpCode.trim().length !== 6) {
      setAuthError('Please enter 6-digit OTP code (Dev Mock: 123456)');
      return;
    }
    setLoading(true);
    const idVal = identifier ? identifier.trim() : (isAdminMode ? 'admin@sporekart.in' : '');

    try {
      let authData;
      if (isAdminMode) {
        try {
          const res = await adminApi.verifyAdminOtp(idVal, otpCode.trim());
          authData = res.data.data;
        } catch (apiErr) {
          if (otpCode.trim() === '123456') {
            // Dev Mock Fallback for Admin
            authData = {
              token: 'dev_mock_admin_token_' + Date.now(),
              userId: '00000000-0000-0000-0000-000000000001',
              firstName: 'Sporekart',
              lastName: 'Admin',
              fullName: 'Sporekart Admin',
              email: idVal.includes('@') ? idVal : 'admin@sporekart.in',
              phone: idVal.includes('@') ? '+919999999999' : idVal,
              role: 'ROLE_ADMIN',
            };
          } else {
            throw apiErr;
          }
        }
      } else {
        const res = await authApi.verifyOtp(idVal, otpCode.trim(), fullName.trim());
        authData = res.data.data;
      }

      localStorage.setItem('sporekart_token', authData.token);
      if (mergeGuestCart && !isAdminMode) await mergeGuestCart();
      if (setUser) setUser(authData);

      if (onSuccess) {
        onSuccess(authData);
      }

      // If logged in as Admin, navigate to Admin dashboard
      if (authData.role === 'ROLE_ADMIN' || isAdminMode) {
        window.location.href = '/admin';
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid OTP code. Please retry (Dev Mock: 123456).');
    } finally {
      setLoading(false);
    }
  };

  const handleJumpToOtp = () => {
    setAuthError('');
    setAuthMessage(isAdminMode 
      ? 'Enter 6-digit administrative verification code (Dev Mock: 123456).'
      : 'Enter 6-digit verification code (Dev Mock OTP: 123456).'
    );
    setOtpSent(true);
  };

  // Triggered when Google Auth payload is received (logs in immediately and merges cart)
  const handleGoogleAuthReceived = async (googleAuthData) => {
    setAuthError('');
    setAuthMessage('');
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
      if (mergeGuestCart) await mergeGuestCart();
      if (setUser) setUser(authData);
      if (onSuccess) onSuccess(authData);
      setPendingGoogleAuth(null);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Google Auth Failed');
    } finally {
      setLoading(false);
    }
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
      if (mergeGuestCart) await mergeGuestCart();
      if (setUser) setUser(authData);
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
      if (mergeGuestCart) await mergeGuestCart();
      if (setUser) setUser(authData);
      if (onSuccess) onSuccess(authData);
      setPendingGoogleAuth(null);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Google Auth Failed');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic headings depending on mode
  const displayTitle = title || (isAdminMode ? 'Admin Control Console Login' : 'Login or Register Account');
  const displaySubtitle = subtitle || (isAdminMode
    ? 'Enter authorized administrative mobile number or email (+919999999999 or admin@sporekart.in)'
    : 'Enter your mobile number or email to continue');

  // Step 3: Render Google Auth Profile Name Confirmation View
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

          <h3 className="text-xl font-display font-bold text-forest-900 tracking-tight">Set Profile Name</h3>
          <p className="text-xs text-typography-secondary">
            Customize your display name or skip to use your default Google profile name.
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
              <span>Profile / Display Name (Optional)</span>
              <span className="text-[10px] text-forest-700 flex items-center gap-1 font-normal"><Sparkles className="w-3 h-3" /> Customize</span>
            </label>
            <input
              type="text"
              placeholder="Enter full name (e.g. Suresh Kumar)"
              value={googleProfileName}
              onChange={(e) => setGoogleProfileName(e.target.value)}
              autoFocus
              className="w-full bg-surface-white border border-surface-border focus:border-forest-700 rounded-input px-4 py-2.5 text-forest-900 text-sm outline-none transition-all shadow-level-1"
            />
            <p className="text-[11px] text-typography-muted mt-1">
              You can edit this now or skip to use your Google account default name.
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 group shadow-level-1"
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
              className="w-full btn-secondary py-2.5 text-xs"
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
            className="w-full text-xs text-typography-muted hover:text-forest-700 pt-1 transition-colors text-center block"
          >
            ← Change authentication method
          </button>
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
        <div
          className={`p-3 rounded-input text-xs border ${
            isAdminMode
              ? 'bg-gold/15 border-gold/40 text-soil'
              : 'bg-green-600/10 border-green-600/30 text-green-600'
          }`}
        >
          ✅ {authMessage}
        </div>
      )}

      {!otpSent ? (
        <div className="space-y-4">
          {/* Google Login is available for customers/trainees */}
          {!isAdminMode && (
            <>
              <GoogleLoginButton
                onSuccess={handleGoogleAuthReceived}
                onError={(err) => setAuthError(err)}
                loading={loading}
                setLoading={setLoading}
              />

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-surface-border w-full" />
                <span className="bg-surface-white px-3 text-[10px] font-semibold text-typography-muted uppercase tracking-wider absolute">
                  or mobile / email OTP
                </span>
              </div>
            </>
          )}

          {/* Dev Hint for Admin Mode */}
          {isAdminMode && (
            <div className="p-3 bg-surface-cream border border-gold/30 rounded-input text-[11px] text-soil leading-relaxed">
              <span className="text-gold font-bold block mb-0.5">🔑 Dev Admin Credentials:</span>
              Use <code className="text-forest-900 font-mono">admin@sporekart.in</code> or <code className="text-forest-900 font-mono">+919999999999</code> with Mock OTP: <code className="text-forest-900 font-mono font-bold bg-gold/20 px-1 py-0.5 rounded border border-gold/40">123456</code>
            </div>
          )}

          <form onSubmit={handleRequestOtp} className="space-y-3">
            <div>
              <label className="block text-xs text-typography-primary font-medium mb-1">
                {isAdminMode ? 'Admin Mobile Number or Email' : 'Mobile Number or Email'}
              </label>
              <input
                data-testid="auth-identifier-input"
                type="text"
                placeholder={isAdminMode ? "e.g. admin@sporekart.in or +919999999999" : "e.g. +91 9876543210 or user@example.com"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className={`w-full bg-surface-white rounded-input px-4 py-2.5 text-forest-900 text-sm focus:outline-none transition-all ${
                  isAdminMode
                    ? 'border border-gold/40 focus:border-gold'
                    : 'border border-surface-border focus:border-forest-700'
                }`}
              />
            </div>

            <div className="space-y-2">
              <button
                data-testid="send-otp-btn"
                type="submit"
                disabled={loading}
                className={`w-full font-bold py-3 rounded-input shadow-level-1 transition-all button-press flex items-center justify-center gap-2 ${
                  isAdminMode
                    ? 'btn-premium'
                    : 'btn-primary'
                } disabled:opacity-50`}
              >
                <span>{loading ? 'Sending Admin OTP...' : (isAdminMode ? 'Send Admin OTP' : 'Send OTP Code')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleJumpToOtp}
                className="w-full bg-surface-cream hover:bg-surface-border border border-forest-900/15 text-forest-900 font-semibold py-2.5 rounded-input text-xs transition-all button-press flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5 text-forest-700" />
                <span>Enter OTP Directly (Dev Mock: 123456)</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <div>
            {!isAdminMode && (
              <>
                <label className="block text-xs text-typography-primary font-medium mb-1 flex items-center justify-between">
                  <span>Full Name (Optional Registration Detail)</span>
                  <span className="text-[10px] text-typography-muted font-normal">Fill now or later</span>
                </label>
                <input
                  type="text"
                  placeholder="Your Full Name (e.g. Praveen Kumar)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface-white border border-surface-border rounded-input px-4 py-2.5 text-forest-900 text-sm focus:outline-none focus:border-forest-700 mb-3"
                />
              </>
            )}

            <label className="block text-xs text-typography-primary font-medium mb-1 flex items-center justify-between">
              <span>{isAdminMode ? 'Admin 6-Digit Verification Code' : '6-Digit OTP Code'}</span>
              {isAdminMode && (
                <span className="text-[10px] text-soil font-mono font-bold bg-gold/20 px-1.5 py-0.5 rounded border border-gold/40">
                  Dev Mock: 123456
                </span>
              )}
            </label>
            <input
              data-testid="otp-code-input"
              type="text"
              placeholder="Enter 6-digit OTP (e.g. 123456)"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              required
              autoFocus
              className={`w-full bg-surface-white rounded-input px-4 py-2.5 text-forest-900 text-sm text-center tracking-widest font-mono focus:outline-none transition-all ${
                isAdminMode
                  ? 'border border-gold/40 focus:border-gold ring-1 ring-gold/30'
                  : 'border border-surface-border focus:border-forest-700'
              }`}
            />
          </div>

          <button
            data-testid="verify-otp-btn"
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-3 rounded-input shadow-level-1 transition-all button-press ${
              isAdminMode
                ? 'btn-premium'
                : 'btn-primary'
            } disabled:opacity-50`}
          >
            {loading ? 'Verifying Admin Access...' : (isAdminMode ? 'Verify Admin OTP & Enter Dashboard' : 'Verify OTP & Complete Account')}
          </button>
          
          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={resendCooldown > 0 || loading}
              className="text-forest-700 font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtpCode('');
              }}
              className="text-typography-muted hover:text-forest-700"
            >
              ← Change number / email
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
