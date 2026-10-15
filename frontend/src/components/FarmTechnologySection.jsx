import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Cpu, ShieldCheck, ArrowRight } from 'lucide-react';

export default function FarmTechnologySection() {
  return (
    <section 
      id="farm" 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16"
      aria-label="Our Farm and Technology"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Side: Modern Cultivation Facility & Agronomist Photo */}
        <div className="lg:col-span-6 relative">
          <div className="relative rounded-[24px] sm:rounded-[36px] overflow-hidden shadow-level-2 border border-surface-border aspect-[16/10] sm:aspect-[16/11] lg:aspect-[4/3] group">
            <img
              src="/sporekart-farm-scientist.jpg"
              alt="Agronomist monitoring climate-controlled mushroom cultivation in Sporekart agritech facility"
              width="1024"
              height="768"
              loading="lazy"
              className="w-full h-full object-cover object-center transform group-hover:scale-[1.02] transition-transform duration-700 ease-out"
            />
            {/* Subtle natural lighting gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

            {/* Handwritten cursive script "Innovation grows here" badge overlay */}
            <div className="absolute bottom-4 left-4 sm:bottom-7 sm:left-7 pointer-events-none text-white select-none drop-shadow-lg">
              <span
                className="text-lg sm:text-2xl md:text-3xl font-normal tracking-wide block italic"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Innovation<br />grows here ~
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Editorial Information, 3 Pillars, Learn More & 3 Key Metrics */}
        <div className="lg:col-span-6 space-y-5 sm:space-y-7">
          
          <div className="space-y-2 sm:space-y-3">
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-forest-800 uppercase font-sans">
              OUR FARM &amp; TECHNOLOGY
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-4xl lg:text-[42px] text-forest-900 leading-[1.15]">
              Where Nature Meets<br className="hidden sm:inline" /> Innovation
            </h2>
            <p className="text-typography-secondary text-xs sm:text-base leading-relaxed max-w-xl">
              Our state-of-the-art facility combines advanced agritech with sustainable farming practices to grow high-quality mushrooms, all year round.
            </p>
          </div>

          {/* 3 Pillar Features with Forest Green Circular Badges */}
          <div className="space-y-3 sm:space-y-4 pt-1">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-forest-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Sprout className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-bold text-forest-900 leading-tight">
                  Controlled Environment
                </h3>
                <p className="text-[11px] sm:text-sm text-typography-secondary mt-0.5">
                  Perfect growing conditions with precision microclimate and humidity automation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-forest-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-bold text-forest-900 leading-tight">
                  Advanced Agritech
                </h3>
                <p className="text-[11px] sm:text-sm text-typography-secondary mt-0.5">
                  Precision vertical farming, HEPA laminar airflow, and automated harvest tracking.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-forest-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-bold text-forest-900 leading-tight">
                  Quality Assurance
                </h3>
                <p className="text-[11px] sm:text-sm text-typography-secondary mt-0.5">
                  Clean, chemical-free, lab-certified mother cultures for consistent yields.
                </p>
              </div>
            </div>
          </div>

          {/* Learn More CTA */}
          <div className="pt-2">
            <Link
              to="/about"
              className="bg-forest-900 hover:bg-forest-800 text-white font-medium text-xs sm:text-sm px-6 py-3 rounded-full inline-flex items-center gap-2 shadow-level-1 hover-lift transition-all button-press"
            >
              <span>Learn More</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Bottom Card: Cluster Photo + 3 Metric Stats */}
          <div className="pt-4 border-t border-forest-900/10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-5 rounded-2xl overflow-hidden border border-surface-border aspect-[4/3] shadow-sm">
              <img
                src="/sporekart-oyster-cluster.jpg"
                alt="Fresh blooming oyster mushrooms"
                width="400"
                height="300"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="sm:col-span-7 grid grid-cols-3 gap-3 text-left pl-1">
              <div>
                <div className="font-display font-extrabold text-lg sm:text-xl text-forest-900">
                  100%
                </div>
                <div className="text-[11px] sm:text-xs text-typography-secondary font-medium leading-tight mt-0.5">
                  Natural Growing Process
                </div>
              </div>
              <div>
                <div className="font-display font-extrabold text-lg sm:text-xl text-forest-900">
                  Year-Round
                </div>
                <div className="text-[11px] sm:text-xs text-typography-secondary font-medium leading-tight mt-0.5">
                  Fresh Supply
                </div>
              </div>
              <div>
                <div className="font-display font-extrabold text-lg sm:text-xl text-forest-900">
                  Modern
                </div>
                <div className="text-[11px] sm:text-xs text-typography-secondary font-medium leading-tight mt-0.5">
                  Farming Technology
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
