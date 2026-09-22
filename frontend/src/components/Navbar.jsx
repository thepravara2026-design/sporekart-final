import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Sprout, GraduationCap, ShoppingBag, User, X, Menu, ShieldCheck, BookOpen, Info, PhoneCall } from 'lucide-react';
import { authApi } from '../api';
import GoogleLoginButton from './GoogleLoginButton';
import GlobalSearch from './GlobalSearch';
import AuthForm from './AuthForm';

export default function Navbar({ user, setUser }) {
  const { cart, openDrawer, mergeGuestCart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Auth State
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Handle ESC key to close mobile menu or auth modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      // Merge guest cart into authenticated user cart
      if (mergeGuestCart) {
        mergeGuestCart();
      }
      navigate('/dashboard');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid OTP');
    }
  };

  const handleGoogleSuccess = async (googleAuthData) => {
    setAuthError('');
    setAuthMessage('');
    setAuthLoading(true);
    try {
      const res = await authApi.loginWithGoogle(googleAuthData);
      const authData = res.data.data;
      localStorage.setItem('sporekart_token', authData.token);
      setUser(authData);
      setIsAuthModalOpen(false);
      // Merge guest cart into authenticated user cart
      if (mergeGuestCart) {
        mergeGuestCart();
      }
      navigate('/dashboard');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Google Login Failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sporekart_token');
    setUser(null);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Accessibility Keyboard Navigation Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 w-full glass-panel border-b border-spore-800/30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo */}
            <Link to="/" aria-label="Sporekart Agritech Home" className="flex items-center gap-3 group min-h-[44px] shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-spore-400 via-emerald-500 to-spore-700 flex items-center justify-center shadow-lg shadow-spore-950/50 group-hover:scale-105 transition-transform duration-200">
                <Sprout className="w-6 h-6 text-slate-950" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                  Spore<span className="text-spore-400">kart</span>
                </span>
                <span className="block text-[10px] text-spore-300 font-semibold tracking-widest uppercase opacity-90">
                  India Agritech
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-5 font-medium text-xs lg:text-sm text-slate-300">
              <Link 
                to="/products" 
                className={`hover:text-spore-300 transition-colors flex items-center gap-1.5 min-h-[44px] px-2.5 py-1 rounded-lg ${isActive('/products') ? 'text-spore-400 bg-spore-950/60 font-semibold border border-spore-800/50' : ''}`}
              >
                <Sprout className="w-4 h-4 text-spore-400" /> Products
              </Link>
              <Link 
                to="/training" 
                className={`hover:text-spore-300 transition-colors flex items-center gap-1.5 min-h-[44px] px-2.5 py-1 rounded-lg ${isActive('/training') ? 'text-spore-400 bg-spore-950/60 font-semibold border border-spore-800/50' : ''}`}
              >
                <GraduationCap className="w-4 h-4 text-spore-400" /> Training
              </Link>
              <Link 
                to="/blog" 
                className={`hover:text-spore-300 transition-colors flex items-center gap-1.5 min-h-[44px] px-2.5 py-1 rounded-lg ${isActive('/blog') ? 'text-spore-400 bg-spore-950/60 font-semibold border border-spore-800/50' : ''}`}
              >
                <BookOpen className="w-4 h-4 text-spore-400" /> Blog
              </Link>
              <Link 
                to="/about" 
                className={`hover:text-spore-300 transition-colors flex items-center gap-1.5 min-h-[44px] px-2.5 py-1 rounded-lg ${isActive('/about') ? 'text-spore-400 bg-spore-950/60 font-semibold border border-spore-800/50' : ''}`}
              >
                <Info className="w-4 h-4 text-spore-400" /> About
              </Link>
              <Link 
                to="/contact" 
                className={`hover:text-spore-300 transition-colors flex items-center gap-1.5 min-h-[44px] px-2.5 py-1 rounded-lg ${isActive('/contact') ? 'text-spore-400 bg-spore-950/60 font-semibold border border-spore-800/50' : ''}`}
              >
                <PhoneCall className="w-4 h-4 text-spore-400" /> Contact
              </Link>
            </nav>

            {/* Desktop Global Search Bar */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              {/* Cart Button */}
              <button
                onClick={openDrawer}
                className="relative p-2.5 rounded-xl bg-spore-900/50 hover:bg-spore-800/70 border border-spore-700/40 text-slate-200 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center button-press hover-lift"
                aria-label={`Shopping cart with ${cart.itemCount} items`}
              >
                <ShoppingBag className="w-5 h-5 text-spore-300" />
                {cart.itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-r from-spore-400 to-emerald-500 text-slate-950 text-[11px] font-extrabold rounded-full flex items-center justify-center shadow-md shadow-spore-950 animate-scale-in">
                    {cart.itemCount}
                  </span>
                )}
              </button>

              {/* User Account / Auth */}
              {user ? (
                <div className="flex items-center gap-2">
                  <Link 
                    to="/dashboard" 
                    aria-label="User Account Dashboard" 
                    className="hidden sm:flex items-center gap-2 text-xs font-medium bg-spore-900/70 hover:bg-spore-800 px-3.5 py-2.5 rounded-xl border border-spore-700/50 transition-all button-press"
                  >
                    <User className="w-4 h-4 text-spore-400" />
                    <span className="max-w-[100px] truncate">{user.fullName || 'Dashboard'}</span>
                  </Link>
                  {user.role === 'ROLE_ADMIN' && (
                    <Link 
                      to="/admin" 
                      aria-label="Admin Control Console" 
                      className="hidden sm:flex items-center gap-2 text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl transition-all button-press"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Admin</span>
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    aria-label="Log out of account" 
                    className="text-xs text-slate-400 hover:text-rose-400 min-h-[44px] px-2.5 transition-colors font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  aria-label="Login or Sign Up for an Account"
                  className="bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-spore-950/50 transition-all button-press hover-lift shrink-0"
                >
                  Login / Signup
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
                className="lg:hidden p-2 rounded-xl text-slate-300 hover:bg-spore-900/60 min-h-[44px] min-w-[44px] flex items-center justify-center border border-spore-800/40"
              >
                {isMenuOpen ? <X className="w-6 h-6 text-spore-400" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Integrated Search Bar */}
          <div className="md:hidden pb-3 pt-1">
            <GlobalSearch isMobile={true} />
          </div>
        </div>

        {/* Mobile Slide-over Drawer */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-spore-800/50 bg-spore-950/95 backdrop-blur-xl animate-fade-in px-4 py-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <nav className="flex flex-col gap-2">
              <Link
                to="/products"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl text-slate-200 font-medium text-sm border transition-all ${isActive('/products') ? 'bg-spore-950 border-spore-500/50 text-spore-300 font-bold' : 'bg-spore-900/40 border-spore-800/40 hover:bg-spore-900/80'}`}
              >
                <Sprout className="w-5 h-5 text-spore-400" />
                <span>Products & Spawn Catalog</span>
              </Link>
              <Link
                to="/training"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl text-slate-200 font-medium text-sm border transition-all ${isActive('/training') ? 'bg-spore-950 border-spore-500/50 text-spore-300 font-bold' : 'bg-spore-900/40 border-spore-800/40 hover:bg-spore-900/80'}`}
              >
                <GraduationCap className="w-5 h-5 text-spore-400" />
                <span>Workshops & Training</span>
              </Link>
              <Link
                to="/blog"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl text-slate-200 font-medium text-sm border transition-all ${isActive('/blog') ? 'bg-spore-950 border-spore-500/50 text-spore-300 font-bold' : 'bg-spore-900/40 border-spore-800/40 hover:bg-spore-900/80'}`}
              >
                <BookOpen className="w-5 h-5 text-spore-400" />
                <span>Agritech Blog</span>
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl text-slate-200 font-medium text-sm border transition-all ${isActive('/about') ? 'bg-spore-950 border-spore-500/50 text-spore-300 font-bold' : 'bg-spore-900/40 border-spore-800/40 hover:bg-spore-900/80'}`}
              >
                <Info className="w-5 h-5 text-spore-400" />
                <span>About Sporekart</span>
              </Link>
              <Link
                to="/contact"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl text-slate-200 font-medium text-sm border transition-all ${isActive('/contact') ? 'bg-spore-950 border-spore-500/50 text-spore-300 font-bold' : 'bg-spore-900/40 border-spore-800/40 hover:bg-spore-900/80'}`}
              >
                <PhoneCall className="w-5 h-5 text-spore-400" />
                <span>Support & Contact</span>
              </Link>
            </nav>

            {user ? (
              <div className="pt-4 border-t border-spore-800/40 flex flex-col gap-2">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-spore-900/60 text-slate-200 font-medium text-sm border border-spore-700/50"
                >
                  <User className="w-5 h-5 text-spore-400" />
                  <span>Dashboard ({user.fullName})</span>
                </Link>
                {user.role === 'ROLE_ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-sm border border-amber-500/40"
                  >
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <span>Admin Control Console</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="p-3.5 rounded-xl text-rose-400 font-medium text-sm text-left hover:bg-rose-950/30"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-spore-800/40">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-spore-500 to-emerald-500 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg text-center button-press"
                >
                  Login / Register Account
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Auth Modal (Phone / Email OTP) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl relative border border-spore-600/50 shadow-2xl animate-scale-in">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>
            <AuthForm
              title="Login or Register to Sporekart"
              subtitle="Instant OTP & Account Registration via Phone or Email"
              setUser={setUser}
              onSuccess={() => {
                setIsAuthModalOpen(false);
                navigate('/dashboard');
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
