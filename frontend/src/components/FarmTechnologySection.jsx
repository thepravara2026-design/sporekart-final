import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Cpu, ShieldCheck, ArrowRight } from 'lucide-react';

const PILLARS = [
  {
    icon: Sprout,
    title: 'Controlled Environment',
    desc: 'Sterile microclimate & automated humidity',
  },
  {
    icon: Cpu,
    title: 'Advanced Agritech',
    desc: 'Vertical racks & laminar HEPA filtration',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Assurance',
    desc: 'Pure certified spawn & zero chemicals',
  },
];

export default function FarmTechnologySection({ showLearnMore = true, isContained = false }) {
  return (
    <section 
      id="farm" 
      className={isContained ? "w-full py-4 sm:py-8" : "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14"}
      aria-label="Our Farm and Technology"
    >
      {/* Outer Card with 20% Creamy White Background and 80% Clearly Visible Background Image */}
      <div className="relative rounded-[26px] sm:rounded-[36px] overflow-hidden border border-surface-cream/30 shadow-2xl bg-surface-cream/20 text-white min-h-[600px] sm:min-h-[640px] lg:min-h-[660px]"> 
        
        {/* Background Image: 80% Visibility with 20% Creamy White Tint */}
        <div className="absolute inset-0 z-0">
          <img
            src="/sporekart-farm-tech-bg.png"
            alt="State-of-the-art modern Indian mushroom cultivation innovation centre with vertical farming racks and fresh oyster mushroom flushes"
            width="1920"
            height="1080"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-right md:object-center opacity-80 transition-transform duration-700 hover:scale-[1.01]"
          />
          {/* 20% Creamy White Tint */}
          <div className="absolute inset-0 bg-surface-cream/20 pointer-events-none" />
          {/* Contrast-protection gradient overlays ensuring all text, pillars, and telemetry components remain clearly visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950/85 via-forest-950/45 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Floating Top-Right Signature Badge */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-10 hidden sm:block pointer-events-none select-none">
          <div className="px-4 py-2 rounded-full bg-forest-950/80 backdrop-blur-md border border-white/25 shadow-lg text-white">
            <span
              className="text-sm md:text-base font-normal tracking-wide italic block text-emerald-300 drop-shadow-md"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Our Innovation Centre  ~
            </span>
          </div>
        </div>

        {/* Content Overlay: Top-to-Bottom Flow with Vertical Pillars & Horizontal Telemetry Dock */}
        <div className="relative z-10 p-5 sm:p-8 lg:p-12 flex flex-col justify-between min-h-[600px] sm:min-h-[640px] lg:min-h-[660px] gap-8">
          
          {/* Top/Middle Area: Left-Aligned Innovation Command Panel */}
          <div className="max-w-xl lg:max-w-2xl space-y-4">
            
            {/* Header Badge & Title */}
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900/90 border border-emerald-400/50 text-emerald-300 text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-md shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>OUR FARM &amp; TECHNOLOGY</span>
              </div>
              
              <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-[40px] text-white leading-[1.14] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                Where Nature Meets<br />Innovation
              </h2>
              
              {/* Minimal Descriptive Tagline */}
              <p className="text-white text-xs sm:text-sm lg:text-base leading-relaxed font-sans font-medium drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] max-w-md">
                Precision agritech and sustainable vertical cultivation for year-round fresh gourmet harvest.
              </p>
            </div>

            {/* 3 Pillar Feature Cards - Vertically Positioned in All Views with Minimal Descriptions */}
            <div className="flex flex-col gap-2 sm:gap-2.5 pt-0.5 w-full max-w-sm sm:max-w-md">
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="group px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-forest-950/65 hover:bg-forest-950/85 backdrop-blur-md border border-white/20 hover:border-emerald-400/50 shadow-md hover:translate-x-1.5 transition-all duration-200 flex items-center gap-3 cursor-default"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 border border-emerald-400/35 text-emerald-300 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200 transition-colors" strokeWidth={2.2} />
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="font-bold text-xs sm:text-[13px] text-white leading-tight drop-shadow-sm">
                        {pillar.title}
                      </span>
                      <span className="text-[11px] sm:text-xs text-white/85 leading-tight drop-shadow-sm">
                        {pillar.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action CTA */}
            <div className="pt-1.5">
              {showLearnMore ? (
                <Link
                  to="/about"
                  className="bg-white hover:bg-emerald-50 text-forest-950 font-bold text-xs sm:text-sm px-7 py-3 rounded-full inline-flex items-center gap-2.5 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all button-press"
                >
                  <span>Learn More About Sporekart</span>
                  <ArrowRight className="w-4 h-4 text-forest-950" />
                </Link>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/products"
                    className="bg-white hover:bg-emerald-50 text-forest-950 font-bold text-xs sm:text-sm px-6 py-3 rounded-full inline-flex items-center gap-2.5 shadow-xl hover:scale-[1.02] transition-all button-press"
                  >
                    <span>Explore Mushroom Products</span>
                    <ArrowRight className="w-4 h-4 text-forest-950" />
                  </Link>
                  <Link
                    to="/training"
                    className="bg-forest-950/60 hover:bg-forest-950/80 backdrop-blur-md border border-white/25 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-full inline-flex items-center gap-2 transition-all button-press"
                  >
                    <span>Grower Masterclasses</span>
                  </Link>
                </div>
              )}
            </div>

          </div>

          {/* Bottom Horizontal Telemetry HUD Console */}
          <div className="w-full pt-2">
            <div className="w-full rounded-2xl sm:rounded-3xl bg-forest-950/45 hover:bg-forest-950/60 backdrop-blur-xl border border-white/20 shadow-2xl p-3.5 sm:p-5 transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
                
                {/* Telemetry Left: Live Beacon + Clean-Room Microclimate Info */}
                <div className="lg:col-span-6 flex flex-col sm:flex-row sm:items-center gap-3.5">
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-white/25 shrink-0 shadow-md">
                      <img
                        src="/sporekart-oyster-cluster.jpg"
                        alt="Fresh blooming oyster mushrooms"
                        width="100"
                        height="100"
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                          Live Farm Telemetry
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-forest-950/70 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm shadow-xs">
                        HEPA Active
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                      Clean-Room Microclimate
                    </div>
                    <p className="text-[11px] text-white/90 leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] hidden sm:block">
                      Automated ultrasonic vapor &amp; laminar HEPA filtration.
                    </p>
                  </div>
                </div>

                {/* Divider Line on Desktop */}
                <div className="hidden lg:block lg:col-span-1 border-l border-white/15 h-12 mx-auto" />

                {/* Telemetry Right: 3 Metric Stats */}
                <div className="lg:col-span-5 grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-forest-950/50 hover:bg-forest-950/70 backdrop-blur-md border border-white/15 shadow-sm transition-all hover:-translate-y-0.5">
                    <div className="font-display font-extrabold text-base sm:text-lg lg:text-xl text-emerald-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      100%
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-white font-medium leading-tight mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      Natural Growing
                    </div>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-forest-950/50 hover:bg-forest-950/70 backdrop-blur-md border border-white/15 shadow-sm transition-all hover:-translate-y-0.5">
                    <div className="font-display font-extrabold text-base sm:text-lg lg:text-xl text-emerald-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      Year-Round
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-white font-medium leading-tight mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      Fresh Supply
                    </div>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-forest-950/50 hover:bg-forest-950/70 backdrop-blur-md border border-white/15 shadow-sm transition-all hover:-translate-y-0.5">
                    <div className="font-display font-extrabold text-base sm:text-lg lg:text-xl text-emerald-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      Modern
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-white font-medium leading-tight mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      Agritech Racks
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
