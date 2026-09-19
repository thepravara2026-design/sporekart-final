import { useEffect, useRef, useState } from 'react';

// Helper function to decode JWT payload safely without external dependencies
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to parse Google ID Token JWT:', err);
    return null;
  }
};

export default function GoogleLoginButton({ onSuccess, onError, loading, setLoading }) {
  const googleButtonRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      if (onError) onError('Google login failed: No credential received');
      return;
    }

    if (setLoading) setLoading(true);
    try {
      const payload = parseJwt(response.credential);
      if (!payload || !payload.email || !payload.sub) {
        throw new Error('Invalid payload extracted from Google token');
      }

      const googleAuthData = {
        googleSub: payload.sub,
        email: payload.email,
        firstName: payload.given_name || payload.name || 'Google User',
        lastName: payload.family_name || '',
        fullName: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
        idToken: response.credential,
      };

      await onSuccess(googleAuthData);
    } catch (err) {
      console.error('Google Auth Processing Error:', err);
      if (onError) onError(err.message || 'Google Auth Verification Failed');
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  // Mock / Dev Demo Google Login when Client ID is missing or in dev mode
  const handleDevMockGoogleLogin = async () => {
    if (setLoading) setLoading(true);
    try {
      const mockSub = 'google_user_' + Math.floor(100000 + Math.random() * 900000);
      const mockEmail = `demo.google.${Math.floor(Math.random() * 1000)}@gmail.com`;

      const mockData = {
        googleSub: mockSub,
        email: mockEmail,
        firstName: 'Google',
        lastName: 'User',
        fullName: 'Google Agri Customer',
        idToken: 'mock_google_id_token_' + Date.now(),
      };

      await onSuccess(mockData);
    } catch (err) {
      if (onError) onError(err.message || 'Mock Google login failed');
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => console.warn('Failed to load Google GSI SDK script');
    document.body.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (scriptLoaded && clientId && window.google?.accounts?.id && googleButtonRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'filled_dark',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'pill',
        });
      } catch (e) {
        console.error('Google GSI Initialize Error:', e);
      }
    }
  }, [scriptLoaded, clientId]);

  return (
    <div className="w-full space-y-2">
      {clientId ? (
        <div className="w-full flex justify-center min-h-[44px]">
          <div ref={googleButtonRef} className="w-full max-w-sm flex justify-center" />
        </div>
      ) : (
        <button
          type="button"
          onClick={handleDevMockGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 font-semibold py-3 px-4 rounded-xl shadow-md transition-all min-h-[44px] text-sm group"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.8-.9-1.3-2.1-1.3-3.6z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
          <span>{loading ? 'Signing in with Google...' : 'Continue with Google'}</span>
        </button>
      )}
    </div>
  );
}
