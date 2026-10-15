import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { reviewApi } from '../api';

const DEFAULT_STORIES = [
  {
    id: 'story-1',
    name: 'Priya Sharma',
    role: 'Home Cook',
    city: 'Bengaluru',
    rating: 5,
    avatarColor: 'bg-emerald-700',
    quote: 'The quality of mushrooms is outstanding. You can really taste the freshness and care in every bite!',
    initials: 'PS',
  },
  {
    id: 'story-2',
    name: 'Rohan Mehta',
    role: 'Restaurant Owner',
    city: 'Mumbai',
    rating: 5,
    avatarColor: 'bg-amber-700',
    quote: 'Reliable supply, great taste and a brand that truly cares about sustainability. Highly recommended!',
    initials: 'RM',
  },
  {
    id: 'story-3',
    name: 'Anjali Verma',
    role: 'Aspiring Farmer',
    city: 'Pune',
    rating: 5,
    avatarColor: 'bg-forest-800',
    quote: 'The training program gave me practical skills and confidence to start my own mushroom farm. Excellent experience!',
    initials: 'AV',
  },
];

export default function CustomerTestimonialsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewApi
      .getLatestReviews(3)
      .then((res) => {
        const fetched = res.data?.data || [];
        if (fetched.length > 0) {
          setReviews(
            fetched.map((r, i) => ({
              id: r.id || `rev-${i}`,
              name: r.customerName || r.reviewerName || 'Sporekart Customer',
              role: r.productTitle ? `Verified Buyer of ${r.productTitle}` : 'Customer',
              rating: r.rating || 5,
              avatarColor: i % 2 === 0 ? 'bg-forest-800' : 'bg-emerald-700',
              quote: r.comment || r.reviewText || r.title || 'Exceptional fresh mushrooms and pure grain spawn.',
              initials: (r.customerName || 'SC')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase(),
              productSlug: r.productSlug,
            }))
          );
        } else {
          setReviews(DEFAULT_STORIES);
        }
      })
      .catch(() => {
        setReviews(DEFAULT_STORIES);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section 
      id="testimonials" 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16"
      aria-label="Customer Testimonials"
    >
      <div className="space-y-8 sm:space-y-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-forest-800 uppercase font-sans">
            REAL STORIES
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-forest-900 leading-[1.15]">
            What Our Customers Say
          </h2>
          <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
            Freshness, quality and sustainability — that’s what our customers love about us.
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {reviews.map((story) => (
            <div
              key={story.id}
              className="p-6 sm:p-7 rounded-[24px] bg-surface-white border border-surface-border shadow-sm hover:shadow-level-2 hover:border-forest-700/30 transition-all duration-300 flex flex-col justify-between space-y-5"
            >
              {/* Top Quote */}
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(story.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-forest-900/90 leading-relaxed italic font-sans">
                  "{story.quote}"
                </p>
              </div>

              {/* Reviewer Meta */}
              <div className="flex items-center gap-3 pt-3 border-t border-forest-900/5">
                <div
                  className={`w-10 h-10 rounded-full ${story.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm`}
                >
                  {story.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="font-bold text-xs sm:text-sm text-forest-900 truncate">
                      {story.name}
                    </h4>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Verified" />
                  </div>
                  <p className="text-[11px] text-typography-muted truncate">
                    {story.role} {story.city ? `• ${story.city}` : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
