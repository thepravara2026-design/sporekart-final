import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, GraduationCap, Sparkles, CheckCircle2 } from 'lucide-react';

export default function HeroSection() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    let animationFrameId;

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate smooth normalized mouse offsets (-8px to +8px)
      const targetX = ((clientX / innerWidth) - 0.5) * 16;
      const targetY = ((clientY / innerHeight) - 0.5) * 16;

      animationFrameId = requestAnimationFrame(() => {
        setParallax({ x: targetX, y: targetY });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section 
      id="hero" 
      className="relative w-full mt-3 sm:mt-4 px-3 sm:px-6 lg:px-8"
      aria-label="Sporekart Hero Banner"
    >
      <div className="relative w-full min-h-[560px] sm:min-h-[600px] lg:min-h-[660px] rounded-hero overflow-hidden text-white shadow-level-3 flex items-center">
        {/* LAYER 1: Full-Bleed Hero Visual Canvas */}
        <div 
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
          style={{
            transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
            transition: 'transform 0.4s ease-out'
          }}
        >
          <img
            src="/hero-bg.png"
            alt="Farm Fresh Organic Oyster & Button Mushrooms Sporekart India"
            width="2000"
            height="1200"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-[85%_center] lg:object-[right_center] scale-105 animate-ken-burns transition-transform duration-1000"
          />
        </div>

        {/* LAYER 2: Sophisticated Cinematic Gradient Overlays for Text Readability */}
        {/* Global ambient dark tone for rich cinematic contrast */}
        <div className="absolute inset-0 z-1 bg-forest-950/30 pointer-events-none" />

        {/* Desktop & Tablet: Left-to-Right Gradient (Dark on left, fading smoothly to 0% transparency on right to expose mushroom imagery) */}
        <div 
          className="hidden md:block absolute inset-0 z-2 pointer-events-none" 
          style={{
            background: 'linear-gradient(90deg, rgba(14, 36, 19, 0.94) 0%, rgba(6, 61, 2, 1) 0%, rgba(0, 210, 102, 0) 60%, rgba(15, 31, 23, 0.05) 85%, transparent 100%)'
          }}
        />

        {/* Mobile: Top-to-Bottom / Radial Gradient for seamless text readability without obscuring visual focus */}
        <div 
          className="md:hidden absolute inset-0 z-2 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(15, 31, 23, 0.95) 0%, rgba(15, 31, 23, 0.85) 60%, rgba(15, 31, 23, 0.40) 100%)'
          }}
        />

        {/* Layer 3: Subtle Glowing Ambient Light Accent */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-leaf/15 rounded-full blur-[120px] pointer-events-none z-3" />

        {/* LAYER 4: Existing Sporekart Content Overlaid on Left Portion */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 md:py-20 flex items-center">
          <div className="w-full max-w-xl lg:max-w-[620px] space-y-6 text-left">
            {/* 1. Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-pill bg-forest-800/80 backdrop-blur-md border border-forest-700/60 text-sage text-xs font-semibold tracking-wide shadow-level-1">
              <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse shrink-0" />
              <span>India's Premier Mushroom Agritech &amp; Training Platform</span>
            </div>

            {/* 2. Main Heading */}
            <h1 className="animate-fade-up font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.12]">
              Fresh Mushrooms, <br className="hidden sm:inline" />
              <span className="text-leaf">Pure Grain Spawn</span> &amp; Certified Training
            </h1>

            {/* 3. Subheading / Description */}
            <p className="animate-fade-up text-surface-cream/95 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              Sporekart delivers lab-tested high-yield mushroom spawn seeds, fresh button &amp; oyster varieties, DIY home growing kits, and comprehensive commercial cultivation training across India.
            </p>

            {/* 4. CTA Buttons */}
            <div className="animate-fade-up flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                to="/products"
                className="w-full sm:w-auto btn-primary text-base px-8 py-4 shadow-level-2 flex items-center justify-center gap-2.5 button-press group hover:shadow-level-3 transition-all duration-300"
              >
                <Sprout className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
                <span>Explore Products</span>
              </Link>
              <Link
                to="/training"
                className="w-full sm:w-auto btn-light text-base px-8 py-4 shadow-level-1 flex items-center justify-center gap-2.5 button-press group hover:shadow-level-2 transition-all duration-300"
              >
                <GraduationCap className="w-5 h-5 text-forest-700 group-hover:scale-110 transition-transform duration-300" />
                <span>Training Workshops</span>
              </Link>
            </div>

            {/* 5. Supporting Info Badges */}
            <div className="animate-fade-up grid grid-cols-3 gap-3 pt-6 border-t border-forest-700/60 text-sage text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-leaf shrink-0" />
                <span>Lab Tested Spawn</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-leaf shrink-0" />
                <span>Cold-Chain Express</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-leaf shrink-0" />
                <span>100% Organic Fresh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Trust / Quality Card positioned on Right Side over Visual Focus Area */}
        <div className="hidden lg:block absolute bottom-10 right-12 z-20 max-w-sm animate-fade-in">
          <div className="p-4 rounded-card bg-forest-950/85 backdrop-blur-md border border-forest-700/60 shadow-level-3 group hover:border-forest-600/80 transition-all duration-300">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-sm tracking-wide">Farm Fresh Organic Mushrooms</h3>
                <p className="text-xs text-sage mt-0.5">Harvested Daily • Delivered in 24-48 Hours</p>
              </div>
              <span className="px-3 py-1 bg-forest-700/60 text-sage text-xs font-bold rounded-pill border border-forest-600/50 shrink-0 shadow-sm">
                FSSAI Approved
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
