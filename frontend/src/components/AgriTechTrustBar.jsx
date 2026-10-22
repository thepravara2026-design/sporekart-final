import React, { useState, useEffect } from 'react';
import { 
  Truck, ShieldCheck, Zap, Award, PhoneCall, 
  CheckCircle2, Sparkles, ArrowUpRight, ChevronRight, X, MessageSquare, Users, Activity
} from 'lucide-react';

/**
 * High-performance animated counter hook & component with easing
 */
function AnimatedCounter({ end, duration = 1600, prefix = '', suffix = '', decimals = 0 }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animId;
    const step = (now) => {
      if (!startTimestamp) startTimestamp = now;
      const progress = Math.min((now - startTimestamp) / duration, 1);
      // smooth ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(ease * end);
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [end, duration]);

  const formatted = decimals > 0 
    ? val.toFixed(decimals) 
    : Math.floor(val).toLocaleString('en-IN');

  return <span>{prefix}{formatted}{suffix}</span>;
}

const TRUST_METRICS = [
  {
    id: 'delivery',
    icon: Truck,
    num: 19000,
    prefix: '',
    suffix: '+',
    decimals: 0,
    label: 'Pincodes',
    title: 'Pan-India Delivery',
    subtitle: '24–48h express insulated cold-chain logistics',
    highlight: 'Insulated Packaging',
    metricPercent: 98,
    benchmarkBadge: '99.2% On-Time SLA',
    details: 'Temperature-controlled insulated boxes tested to preserve mycelium viability across all 28 Indian states.',
    spec: 'Cold-chain dispatch within 24 hours of autoclave sterilization'
  },
  {
    id: 'purity',
    icon: ShieldCheck,
    num: 99.9,
    prefix: '',
    suffix: '%',
    decimals: 1,
    label: 'Viability Rate',
    title: 'Pure Mother Spawn',
    subtitle: 'Class-100 laminar sterile cleanroom cultured',
    highlight: 'Zero Contamination',
    metricPercent: 99.9,
    benchmarkBadge: 'Class-100 Cleanroom',
    details: '1st-generation grain mother cultures certified free from trichoderma, bacterial blotch, or competing fungi.',
    spec: 'Sub-cultured only up to G1 stage on whole autoclaved wheat grains'
  },
  {
    id: 'buyback',
    icon: Award,
    num: 100,
    prefix: '',
    suffix: '%',
    decimals: 0,
    label: 'Guaranteed',
    title: 'Commercial Buyback',
    subtitle: 'Contractual harvest procurement linkage',
    highlight: 'Predetermined Floor Price',
    metricPercent: 100,
    benchmarkBadge: 'Legal Contract Linkage',
    details: 'Direct commercial linkages connecting trained growers with wholesale hotels, retail supermarkets, and dehydration units.',
    spec: 'Assured minimum procurement price agreed prior to masterclass commencement'
  },
  {
    id: 'growers',
    icon: Users,
    num: 12500,
    prefix: '',
    suffix: '+',
    decimals: 0,
    label: 'Cultivators',
    title: 'Certified Growers',
    subtitle: 'Farmers trained & thriving nationwide',
    highlight: 'Pan-India Network',
    metricPercent: 95,
    benchmarkBadge: 'ICAR Protocol Trained',
    details: 'Empowering smallholder agripreneurs and commercial mushroom units with state-of-the-art sterile protocols.',
    spec: 'Lifetime grower advisory and access to Sporekart wholesale buyer portal'
  },
  {
    id: 'support',
    icon: PhoneCall,
    num: 24,
    prefix: '',
    suffix: '/7',
    decimals: 0,
    label: 'Direct Care',
    title: 'Mycologist Advisory',
    subtitle: 'Direct agronomist WhatsApp assistance',
    highlight: 'Hindi • Marathi • English',
    metricPercent: 100,
    benchmarkBadge: 'Instant WhatsApp Desk',
    details: 'On-demand technical guidance for temperature, humidity, contamination diagnosis, and optimal pinhead fruiting.',
    spec: 'Direct WhatsApp helpline: +91 98811 74768 manned by certified mycology agronomists'
  }
];

export default function AgriTechTrustBar() {
  const [activeCard, setActiveCard] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const selectedMetric = TRUST_METRICS.find(m => m.id === activeCard);

  return (
    <section 
      aria-label="Sporekart Agritech Verification & Trust Standards" 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5"
    >
      {/* Outer Shell: Completely Transparent Canvas */}
      <div className="relative rounded-[26px] sm:rounded-[36px] bg-transparent text-forest-950 p-5 sm:p-7 lg:p-9 border border-forest-900/10 overflow-hidden transition-all duration-500">
        
        {/* Header Telemetry Strip with Counting Badge */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-4 sm:pb-6 border-b border-forest-900/10">
          
          {/* Eyebrow & Live Pulse Beacon */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <span className="text-[11px] sm:text-xs font-black tracking-[0.22em] uppercase text-forest-900 font-sans">
              AGRITECH TRUST BENCHMARK
            </span>
            
            {/* Dynamic Counting Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-900/5 border border-forest-900/15 text-forest-900 font-mono text-[11px] sm:text-xs font-bold backdrop-blur-md shadow-xs animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Live Deliveries: <AnimatedCounter end={19480} suffix="+" /> Units Shipped</span>
            </div>
          </div>

          {/* Compliance & Standards Badges */}
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-forest-800 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-white/85 border border-surface-border inline-flex items-center gap-1.5 backdrop-blur-md shadow-xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>FSSAI Central Lic.</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/85 border border-surface-border inline-flex items-center gap-1.5 backdrop-blur-md shadow-xs">
              <ShieldCheck className="w-3 h-3 text-forest-700" />
              <span>ICAR Protocols</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/85 border border-surface-border inline-flex items-center gap-1.5 backdrop-blur-md shadow-xs hidden sm:inline-flex">
              <Activity className="w-3 h-3 text-emerald-600" />
              <span>100% Viability Test</span>
            </span>
          </div>

        </div>

        {/* 5 Modular Metric Cards Grid with Blurred Backgrounds */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4 pt-4 sm:pt-6">
          {TRUST_METRICS.map((item, idx) => {
            const Icon = item.icon;
            const isLast = idx === TRUST_METRICS.length - 1;
            const isSelected = activeCard === item.id;
            const isHovered = hoveredCard === item.id;

            return (
              <div 
                key={item.id}
                onClick={() => setActiveCard(isSelected ? null : item.id)}
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative p-3.5 sm:p-5 rounded-2xl sm:rounded-[24px] cursor-pointer transition-all duration-300 flex flex-col justify-between gap-3 overflow-hidden select-none ${
                  isLast ? 'col-span-2 sm:col-span-1' : ''
                } ${
                  isSelected 
                    ? 'bg-white/95 backdrop-blur-2xl text-forest-950 ring-2 ring-emerald-500 shadow-2xl -translate-y-1.5' 
                    : 'bg-white/60 hover:bg-white/90 backdrop-blur-xl text-forest-950 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.01] border border-white/80 hover:border-emerald-500/40'
                }`}
              >
                {/* Holographic light sweep / micro-shimmer beam on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-1000 pointer-events-none" />

                {/* Top Row: Icon Badge & Animated Metric Counting Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-forest-900/10 group-hover:bg-forest-900 border border-forest-900/10 group-hover:border-forest-900 text-forest-900 group-hover:text-emerald-300 flex items-center justify-center shrink-0 shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300" strokeWidth={2.2} />
                  </div>
                  
                  {/* Metric Counter Badge with dynamic animated numbers */}
                  <div className="text-right">
                    <div className="font-display font-black text-base sm:text-lg lg:text-xl text-forest-950 group-hover:text-emerald-700 transition-colors leading-none tracking-tight">
                      <AnimatedCounter 
                        end={item.num} 
                        prefix={item.prefix} 
                        suffix={item.suffix} 
                        decimals={item.decimals} 
                      />
                    </div>
                    <span className="text-[9px] font-extrabold text-forest-800/70 uppercase tracking-tight block mt-0.5">
                      {item.label}
                    </span>
                  </div>
                </div>

                {/* Middle Content: Clean Title & Minimal Subtitle */}
                <div className="space-y-1">
                  <h3 className="font-bold text-xs sm:text-[14px] text-forest-950 leading-snug group-hover:text-forest-900 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-[10px] sm:text-[11.5px] text-typography-secondary leading-snug font-sans line-clamp-1">
                    {item.subtitle}
                  </p>
                </div>

                {/* Visual Progress Meter Bar with Animated Gradient */}
                <div className="w-full bg-forest-950/10 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${item.metricPercent}%` }}
                  />
                </div>

                {/* Bottom Row: Minimal Tag Pill & Interactive Cue */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest-900/5 group-hover:bg-forest-900 text-[9px] sm:text-[9.5px] font-extrabold text-forest-900 group-hover:text-emerald-300 border border-forest-700/15 group-hover:border-forest-900 transition-all duration-300 truncate max-w-[85%]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:bg-emerald-300 shrink-0" />
                    <span className="truncate">{item.highlight}</span>
                  </span>

                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isSelected ? 'bg-forest-900 text-white rotate-90' : 'text-forest-700/60 group-hover:text-forest-900 group-hover:translate-x-0.5'
                  }`}>
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modular Expandable Details Drawer with Blurred Milky Glassmorphism */}
        {selectedMetric && (
          <div className="relative z-10 mt-4 p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-2xl text-forest-950 border border-emerald-500/30 shadow-2xl animate-fade-in flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-forest-900 text-emerald-300">
                  {selectedMetric.benchmarkBadge}
                </span>
                <span className="text-xs font-bold text-forest-900">
                  {selectedMetric.title} Protocol Verification
                </span>
              </div>
              <p className="text-xs sm:text-sm text-forest-900/90 leading-relaxed font-medium">
                {selectedMetric.details}
              </p>
              <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{selectedMetric.spec}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
              <a
                href="https://wa.me/919881174768?text=Hi%20Sporekart%20Team%2C%20I%20want%20to%20know%20more%20about%20your%20agritech%20standards."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-forest-900 hover:bg-forest-800 text-emerald-300 text-xs font-bold shadow-md transition-all button-press"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Agronomist</span>
              </a>
              <button
                type="button"
                onClick={() => setActiveCard(null)}
                className="w-8 h-8 rounded-full bg-forest-900/10 hover:bg-forest-900/20 text-forest-900 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

