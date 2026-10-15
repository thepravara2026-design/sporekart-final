import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Sprout, ShoppingBag, User, X, Menu, ShieldCheck, Search, ArrowRight } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import AuthForm from './AuthForm';
import NotificationCenter from './NotificationCenter';
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

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position to subtly deepen glass intensity
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Our Products', path: '/products' },
    { name: 'Our Farm', path: '/#farm' },
    { name: 'About Us', path: '/about' },
    { name: 'Sustainability', path: '/sustainability' },
    { name: 'Training', path: '/training' },
    { name: 'Blog', path: '/blog' },
  ];

  const isNavActive = (path) => {
    if (path === '/') return location.pathname === '/' && !location.hash;
    if (path.startsWith('/#')) return location.hash === path.substring(1);
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Accessibility Keyboard Navigation Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Static / Fixed Glass Navigation Header */}
      <header 
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-surface-white/95 backdrop-blur-xl border-b border-surface-border shadow-level-1'
            : 'bg-surface-white/90 backdrop-blur-md border-b border-surface-border/80 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[3.5rem] sm:min-h-[4.25rem] py-1.5 sm:py-2 gap-2 sm:gap-4">
            {/* Logo */}
            <Link to="/" aria-label="Sporekart Agritech Home" className="flex items-center gap-2 sm:gap-2.5 group min-h-[40px] sm:min-h-[44px] shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-forest-900 to-forest-800 flex items-center justify-center shadow-level-1 group-hover:scale-105 transition-all duration-200 shrink-0">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-display font-bold text-lg sm:text-2xl tracking-tight text-forest-900 leading-tight block">
                  Spore<span className="text-forest-700">kart</span>
                </span>
                <span className="hidden min-[400px]:block text-[8px] sm:text-[9px] text-typography-muted font-semibold tracking-wider sm:tracking-widest uppercase mt-0.5 leading-none">
                  Smart Farming. Healthy Living.
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (>= 1280px / xl) - Modern Glass Pill Tabs */}
            <nav aria-label="Primary Navigation" className="hidden xl:flex items-center gap-1 font-sans text-xs font-semibold tracking-wide text-typography-secondary shrink-0 bg-surface-neutral/80 p-1 rounded-full border border-surface-border/60">
              {navItems.map((item) => {
                const active = isNavActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                      active 
                        ? 'bg-forest-900 text-white font-bold shadow-sm' 
                        : 'text-typography-secondary hover:text-forest-900 hover:bg-forest-900/5'
                    }`}
                  >
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Compact Desktop Navigation Links for Large Screens (1024px - 1279px) */}
            <nav aria-label="Primary Navigation Compact" className="hidden lg:flex xl:hidden items-center gap-0.5 font-sans text-xs font-semibold text-typography-secondary shrink-0 bg-surface-neutral/80 p-1 rounded-full border border-surface-border/60">
              {navItems.map((item) => {
                const active = isNavActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative px-2.5 py-1 rounded-full transition-all duration-200 ${
                      active 
                        ? 'bg-forest-900 text-white font-bold shadow-sm' 
                        : 'text-typography-secondary hover:text-forest-900 hover:bg-forest-900/5'
                    }`}
                  >
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Actions: Search, Account, Cart & Shop Now */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Notification Center (if logged in) */}
              {user && <NotificationCenter user={user} />}

              {/* Desktop/Tablet Search Toggle Button */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Toggle Global Search"
                className="hidden md:flex p-2 sm:p-2.5 rounded-full text-typography-secondary hover:text-forest-900 hover:bg-forest-900/5 transition-all min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] items-center justify-center button-press shrink-0"
              >
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* User Account / Auth */}
              {user ? (
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  {user.role === 'ROLE_ADMIN' ? (
                    <Link 
                      to="/admin" 
                      aria-label="Admin Control Console" 
                      className="flex items-center gap-1.5 text-xs font-bold bg-gold/15 hover:bg-gold/25 text-soil border border-gold/40 px-2.5 sm:px-3 py-1.5 rounded-full transition-all button-press shrink-0"
                    >
                      <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                      <span className="hidden sm:inline">Admin Console</span>
                    </Link>
                  ) : (
                    <Link 
                      to="/dashboard" 
                      aria-label="User Account Dashboard" 
                      className="p-1.5 sm:p-2.5 rounded-full text-typography-secondary hover:text-forest-900 hover:bg-forest-900/5 transition-all min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center button-press shrink-0"
                      title={user.fullName || 'Dashboard'}
                    >
                      <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    aria-label="Log out of account" 
                    className="text-xs text-typography-muted hover:text-rose-600 px-2 py-1 transition-colors font-medium hidden sm:inline"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  data-testid="desktop-login-btn"
                  onClick={() => setIsAuthModalOpen(true)}
                  aria-label="Login or Sign Up for an Account"
                  className="p-1.5 sm:p-2.5 rounded-full text-typography-secondary hover:text-forest-900 hover:bg-forest-900/5 transition-all min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center button-press shrink-0"
                  title="Login / Account"
                >
                  <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>
              )}

              {/* Cart Button */}
              <button
                onClick={openDrawer}
                className="relative p-1.5 sm:p-2.5 rounded-full text-typography-secondary hover:text-forest-900 hover:bg-forest-900/5 transition-all min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center button-press shrink-0"
                aria-label={`Shopping cart with ${cart.itemCount} items`}
              >
                <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-forest-900" />
                {cart.itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-forest-900 text-white text-[10px] sm:text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {cart.itemCount}
                  </span>
                )}
              </button>

              {/* Prominent Shop Now CTA Button */}
              <Link
                to="/products"
                className="hidden sm:inline-flex bg-gradient-to-r from-forest-900 to-forest-800 hover:from-forest-800 hover:to-forest-700 text-white font-medium text-xs sm:text-sm px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full items-center gap-1.5 transition-all shadow-level-1 hover:shadow-glow button-press shrink-0 ml-0.5 sm:ml-1"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
                className="lg:hidden p-1.5 sm:p-2 rounded-full text-typography-primary hover:bg-forest-900/5 min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center shrink-0 ml-0.5 transition-colors"
              >
                {isMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 text-forest-700" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-forest-900" />}
              </button>
            </div>
          </div>

          {/* Desktop/Tablet Collapsible Global Search Drawer */}
          {isSearchOpen && (
            <div className="hidden md:block pt-2 pb-3 border-t border-surface-border/60 animate-fade-in">
              <div className="max-w-2xl mx-auto flex items-center gap-3">
                <div className="flex-1">
                  <GlobalSearch />
                </div>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 text-typography-muted hover:text-typography-primary text-xs font-semibold rounded-lg hover:bg-forest-900/5"
                  aria-label="Close Search"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Mobile Integrated Search Bar */}
          <div className="md:hidden pb-2.5 pt-1 border-t border-surface-border/50">
            <GlobalSearch isMobile={true} />
          </div>
        </div>

        {/* Mobile Slide-down Glass Drawer */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-surface-border bg-surface-white/98 backdrop-blur-2xl shadow-level-3 px-4 py-5 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto animate-fade-in">
            {/* Quick Action: Shop Now CTA in Mobile Drawer */}
            <div className="sm:hidden pb-1">
              <Link
                to="/products"
                onClick={() => setIsMenuOpen(false)}
                className="w-full bg-forest-900 hover:bg-forest-800 text-white font-semibold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-level-1 button-press transition-colors"
              >
                <span>Shop All Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center justify-between p-3.5 rounded-xl font-medium text-sm transition-all ${
                    isNavActive(item.path)
                      ? 'bg-surface-cream text-forest-900 font-bold border border-forest-700/20'
                      : 'text-typography-secondary hover:text-forest-900 hover:bg-surface-neutral'
                  }`}
                >
                  <span>{item.name}</span>
                  <ArrowRight className="w-4 h-4 text-typography-muted" />
                </Link>
              ))}
            </nav>

            {user ? (
              <div className="pt-4 border-t border-surface-border flex flex-col gap-2">
                {user.role === 'ROLE_ADMIN' ? (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-gold/15 text-soil font-bold text-sm border border-gold/30"
                  >
                    <ShieldCheck className="w-5 h-5 text-gold" />
                    <span>Admin Control Console</span>
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-cream text-forest-900 font-semibold text-sm border border-surface-border"
                  >
                    <User className="w-5 h-5 text-forest-700" />
                    <span>Dashboard ({user.fullName})</span>
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
                const currentPath = window.location.pathname;
                const hasCartItems = cart?.items?.length > 0 || cart?.itemCount > 0;
                if (hasCartItems) {
                  if (currentPath !== '/checkout' && currentPath !== '/cart') {
                    navigate('/checkout');
                  }
                } else if (currentPath !== '/checkout' && currentPath !== '/cart') {
                  navigate('/dashboard');
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
