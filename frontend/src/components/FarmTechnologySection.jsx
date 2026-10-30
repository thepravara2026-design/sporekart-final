import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, Cpu, ShieldCheck, ArrowRight, Thermometer, 
  Droplets, Wind, Sparkles 
} from 'lucide-react';

const PILLARS = [
  {
    icon: Sprout,
    title: 'Controlled Environment',
    desc: 'Sterile microclimate & automated humidity',
    tag: 'IoT Automation',
  },
  {
    icon: Cpu,
    title: 'Advanced Agritech',
    desc: 'Vertical racks & laminar HEPA filtration',
    tag: 'Class 100 Cleanroom',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Assurance',
    desc: 'Pure certified spawn & zero chemicals',
    tag: 'Lab Certified 99.9%',
  },
];

const LIVE_SENSORS = [
  { icon: Thermometer, label: 'Chamber Temp', val: '18.4°C', detail: 'Optimal Fruiting Range' },
  { icon: Droplets, label: 'Air Humidity', val: '92% RH', detail: 'Automated Ultrasonic Mist' },
  { icon: Wind, label: 'CO₂ Circulation', val: '640 ppm', detail: 'Fresh Air HEPA Flushed' },
  { icon: ShieldCheck, label: 'Laminar HEPA', val: '99.97%', detail: 'Positive Pressure Active' },
];

const SPORE_PARTICLES = [
  { top: '15%', left: '16%', size: 6, delay: '0s', duration: '7.5s' },
  { top: '38%', left: '74%', size: 8, delay: '1.2s', duration: '8.8s' },
  { top: '68%', left: '38%', size: 5, delay: '2.5s', duration: '6.8s' },
  { top: '24%', left: '88%', size: 7, delay: '1.8s', duration: '8.2s' },
  { top: '78%', left: '18%', size: 6, delay: '3.6s', duration: '7.2s' },
  { top: '48%', left: '10%', size: 8, delay: '0.6s', duration: '9.5s' },
];

export default function FarmTechnologySection({ showLearnMore = true, isContained = false }) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50, active: false });
  const [activeSensorIdx, setActiveSensorIdx] = useState(0);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // 1. Accessibility: Detect user motion preferences
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setIsReducedMotion(mq.matches);
      const listener = (e) => setIsReducedMotion(e.matches);
      mq.addEventListener?.('change', listener);
      return () => mq.removeEventListener?.('change', listener);
    }
  }, []);

  // 2. Viewport entrance detection via IntersectionObserver
  useEffect(() => {
    if (isReducedMotion || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [isReducedMotion]);

  // 3. Automated rotating live telemetry sensor cycle (every 3200ms)
  useEffect(() => {
    if (isReducedMotion) return;
    const interval = setInterval(() => {
      setActiveSensorIdx((prev) => (prev + 1) % LIVE_SENSORS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isReducedMotion]);

  // 4. Smooth interactive cursor spotlight
  const handleMouseMove = useCallback((e) => {
    if (isReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y, active: true });
  }, [isReducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setMousePos((prev) => ({ ...prev, active: false }));
  }, []);

  const currentSensor = LIVE_SENSORS[activeSensorIdx];
  const SensorIcon = currentSensor.icon;

  return (
    <section 
      id="farm" 
      className={isContained ? "w-full py-4 sm:py-8" : "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14"}
      aria-label="Our Farm and Technology"
    >
      {/* Outer Card with Responsive Aspect and High-Tech Glass Canvas */}
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group/farm relative rounded-[26px] sm:rounded-[36px] overflow-hidden border border-surface-cream/30 shadow-2xl bg-surface-cream/20 text-white min-h-[600px] sm:min-h-[640px] lg:min-h-[660px] transition-all duration-500"
      > 
        
        {/* Background Image: 80% Visibility with Smooth Cinematic Depth */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/sporekart-farm-tech-bg.png"
            alt="State-of-the-art modern Indian mushroom cultivation innovation centre with vertical farming racks and fresh oyster mushroom flushes"
            width="1920"
            height="1080"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-right md:object-center opacity-80 transition-transform duration-1000 ease-out group-hover/farm:scale-[1.025]"
          />
          {/* 20% Creamy White Tint */}
          <div className="absolute inset-0 bg-surface-cream/20 pointer-events-none" />
          {/* Contrast-protection gradient overlays ensuring high readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950/85 via-forest-950/50 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Dynamic Interactive Cursor Spotlight Highlight */}
        {mousePos.active && !isReducedMotion && (
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-1"
            style={{
              background: `radial-gradient(650px circle at ${mousePos.x}% ${mousePos.y}%, rgba(16, 185, 129, 0.16), transparent 70%)`
            }}
          />
        )}

        {/* Ambient Organic Spores / Cleanroom Particles */}
        {!isReducedMotion && SPORE_PARTICLES.map((spore, idx) => (
          <span
            key={idx}
            className="farm-spore-particle z-1"
            style={{
              top: spore.top,
              left: spore.left,
              width: `${spore.size}px`,
              height: `${spore.size}px`,
              animationDelay: spore.delay,
              animationDuration: spore.duration,
            }}
          />
        ))}

        {/* Floating Top-Right Signature Badge with Subtle Organic Drift */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-10 hidden sm:block pointer-events-none select-none farm-badge-float">
          <div className="px-4 py-2 rounded-full bg-forest-950/80 backdrop-blur-md border border-white/25 shadow-lg text-white flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span
              className="text-sm md:text-base font-normal tracking-wide italic block text-emerald-300 drop-shadow-md"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Our Innovation Centre ~
            </span>
          </div>
        </div>

        {/* Content Overlay: Top-to-Bottom Flow with Vertical Pillars & Horizontal Telemetry Dock */}
        <div className="relative z-10 p-5 sm:p-8 lg:p-12 flex flex-col justify-between min-h-[600px] sm:min-h-[640px] lg:min-h-[660px] gap-8">
          
          {/* Top/Middle Area: Left-Aligned Innovation Command Panel */}
          <div className="max-w-xl lg:max-w-2xl space-y-4">
            
            {/* Header Badge & Title with Viewport Entrance Animation */}
            <div className={`space-y-2.5 transition-all duration-700 ease-out transform ${
              isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900/90 border border-emerald-400/50 text-emerald-300 text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-md shadow-md">
                <span className="relative flex h-2 w-2">
                  <span className="farm-beacon-radar absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
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

            {/* 3 Pillar Feature Cards - Staggered Slide-In with Smooth Interactive Hover */}
            <div className="flex flex-col gap-2 sm:gap-2.5 pt-0.5 w-full max-w-sm sm:max-w-md">
              {PILLARS.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    style={{
                      transitionDelay: isIntersecting ? `${idx * 140}ms` : '0ms',
                    }}
                    className={`group px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-forest-950/65 hover:bg-forest-950/90 backdrop-blur-md border border-white/20 hover:border-emerald-400/60 shadow-md hover:translate-x-2 transition-all duration-300 flex items-center justify-between gap-3 cursor-default hover:shadow-[0_4px_20px_rgba(16,185,129,0.2)] transform ${
                      isIntersecting ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/35 border border-emerald-400/35 text-emerald-300 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <Icon className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200 transition-colors" strokeWidth={2.2} />
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <span className="font-bold text-xs sm:text-[13px] text-white leading-tight drop-shadow-sm group-hover:text-emerald-100 transition-colors">
                          {pillar.title}
                        </span>
                        <span className="text-[11px] sm:text-xs text-white/85 leading-tight drop-shadow-sm">
                          {pillar.desc}
                        </span>
                      </div>
                    </div>

                    {/* Micro Spec Pill */}
                    <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-forest-900/60 text-emerald-300/90 border border-emerald-400/20 shrink-0">
                      {pillar.tag}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action CTA with Enhanced Hover Depth */}
            <div className={`pt-1.5 transition-all duration-700 delay-500 ease-out transform ${
              isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {showLearnMore ? (
                <Link
                  to="/about"
                  className="bg-white hover:bg-emerald-50 text-forest-950 font-bold text-xs sm:text-sm px-7 py-3 rounded-full inline-flex items-center gap-2.5 shadow-xl hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-[1.03] transition-all duration-300 button-press"
                >
                  <span>Learn More About Sporekart</span>
                  <ArrowRight className="w-4 h-4 text-forest-950 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/products"
                    className="bg-white hover:bg-emerald-50 text-forest-950 font-bold text-xs sm:text-sm px-6 py-3 rounded-full inline-flex items-center gap-2.5 shadow-xl hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-all duration-300 button-press"
                  >
                    <span>Explore Mushroom Products</span>
                    <ArrowRight className="w-4 h-4 text-forest-950" />
                  </Link>
                  <Link
                    to="/training"
                    className="bg-forest-950/60 hover:bg-forest-950/85 backdrop-blur-md border border-white/25 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-full inline-flex items-center gap-2 transition-all hover:border-emerald-400/50 hover:scale-[1.02] button-press"
                  >
                    <span>Grower Masterclasses</span>
                  </Link>
                </div>
              )}
            </div>

          </div>

          {/* Bottom Horizontal Telemetry HUD Console with Smooth Live Sensor Cycling */}
          <div className={`w-full pt-2 transition-all duration-700 delay-600 ease-out transform ${
            isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            <div className="w-full rounded-2xl sm:rounded-3xl bg-forest-950/45 hover:bg-forest-950/65 backdrop-blur-xl border border-white/20 hover:border-emerald-400/40 shadow-2xl p-3.5 sm:p-5 transition-all duration-300 hover:shadow-[0_12px_36px_rgba(11,31,20,0.6)]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
                
                {/* Telemetry Left: Live Beacon + Clean-Room Microclimate Info */}
                <div className="lg:col-span-6 flex flex-col sm:flex-row sm:items-center gap-3.5">
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-white/25 shrink-0 shadow-md group/thumb">
                      <img
                        src="/sporekart-oyster-cluster.jpg"
                        alt="Fresh blooming oyster mushrooms"
                        width="100"
                        height="100"
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="farm-beacon-radar absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                          Live Farm Telemetry
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-forest-950/70 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm shadow-xs">
                        HEPA Active
                      </span>
                    </div>

                    {/* Rotating Live Sensor Telemetry Indicator */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                        <SensorIcon className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-white leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] flex items-center gap-2">
                        <span>{currentSensor.label}:</span>
                        <span className="text-emerald-300 font-mono font-extrabold">{currentSensor.val}</span>
                        <span className="text-[10px] text-emerald-200/80 font-normal hidden md:inline">({currentSensor.detail})</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-white/90 leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] hidden sm:block">
                      Automated ultrasonic vapor &amp; laminar HEPA filtration.
                    </p>
                  </div>
                </div>

                {/* Divider Line on Desktop */}
                <div className="hidden lg:block lg:col-span-1 border-l border-white/15 h-12 mx-auto" />

                {/* Telemetry Right: 3 Metric Stats with Interactive Elevation */}
                <div className="lg:col-span-5 grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-forest-950/50 hover:bg-forest-950/80 backdrop-blur-md border border-white/15 hover:border-emerald-400/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_4px_16px_rgba(16,185,129,0.2)] cursor-default">
                    <div className="font-display font-extrabold text-base sm:text-lg lg:text-xl text-emerald-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      100%
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-white font-medium leading-tight mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      Natural Growing
                    </div>
                  </div>
                  
                  <div className="p-2 sm:p-2.5 rounded-xl bg-forest-950/50 hover:bg-forest-950/80 backdrop-blur-md border border-white/15 hover:border-emerald-400/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_4px_16px_rgba(16,185,129,0.2)] cursor-default">
                    <div className="font-display font-extrabold text-base sm:text-lg lg:text-xl text-emerald-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      Year-Round
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-white font-medium leading-tight mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      Fresh Supply
                    </div>
                  </div>
                  
                  <div className="p-2 sm:p-2.5 rounded-xl bg-forest-950/50 hover:bg-forest-950/80 backdrop-blur-md border border-white/15 hover:border-emerald-400/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_4px_16px_rgba(16,185,129,0.2)] cursor-default">
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
