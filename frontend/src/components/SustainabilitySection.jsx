import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Recycle, Droplets, Sun, ShieldCheck, Sparkles } from 'lucide-react';

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
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14"
      aria-label="Our Sustainability Commitment"
    >
      {/* Outer Card with High-Visibility Panoramic Background Image */}
      <div className="relative rounded-[26px] sm:rounded-[36px] overflow-hidden border border-emerald-500/25 shadow-2xl bg-[#071d12] text-white">
        
        {/* Background Panoramic Solar Farm Image - Clearly Visible & Properly Fitted */}
        <div className="absolute inset-0 z-0">
          <img
            src="/sporekart-sustainability-farm.jpg"
            alt="Sporekart eco-friendly sustainable solar greenhouse farm"
            width="1920"
            height="1080"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center sm:object-[center_35%] opacity-80 transition-transform duration-700 hover:scale-[1.02]"
          />
          {/* Subtle gradient: preserves 80% image visibility while keeping text readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#06180f]/75 via-[#06180f]/35 to-transparent sm:to-[#06180f]/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06180f]/70 via-transparent to-transparent lg:hidden" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[460px] sm:min-h-[520px]">
          
          {/* Left Text Block */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-950/70 border border-emerald-400/40 text-emerald-300 text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>OUR SUSTAINABILITY COMMITMENT</span>
            </div>
            
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-[42px] text-white leading-[1.14] drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]">
              Sustainable Practices<br />for a Healthier Planet
            </h2>
            
            <p className="text-white/95 text-sm sm:text-base leading-relaxed max-w-lg font-sans drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              We believe in farming that gives back. Our closed-loop agricultural methods upcycle crop residue, conserve water, and power cold storage with clean solar energy for generations to come.
            </p>

            <div className="pt-2">
              <Link
                to="/sustainability"
                className="bg-white hover:bg-emerald-50 text-forest-950 font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full inline-flex items-center gap-2.5 shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all button-press"
              >
                <span>Explore Sustainability Initiatives</span>
                <ArrowRight className="w-4 h-4 text-forest-950" />
              </Link>
            </div>
          </div>

          {/* Right Verified Practices: 2-Column Grid with Glassmorphic Translucency */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-2.5 sm:gap-4">
            {PRACTICES.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="group p-3.5 sm:p-5 rounded-2xl bg-forest-950/65 hover:bg-forest-950/85 backdrop-blur-md border border-white/20 hover:border-emerald-400/60 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-2.5"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500 border border-emerald-400/40 flex items-center justify-center shrink-0 transition-all duration-300">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-xs sm:text-[14px] text-white leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      {p.title}
                    </h3>
                    <p className="text-[10px] sm:text-[11.5px] text-white/85 leading-relaxed font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] line-clamp-2">
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
