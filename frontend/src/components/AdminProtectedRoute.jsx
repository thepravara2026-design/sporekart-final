import React from 'react';
import { ShieldAlert, LogIn } from 'lucide-react';
import SeoHead from './SeoHead';

export default function AdminProtectedRoute({ user, children }) {
  if (!user || user.role !== 'ROLE_ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <SeoHead
          title="Access Denied — Sporekart Admin Console"
          description="Administrative access restricted to authorized personnel."
          noindex={true}
        />
        <div className="w-20 h-20 mx-auto rounded-3xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400 shadow-2xl animate-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-black text-3xl text-white">403 — Unauthorized Administrative Access</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            The requested control plane endpoint requires elevated privilege <code className="text-amber-400 font-mono">ROLE_ADMIN</code>. Public or non-administrative access is strictly forbidden.
          </p>
        </div>
        <div className="pt-4 flex justify-center gap-4">
          <a
            href="/"
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700/60 transition-all"
          >
            Return to Storefront
          </a>
        </div>
      </div>
    );
  }

  return children;
}
