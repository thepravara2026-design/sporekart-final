import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Sprout, GraduationCap, ShoppingBag, User, X, Menu, ShieldCheck, BookOpen, Info, PhoneCall } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import AuthForm from './AuthForm';
import { clearSessionAndTokens } from '../api';

export default function Navbar({ user, setUser }) {
  const { cart, openDrawer, mergeGuestCart } = useCart();
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

      <header className="sticky top-0 z-40 w-full transition-all duration-300 shadow-md">
        {/* Top Header Bar (Deep Forest Green #16532f) */}
        <div className="bg-[#16532f] text-white py-3.5 px-4 sm:px-6 lg:px-8 border-b border-[#124426]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" aria-label="Sporekart Agritech Home" className="flex items-center gap-3 group min-h-[44px] shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#16532f] shadow-md group-hover:scale-105 transition-transform duration-200">
                <Sprout className="w-6 h-6 text-[#16532f]" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                  Spore<span className="text-emerald-300">kart</span>
                </span>
                <span className="block text-[10px] text-emerald-200 font-bold tracking-widest uppercase opacity-90">
                  Grow. Learn. Thrive.
                </span>
              </div>
            </Link>

            {/* Desktop Global Search Bar */}
            <div className="hidden md:block flex-1 max-w-xl mx-4">
              <GlobalSearch />
            </div>

            {/* Top Bar Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link 
                    to="/dashboard" 
                    aria-label="User Account Dashboard" 
                    className="hidden sm:flex items-center gap-2 text-xs font-bold bg-white text-slate-900 px-4 py-2 rounded-full shadow-sm hover:bg-emerald-50 transition-all button-press"
                  >
                    <User className="w-4 h-4 text-[#16532f]" />
                    <span className="max-w-[120px] truncate">{user.fullName || 'Account'}</span>
                  </Link>
                  {user.role === 'ROLE_ADMIN' && (
                    <Link 
                      to="/admin" 
                      aria-label="Admin Control Console" 
                      className="hidden sm:flex items-center gap-2 text-xs font-bold bg-amber-400 text-slate-950 px-3.5 py-2 rounded-full shadow-sm hover:bg-amber-300 transition-all button-press"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      <span>Admin Console</span>
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    aria-label="Log out of account" 
                    className="text-xs text-emerald-200 hover:text-white min-h-[44px] px-2 transition-colors font-semibold"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  aria-label="Login or Sign Up for an Account"
                  className="bg-white text-[#16532f] hover:bg-emerald-50 font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-md transition-all button-press shrink-0 flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" /> Log In
                </button>
              )}

              {/* Cart Button */}
              <button
                onClick={openDrawer}
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-[#124426] hover:bg-[#0e361e] text-white transition-all min-h-[44px] button-press shadow-sm"
                aria-label={`Shopping cart with ${cart.itemCount} items`}
              >
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold hidden sm:inline">Cart</span>
                <span className="bg-amber-400 text-slate-950 text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow animate-scale-in">
                  {cart.itemCount || 0}
                </span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
                className="lg:hidden p-2 rounded-xl text-white hover:bg-[#124426] min-h-[44px] min-w-[44px] flex items-center justify-center border border-emerald-800/40"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Header Navigation Bar (White Background) */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Category Dropdown Button */}
            <Link
              to="/products"
              className="bg-[#16532f] hover:bg-[#124426] text-white font-extrabold text-xs sm:text-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all shrink-0"
            >
              <Sprout className="w-4 h-4 text-emerald-300" />
              <span>Shop by Category</span>
              <span className="text-xs">▼</span>
            </Link>

            {/* Navigation Links */}
            <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-6 font-bold text-xs sm:text-sm text-slate-800">
              <Link 
                to="/products" 
                className={`hover:text-[#16532f] transition-colors flex items-center gap-1.5 py-1.5 ${isActive('/products') ? 'text-[#16532f] font-extrabold border-b-2 border-[#16532f]' : ''}`}
              >
                Products Catalog
              </Link>
              <Link 
                to="/training" 
                className={`hover:text-[#16532f] transition-colors flex items-center gap-1.5 py-1.5 ${isActive('/training') ? 'text-[#16532f] font-extrabold border-b-2 border-[#16532f]' : ''}`}
              >
                Training and Courses
              </Link>
              <Link 
                to="/dashboard" 
                className={`hover:text-[#16532f] transition-colors flex items-center gap-1.5 py-1.5 ${isActive('/dashboard') ? 'text-[#16532f] font-extrabold border-b-2 border-[#16532f]' : ''}`}
              >
                Track Order
              </Link>
              <Link 
                to="/contact" 
                className={`hover:text-[#16532f] transition-colors flex items-center gap-1.5 py-1.5 ${isActive('/contact') ? 'text-[#16532f] font-extrabold border-b-2 border-[#16532f]' : ''}`}
              >
                Contact Us
              </Link>
              <Link 
                to="/products/mushroom-spawn" 
                className="hover:text-[#16532f] transition-colors flex items-center gap-1.5 py-1.5 font-bold text-[#16532f]"
              >
                Bulk Orders
              </Link>
            </nav>
          </div>
        </div>

        {/* Mobile Slide-over Drawer */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white animate-fade-in px-4 py-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="pb-2">
              <GlobalSearch isMobile={true} />
            </div>
            <nav className="flex flex-col gap-2">
              <Link
                to="/products"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl text-slate-800 font-bold text-sm border transition-all ${isActive('/products') ? 'bg-[#e2f2e6] border-[#16532f] text-[#16532f]' : 'bg-gray-50 border-gray-200'}`}
              >
                <Sprout className="w-5 h-5 text-[#16532f]" />
                <span>Shop by Category / Catalog</span>
              </Link>
              <Link
                to="/training"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl text-slate-800 font-bold text-sm border transition-all ${isActive('/training') ? 'bg-[#e2f2e6] border-[#16532f] text-[#16532f]' : 'bg-gray-50 border-gray-200'}`}
              >
                <GraduationCap className="w-5 h-5 text-[#16532f]" />
                <span>Training and Courses</span>
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl text-slate-800 font-bold text-sm border transition-all ${isActive('/dashboard') ? 'bg-[#e2f2e6] border-[#16532f] text-[#16532f]' : 'bg-gray-50 border-gray-200'}`}
              >
                <User className="w-5 h-5 text-[#16532f]" />
                <span>Track Order & Dashboard</span>
              </Link>
              <Link
                to="/contact"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl text-slate-800 font-bold text-sm border transition-all ${isActive('/contact') ? 'bg-[#e2f2e6] border-[#16532f] text-[#16532f]' : 'bg-gray-50 border-gray-200'}`}
              >
                <PhoneCall className="w-5 h-5 text-[#16532f]" />
                <span>Contact Us</span>
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
