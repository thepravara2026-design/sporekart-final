import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck, Sprout, CheckCircle2 } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import AuthForm from '../components/AuthForm';

export default function AdminLoginPage({ user, setUser }) {
  const navigate = useNavigate();

  // Redirect to admin dashboard if user is already the authorized Admin
  if (user && user.role === 'ROLE_ADMIN' && user.email?.toLowerCase() === 'thepravara2026@gmail.com') {
    return <Navigate to="/admin" replace />;
  }

  const handleAdminAuthSuccess = (authData) => {
    if (authData.email?.toLowerCase() !== 'thepravara2026@gmail.com') {
      alert('Access Denied: Only thepravara2026@gmail.com is authorized for administrator access.');
      return;
    }
    if (setUser) setUser(authData);
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-typography-primary">
      <SeoHead
        title="Admin Control Plane Login — Sporekart Agritech"
        description="Administrative authentication portal for Sporekart control plane."
        noindex={true}
      />

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-gold/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        
        {/* Top Header Card */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-900 text-white text-xs font-semibold shadow-level-1 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sporekart Enterprise Control Plane</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-forest-900 tracking-tight">
            Administrator Authentication
          </h1>
          <p className="text-xs sm:text-sm text-typography-secondary max-w-md mx-auto leading-relaxed">
            Restricted access portal for Sporekart catalog, cold-chain fulfillment, student enrollment records, and platform financial ledgers.
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-surface-white border border-surface-border rounded-3xl p-6 sm:p-8 shadow-level-2 space-y-6">
          <div className="p-3.5 rounded-2xl bg-forest-900/5 border border-forest-900/10 flex items-start gap-3">
            <Lock className="w-4 h-4 text-forest-800 shrink-0 mt-0.5" />
            <p className="text-xs text-typography-secondary leading-relaxed">
              Authorized admin account: <strong className="text-forest-900 font-mono">thepravara2026@gmail.com</strong>. All administrative operations are cryptographically audited.
            </p>
          </div>

          <AuthForm
            setUser={setUser}
            onSuccess={handleAdminAuthSuccess}
            initialAdminMode={true}
            title="Admin Sign-In"
            subtitle="Authenticate with your authorized Google credentials"
          />
        </div>

        {/* Security & Return Link */}
        <div className="flex items-center justify-between px-2 text-xs text-typography-muted">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-forest-900 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </a>
          <span className="flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>TLS 256-bit Encrypted Session</span>
          </span>
        </div>
      </div>
    </div>
  );
}
