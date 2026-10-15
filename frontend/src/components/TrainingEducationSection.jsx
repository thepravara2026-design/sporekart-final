import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const TRAINING_POINTS = [
  'Hands-on Training in sterile lab techniques',
  'Expert-Led Sessions by veteran mycologists',
  'Live Farm Visits & climate chamber tours',
  'Certification Support & commercial buyback linkages',
];

export default function TrainingEducationSection() {
  return (
    <section 
      id="training-education" 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16"
      aria-label="Training and Education"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        
        {/* Left Visual: Hands Holding Fresh Harvest */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-level-2 border border-surface-border aspect-[4/3] lg:aspect-[4/5] group">
            <img
              src="/sporekart-hands-oyster.jpg"
              alt="Hands holding fresh harvested oyster mushrooms"
              width="800"
              height="1000"
              loading="lazy"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Center Content: Heading, Description, 4 Checkmarks, CTA */}
        <div className="lg:col-span-4 order-1 lg:order-2 space-y-5 text-left">
          <div className="space-y-3">
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-forest-800 uppercase font-sans">
              TRAINING &amp; EDUCATION
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-forest-900 leading-[1.15]">
              Learn. Grow. Build a<br />Greener Future.
            </h2>
            <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
              Join our training programs to gain hands-on knowledge and expert guidance in sustainable mushroom farming and agritech solutions.
            </p>
          </div>

          {/* 4 Checkmarks */}
          <div className="space-y-3 pt-1">
            {TRAINING_POINTS.map((pt) => (
              <div key={pt} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-forest-800 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-forest-900">
                  {pt}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3">
            <Link
              to="/training"
              className="bg-forest-900 hover:bg-forest-800 text-white font-medium text-xs sm:text-sm px-7 py-3.5 rounded-full inline-flex items-center gap-2 shadow-level-1 hover-lift transition-all button-press"
            >
              <span>Explore Training</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right Visual: Training Workshop with Cursive Overlay */}
        <div className="lg:col-span-4 order-3">
          <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-level-2 border border-surface-border aspect-[4/3] lg:aspect-[4/5] group">
            <img
              src="/sporekart-training-workshop.jpg"
              alt="Practical mushroom cultivation workshop with trainees"
              width="800"
              height="1000"
              loading="lazy"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Handwritten cursive script badge */}
            <div className="absolute bottom-5 right-5 sm:bottom-7 sm:right-7 pointer-events-none text-white select-none text-right drop-shadow-lg">
              <span
                className="text-xl sm:text-2xl font-normal tracking-wide block italic"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Skills for a<br />sustainable future ~
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
