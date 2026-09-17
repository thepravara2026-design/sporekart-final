import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Sprout, GraduationCap, MapPin, ShoppingBag, User, X, Menu, CheckCircle, ShieldCheck } from 'lucide-react';
import { shippingApi, authApi } from '../api';


export default function Navbar({ user, setUser }) {
  const { cart, openDrawer } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  // Auth State
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const navigate = useNavigate();

  const handlePincodeCheck = async (e) => {
    e.preventDefault();
    if (!pincode) return;
    setCheckingPincode(true);
    try {
      const res = await shippingApi.checkPincode(pincode);
      setPincodeResult(res.data.data);
    } catch (err) {
      setPincodeResult({ isServiceable: false, message: 'Failed to verify pincode serviceability' });
    } finally {
      setCheckingPincode(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    try {
      const res = await authApi.requestOtp(identifier);
      setOtpSent(true);
      setAuthMessage(`OTP sent to ${identifier}. (Dev code: ${res.data.data})`);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await authApi.verifyOtp(identifier, otpCode, fullName);
      const authData = res.data.data;
      localStorage.setItem('sporekart_token', authData.token);
      setUser(authData);
      setIsAuthModalOpen(false);
      setOtpSent(false);
      setOtpCode('');
      navigate('/dashboard');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid OTP');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sporekart_token');
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-spore-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-spore-400 to-spore-700 flex items-center justify-center shadow-lg shadow-spore-900/50 group-hover:scale-105 transition-transform">
                <Sprout className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                  Spore<span className="text-spore-400">kart</span>
                </span>
                <span className="block text-[10px] text-spore-300 font-semibold tracking-widest uppercase">
                  India Agritech
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 font-medium text-xs sm:text-sm text-slate-300">
              <Link to="/products" className="hover:text-spore-300 transition-colors flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-spore-400" /> Products
              </Link>
              <Link to="/training" className="hover:text-spore-300 transition-colors flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-spore-400" /> Training
              </Link>
              <Link to="/blog" className="hover:text-spore-300 transition-colors">
                Blog
              </Link>
              <Link to="/about" className="hover:text-spore-300 transition-colors">
                About
              </Link>
              <Link to="/contact" className="hover:text-spore-300 transition-colors">
                Contact
              </Link>
              <button 
                onClick={() => setIsPincodeModalOpen(true)}
                className="hover:text-spore-300 transition-colors flex items-center gap-1.5 text-xs bg-spore-950/60 px-3 py-1.5 rounded-lg border border-spore-800/60"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Delivery Check
              </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Cart Button */}
              <button
                onClick={openDrawer}
                className="relative p-2.5 rounded-xl bg-spore-900/40 hover:bg-spore-800/60 border border-spore-700/30 text-slate-200 transition-all"
                aria-label="View Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 text-spore-300" />
                {cart.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-spore-500 text-slate-950 text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {cart.itemCount}
                  </span>
                )}
              </button>

              {/* User Account / Auth */}
              {user ? (
                <div className="flex items-center gap-3">
                  <Link to="/dashboard" className="hidden sm:flex items-center gap-2 text-xs font-medium bg-spore-900/60 hover:bg-spore-800 px-3.5 py-2 rounded-xl border border-spore-700/40">
                    <User className="w-4 h-4 text-spore-400" />
                    <span>{user.fullName || 'Dashboard'}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-400">
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-gradient-to-r from-spore-500 to-spore-600 hover:from-spore-400 hover:to-spore-500 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-spore-950/40 transition-all"
                >
                  Login / Signup
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-spore-900/50"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Pincode Serviceability Modal */}
      {isPincodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl relative border border-spore-700/50 shadow-2xl">
            <button
              onClick={() => setIsPincodeModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-display font-bold text-white mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-spore-400" /> Check Indian PIN Code Serviceability
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your 6-digit PIN code to check Shiprocket courier delivery times and fresh mushroom cold-chain availability.
            </p>
            <form onSubmit={handlePincodeCheck} className="space-y-4">
              <input
                type="text"
                placeholder="e.g. 411001, 110001, 400001"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full bg-slate-900/90 border border-spore-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-spore-400"
              />
              <button
                type="submit"
                disabled={checkingPincode}
                className="w-full bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold py-3 rounded-xl transition-all"
              >
                {checkingPincode ? 'Verifying...' : 'Check Availability'}
              </button>
            </form>

            {pincodeResult && (
              <div className={`mt-4 p-4 rounded-xl border text-sm ${pincodeResult.isServiceable ? 'bg-spore-950/80 border-spore-500/50 text-spore-200' : 'bg-red-950/40 border-red-800/40 text-red-300'}`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {pincodeResult.isServiceable ? <CheckCircle className="w-4 h-4 text-spore-400" /> : null}
                  <span>{pincodeResult.message}</span>
                </div>
                {pincodeResult.isServiceable && (
                  <div className="text-xs text-slate-400 space-y-1 mt-2">
                    <p>📦 Courier: <strong className="text-slate-200">{pincodeResult.courierName}</strong></p>
                    <p>⚡ Est. Delivery: <strong className="text-slate-200">{pincodeResult.estimatedDeliveryDays} Days</strong></p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal (Phone / Email OTP) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl relative border border-spore-600/50 shadow-2xl">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-spore-900/80 border border-spore-600/40 rounded-xl mx-auto flex items-center justify-center mb-2">
                <ShieldCheck className="w-6 h-6 text-spore-400" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white">Login to Sporekart</h3>
              <p className="text-xs text-slate-400 mt-1">Instant OTP Verification via Phone or Email</p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-xs text-red-300">
                {authError}
              </div>
            )}

            {authMessage && (
              <div className="mb-4 p-3 bg-spore-950/80 border border-spore-600/50 rounded-xl text-xs text-spore-300">
                {authMessage}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Mobile Number or Email</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210 or user@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="w-full bg-slate-900/90 border border-spore-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-spore-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-spore-500 to-spore-600 hover:from-spore-400 hover:to-spore-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all"
                >
                  Send OTP Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Full Name (New Users)</label>
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-900/90 border border-spore-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-spore-400 mb-3"
                  />
                  <label className="block text-xs text-slate-300 font-medium mb-1">6-Digit OTP Code</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    className="w-full bg-slate-900/90 border border-spore-700/50 rounded-xl px-4 py-3 text-white text-sm text-center tracking-widest font-mono focus:outline-none focus:border-spore-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-spore-500 to-spore-600 hover:from-spore-400 hover:to-spore-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all"
                >
                  Verify & Continue
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-xs text-slate-400 hover:text-white pt-2"
                >
                  ← Change phone/email
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
