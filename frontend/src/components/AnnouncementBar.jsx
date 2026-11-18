import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, Truck, ShieldCheck, Sparkles, Tag, Compass, Leaf } from 'lucide-react';
import * as api from '../api';

const DEFAULT_ANNOUNCEMENTS = [
  { id: 'a1', text: 'Daily Fresh Harvest at 5:00 AM • Davangere Commercial Farm Direct', icon: Sparkles, badge: 'LIVE HARVEST' },
  { id: 'a2', text: 'Pan-India Cold Chain Dispatch within 24–48 Hours', icon: Truck, badge: 'EXPRESS DISPATCH' },
  { id: 'a3', text: '1st-Gen Pure Wheat Grain Spawn • 99.8% Colonization Viability Guaranteed', icon: ShieldCheck, badge: 'LAB VERIFIED' },
  { id: 'a4', text: 'Next Commercial Cultivation Masterclass Enrolling Now • Direct Market Buyback', icon: Tag, badge: 'TRAINING' },
  { id: 'a5', text: 'FSSAI Lic. #10020011000123 • 100% Pesticide-Free Steam-Sterilized Straw', icon: ShieldCheck, badge: 'CERTIFIED ORGANIC' },
];

export default function AnnouncementBar() {
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const cartApi = api?.cartApi;
    if (typeof cartApi?.getAvailablePromotions === 'function') {
      try {
        const promise = cartApi.getAvailablePromotions('CUSTOMER');
        if (promise && typeof promise.then === 'function') {
          promise
            .then((res) => {
              if (isMounted && res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
                const promoItems = res.data.data.map((p) => ({
                  id: `promo-${p.id || p.code}`,
                  text: `Use Code ${p.code} • ${p.description || `Special ${p.discountPercent ? `${p.discountPercent}% OFF` : 'Discount'}`}`,
                  icon: Tag,
                  badge: 'SPECIAL OFFER'
                }));
                setPromotions(promoItems);
              }
            })
            .catch(() => {
              // Fallback cleanly to default verified announcements
            });
        }
      } catch (err) {
        // Fallback cleanly to default verified announcements
      }
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const allItems = promotions.length > 0 ? [...promotions, ...DEFAULT_ANNOUNCEMENTS] : DEFAULT_ANNOUNCEMENTS;

  return (
    <aside 
      className="bg-gradient-to-r from-[#06180e] via-[#0b2416] to-[#06180e] text-emerald-100 border-b border-emerald-500/20 text-[10px] sm:text-xs font-medium py-1 sm:py-1.5 px-3 sm:px-6 relative z-50 overflow-hidden select-none shadow-xs"
      role="region"
      aria-label="Promotional announcements and customer order assistance"
    >
      {/* Background Ambient Glow Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-32 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-40 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 relative z-10">
        {/* Contact Assistance Hub */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 hidden md:flex text-emerald-200">
          {/* Live Radar Pulse Indicator */}
          <span className="relative flex h-2 w-2 mr-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>

          <a
            href="tel:+917204709870"
            className="flex items-center gap-1.5 hover:text-white transition-all cursor-pointer group bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px]"
            title="Call Sporekart Order Helpline"
          >
            <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 group-hover:scale-110 group-hover:text-emerald-300 transition-transform" />
            <span className="tracking-tight">Order Helpline: <strong className="text-white font-bold ml-0.5">+91 7204709870</strong></span>
          </a>

          <span className="text-emerald-700/60 font-light text-[10px]">|</span>

          <a
            href="https://wa.me/917204709870?text=Hello%20Sporekart%2C%20I%20have%20an%20inquiry%20regarding%20mushroom%20orders."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white transition-all bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold shadow-2xs"
          >
            <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
            <span>WhatsApp Us</span>
          </a>
        </div>

        {/* Marquee Center Track */}
        <div className="relative flex-1 overflow-hidden min-w-0 mx-2 sm:mx-4 group">
          {/* Subtle gradient edge fade */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#07190f] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#07190f] to-transparent z-10 pointer-events-none" />

          <div 
            className="inline-flex items-center gap-8 whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]"
            style={{ willChange: 'transform' }}
          >
            {allItems.concat(allItems).map((item, idx) => {
              const Icon = item.icon || Sparkles;
              return (
                <div key={`${item.id}-${idx}`} className="inline-flex items-center gap-2 text-emerald-100">
                  {item.badge && (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                  <Icon className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="tracking-tight font-medium">{item.text}</span>
                  <span className="text-emerald-700/80 mx-2 text-[10px]">✦</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Badge / Location & Quality Telemetry */}
        <div className="shrink-0 hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/25 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Davangere Farm Direct</span>
          </div>

          <div className="hidden xl:flex items-center gap-1 text-[10px] text-emerald-400/75 bg-emerald-900/30 border border-emerald-500/20 px-2 py-1 rounded-full">
            <Leaf className="w-2.5 h-2.5 text-emerald-400" />
            <span>100% Organically Grown</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
