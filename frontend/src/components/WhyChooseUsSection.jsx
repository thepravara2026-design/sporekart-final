import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Leaf, Users, Truck, Cpu, Heart, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'Fresh, nutritious & delicious gourmet mushrooms grown to peak flavor.',
  },
  {
    icon: Leaf,
    title: 'Sustainable Farming',
    description: 'Lower environmental impact with upcycled agricultural substrate.',
  },
  {
    icon: Users,
    title: 'Expert Team',
    description: 'Driven by passion & certified mycology expertise across India.',
  },
  {
    icon: Truck,
    title: 'Farm to Table',
    description: 'Shorter supply chain delivering harvest directly to your doorstep.',
  },
  {
    icon: Cpu,
    title: 'Innovation Focused',
    description: 'Smarter farming solutions combining biological science and IoT tech.',
  },
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Goodness in every bite packed with immunity-boosting beta-glucans.',
  },
];

export default function WhyChooseUsSection() {
  return (
    <section 
      id="why-choose-us" 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14"
      aria-label="Why Choose Sporekart"
    >
      {/* Outer Card with High-Visibility Fitted Background Image */}
      <div className="relative rounded-[26px] sm:rounded-[36px] overflow-hidden border border-surface-border shadow-xl bg-surface-cream text-forest-950">
        
        {/* Background Image: Fitted properly in the background with 90% visibility */}
        <div className="absolute inset-0 z-0">
          <img
            src="/sporekart-why-choose.jpg"
            alt="Sporekart fresh harvest mushrooms and organic culinary herbs"
            width="1920"
            height="1080"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center opacity-90 transition-transform duration-700 hover:scale-[1.02]"
          />
          {/* Gentle translucent wash preserving 90% background visibility while guaranteeing crisp text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-surface-cream/55 via-surface-cream/25 to-transparent sm:to-surface-cream/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-cream/50 via-transparent to-transparent lg:hidden" />
        </div>

        {/* Content Overlay: All elements positioned cleanly over background */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Copy, & Our Story CTA */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            <div className="space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900/10 border border-forest-800/20 text-forest-800 text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-md shadow-xs">
                <span className="w-2 h-2 rounded-full bg-forest-700 animate-pulse" />
                <span>WHY CHOOSE US</span>
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-[42px] text-forest-950 leading-[1.14]">
                Good for You.<br />Better for Tomorrow.
              </h2>
              <p className="text-forest-900/85 text-sm sm:text-base leading-relaxed max-w-lg font-sans">
                From more than just a mushroom brand — we’re a step towards a healthier you and a healthier planet.
              </p>
            </div>

            <div className="pt-1">
              <Link
                to="/about"
                className="bg-forest-900 hover:bg-forest-800 text-white font-medium text-xs sm:text-sm px-7 py-3.5 rounded-full inline-flex items-center gap-2.5 shadow-level-1 hover:shadow-level-2 hover:scale-[1.02] transition-all button-press"
              >
                <span>Our Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: 2-Column Grid of 6 Trust Cards with Blurred Forest Green Background & White Text */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-2.5 sm:gap-4">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group p-3.5 sm:p-5 rounded-2xl bg-forest-950/65 hover:bg-forest-950/80 backdrop-blur-md border border-white/20 hover:border-emerald-400/50 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 space-y-2 sm:space-y-2.5 flex flex-col justify-between"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/30 border border-emerald-400/35 text-emerald-300 flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 group-hover:text-emerald-200 transition-colors" strokeWidth={2} />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <h3 className="font-bold text-xs sm:text-base text-white leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] line-clamp-1 sm:line-clamp-none">
                      {feat.title}
                    </h3>
                    <p className="text-[10.5px] sm:text-xs text-white/85 font-medium leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] line-clamp-3 sm:line-clamp-none">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
