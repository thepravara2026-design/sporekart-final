import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Truck, CreditCard, Award, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#16532f] border-t border-[#124426] pt-14 pb-10 text-emerald-100 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-10 border-b border-[#216d41]">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#124426]/60 border border-[#216d41]">
            <ShieldCheck className="w-8 h-8 text-[#b8e2c2] shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm">Lab Certified Spawn</h4>
              <p className="text-[11px] text-emerald-200/80">100% pure grain mother cultures</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#124426]/60 border border-[#216d41]">
            <Truck className="w-8 h-8 text-[#b8e2c2] shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm">Cold-Chain Express</h4>
              <p className="text-[11px] text-emerald-200/80">Shiprocket delivery across India</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#124426]/60 border border-[#216d41]">
            <CreditCard className="w-8 h-8 text-[#b8e2c2] shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm">Secure Razorpay</h4>
              <p className="text-[11px] text-emerald-200/80">UPI, Cards, NetBanking, Wallet</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#124426]/60 border border-[#216d41]">
            <Award className="w-8 h-8 text-[#b8e2c2] shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm">Certified Training</h4>
              <p className="text-[11px] text-emerald-200/80">Online & Offline lab masterclasses</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#16532f] font-bold shadow-md">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display font-extrabold text-xl text-white">Sporekart</span>
                <span className="block text-[10px] text-emerald-200 font-semibold tracking-wider uppercase">Grow. Learn. Thrive.</span>
              </div>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              India's pioneer mushroom agritech platform. Dedicated to fresh organic mushroom supply, high-yield grain spawn, ready-to-grow kits, and commercial grower incubation.
            </p>
            <div className="text-xs space-y-2 text-emerald-100">
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#b8e2c2] flex-shrink-0" /> AgriTech Innovation Hub, Pune, MH 411001</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#b8e2c2] flex-shrink-0" /> +91 9876543210</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#b8e2c2] flex-shrink-0" /> support@sporekart.in</p>
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <h3 className="font-display font-bold text-white text-sm mb-4 uppercase tracking-wider">E-Commerce Catalog</h3>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/products" className="hover:text-white transition-colors">Fresh Button & Oyster Mushrooms</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Dehydrated Gourmet Mushrooms</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Milky & Oyster Grain Spawn Seeds</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Indoor DIY Mushroom Growing Kits</Link></li>
            </ul>
          </div>

          {/* Training & Guides */}
          <div>
            <h3 className="font-display font-bold text-white text-sm mb-4 uppercase tracking-wider">Training & Guides</h3>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/training" className="hover:text-white transition-colors">Commercial Cultivation Masterclass</Link></li>
              <li><Link to="/training" className="hover:text-white transition-colors">Spawn Production & Lab Setup</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Mushroom Cultivation Handbook</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Agritech Knowledge Blog</Link></li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h3 className="font-display font-bold text-white text-sm mb-4 uppercase tracking-wider">India Agri-Commerce</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed mb-4">
              Compliant with FSSAI & National Seeds Policy standards. All payments processed via PCI-DSS compliant Razorpay gateway.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/about" className="px-3 py-1.5 bg-[#124426] border border-[#216d41] rounded-xl text-xs text-white hover:bg-[#1a5b35] transition-colors">About Us</Link>
              <Link to="/contact" className="px-3 py-1.5 bg-[#124426] border border-[#216d41] rounded-xl text-xs text-white hover:bg-[#1a5b35] transition-colors">Contact</Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-[#216d41] text-center text-xs text-emerald-200/70">
          <p>© {new Date().getFullYear()} Sporekart Agritech India. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
