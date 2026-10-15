import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Recycle, Droplets, Sun, ShieldCheck } from 'lucide-react';

const PRACTICES = [
  {
    icon: Recycle,
    title: 'Substrate Upcycling',
    desc: 'Repurposing agricultural paddy & wheat straw into organic compost.',
  },
  {
    icon: Droplets,
    title: '90%+ Water Recovery',
    desc: 'Closed-loop micro-misting systems recycling condensation.',
  },
  {
    icon: Sun,
    title: 'Clean Solar Energy',
    desc: 'Powering automated cold-chain storage with renewable energy.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero Chemical Residues',
    desc: 'HEPA laminar airflow eliminating synthetic chemical pesticides.',
  },
];

export default function SustainabilitySection() {
  return (
    <section 
      id="sustainability" 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16"
      aria-label="Our Sustainability Commitment"
    >
      <div className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden border border-surface-border shadow-level-2 bg-[#0C2518] text-white">
        
        {/* Background Panoramic Solar Farm Image */}
        <div className="absolute inset-0">
          <img
            src="/sporekart-sustainability-farm.jpg"
            alt="Sporekart eco-friendly sustainable solar greenhouse farm"
            width="1440"
            height="810"
            loading="lazy"
            className="w-full h-full object-cover opacity-35 transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C2518]/95 via-[#0C2518]/85 to-transparent sm:to-[#0C2518]/40" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 p-6 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-6 space-y-5">
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-emerald-300 uppercase font-sans">
              OUR COMMITMENT
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-[42px] text-white leading-[1.15]">
              Sustainable Practices<br />for a Healthier Planet
            </h2>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-lg">
              We believe in farming that gives back. Our sustainable practices help protect the environment, conserve resources, and build a greener future for generations to come.
            </p>

            <div className="pt-2">
              <Link
                to="/sustainability"
                className="bg-white hover:bg-surface-cream text-forest-900 font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full inline-flex items-center gap-2 shadow-level-1 hover-lift transition-all button-press"
              >
                <span>Explore Sustainability</span>
                <ArrowRight className="w-4 h-4 text-forest-900" />
              </Link>
            </div>
          </div>

          {/* Right Verified Practices: 2-Column Grid in Mobile & Desktop */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-2.5 sm:gap-3.5">
            {PRACTICES.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="p-3 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5 sm:space-y-2 hover:bg-white/15 transition-colors flex flex-col justify-between"
                >
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 sm:line-clamp-none">
                      {p.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-white/70 leading-relaxed line-clamp-2 sm:line-clamp-none">
                      {p.desc}
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
