import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Truck, CreditCard, Award, Mail, Phone, MapPin, Building2 } from 'lucide-react';

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

export default function Footer() {
  return (
    <footer id="footer" className="bg-forest-900 border-t border-forest-800 pt-16 pb-12 text-surface-neutral text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-forest-800">
          <div className="flex items-center gap-3 p-4 rounded-card bg-forest-800/60 border border-forest-700/50 hover-lift">
            <ShieldCheck className="w-8 h-8 text-sage shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm">Lab Certified Spawn</h4>
              <p className="text-[11px] text-sage/80">100% pure grain mother cultures</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-card bg-forest-800/60 border border-forest-700/50 hover-lift">
            <Truck className="w-8 h-8 text-sage shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm">Cold-Chain Express</h4>
              <p className="text-[11px] text-sage/80">Shiprocket delivery across India</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-card bg-forest-800/60 border border-forest-700/50 hover-lift">
            <CreditCard className="w-8 h-8 text-sage shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm">Secure Razorpay</h4>
              <p className="text-[11px] text-sage/80">UPI, Cards, NetBanking, Wallet</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-card bg-forest-800/60 border border-forest-700/50 hover-lift">
            <Award className="w-8 h-8 text-sage shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm">Certified Training</h4>
              <p className="text-[11px] text-sage/80">Online & Offline lab masterclasses</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          {/* Brand & Enterprise Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center text-white font-bold shadow-level-1">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-white">Spore<span className="text-leaf">kart</span></span>
                <span className="block text-[10px] text-sage font-semibold tracking-wider uppercase">Shriyap Enterprise</span>
              </div>
            </div>
            <p className="text-xs text-sage/90 leading-relaxed">
              India's pioneer mushroom agritech platform managed by <strong>Shriyap Enterprise</strong>. Dedicated to fresh organic mushroom supply, high-yield grain spawn, ready-to-grow kits, and commercial grower incubation.
            </p>

            <div className="text-xs space-y-2.5 text-surface-cream/90 pt-1">
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-leaf flex-shrink-0 mt-0.5" />
                <span><strong>Shriyap Enterprise</strong></span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-leaf flex-shrink-0 mt-0.5" />
                <span>Basapura village, Behind Taralabalu school, Davangere-577001, Karnataka</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-leaf flex-shrink-0" />
                <a href="tel:+917204709870" className="hover:text-white font-medium transition-colors">+91 7204709870</a>
              </div>
              <div className="flex items-center gap-2.5">
                <WhatsAppIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <a 
                  href="https://wa.me/917204709870" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-300 hover:text-emerald-200 font-semibold transition-colors flex items-center gap-1"
                >
                  WhatsApp: +91 7204709870 ↗
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <InstagramIcon className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <a 
                  href="https://www.instagram.com/sporekart" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-pink-300 hover:text-pink-200 font-semibold transition-colors flex items-center gap-1"
                >
                  www.instagram.com/sporekart ↗
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-leaf flex-shrink-0" />
                <a href="mailto:support@sporekart.in" className="hover:text-white transition-colors">support@sporekart.in</a>
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <h3 className="font-display font-bold text-white text-sm mb-4 uppercase tracking-wider">E-Commerce Catalog</h3>
            <ul className="space-y-2.5 text-xs text-sage">
              <li><Link to="/products/fresh-mushrooms" className="hover:text-white transition-colors">Fresh Button & Oyster Mushrooms</Link></li>
              <li><Link to="/products/dry-mushrooms" className="hover:text-white transition-colors">Dehydrated Gourmet Mushrooms</Link></li>
              <li><Link to="/products/spawn-seeds" className="hover:text-white transition-colors">Milky & Oyster Grain Spawn Seeds</Link></li>
              <li><Link to="/products/growing-kits" className="hover:text-white transition-colors">Indoor DIY Mushroom Growing Kits</Link></li>
              <li><Link to="/products/equipment-supplies" className="hover:text-white transition-colors">Cultivation Equipment & Supplies</Link></li>
            </ul>
          </div>

          {/* Training & Guides */}
          <div>
            <h3 className="font-display font-bold text-white text-sm mb-4 uppercase tracking-wider">Training & Guides</h3>
            <ul className="space-y-2.5 text-xs text-sage">
              <li><Link to="/training" className="hover:text-white transition-colors">Commercial Cultivation Masterclass</Link></li>
              <li><Link to="/training" className="hover:text-white transition-colors">Spawn Production & Lab Setup</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Mushroom Cultivation Handbook</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Agritech Knowledge Blog</Link></li>
            </ul>
          </div>

          {/* Connect & Social Integrations */}
          <div>
            <h3 className="font-display font-bold text-white text-sm mb-4 uppercase tracking-wider">Connect & Order Online</h3>
            <p className="text-xs text-sage/90 leading-relaxed mb-4">
              Get instant assistance via WhatsApp or follow our farm updates on Instagram. Compliant with FSSAI & National Seeds Policy standards.
            </p>
            
            {/* Social Integration Quick Buttons */}
            <div className="space-y-2.5 mb-5">
              <a
                href="https://wa.me/917204709870"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-level-1 transition-all button-press"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>Chat on WhatsApp (+91 7204709870)</span>
              </a>

              <a
                href="https://www.instagram.com/sporekart"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2.5 bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600 hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-level-1 transition-all button-press"
              >
                <InstagramIcon className="w-4 h-4 text-white" />
                <span>Follow on Instagram (@sporekart)</span>
              </a>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to="/about" className="px-3 py-1.5 bg-forest-800 border border-forest-700 rounded-input text-xs text-white hover:bg-forest-700 transition-colors">About Us</Link>
              <Link to="/contact" className="px-3 py-1.5 bg-forest-800 border border-forest-700 rounded-input text-xs text-white hover:bg-forest-700 transition-colors">Contact Us</Link>
            </div>
          </div>
        </div>

        {/* Copyright & Enterprise Legal Notice */}
        <div className="pt-8 border-t border-forest-800 text-center text-xs text-sage/70 space-y-1">
          <p>© {new Date().getFullYear()} Sporekart — <strong>Shriyap Enterprise</strong>, Davangere-577001. All rights reserved.</p>
          <p className="text-[11px] text-sage/50">High-yield mushroom grain spawn, fresh gourmet produce, & lab masterclasses.</p>
        </div>
      </div>
    </footer>
  );
}

