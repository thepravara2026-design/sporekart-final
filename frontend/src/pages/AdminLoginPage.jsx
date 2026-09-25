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
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 bg-slate-950 relative overflow-hidden">
      <SeoHead
        title="Admin Control Plane Login — Sporekart Agritech"
        description="Administrative authentication portal for Sporekart control plane."
        noindex={true}
      />

      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-spore-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Top Header Card */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-inner">
            <Lock className="w-3.5 h-3.5" /> Restricted Access — Admin Portal
          </div>
          
          <h1 className="text-3xl font-display font-black text-white tracking-tight">
            Sporekart <span className="text-amber-400">Admin Control</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Log in with your authorized administrative credentials to manage products, orders, catalog, and training.
          </p>
        </div>

        {/* Credentials Tip Card */}
        <div className="p-3.5 bg-slate-900/90 border border-amber-500/30 rounded-2xl text-xs space-y-1 text-slate-300 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Development Admin Account</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Use <code className="text-amber-300 font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded">admin@sporekart.in</code> or <code className="text-amber-300 font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded">+919999999999</code> with Mock OTP: <code className="text-amber-400 font-mono font-bold bg-amber-950/60 px-1 py-0.5 rounded border border-amber-500/40">123456</code>.
          </p>
        </div>

        {/* Auth Form pre-configured for Admin Mode */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
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
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Storefront
          </a>
        </div>
      </div>
    </div>
  );
}
