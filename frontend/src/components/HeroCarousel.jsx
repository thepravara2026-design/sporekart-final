import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const HERO_SLIDES = [
  {
    id: 1,
    tag: 'FARM-TO-HOME FRESHNESS',
    title: 'Sporekart Brand Ecosystem — Grow. Harvest. Thrive.',
    image: '/images/hero/sporekart-hero-brand-ecosystem.jpg',
    alt: 'Sporekart Brand Ecosystem - Premium Spawn Production, Expert Training, Grower Support and Customer Satisfaction',
  },
  {
    id: 2,
    tag: 'LAB CERTIFIED GRAIN SPAWN',
    title: 'Sporekart Pure Grain Spawn & Mushroom Seeds Product Lineup',
    image: '/images/hero/sporekart-hero-product-lineup.jpg',
    alt: 'Sporekart Lab-Certified Pure Wheat Grain Spawn, Oyster Mushroom Spawn, Milky Spawn and Spawn Seeds Lineup',
  },
  {
    id: 3,
    tag: 'BEGINNER INDOOR KITS',
    title: 'Sporekart Commercial Farm Facility in Davangere, Karnataka',
    image: '/images/hero/sporekart-hero-commercial-farm.jpg',
    alt: 'Sporekart Commercial Mushroom Farm Facility with Shaded Growing Beds and Fresh Fruiting Clusters',
  },
  {
    id: 4,
    tag: 'HANDS-ON MASTERCLASSES',
    title: 'Sporekart Hands-on Commercial Cultivation Training Masterclass',
    image: '/images/hero/sporekart-hero-cultivation-training.jpg',
    alt: 'Sporekart Hands-on Commercial Mushroom Cultivation Training Program with Live Demonstration',
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
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

  // Preload all slide images on mount for instant, flicker-free 1-second transition loop
  useEffect(() => {
    HERO_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  // Automatic slideshow timer: continuous 1-second loop
  useEffect(() => {
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide]);

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

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3.5">
      <section
        aria-label="Sporekart Featured Agricultural Showcase"
        tabIndex="0"
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full aspect-[16/9] max-w-[1024px] mx-auto rounded-2xl sm:rounded-3xl overflow-hidden bg-forest-950 select-none shadow-level-2 border border-surface-border/80 flex items-center justify-center"
      >
        {/* Background Slides with Snappy 500ms Cross-Fade - Pure Image Only */}
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Pure Uploaded Image - Displayed with crystal clear native sharpness */}
              <img
                src={slide.image}
                alt={slide.alt || slide.title}
                width="1024"
                height="576"
                fetchpriority={index === 0 ? 'high' : 'auto'}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className={`w-full h-full object-cover object-center transform transition-transform duration-3000 ease-out ${
                  isActive ? 'scale-[1.03]' : 'scale-100'
                }`}
              />
            </div>
          );
        })}

        {/* Left Navigation Chevron Button */}
        <div className="absolute inset-y-0 left-2 sm:left-4 z-30 flex items-center">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-forest-950/45 hover:bg-forest-950/85 text-white/90 hover:text-white border border-white/25 backdrop-blur-md flex items-center justify-center transition-all duration-150 hover:scale-105 cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>

        {/* Right Navigation Chevron Button */}
        <div className="absolute inset-y-0 right-2 sm:right-4 z-30 flex items-center">
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-forest-950/45 hover:bg-forest-950/85 text-white/90 hover:text-white border border-white/25 backdrop-blur-md flex items-center justify-center transition-all duration-150 hover:scale-105 cursor-pointer shadow-xs"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>

        {/* Bottom Progress Navigation Indicators */}
        <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2">
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = idx === currentSlide;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-200 cursor-pointer rounded-full h-1.5 sm:h-2 ${
                  isActive
                    ? 'w-5 sm:w-7 bg-emerald-400 shadow-sm'
                    : 'w-1.5 sm:w-2 bg-white/45 hover:bg-white/75'
                }`}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
