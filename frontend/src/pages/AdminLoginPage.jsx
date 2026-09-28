import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import AuthForm from '../components/AuthForm';

export default function AdminLoginPage({ user, setUser }) {
  const navigate = useNavigate();

  // Redirect to admin dashboard if user is already an Admin
  if (user && user.role === 'ROLE_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const handleAdminAuthSuccess = (authData) => {
    if (setUser) setUser(authData);
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 bg-surface-cream relative overflow-hidden text-typography-primary">
      <SeoHead
        title="Admin Control Plane Login — Sporekart Agritech"
        description="Administrative authentication portal for Sporekart control plane."
        noindex={true}
      />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Top Header Card */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-typography-primary text-xs font-semibold shadow-level-1">
            <Lock className="w-3.5 h-3.5 text-forest-700" /> Restricted Access — Admin Portal
          </div>
          
          <h1 className="text-3xl font-display font-extrabold text-typography-primary tracking-tight">
            Sporekart <span className="text-forest-700">Admin Control</span>
          </h1>
          <p className="text-xs text-typography-secondary max-w-sm mx-auto">
            Log in with your authorized administrative credentials to manage products, orders, catalog, and training.
          </p>
        </div>

        {/* Credentials Tip Card (Dev Mode Only) */}
        {import.meta.env.DEV && (
          <div className="p-4 bg-surface-white border border-gold/30 rounded-2xl text-xs space-y-1.5 text-typography-secondary shadow-level-1">
            <div className="flex items-center gap-2 text-forest-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              <span>Development Admin Account</span>
            </div>
            <p className="text-[11px] text-typography-secondary leading-relaxed">
              Use <code className="text-forest-900 font-mono font-bold bg-surface-cream px-1.5 py-0.5 rounded">admin@sporekart.in</code> or <code className="text-forest-900 font-mono font-bold bg-surface-cream px-1.5 py-0.5 rounded">+919999999999</code> with Mock OTP: <code className="text-forest-900 font-mono font-bold bg-gold/20 px-1 py-0.5 rounded border border-gold/40">123456</code>.
            </p>
          </div>
        )}

        {/* Auth Form pre-configured for Admin Mode */}
        <div className="bg-surface-white border border-surface-border rounded-card p-6 sm:p-8 shadow-level-2">
          <AuthForm
            setUser={setUser}
            onSuccess={handleAdminAuthSuccess}
            initialAdminMode={true}
            title="Admin Authentication"
            subtitle="Verify administrative mobile or email identifier"
          />
        </div>

        {/* Return to Customer Portal */}
        <div className="text-center pt-2">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs text-typography-muted hover:text-typography-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Storefront
          </a>
        </div>
      </div>
    </div>
  );
}
