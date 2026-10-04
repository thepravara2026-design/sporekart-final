import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Award, Clock } from 'lucide-react';

export default function TrainingCarousel({
  courses = [],
  title = "Certified Agribusiness Masterclasses",
  subtitle = "Learn commercial cultivation & setup spawn labs with expert guidance",
  viewAllLink = "/training",
  className = "",
}) {
  if (!courses || courses.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-900/10 text-forest-800 text-[11px] font-bold border border-forest-900/15 mb-1">
            <GraduationCap className="w-3.5 h-3.5 text-forest-700" />
            <span>Agronomist Workshops</span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-forest-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-typography-secondary text-xs sm:text-sm mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 hover-lift shrink-0"
          >
            All Workshops <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Horizontal Swipeable Track */}
      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        {courses.map((course) => (
          <div
            key={course.id || course.slug}
            className="w-[260px] sm:w-[320px] shrink-0 snap-start bg-forest-900 text-white rounded-2xl p-5 border border-forest-800 shadow-level-2 hover-lift flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-forest-800 text-sage text-[10px] font-bold uppercase tracking-wider border border-forest-700">
                  {course.mode || 'ONLINE & LAB'}
                </span>
                {course.durationDays && (
                  <span className="text-[11px] text-sage flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gold" /> {course.durationDays} Days
                  </span>
                )}
              </div>

              <h3 className="font-bold text-white text-base font-display line-clamp-2">
                {course.title}
              </h3>
              <p className="text-xs text-sage/90 line-clamp-2 leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="pt-3 border-t border-forest-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-sage block font-medium">Course Fee</span>
                <span className="text-lg font-bold text-gold font-display">
                  ₹{(course.priceInr || course.feeInr || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <Link
                to={`/training/${course.slug}`}
                className="px-4 py-2 bg-leaf hover:bg-green-600 text-forest-900 font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Enroll Now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
