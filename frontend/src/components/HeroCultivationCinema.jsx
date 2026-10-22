import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Sprout, CheckCircle2, Play, Pause, 
  RotateCcw, Sparkles, Droplets, Award, ArrowUpRight, Zap
} from 'lucide-react';

const CULTIVATION_STAGES = [
  {
    id: 'inoculation',
    stepNumber: '01',
    shortLabel: 'Inoculation',
    title: 'Class-100 Cleanroom Inoculation',
    subtitle: 'Gen-1 Milky & Button master culture on sterilised grain substrate',
    image: '/sporekart-cultivation-stage1-lab.jpg',
    glowColor: 'rgba(16, 185, 129, 0.35)', // Emerald teal glow
    accentColor: '#10B981',
    badgeTop: {
      icon: ShieldCheck,
      text: 'Class-100 Cleanroom Certified',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
    },
    metricBottomLeft: {
      headline: '99.9% Purity',
      subline: '0.2µ Autoclave Filter Patch'
    },
    metricBottomRight: {
      headline: 'Gen-1 Master Strain',
      subline: 'Zero Contamination'
    }
  },
  {
    id: 'fruiting',
    stepNumber: '02',
    shortLabel: 'Fruiting',
    title: 'IoT Microclimate Fruiting',
    subtitle: 'Automated ultrasonic humidity & fresh air exchange for lush flushes',
    image: '/sporekart-cultivation-stage2-grow.jpg',
    glowColor: 'rgba(52, 211, 153, 0.40)', // Misty cool green glow
    accentColor: '#34D399',
    badgeTop: {
      icon: Droplets,
      text: 'IoT Microclimate Automation',
      color: 'bg-teal-500/20 text-teal-300 border-teal-400/30'
    },
    metricBottomLeft: {
      headline: '88% RH • 22°C Temp',
      subline: 'Precision Ultrasonic Mist'
    },
    metricBottomRight: {
      headline: 'Zero Chemicals',
      subline: 'Organic Milky & Button Flush'
    }
  },
  {
    id: 'certified',
    stepNumber: '03',
    shortLabel: 'Certified',
    title: 'Finished Sporekart Branded Harvest',
    subtitle: 'Sustainable packaging, tamper-proof gold seal & cold-chain dispatch',
    image: '/sporekart-cultivation-stage3-product.jpg',
    glowColor: 'rgba(199, 154, 74, 0.45)', // Warm luxury harvest gold glow
    accentColor: '#C79A4A',
    badgeTop: {
      icon: Zap,
      text: 'Cold-Chain 24h Express',
      color: 'bg-amber-500/20 text-amber-300 border-amber-400/30'
    },
    metricBottomLeft: {
      headline: '★ 4.9/5 Rating',
      subline: '12,000+ Indian Growers'
    },
    metricBottomRight: {
      headline: '100% Buyback',
      subline: 'Guaranteed Market Floor'
    }
  }
];

const STAGE_DURATION_MS = 5000;
const TICK_INTERVAL_MS = 50;

/**
 * HeroCultivationCinema
 * FAANG-grade animated bio-canvas visualizing the full Sporekart mushroom lifecycle:
 * Stage 1: Class-100 Cleanroom Inoculation & Mycelium Vigour
 * Stage 2: IoT Controlled Fruiting & Velvet Cap Blooming
 * Stage 3: Finished Sporekart Branded Luxury Packaging with Holographic Seal
 */
export default function HeroCultivationCinema() {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  // Auto-advance timeline loop with smooth millisecond ticks
  useEffect(() => {
    if (!isPlaying || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const increment = (TICK_INTERVAL_MS / STAGE_DURATION_MS) * 100;
        if (prev + increment >= 100) {
          setCurrentStage((curr) => (curr + 1) % CULTIVATION_STAGES.length);
          return 0;
        }
        return prev + increment;
      });
    }, TICK_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isHovered, currentStage]);

  const handleStageSelect = (index) => {
    setCurrentStage(index);
    setProgress(0);
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const activeData = CULTIVATION_STAGES[currentStage];
  const TopBadgeIcon = activeData.badgeTop.icon;

  return (
    <div 
      className="relative w-full flex flex-col items-center justify-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Interactive Mushroom Cultivation to Certified Packaging Showcase"
    >
      {/* Dynamic Ambient Backlight Glow that morphs color per stage */}
      <div 
        className="absolute -inset-4 rounded-[40px] blur-[36px] opacity-75 transition-colors duration-1000 pointer-events-none -z-10"
        style={{ backgroundColor: activeData.glowColor }}
      />

      {/* Main Glassmorphic Cinema Frame */}
      <div className="relative w-full aspect-[16/11] sm:aspect-[4/3] rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-level-2 border border-surface-border/90 bg-forest-950/90 group">
        
        {/* Layered Cross-Fading Images with Ken-Burns Ambient Motion */}
        {CULTIVATION_STAGES.map((stage, idx) => {
          const isActive = idx === currentStage;
          return (
            <div
              key={stage.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={stage.image}
                alt={`${stage.title} - ${stage.subtitle}`}
                width="1280"
                height="960"
                loading="eager"
                decoding="async"
                className={`w-full h-full object-cover object-center transform transition-transform duration-[6000ms] ease-out ${
                  isActive ? 'scale-[1.04]' : 'scale-100'
                }`}
              />

              {/* Shimmer Light Sweep Effect for Finished Branded Packaging (Stage 3) */}
              {stage.id === 'certified' && isActive && (
                <div 
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 animate-[pulse_3s_ease-in-out_infinite] pointer-events-none" 
                />
              )}
            </div>
          );
        })}

        {/* Cinematic Vignette Overlay (Protects readability of HUD badges) */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-forest-950/85 via-forest-950/20 to-black/40 pointer-events-none" />

        {/* TOP HUD BAR */}
        <div className="absolute top-3.5 sm:top-4 left-3.5 sm:left-4 right-3.5 sm:right-4 z-30 flex items-center justify-between pointer-events-auto">
          
          {/* Active Stage Eyebrow Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-950/80 backdrop-blur-md border border-white/15 text-white shadow-md">
            <span className="flex h-2 w-2 relative shrink-0">
              <span 
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: activeData.accentColor }}
              />
              <span 
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: activeData.accentColor }}
              />
            </span>
            <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-white/90">
              Stage {activeData.stepNumber}: {activeData.shortLabel}
            </span>
          </div>

          {/* Right Action Cluster: Stage Top Badge & Play/Pause */}
          <div className="flex items-center gap-2">
            <div className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-[11px] font-bold shadow-md ${activeData.badgeTop.color}`}>
              <TopBadgeIcon className="w-3.5 h-3.5" />
              <span>{activeData.badgeTop.text}</span>
            </div>

            <button
              onClick={togglePlayPause}
              className="p-1.5 sm:p-2 rounded-full bg-forest-950/80 hover:bg-forest-900 border border-white/20 text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 touch-target flex items-center justify-center shadow-md"
              aria-label={isPlaying ? 'Pause auto cultivation animation' : 'Play cultivation animation'}
              title={isPlaying ? 'Pause loop' : 'Play loop'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 text-white/90" />
              ) : (
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* BOTTOM HUD CARDS & CONTEXT */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-30 flex flex-col gap-2.5 pointer-events-auto">
          
          {/* Active Stage Headline & Description */}
          <div className="px-3.5 py-2.5 rounded-2xl bg-forest-950/85 backdrop-blur-md border border-white/15 text-white shadow-level-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>{activeData.title}</span>
                <span 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: activeData.accentColor }}
                />
              </h3>
              <span className="text-[10px] text-surface-neutral/60 font-mono hidden md:inline">
                {currentStage + 1} of 3
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-surface-neutral/80 line-clamp-1 font-sans mt-0.5">
              {activeData.subtitle}
            </p>
          </div>

          {/* Dual Verification Micro-Badges */}
          <div className="grid grid-cols-2 gap-2">
            
            {/* Left Badge */}
            <div className="px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md text-forest-900 shadow-level-1 border border-surface-border">
              <div className="text-xs font-bold text-forest-950 flex items-center gap-1">
                {currentStage === 2 ? (
                  <span className="text-amber-500">★</span>
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{activeData.metricBottomLeft.headline}</span>
              </div>
              <div className="text-[10px] text-typography-muted font-normal mt-0.5 truncate">
                {activeData.metricBottomLeft.subline}
              </div>
            </div>

            {/* Right Badge */}
            <div className="px-3 py-2 rounded-xl bg-forest-900/90 backdrop-blur-md text-white shadow-level-1 border border-emerald-400/30 text-right">
              <div className="text-emerald-300 text-xs font-bold flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{activeData.metricBottomRight.headline}</span>
              </div>
              <div className="text-[10px] text-surface-neutral/80 font-normal mt-0.5 truncate">
                {activeData.metricBottomRight.subline}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* APPLE-STYLE 3-STAGE INTERACTIVE PROGRESS CONTROLLER */}
      <div 
        className="w-full mt-3.5 grid grid-cols-3 gap-2 sm:gap-3 px-1"
        role="tablist"
        aria-label="Cultivation stages timeline navigation"
      >
        {CULTIVATION_STAGES.map((stage, idx) => {
          const isActive = idx === currentStage;
          const isPassed = idx < currentStage;

          return (
            <button
              key={stage.id}
              onClick={() => handleStageSelect(idx)}
              role="tab"
              aria-selected={isActive}
              className={`group flex flex-col text-left py-1.5 px-2 sm:px-3 rounded-xl transition-all border ${
                isActive 
                  ? 'bg-white shadow-sm border-forest-900/20' 
                  : 'bg-white/40 hover:bg-white/70 border-transparent hover:border-forest-900/10'
              }`}
            >
              {/* Progress Track Line */}
              <div className="w-full h-1 sm:h-1.5 bg-forest-900/15 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all duration-75"
                  style={{
                    backgroundColor: stage.accentColor,
                    width: isActive ? `${progress}%` : isPassed ? '100%' : '0%'
                  }}
                />
              </div>

              {/* Stage Button Label */}
              <div className="flex items-center justify-center w-full text-center">
                <span className={`text-[11px] sm:text-xs font-bold tracking-tight ${
                  isActive ? 'text-forest-950 font-extrabold' : 'text-typography-muted group-hover:text-forest-900'
                }`}>
                  {stage.stepNumber}. {stage.shortLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}
