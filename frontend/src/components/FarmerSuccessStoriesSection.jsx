import React from 'react';
import { Star, CheckCircle2, TrendingUp, Quote, MapPin, Building, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const GROWER_STORIES = [
  {
    id: 'story-rajesh',
    name: 'Rajesh Patil',
    role: 'Commercial Grower',
    location: 'Satara, Maharashtra',
    scale: '500 Bags / 300 sq.ft Shed',
    monthlyProfit: '₹48,500 / Month',
    crop: 'Pearl Oyster Mushrooms',
    quote: 'Sporekart’s 1st-generation oyster spawn has zero contamination. Their buyback team picks up my dried mushroom batches on the 1st of every month without delayed payments.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    verifiedBadge: 'Certified Partner #MH-104',
    rating: 5
  },
  {
    id: 'story-sunita',
    name: 'Sunita Sharma',
    role: 'Terrace Agri-Entrepreneur',
    location: 'Belagavi, Karnataka',
    scale: '150 Bags on Covered Terrace',
    monthlyProfit: '₹22,000 / Month',
    crop: 'Tropical Milky & Oyster',
    quote: 'I attended the 2-day Pune masterclass. As a homemaker with no previous farming knowledge, the step-by-step humidity controller setup made cultivation seamless.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    verifiedBadge: 'Trainee Cohort #18',
    rating: 5
  },
  {
    id: 'story-vikram',
    name: 'Vikram & Rohan Joshi',
    role: 'Commercial Button Unit',
    location: 'Pune AgriTech Hub',
    scale: '2,000 Bags Climate-Controlled Room',
    monthlyProfit: '₹1,85,000 / Month',
    crop: 'Commercial White Button',
    quote: 'The direct buyback contract gave our bank the confidence to sanction our agricultural subsidy. Sporekart is the only end-to-end mycology partner in western India.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    verifiedBadge: 'Incubation Partner #PN-09',
    rating: 5
  }
];

export default function FarmerSuccessStoriesSection() {
  return (
    <section 
      id="success-stories" 
      aria-label="Real Indian Grower Success Stories" 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16"
    >
      <div className="space-y-8 sm:space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-900/10 border border-forest-900/20 text-forest-800 text-xs font-bold font-sans">
            <TrendingUp className="w-4 h-4 text-forest-800" />
            <span>REAL INDIAN FARMERS. REAL VERIFIED EARNINGS.</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-forest-900 leading-tight">
            From Spare Rooms to<br />Thriving Mushroom Farms
          </h2>
          <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
            Discover how ordinary individuals, homemakers, and commercial farmers across India have created profitable micro-enterprises with Sporekart spawn and buyback.
          </p>
        </div>

        {/* 3 Story Cards - Compact 2-Column Grid on Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-8 items-stretch">
          {GROWER_STORIES.map((story, idx) => {
            const isLast = idx === GROWER_STORIES.length - 1;
            return (
              <div
                key={story.id}
                className={`bg-surface-white rounded-2xl sm:rounded-[28px] p-3 sm:p-7 border border-surface-border shadow-level-1 hover:border-forest-700/40 hover:shadow-level-2 transition-all duration-300 flex flex-col justify-between space-y-3 sm:space-y-6 relative overflow-hidden group ${
                  isLast ? 'col-span-2 md:col-span-1' : ''
                }`}
              >
                {/* Subtle top decoration */}
                <div className="absolute top-0 inset-x-0 h-1 sm:h-1.5 bg-gradient-to-r from-forest-900 via-emerald-600 to-forest-900" />

                <div className="space-y-2.5 sm:space-y-5">
                  {/* Farmer Profile Header */}
                  <div className="flex items-center gap-2 sm:gap-3.5">
                    <img
                      src={story.avatar}
                      alt={story.name}
                      loading="lazy"
                      className="w-9 h-9 sm:w-14 sm:h-14 rounded-full object-cover border border-forest-700/30 sm:border-2 shadow-sm shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs sm:text-lg text-forest-900 leading-tight truncate">
                        {story.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[9px] sm:text-xs text-typography-muted mt-0.5">
                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-forest-700 shrink-0" />
                        <span className="truncate">{story.location}</span>
                      </div>
                      <div className="inline-flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-0.5 border border-emerald-200 truncate max-w-full">
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{story.verifiedBadge}</span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Earnings Highlight */}
                  <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-forest-900 to-forest-800 text-white p-2.5 sm:p-4 space-y-0.5 sm:space-y-1 shadow-sm">
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                      Verified Monthly Earnings
                    </span>
                    <div className="font-display font-extrabold text-base sm:text-2xl text-white">
                      {story.monthlyProfit}
                    </div>
                    <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-surface-neutral/80 pt-1 border-t border-white/10 truncate">
                      <span className="truncate">{story.scale}</span>
                      <span className="text-emerald-300 font-semibold truncate ml-1">{story.crop}</span>
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="relative pt-0.5 sm:pt-1">
                    <Quote className="w-4 h-4 sm:w-6 sm:h-6 text-forest-900/10 absolute -top-1 -left-1" />
                    <p className="text-[10px] sm:text-sm text-typography-secondary leading-relaxed pl-3 sm:pl-5 italic line-clamp-3 sm:line-clamp-none">
                      "{story.quote}"
                    </p>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex items-center justify-between pt-2 sm:pt-4 border-t border-surface-border text-[10px] sm:text-xs">
                  <span className="font-semibold text-forest-900 text-[9px] sm:text-[11px] truncate max-w-[90px] sm:max-w-none">
                    {story.role}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="rounded-2xl bg-surface-cream border border-surface-border p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-display font-bold text-lg sm:text-xl text-forest-900">
              Ready to Start Your Commercial Farm in 2026?
            </h4>
            <p className="text-xs sm:text-sm text-typography-secondary">
              We provide laboratory spawn, humidity equipment, technical audits, and institutional buyback under one roof.
            </p>
          </div>
          <Link
            to="/training"
            className="shrink-0 px-6 py-3 rounded-full bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm transition-all"
          >
            <span>Join Next Training Cohort</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
