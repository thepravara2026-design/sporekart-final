import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, MapPin, Calendar, Users, ChevronLeft, ChevronRight, 
  Play, Pause, Sparkles, Image as ImageIcon, Award, Maximize2, X
} from 'lucide-react';
import MediaImage from './MediaImage';

const DEFAULT_GLIMPSES = [
  {
    id: 'glimpse-1',
    title: 'Sterile Tissue Culture & Laminar Flow Inoculation',
    caption: 'Trainees practicing pure spawn inoculation under HEPA filter airflow conditions during the Masterclass.',
    courseTitle: 'Commercial Spawn Production Masterclass',
    location: 'Shriyap Enterprise Lab, Davangere',
    eventDate: 'September 2026 Batch',
    attendeeCount: 35,
    imageUrl: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'glimpse-2',
    title: 'Commercial Substrate Pasteurization & Moisture Audit',
    caption: 'Live practical demonstration on wheat straw thermal pasteurization and pH buffer tuning.',
    courseTitle: 'Oyster & Button Mushroom Farming Workshop',
    location: 'Agritech Demonstration Farm, Davangere',
    eventDate: 'August 2026 Batch',
    attendeeCount: 42,
    imageUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'glimpse-3',
    title: 'High-Yield Milky Mushroom Fruiting Chamber Setup',
    caption: 'Trainees inspecting climate-controlled humidity and ventilation systems for tropical fruiting.',
    courseTitle: 'Tropical Milky Mushroom Specialist Course',
    location: 'Agritech Demonstration Farm, Davangere',
    eventDate: 'July 2026 Batch',
    attendeeCount: 28,
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'glimpse-4',
    title: 'Grain Spawn Quality Certification & Harvest Graduation',
    caption: 'Certified trainees receiving government-aligned completion certificates and mother spawn starter kits.',
    courseTitle: 'Agritech Entrepreneur Incubator',
    location: 'Shriyap Enterprise Auditorium, Davangere',
    eventDate: 'June 2026 Batch',
    attendeeCount: 50,
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  }
];

export default function TrainingGlimpseCarousel({
  glimpses: propGlimpses = [],
  title = "Hands-on Training & Workshop Glimpse",
  subtitle = "Real live laboratory practicals, substrate preparation, and grower incubation sessions",
  autoSlideInterval = 2500, // 2.5 seconds loop
  className = ""
}) {
  const glimpses = (propGlimpses && propGlimpses.length > 0) ? propGlimpses : DEFAULT_GLIMPSES;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const timerRef = useRef(null);

  // Auto sliding loop (2.5 seconds interval)
  useEffect(() => {
    if (isPlaying && !isHovered && glimpses.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % glimpses.length);
      }, autoSlideInterval);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isHovered, glimpses.length, autoSlideInterval]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % glimpses.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + glimpses.length) % glimpses.length);
  };

  const currentSlide = glimpses[currentIndex] || glimpses[0];

  if (!currentSlide) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-forest-900/10 border border-forest-900/20 text-forest-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-forest-700" />
            <span>Practical Workshop Gallery</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-forest-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-typography-secondary text-xs sm:text-sm mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Carousel Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-2 rounded-xl bg-surface-white border border-surface-border text-forest-900 hover:bg-forest-700 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm button-press"
            title={isPlaying ? "Pause Auto-Slide" : "Play Auto-Slide"}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-emerald-600" /> : <Play className="w-4 h-4 text-forest-700" />}
            <span className="hidden xs:inline">{isPlaying ? "Pause" : "Play"}</span>
          </button>

          <button
            onClick={handlePrev}
            className="w-9 h-9 rounded-xl bg-surface-white border border-surface-border text-forest-900 flex items-center justify-center hover:bg-forest-700 hover:text-white transition-all shadow-sm button-press"
            aria-label="Previous Glimpse"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="w-9 h-9 rounded-xl bg-surface-white border border-surface-border text-forest-900 flex items-center justify-center hover:bg-forest-700 hover:text-white transition-all shadow-sm button-press"
            aria-label="Next Glimpse"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Single-Image Slide Container */}
      <div 
        className="relative rounded-[28px] overflow-hidden bg-forest-950 border border-surface-border shadow-level-3 group transition-all duration-500 h-[380px] xs:h-[420px] sm:h-[480px] md:h-[520px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Single Image Display with Transition */}
        <div className="absolute inset-0 z-0">
          <MediaImage
            src={currentSlide.imageUrl}
            alt={currentSlide.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          {/* Gradient Darkness Overlay for High Contrast Text */}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950/80 via-transparent to-transparent hidden sm:block" />
        </div>

        {/* Top Badges & Fullscreen Control */}
        <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md text-emerald-300 text-xs font-bold rounded-full border border-emerald-400/30 flex items-center gap-1.5 shadow-sm">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{currentSlide.courseTitle || 'Agritech Workshop'}</span>
            </span>

            {currentSlide.location && (
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/20 hidden xs:inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentSlide.location}</span>
              </span>
            )}
          </div>

          <button
            onClick={() => setFullscreenImage(currentSlide.imageUrl)}
            className="p-2 rounded-xl bg-white/15 backdrop-blur-md text-white hover:bg-white hover:text-forest-900 border border-white/20 transition-all shadow-sm"
            title="Expand Fullscreen Image"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Slide Progress Bar (2.5 Seconds fill) */}
        {isPlaying && !isHovered && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20 overflow-hidden">
            <div 
              key={currentIndex}
              className="h-full bg-emerald-400 animate-progress-fill"
              style={{ animationDuration: `${autoSlideInterval}ms` }}
            />
          </div>
        )}

        {/* Bottom Glimpse Information & Metadata Overlay */}
        <div className="absolute bottom-0 inset-x-0 z-10 p-5 sm:p-8 space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-300 font-semibold">
            {currentSlide.eventDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>{currentSlide.eventDate}</span>
              </span>
            )}

            {currentSlide.attendeeCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{currentSlide.attendeeCount}+ Trainees Incubated</span>
              </span>
            )}
          </div>

          <h3 className="font-display font-extrabold text-xl sm:text-2xl md:text-3xl text-white leading-tight">
            {currentSlide.title}
          </h3>

          {currentSlide.caption && (
            <p className="text-xs sm:text-sm text-surface-neutral/90 leading-relaxed line-clamp-2 sm:line-clamp-3">
              {currentSlide.caption}
            </p>
          )}

          {/* Indicator Navigation Dots */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {glimpses.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx 
                      ? 'w-8 bg-emerald-400' 
                      : 'w-2.5 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <span className="text-xs font-mono text-white/70 font-semibold">
              0{currentIndex + 1} / 0{glimpses.length}
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-6 right-6 text-white hover:text-emerald-400 p-3 bg-white/10 rounded-full border border-white/20 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Training Glimpse Fullscreen"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
