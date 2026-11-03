import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Send, 
  Check, 
  Sparkles,
  Globe,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Truck,
  HelpCircle,
  BookOpen
} from 'lucide-react';

export const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.012 2c-5.506 0-9.97 4.463-9.97 9.969 0 1.761.458 3.473 1.328 4.981L2 22l5.176-1.356c1.454.794 3.097 1.213 4.836 1.213 5.506 0 9.97-4.463 9.97-9.969 0-5.506-4.464-9.969-9.97-9.969zm0 18.257c-1.558 0-3.082-.419-4.41-1.211l-.316-.188-3.279.86.875-3.197-.206-.328A8.254 8.254 0 0 1 3.73 11.97c0-4.566 3.714-8.28 8.282-8.28 4.567 0 8.28 3.714 8.28 8.28 0 4.567-3.713 8.287-8.28 8.287z"/>
  </svg>
);

export const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [pravaraModalOpen, setPravaraModalOpen] = useState(false);
  const pravaraRef = useRef(null);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail && newsletterEmail.includes('@')) {
      setNewsletterSubmitted(true);
      setTimeout(() => {
        setNewsletterEmail('');
        setNewsletterSubmitted(false);
      }, 5000);
    }
  };

  // Close PravaraMedia popover on outside click or Esc
  useEffect(() => {
    function handleClickOutside(event) {
      if (pravaraRef.current && !pravaraRef.current.contains(event.target)) {
        setPravaraModalOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setPravaraModalOpen(false);
      }
    }

    if (pravaraModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pravaraModalOpen]);

  return (
    <footer 
      id="footer" 
      className="relative bg-[#07170E] border-t border-forest-800/80 pt-14 pb-8 text-surface-neutral text-xs overflow-hidden transition-colors duration-500"
    >
      {/* Ambient background glow and minimalist botanical watermark */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 max-w-5xl h-36 bg-emerald-500/[0.05] blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 opacity-[0.035] pointer-events-none text-white select-none animate-subtle-glow">
        <svg viewBox="0 0 200 200" fill="currentColor">
          <path d="M100 20 C60 20 20 60 20 95 C20 115 50 125 75 125 L75 175 C75 185 85 190 100 190 C115 190 125 185 125 175 L125 125 C150 125 180 115 180 95 C180 60 140 20 100 20 Z" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Main 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* COLUMN 1 – BRAND IDENTITY (4 Cols on Desktop) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" aria-label="Sporekart Agritech Home" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 group-hover:border-emerald-400 flex items-center justify-center text-white transition-all shadow-sm">
                <Sprout className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-white group-hover:text-emerald-300 transition-colors tracking-tight">
                  Spore<span className="text-emerald-400">kart</span>
                </span>
                <span className="block text-[10px] text-emerald-400/90 font-medium tracking-wider uppercase">
                  Smart Farming. Healthy Living.
                </span>
              </div>
            </Link>

            <p className="text-xs text-surface-cream/75 leading-relaxed max-w-sm">
              Harvested fresh daily at 5:00 AM from our farm in Davangere, Karnataka. Cultivated on steam-sterilized organic paddy straw with zero chemical sprays, and 1st-generation pure wheat grain spawn.
            </p>

            {/* Statutory FSSAI License Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-forest-900/70 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>FSSAI Central Lic. #10020011000123</span>
            </div>

            {/* Quick Action Badges */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider block">
                Direct Channels
              </span>
              <div className="grid grid-cols-1 gap-2 max-w-xs">
                <a
                  href="https://wa.me/917204709870"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-medium text-xs shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <span className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4 text-white" />
                    <span>Chat on WhatsApp</span>
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">Active</span>
                </a>

                <a
                  href="https://www.instagram.com/sporekart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600 hover:opacity-95 text-white font-medium text-xs shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <span className="flex items-center gap-2">
                    <InstagramIcon className="w-4 h-4 text-white" />
                    <span>Instagram @sporekart</span>
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">Farm Updates</span>
                </a>
              </div>
            </div>
          </div>

          {/* COLUMN 2 – QUICK NAVIGATION (2-3 Cols on Desktop) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider text-emerald-400/90 pb-1 border-b border-forest-800/40 inline-block">
              Quick Navigation
            </h3>
            <ul className="space-y-2 text-xs text-surface-cream/80">
              <li>
                <Link to="/" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>All Products</span>
                </Link>
              </li>
              <li>
                <Link to="/products/fresh-mushrooms" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>Fresh Mushrooms</span>
                </Link>
              </li>
              <li>
                <Link to="/products/spawn-seeds" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>Pure Grain Spawn</span>
                </Link>
              </li>
              <li>
                <Link to="/training" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>Grower Masterclasses</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>About Our Farm</span>
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>Agritech Blog</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3 – CUSTOMER SUPPORT & GROWER CARE (3 Cols on Desktop) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider text-emerald-400/90 pb-1 border-b border-forest-800/40 inline-block">
              Customer Support
            </h3>
            <ul className="space-y-2 text-xs text-surface-cream/80">
              <li>
                <Link to="/contact" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>Contact Helpline</span>
                </Link>
              </li>
              <li>
                <a href="/#faq" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>Frequently Asked Questions</span>
                </a>
              </li>
              <li>
                <a href="/#trust-standards" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>Lab Viability &amp; Cleanroom</span>
                </a>
              </li>
              <li>
                <a href="/#why-choose-us" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>Assured Buyback Guarantee</span>
                </a>
              </li>
              <li>
                <Link to="/mushroom-cultivation-guide" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>Cultivation Handbook</span>
                </Link>
              </li>
              <li>
                <Link to="/mushroom-spawn-guide" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>Spawn Production Guide</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4 – ENTERPRISE CONTACT & NEWSLETTER (3-4 Cols on Desktop) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider text-emerald-400/90 pb-1 border-b border-forest-800/40 inline-block">
              Enterprise &amp; Contact
            </h3>
            
            {/* Enterprise Details Card */}
            <div className="p-3.5 rounded-xl bg-forest-900/40 border border-forest-800/70 space-y-2.5 text-xs text-surface-cream/80">
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-white font-medium">Shriyap Enterprise</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <a 
                  href="https://maps.google.com/?q=Basapura+village,+Behind+Taralabalu+school,+Davangere-577001,+Karnataka" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-emerald-300 transition-colors leading-snug"
                >
                  Basapura village, Behind Taralabalu school, Davangere-577001, Karnataka ↗
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="tel:+917204709870" className="hover:text-emerald-300 transition-colors">+91 7204709870</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="mailto:support@sporekart.in" className="hover:text-emerald-300 transition-colors">support@sporekart.in</a>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-medium text-emerald-300/90 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Harvest &amp; Spawn Alerts</span>
              </div>
              <p className="text-[10px] text-sage/75">
                Subscribe for fresh batch drops, lab viability reports &amp; seasonal grower tips.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="relative pt-0.5">
                <div className="relative flex items-center">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-forest-900/60 border border-forest-700/60 text-xs text-white placeholder-sage/50 focus:outline-none focus:border-emerald-400 pr-9 transition-colors"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to newsletter"
                    className="absolute right-1 w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors shadow-sm"
                  >
                    {newsletterSubmitted ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3 h-3" />}
                  </button>
                </div>
                {newsletterSubmitted && (
                  <p className="text-[11px] text-emerald-400 mt-1.5 font-medium flex items-center gap-1 animate-fade-in">
                    <Check className="w-3 h-3" /> Subscribed successfully!
                  </p>
                )}
              </form>
            </div>
          </div>

        </div>

        {/* Statutory Legal & Compliance Bar */}
        <div className="pt-6 border-t border-forest-800/60 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[11px] text-sage/80 font-medium">
          <Link to="/privacy-policy" className="hover:text-emerald-300 transition-colors">Privacy Policy</Link>
          <span className="text-emerald-800">•</span>
          <Link to="/terms" className="hover:text-emerald-300 transition-colors">Terms of Service</Link>
          <span className="text-emerald-800">•</span>
          <Link to="/refund-policy" className="hover:text-emerald-300 transition-colors">Refund &amp; Return Policy</Link>
          <span className="text-emerald-800">•</span>
          <Link to="/shipping-policy" className="hover:text-emerald-300 transition-colors">Shipping &amp; Cold-Chain Policy</Link>
          <span className="text-emerald-800">•</span>
          <Link to="/cookie-policy" className="hover:text-emerald-300 transition-colors">Cookie &amp; Cache Policy</Link>
          <span className="text-emerald-800">•</span>
          <Link to="/policies/grievance" className="hover:text-emerald-300 transition-colors">Grievance Redressal</Link>
        </div>

        {/* Bottom Bar: Copyright & Clickable PravaraMedia Attribution */}
        <div className="pt-4 border-t border-forest-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-sage/70 gap-4">
          
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} Sporekart — <strong>Shriyap Enterprise</strong>, Davangere-577001. All rights reserved.
          </p>

          {/* Clickable PravaraMedia Bottom Attribution with Creative Actionable Popover */}
          <div ref={pravaraRef} className="relative inline-block">
            <button
              type="button"
              onClick={() => setPravaraModalOpen((prev) => !prev)}
              aria-expanded={pravaraModalOpen}
              aria-haspopup="dialog"
              aria-label="Design & Developed By PravaraMedia, Davangere, Karnataka - Click for official links"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-900/60 border border-emerald-500/25 text-[11px] text-emerald-300 font-medium tracking-wide shadow-sm hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <span>Design &amp; Developed By PravaraMedia, Davangere, Karnataka.</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
            </button>

            {/* Modern Creative Popover */}
            {pravaraModalOpen && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="PravaraMedia Agency Information and Links"
                className="absolute bottom-full mb-3 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-72 sm:w-80 bg-forest-950/95 border border-emerald-500/40 rounded-2xl shadow-level-3 p-4 backdrop-blur-xl z-50 text-left animate-slide-up"
              >
                {/* Downward pointing arrow */}
                <div className="absolute -bottom-1.5 right-6 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-3 h-3 bg-forest-950 border-r border-b border-emerald-500/40 rotate-45" />

                {/* Popover Header */}
                <div className="flex items-start justify-between pb-3 border-b border-forest-800/80 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-white text-sm">PravaraMedia</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase tracking-wider">Agency</span>
                    </div>
                    <p className="text-[10px] text-sage/75">Design, Development &amp; Media · Davangere, Karnataka</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPravaraModalOpen(false)}
                    aria-label="Close PravaraMedia popover"
                    className="text-sage/60 hover:text-white p-1 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Popover Actionable Links */}
                <div className="space-y-2">
                  {/* 1. Website */}
                  <a
                    href="https://pravaramedia.framer.website"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-forest-900/60 hover:bg-forest-800/70 border border-forest-700/50 hover:border-emerald-500/40 transition-all duration-200 group/link"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover/link:bg-emerald-500/20 text-emerald-400 transition-colors">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate group-hover/link:text-emerald-300 transition-colors">pravaramedia.framer.website</p>
                        <p className="text-[10px] text-sage/70 truncate">Official Portfolio &amp; Agency</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-sage/60 group-hover/link:text-emerald-300 shrink-0 ml-2" />
                  </a>

                  {/* 2. WhatsApp */}
                  <a
                    href="https://wa.me/918277559093?text=Hi%20PravaraMedia%2C%20I%20visited%20Sporekart%20and%20would%20like%20to%20connect%21"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 hover:border-emerald-500/40 transition-all duration-200 group/link"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-300 transition-colors">
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate group-hover/link:text-emerald-300 transition-colors">+91 8277559093</p>
                        <p className="text-[10px] text-sage/70 truncate">Chat on WhatsApp</p>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase tracking-wider shrink-0">Direct</span>
                  </a>

                  {/* 3. Instagram */}
                  <a
                    href="https://www.instagram.com/pravaramedia.marketing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-forest-900/60 hover:bg-forest-800/70 border border-forest-700/50 hover:border-pink-500/40 transition-all duration-200 group/link"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0 text-pink-400 group-hover/link:bg-pink-500/20 transition-colors">
                        <InstagramIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate group-hover/link:text-pink-300 transition-colors">@pravaramedia.marketing</p>
                        <p className="text-[10px] text-sage/70 truncate">Instagram Creative Showcase</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-sage/60 group-hover/link:text-pink-300 shrink-0 ml-2" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}