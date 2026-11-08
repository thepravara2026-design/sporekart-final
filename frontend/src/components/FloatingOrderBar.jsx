import React, { useState, useEffect } from 'react';
import { ShoppingBag, MessageSquare, ArrowRight, Sprout, Phone } from 'lucide-react';

const OFFICIAL_WHATSAPP_URL = "https://wa.me/917204709870?text=Hello%20Sporekart%2C%20I%20would%20like%20to%20place%20an%20order%20for%20fresh%20mushrooms%20or%20spawn.";

export default function FloatingOrderBar() {
  const [isVisible, setIsVisible] = useState(false);

  // Show floating bar after scrolling 150px
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOrderNow = (e) => {
    e.preventDefault();
    const target = document.getElementById('all-products') || document.getElementById('bestsellers');
    if (target) {
      const yOffset = -80;
      const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    } else {
      window.location.href = '/products';
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Desktop Floating Conversion Pill */}
      <aside 
        aria-label="Quick order and WhatsApp assistance"
        className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[90%] bg-forest-950/92 backdrop-blur-xl border border-emerald-500/40 shadow-2xl rounded-full px-5 py-2.5 items-center justify-between gap-4 animate-fade-in hover:border-emerald-400 transition-all duration-300"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
            <Sprout className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white leading-tight truncate">
              Fresh Harvested in Davangere
            </div>
            <div className="text-[10px] text-emerald-300/80 leading-tight truncate">
              Order online or chat with farm agronomists
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={OFFICIAL_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-600/40 text-xs font-bold transition-all"
            title="Chat on WhatsApp (+91 7204709870)"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handleOrderNow}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-level-1 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Now</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </aside>

      {/* Mobile Fixed Bottom Action Bar */}
      <aside 
        aria-label="Quick mobile order and WhatsApp assistance"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-forest-950/95 backdrop-blur-md border-t border-forest-800/80 px-3.5 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] flex items-center gap-2.5 shadow-2xl animate-fade-in"
      >
        <a
          href={OFFICIAL_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-600/40 text-xs font-bold shadow-xs active:scale-95 transition-all text-center"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>WhatsApp</span>
        </a>

        <button
          type="button"
          onClick={handleOrderNow}
          className="flex-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-emerald-600 text-white text-xs font-extrabold shadow-level-2 active:scale-95 transition-all text-center cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 shrink-0" />
          <span>Order Now</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </aside>
    </>
  );
}

