import React from 'react';
import { ShieldAlert, LogIn, ArrowLeft, Lock } from 'lucide-react';
import SeoHead from './SeoHead';

export default function AdminProtectedRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-4 text-forest-900">
        <div className="w-12 h-12 border-4 border-forest-900 border-t-gold rounded-full animate-spin" />
        <p className="text-sm font-bold text-forest-900">Verifying administrative access permissions...</p>
      </div>
    );
  }

  const isAdminPermitted = Boolean(
    user &&
    user.role === 'ROLE_ADMIN' &&
    user.email?.toLowerCase() === 'thepravara2026@gmail.com'
  );

  if (!isAdminPermitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <SeoHead
          title="Access Restricted — Sporekart Admin Console"
          description="Administrative access restricted strictly to thepravara2026@gmail.com."
          noindex={true}
        />
        <div className="w-full max-w-lg rounded-3xl bg-forest-950 text-white p-8 sm:p-10 shadow-level-3 border border-emerald-500/20 text-center space-y-6 relative overflow-hidden">
          {/* Ambient background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="w-20 h-20 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-level-2">
            <Lock className="w-10 h-10 text-red-400" />
          </div>

          <div className="space-y-2.5">
            <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 text-[10px] font-black uppercase tracking-wider inline-block">
              Restricted Control Plane
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              403 — Unauthorized Administrative Access
            </h1>
            <p className="text-surface-neutral/80 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
              This console is strictly dedicated for administrative operations by <code className="text-gold-soft font-mono font-bold bg-white/10 px-2 py-0.5 rounded">thepravara2026@gmail.com</code>. Customer or trainee accounts cannot access this portal.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/admin/login"
              className="w-full sm:w-auto px-6 py-3 bg-gold hover:bg-[#b5893b] text-forest-950 font-extrabold text-xs rounded-xl shadow-level-1 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Admin Sign-In Portal</span>
            </a>
            <a
              href="/"
              className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Storefront</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
