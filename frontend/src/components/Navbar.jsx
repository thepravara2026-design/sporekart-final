import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Sprout, GraduationCap, ShoppingBag, User, X, Menu, ShieldCheck, BookOpen, Info, PhoneCall } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import AuthForm from './AuthForm';
import { clearSessionAndTokens } from '../api';

export default function Navbar({ user, setUser }) {
  const { cart, openDrawer } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  const handleLogout = () => {
    clearSessionAndTokens();
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

      <header className="sticky top-0 z-40 w-full bg-surface-white/95 backdrop-blur-md border-b border-surface-border shadow-level-1 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo */}
            <Link to="/" aria-label="Sporekart Agritech Home" className="flex items-center gap-3 group min-h-[44px] shrink-0">
              <div className="w-11 h-11 rounded-xl bg-forest-700 flex items-center justify-center shadow-level-1 group-hover:bg-forest-800 transition-colors duration-200">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-2xl tracking-tight text-forest-900">
                  Spore<span className="text-forest-700">kart</span>
                </span>
                <span className="block text-[10px] text-typography-secondary font-semibold tracking-widest uppercase opacity-90">
                  India Agritech
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-2 font-medium text-sm text-typography-secondary">
              <Link 
                to="/products" 
                className={`hover:text-forest-700 transition-colors flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl ${isActive('/products') ? 'text-forest-800 bg-surface-cream font-semibold border border-surface-border' : ''}`}
              >
                <Sprout className="w-4 h-4 text-forest-700" /> Products
              </Link>
              <Link 
                to="/training" 
                className={`hover:text-forest-700 transition-colors flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl ${isActive('/training') ? 'text-forest-800 bg-surface-cream font-semibold border border-surface-border' : ''}`}
              >
                <GraduationCap className="w-4 h-4 text-forest-700" /> Training
              </Link>
              <Link 
                to="/blog" 
                className={`hover:text-forest-700 transition-colors flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl ${isActive('/blog') ? 'text-forest-800 bg-surface-cream font-semibold border border-surface-border' : ''}`}
              >
                <BookOpen className="w-4 h-4 text-forest-700" /> Blog
              </Link>
              <Link 
                to="/about" 
                className={`hover:text-forest-700 transition-colors flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl ${isActive('/about') ? 'text-forest-800 bg-surface-cream font-semibold border border-surface-border' : ''}`}
              >
                <Info className="w-4 h-4 text-forest-700" /> About
              </Link>
              <Link 
                to="/contact" 
                className={`hover:text-forest-700 transition-colors flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl ${isActive('/contact') ? 'text-forest-800 bg-surface-cream font-semibold border border-surface-border' : ''}`}
              >
                <PhoneCall className="w-4 h-4 text-forest-700" /> Contact
              </Link>
            </nav>

            {/* Desktop Global Search Bar */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Cart Button */}
              <button
                onClick={openDrawer}
                className="relative p-2.5 rounded-xl bg-surface-neutral hover:bg-surface-cream border border-surface-border text-typography-primary transition-all min-h-[44px] min-w-[44px] flex items-center justify-center button-press hover-lift"
                aria-label={`Shopping cart with ${cart.itemCount} items`}
              >
                <ShoppingBag className="w-5 h-5 text-forest-700" />
                {cart.itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gold text-white text-[11px] font-bold rounded-pill flex items-center justify-center shadow-level-1 animate-scale-in">
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
                    className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-surface-cream hover:bg-surface-border text-forest-900 px-3.5 py-2.5 rounded-xl border border-surface-border transition-all button-press"
                  >
                    <User className="w-4 h-4 text-forest-700" />
                    <span className="max-w-[110px] truncate">{user.fullName || 'Dashboard'}</span>
                  </Link>
                  {user.role === 'ROLE_ADMIN' && (
                    <Link 
                      to="/admin" 
                      aria-label="Admin Control Console" 
                      className="hidden sm:flex items-center gap-2 text-xs font-bold bg-gold/15 hover:bg-gold/25 text-soil border border-gold/40 px-3.5 py-2 rounded-xl transition-all button-press"
                    >
                      <ShieldCheck className="w-4 h-4 text-gold" />
                      <span>Admin</span>
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    aria-label="Log out of account" 
                    className="text-xs text-typography-muted hover:text-rose-600 min-h-[44px] px-2.5 transition-colors font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  data-testid="desktop-login-btn"
                  onClick={() => {
                    console.log('>>> [NAVBAR] Desktop login button clicked!');
                    setIsAuthModalOpen(true);
                  }}
                  aria-label="Login or Sign Up for an Account"
                  className="btn-primary text-xs sm:text-sm px-4 py-2.5 shrink-0 shadow-level-1"
                >
                  Login / Signup
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
                className="lg:hidden p-2 rounded-xl text-typography-primary bg-surface-neutral hover:bg-surface-cream min-h-[44px] min-w-[44px] flex items-center justify-center border border-surface-border"
              >
                {isMenuOpen ? <X className="w-6 h-6 text-forest-700" /> : <Menu className="w-6 h-6 text-forest-900" />}
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
          <div className="lg:hidden border-t border-surface-border bg-surface-offwhite/98 backdrop-blur-xl animate-fade-in px-4 py-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-level-2">
            <nav className="flex flex-col gap-2">
              <Link
                to="/products"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl font-semibold text-sm border transition-all ${isActive('/products') ? 'bg-surface-cream border-forest-700/30 text-forest-900' : 'bg-surface-white border-surface-border text-typography-secondary hover:text-forest-700'}`}
              >
                <Sprout className="w-5 h-5 text-forest-700" />
                <span>Products & Spawn Catalog</span>
              </Link>
              <Link
                to="/training"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl font-semibold text-sm border transition-all ${isActive('/training') ? 'bg-surface-cream border-forest-700/30 text-forest-900' : 'bg-surface-white border-surface-border text-typography-secondary hover:text-forest-700'}`}
              >
                <GraduationCap className="w-5 h-5 text-forest-700" />
                <span>Workshops & Training</span>
              </Link>
              <Link
                to="/blog"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl font-semibold text-sm border transition-all ${isActive('/blog') ? 'bg-surface-cream border-forest-700/30 text-forest-900' : 'bg-surface-white border-surface-border text-typography-secondary hover:text-forest-700'}`}
              >
                <BookOpen className="w-5 h-5 text-forest-700" />
                <span>Agritech Blog</span>
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl font-semibold text-sm border transition-all ${isActive('/about') ? 'bg-surface-cream border-forest-700/30 text-forest-900' : 'bg-surface-white border-surface-border text-typography-secondary hover:text-forest-700'}`}
              >
                <Info className="w-5 h-5 text-forest-700" />
                <span>About Sporekart</span>
              </Link>
              <Link
                to="/contact"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl font-semibold text-sm border transition-all ${isActive('/contact') ? 'bg-surface-cream border-forest-700/30 text-forest-900' : 'bg-surface-white border-surface-border text-typography-secondary hover:text-forest-700'}`}
              >
                <PhoneCall className="w-5 h-5 text-forest-700" />
                <span>Support & Contact</span>
              </Link>
            </nav>

            {user ? (
              <div className="pt-4 border-t border-surface-border flex flex-col gap-2">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-cream text-forest-900 font-semibold text-sm border border-surface-border"
                >
                  <User className="w-5 h-5 text-forest-700" />
                  <span>Dashboard ({user.fullName})</span>
                </Link>
                {user.role === 'ROLE_ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-gold/15 text-soil font-bold text-sm border border-gold/30"
                  >
                    <ShieldCheck className="w-5 h-5 text-gold" />
                    <span>Admin Control Console</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="p-3.5 rounded-xl text-rose-600 font-medium text-sm text-left hover:bg-rose-50"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-surface-border">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full btn-primary py-3.5 text-center shadow-level-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-white w-full max-w-md p-6 sm:p-8 rounded-[24px] relative border border-surface-border shadow-level-3 animate-scale-in">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-typography-muted hover:text-typography-primary p-2"
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
