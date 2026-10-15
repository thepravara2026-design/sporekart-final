import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Truck, CreditCard, Award, Mail, Phone, MapPin, Building2, Send, Check } from 'lucide-react';

const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.012 2c-5.506 0-9.97 4.463-9.97 9.969 0 1.761.458 3.473 1.328 4.981L2 22l5.176-1.356c1.454.794 3.097 1.213 4.836 1.213 5.506 0 9.97-4.463 9.97-9.969 0-5.506-4.464-9.969-9.97-9.969zm0 18.257c-1.558 0-3.082-.419-4.41-1.211l-.316-.188-3.279.86.875-3.197-.206-.328A8.254 8.254 0 0 1 3.73 11.97c0-4.566 3.714-8.28 8.282-8.28 4.567 0 8.28 3.714 8.28 8.28 0 4.567-3.713 8.287-8.28 8.287z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.325v21.351C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.597 1.323-1.325V1.325C24 .597 23.405 0 22.675 0z"/>
  </svg>
);

const YouTubeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

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

  return (
    <footer id="footer" className="relative bg-[#0C2518] border-t border-forest-800 pt-16 pb-12 text-surface-neutral text-sm overflow-hidden">
      
      {/* Subtle Botanical Mushroom Watermark Illustration in Bottom Right */}
      <div className="absolute -bottom-8 -right-8 w-72 h-72 opacity-[0.04] pointer-events-none text-white select-none">
        <svg viewBox="0 0 200 200" fill="currentColor">
          <path d="M100 20 C60 20 20 60 20 95 C20 115 50 125 75 125 L75 175 C75 185 85 190 100 190 C115 190 125 185 125 175 L125 125 C150 125 180 115 180 95 C180 60 140 20 100 20 Z" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-12 border-b border-forest-800/80">
          <Link 
            to="/products/spawn-seeds" 
            className="flex items-center gap-3 p-4 rounded-2xl bg-forest-800/40 border border-forest-700/40 hover-lift hover:border-emerald-500/50 transition-all group"
          >
            <ShieldCheck className="w-7 h-7 text-emerald-400 group-hover:text-emerald-300 transition-colors shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">Lab Certified Spawn</h4>
              <p className="text-[11px] text-sage/80">100% pure grain mother cultures</p>
            </div>
          </Link>

          <Link 
            to="/contact" 
            className="flex items-center gap-3 p-4 rounded-2xl bg-forest-800/40 border border-forest-700/40 hover-lift hover:border-emerald-500/50 transition-all group"
          >
            <Truck className="w-7 h-7 text-emerald-400 group-hover:text-emerald-300 transition-colors shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">Cold-Chain Express</h4>
              <p className="text-[11px] text-sage/80">Fast express delivery across India</p>
            </div>
          </Link>

          <Link 
            to="/orders" 
            className="flex items-center gap-3 p-4 rounded-2xl bg-forest-800/40 border border-forest-700/40 hover-lift hover:border-emerald-500/50 transition-all group"
          >
            <CreditCard className="w-7 h-7 text-emerald-400 group-hover:text-emerald-300 transition-colors shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">Secure Razorpay</h4>
              <p className="text-[11px] text-sage/80">UPI, Cards, NetBanking, Wallet</p>
            </div>
          </Link>

          <Link 
            to="/training" 
            className="flex items-center gap-3 p-4 rounded-2xl bg-forest-800/40 border border-forest-700/40 hover-lift hover:border-emerald-500/50 transition-all group"
          >
            <Award className="w-7 h-7 text-emerald-400 group-hover:text-emerald-300 transition-colors shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">Certified Training</h4>
              <p className="text-[11px] text-sage/80">Practical farm & lab masterclasses</p>
            </div>
          </Link>
        </div>

        {/* 4 Main Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-12">
          
          {/* Column 1: Brand & Enterprise Info (4 Cols) */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" aria-label="Sporekart Agritech Home" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-forest-800 group-hover:bg-forest-700 flex items-center justify-center text-white font-bold shadow-sm transition-colors">
                <Sprout className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-white group-hover:text-emerald-300 transition-colors">
                  Spore<span className="text-emerald-400">kart</span>
                </span>
                <span className="block text-[9px] text-sage font-semibold tracking-wider uppercase">
                  Smart Farming. Healthy Living.
                </span>
              </div>
            </Link>
            
            <p className="text-xs text-sage/90 leading-relaxed max-w-sm">
              India’s mushroom agritech platform managed by <strong>Shriyap Enterprise</strong>. Dedicated to fresh organic mushrooms, high-yield grain spawn seeds, and commercial grower training.
            </p>

            <div className="text-xs space-y-2 text-surface-cream/80 pt-1">
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Shriyap Enterprise</strong></span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <a 
                  href="https://maps.google.com/?q=Basapura+village,+Behind+Taralabalu+school,+Davangere-577001,+Karnataka" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors"
                >
                  Basapura village, Behind Taralabalu school, Davangere-577001, Karnataka ↗
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <a href="tel:+917204709870" className="hover:text-white transition-colors">+91 7204709870</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <a href="mailto:support@sporekart.in" className="hover:text-white transition-colors">support@sporekart.in</a>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="pt-2 max-w-sm">
              <p className="text-xs text-sage/90 font-medium mb-2">
                Stay Connected — updates, offers & farm stories:
              </p>
              <form onSubmit={handleNewsletterSubmit} className="relative">
                <div className="relative flex items-center">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="w-full px-4 py-2 rounded-full bg-forest-800/80 border border-forest-700 text-xs text-white placeholder-sage/60 focus:outline-none focus:border-emerald-400 pr-10 transition-colors"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to newsletter"
                    className="absolute right-1 w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors button-press"
                  >
                    {newsletterSubmitted ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3 h-3" />}
                  </button>
                </div>
                {newsletterSubmitted && (
                  <p className="text-[11px] text-emerald-400 mt-1 font-medium animate-fade-in">
                    ✓ Subscribed successfully!
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Column 2: Product Categories (3 Cols) */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">
              E-Commerce Catalog
            </h3>
            <ul className="space-y-2.5 text-xs text-sage">
              <li><Link to="/products" className="hover:text-white transition-colors font-medium text-surface-cream">All Mushroom Products</Link></li>
              <li><Link to="/products/fresh-mushrooms" className="hover:text-white transition-colors">Fresh Button & Oyster Mushrooms</Link></li>
              <li><Link to="/products/dry-mushrooms" className="hover:text-white transition-colors">Dehydrated Gourmet Mushrooms</Link></li>
              <li><Link to="/products/spawn-seeds" className="hover:text-white transition-colors">Milky & Oyster Grain Spawn Seeds</Link></li>
              <li><Link to="/products/growing-kits" className="hover:text-white transition-colors">Indoor DIY Mushroom Growing Kits</Link></li>
              <li><Link to="/products/equipment-supplies" className="hover:text-white transition-colors">Cultivation Equipment & Supplies</Link></li>
            </ul>
          </div>

          {/* Column 3: Training & Guides (2.5 Cols) */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">
              Training & Guides
            </h3>
            <ul className="space-y-2.5 text-xs text-sage">
              <li><Link to="/training" className="hover:text-white transition-colors font-medium text-surface-cream">All Training Masterclasses</Link></li>
              <li><Link to="/training/commercial-mushroom-cultivation-masterclass" className="hover:text-white transition-colors">Commercial Cultivation Masterclass</Link></li>
              <li><Link to="/training/spawn-production-tissue-culture-masterclass" className="hover:text-white transition-colors">Spawn Production & Lab Setup</Link></li>
              <li><Link to="/mushroom-cultivation-guide" className="hover:text-white transition-colors">Mushroom Cultivation Handbook</Link></li>
              <li><Link to="/mushroom-spawn-guide" className="hover:text-white transition-colors">Mushroom Spawn Technical Guide</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Agritech Knowledge Blog</Link></li>
            </ul>
          </div>

          {/* Column 4: Connect & Quick Access (2.5 Cols) */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">
              Connect & Quick Links
            </h3>
            <p className="text-xs text-sage/90 leading-relaxed mb-3">
              Instant WhatsApp support and regular farm updates on Instagram.
            </p>
            
            {/* Quick Action Badges */}
            <div className="space-y-2 mb-3">
              <a
                href="https://wa.me/917204709870"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all button-press"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href="https://www.instagram.com/sporekart"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3.5 py-2 bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600 hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all button-press"
              >
                <InstagramIcon className="w-4 h-4 text-white" />
                <span>Instagram @sporekart</span>
              </a>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Link to="/about" className="px-2.5 py-1 bg-forest-800 border border-forest-700 rounded-input text-xs text-white hover:bg-forest-700 transition-colors">About Us</Link>
              <Link to="/sustainability" className="px-2.5 py-1 bg-forest-800 border border-forest-700 rounded-input text-xs text-white hover:bg-forest-700 transition-colors">Sustainability</Link>
              <Link to="/contact" className="px-2.5 py-1 bg-forest-800 border border-forest-700 rounded-input text-xs text-white hover:bg-forest-700 transition-colors">Contact Us</Link>
              <Link to="/orders" className="px-2.5 py-1 bg-forest-800 border border-forest-700 rounded-input text-xs text-white hover:bg-forest-700 transition-colors">Track Orders</Link>
              <Link to="/cart" className="px-2.5 py-1 bg-forest-800 border border-forest-700 rounded-input text-xs text-white hover:bg-forest-700 transition-colors">Cart</Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Quick Navigation Links + Copyright */}
        <div className="pt-8 border-t border-forest-800/80 flex flex-col lg:flex-row items-center justify-between text-xs text-sage/70 gap-4">
          <p>© {new Date().getFullYear()} Sporekart — <strong>Shriyap Enterprise</strong>, Davangere-577001. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-sage/80">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>•</span>
            <Link to="/products" className="hover:text-white transition-colors">Catalog</Link>
            <span>•</span>
            <Link to="/training" className="hover:text-white transition-colors">Training</Link>
            <span>•</span>
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span>•</span>
            <Link to="/mushroom-cultivation-guide" className="hover:text-white transition-colors">Cultivation Guide</Link>
            <span>•</span>
            <Link to="/mushroom-spawn-guide" className="hover:text-white transition-colors">Spawn Guide</Link>
            <span>•</span>
            <Link to="/sustainability" className="hover:text-white transition-colors">Sustainability</Link>
            <span>•</span>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
