import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, Truck, ShieldCheck, Sparkles, Tag } from 'lucide-react';
import { cartApi } from '../api';

const DEFAULT_ANNOUNCEMENTS = [
  { id: 'a1', text: 'Daily Fresh Harvest at 5:00 AM • Davangere Commercial Farm Direct', icon: Sparkles },
  { id: 'a2', text: 'Pan-India Cold Chain Dispatch within 24–48 Hours', icon: Truck },
  { id: 'a3', text: '1st-Gen Pure Wheat Grain Spawn • 99.8% Colonization Viability Guaranteed', icon: ShieldCheck },
  { id: 'a4', text: 'Next Commercial Cultivation Masterclass Enrolling Now • Direct Market Buyback', icon: Tag },
  { id: 'a5', text: 'FSSAI Lic. #10020011000123 • 100% Pesticide-Free Steam-Sterilized Straw', icon: ShieldCheck },
];

export default function AnnouncementBar() {
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    let isMounted = true;
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
                  icon: Tag
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
      className="bg-forest-950 text-emerald-100 border-b border-forest-800/80 text-[11px] sm:text-xs font-medium py-1.5 px-3 sm:px-6 relative z-50 overflow-hidden select-none"
      role="region"
      aria-label="Promotional announcements and customer order assistance"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Contact Assistance Link */}
        <div className="flex items-center gap-3 shrink-0 hidden md:flex text-emerald-200">
          <a
            href="tel:+917204709870"
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group"
            title="Call Sporekart Order Helpline"
          >
            <Phone className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Order Helpline: <strong className="text-white">+91 7204709870</strong></span>
          </a>
          <span className="text-forest-700">|</span>
          <a
            href="https://wa.me/917204709870?text=Hello%20Sporekart%2C%20I%20have%20an%20inquiry%20regarding%20mushroom%20orders."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <MessageSquare className="w-3 h-3 text-emerald-400" />
            <span>WhatsApp Us</span>
          </a>
        </div>

        {/* Marquee Center Track */}
        <div className="relative flex-1 overflow-hidden min-w-0 mx-auto group">
          <div 
            className="inline-flex items-center gap-8 whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]"
            style={{ willChange: 'transform' }}
          >
            {allItems.concat(allItems).map((item, idx) => {
              const Icon = item.icon || Sparkles;
              return (
                <div key={`${item.id}-${idx}`} className="inline-flex items-center gap-2 text-emerald-100">
                  <Icon className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{item.text}</span>
                  <span className="text-forest-700 mx-2">•</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Badge / Location */}
        <div className="shrink-0 hidden lg:flex items-center gap-1.5 text-emerald-300/80 text-[10px] uppercase tracking-wider font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Davangere Farm Direct</span>
        </div>
      </div>
    </aside>
  );
}
