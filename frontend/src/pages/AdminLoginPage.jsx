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
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 bg-[#f2f8f4] relative overflow-hidden">
      <SeoHead
        title="Admin Control Plane Login — Sporekart Agritech"
        description="Administrative authentication portal for Sporekart control plane."
        noindex={true}
      />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e2f2e6] border border-[#b8e2c2] text-[#16532f] text-xs font-semibold shadow-sm">
            <Lock className="w-3.5 h-3.5" /> Restricted Access — Admin Portal
          </div>
          
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            Admin Sign In
          </h1>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Enter your admin credentials to access the control dashboard.
          </p>
        </div>

        {/* Credentials Tip Card */}
        <div className="p-3.5 bg-[#f4f8f4] border border-[#cbe5d2] rounded-2xl text-xs space-y-1 text-gray-700 shadow-sm">
          <div className="flex items-center gap-2 text-[#16532f] font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Development Admin Account</span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Use <code className="text-[#16532f] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200">admin@sporekart.in</code> or <code className="text-[#16532f] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200">+919999999999</code> with Mock OTP: <code className="text-[#16532f] font-mono font-bold bg-[#e2f2e6] px-1 py-0.5 rounded border border-[#b8e2c2]">123456</code>.
          </p>
        </div>

        {/* Auth Form inside clean white card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xl">
          <AuthForm
            setUser={setUser}
            onSuccess={handleAdminAuthSuccess}
            initialAdminMode={true}
            title="Admin Sign In"
            subtitle="Enter your admin credentials to access the dashboard."
          />
        </div>

        {/* Return to Customer Portal */}
        <div className="text-center pt-2">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-[#16532f] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Not an admin? Head back to the <span className="text-[#16532f] font-bold underline">shop homepage.</span>
          </a>
        </div>
      </div>
    </div>
  );
}
