import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sprout, Award, ShieldCheck, GraduationCap, Sparkles, MessageCircle } from 'lucide-react';

export const HERO_SLIDES = [
  {
    id: 1,
    tag: 'FARM-TO-HOME FRESHNESS',
    title: 'Gourmet Fresh Mushrooms, Cultivated with Science',
    description: 'Harvested at 5:00 AM daily at our climate-controlled farm in Davangere, Karnataka. Grown on steam-sterilized organic paddy straw with zero chemical sprays.',
    primaryCta: { text: 'Shop Fresh Harvest', to: '/products/fresh-mushrooms' },
    secondaryCta: { text: 'Explore All Varieties', to: '/products' },
    image: '/sporekart-hero-crate.jpg',
    badge: 'Daily Harvest • Davangere Farm',
    icon: Sprout,
    stat: 'Harvested 5:00 AM Daily'
  },
  {
    id: 2,
    tag: 'LAB CERTIFIED GRAIN SPAWN',
    title: '1st-Gen Pure Wheat Grain Spawn with 99.8% Viability',
    description: 'Sterile laminar-flow cultured mycelium on high-grade wheat grains. Optimized for commercial and progressive cultivators seeking rapid colonization and maximum flushes.',
    primaryCta: { text: 'Order Pure Grain Spawn', to: '/products/spawn-seeds' },
    secondaryCta: { text: 'Spawn Storage Guide', to: '/mushroom-spawn-guide' },
    image: '/sporekart-cultivation-stage1-lab.jpg',
    badge: '1st-Gen Inoculation • 99.8% Viability',
    icon: Award,
    stat: '99.8% Colonization Rate'
  },
  {
    id: 3,
    tag: 'BEGINNER INDOOR KITS',
    title: 'Grow Gourmet Mushrooms at Home in 10-14 Days',
    description: 'Pre-colonized, ready-to-fruit indoor kits designed for homes, kitchens, and classrooms. Simply mist twice daily and enjoy harvesting vibrant clusters of gourmet mushrooms.',
    primaryCta: { text: 'Get Your Growing Kit', to: '/products/growing-kits' },
    secondaryCta: { text: 'View Cultivation Guide', to: '/mushroom-cultivation-guide' },
    image: '/sporekart-oyster-cluster.jpg',
    badge: 'Zero Experience Needed • 10-14 Days',
    icon: Sparkles,
    stat: '10–14 Days to Harvest'
  },
  {
    id: 4,
    tag: 'HANDS-ON MASTERCLASSES',
    title: 'Commercial Cultivation Masterclasses with Market Buyback',
    description: 'Practical hands-on training at our Davangere farm facility. Learn complete pasteurization, inoculation, climate management, and connect to our verified buyer buyback network.',
    primaryCta: { text: 'Explore Masterclasses', to: '/training' },
    secondaryCta: { 
      text: 'WhatsApp Consultation', 
      href: 'https://wa.me/917204709870?text=Hello%20Sporekart%2C%20I%20am%20interested%20in%20commercial%20mushroom%20training%20and%20buyback.' 
    },
    image: '/sporekart-training-workshop.jpg',
    badge: 'Certified Faculty • Assured Buyback',
    icon: GraduationCap,
    stat: 'Assured Commercial Buyback'
  }
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const timerRef = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  const goToSlide = (idx) => {
    setCurrentSlide(idx);
  };

  // Automatic slideshow timer
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        nextSlide();
      }, 5500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  // Preload upcoming slide images
  useEffect(() => {
    const nextIdx = (currentSlide + 1) % HERO_SLIDES.length;
    const img = new Image();
    img.src = HERO_SLIDES[nextIdx].image;
  }, [currentSlide]);

  // Touch gesture support
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  };

  const activeSlide = HERO_SLIDES[currentSlide];
  const IconComp = activeSlide.icon;

  return (
    <section
      aria-label="Sporekart Featured Agricultural Showcase"
      tabIndex="0"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full overflow-hidden bg-forest-950 text-white min-h-[500px] sm:min-h-[560px] lg:min-h-[620px] flex items-center justify-center select-none"
    >
      {/* Background Slides with Cross-Fade */}
      {HERO_SLIDES.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image with subtle zoom */}
            <img
              src={slide.image}
              alt={slide.title}
              width="1920"
              height="1080"
              fetchpriority={index === 0 ? 'high' : 'auto'}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className={`w-full h-full object-cover object-center transform transition-transform duration-7000 ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
            />
            {/* Ambient Contrast Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/80 to-forest-950/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-transparent to-forest-950/30" />
          </div>
        );
      })}

      {/* Slide Content Layer */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 w-full">
        <div className="max-w-2xl sm:max-w-3xl space-y-4 sm:space-y-6">
          {/* Badge & Stat Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 backdrop-blur-md text-[10px] sm:text-xs font-bold tracking-widest uppercase">
            <IconComp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{activeSlide.tag}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
          </div>

          {/* Headline */}
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.12]">
            {activeSlide.title}
          </h1>

          {/* Description */}
          <p className="text-emerald-100/90 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed font-normal">
            {activeSlide.description}
          </p>

          {/* Quick Highlight Stat */}
          <div className="flex items-center gap-2 pt-1 text-xs sm:text-sm font-semibold text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{activeSlide.stat}</span>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              to={activeSlide.primaryCta.to}
              className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-level-2 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <span>{activeSlide.primaryCta.text}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {activeSlide.secondaryCta.to ? (
              <Link
                to={activeSlide.secondaryCta.to}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md hover:border-white/40 transition-all duration-300"
              >
                <span>{activeSlide.secondaryCta.text}</span>
              </Link>
            ) : activeSlide.secondaryCta.href ? (
              <a
                href={activeSlide.secondaryCta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 hover:text-white font-semibold text-xs sm:text-sm border border-emerald-500/40 backdrop-blur-md transition-all duration-300"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>{activeSlide.secondaryCta.text}</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Left / Right Carousel Controls */}
      <div className="absolute inset-y-0 left-2 sm:left-4 z-30 flex items-center">
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-forest-950/60 hover:bg-forest-900/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer shadow-level-2"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <div className="absolute inset-y-0 right-2 sm:right-4 z-30 flex items-center">
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-forest-950/60 hover:bg-forest-900/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer shadow-level-2"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Bottom Progress Navigation Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3">
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}: ${slide.tag}`}
              className={`transition-all duration-300 cursor-pointer rounded-full h-2 sm:h-2.5 ${
                isActive
                  ? 'w-8 sm:w-10 bg-emerald-400 shadow-md'
                  : 'w-2 sm:w-2.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
