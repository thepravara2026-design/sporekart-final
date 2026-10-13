import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
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
            Authorized admin entity: <span className="font-mono font-bold text-soil">thepravara2026@gmail.com</span>. Strictly dedicated for administrative operations.
          </p>
        </div>

        {/* Auth Form pre-configured for Admin Mode */}
        <div className="bg-surface-white border border-surface-border rounded-card p-6 sm:p-8 shadow-level-2">
          <AuthForm
            setUser={setUser}
            onSuccess={handleAdminAuthSuccess}
            initialAdminMode={true}
            title="Admin Google Sign-In"
            subtitle="Authenticate with the single permissible admin account (thepravara2026@gmail.com)"
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
