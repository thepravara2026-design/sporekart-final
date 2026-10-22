import React from 'react';
import { ShoppingBag, GraduationCap, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StickyMobileActionBar() {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-white/95 backdrop-blur-xl border-t border-surface-border shadow-level-3 p-2.5 px-4 flex items-center justify-between gap-2">
      {/* 1. Shop Spawn & Kits */}
      <a
        href="#store"
        className="flex-1 py-2.5 px-2 rounded-xl bg-forest-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
      >
        <ShoppingBag className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
        <span className="truncate">Order Products</span>
      </a>

      {/* 2. Get Trained */}
      <a
        href="#calculator"
        className="flex-1 py-2.5 px-2 rounded-xl bg-gold text-forest-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
      >
        <GraduationCap className="w-3.5 h-3.5 text-forest-950 shrink-0" />
        <span className="truncate">Get Trained</span>
      </a>

      {/* 3. WhatsApp Help */}
      <a
        href="https://wa.me/917204709870?text=Hello%20Sporekart,%20I%20want%20to%20know%20more%20about%20mushroom%20spawn%20and%20training."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with Agronomist"
        className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
      >
        <MessageSquare className="w-4 h-4" />
      </a>
    </div>
  );
}
