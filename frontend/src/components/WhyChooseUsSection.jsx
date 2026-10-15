import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Leaf, Users, Truck, Cpu, Heart, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'Fresh, nutritious & delicious gourmet mushrooms grown to peak flavor.',
  },
  {
    icon: Leaf,
    title: 'Sustainable Farming',
    description: 'Lower environmental impact with upcycled agricultural substrate.',
  },
  {
    icon: Users,
    title: 'Expert Team',
    description: 'Driven by passion & certified mycology expertise across India.',
  },
  {
    icon: Truck,
    title: 'Farm to Table',
    description: 'Shorter supply chain delivering harvest directly to your doorstep.',
  },
  {
    icon: Cpu,
    title: 'Innovation Focused',
    description: 'Smarter farming solutions combining biological science and IoT tech.',
  },
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Goodness in every bite packed with immunity-boosting beta-glucans.',
  },
];

export default function WhyChooseUsSection() {
  return (
    <section 
      id="why-choose-us" 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16"
      aria-label="Why Choose Sporekart"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: Heading, Copy, Our Story CTA & Visual */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-forest-800 uppercase font-sans">
              WHY CHOOSE US
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-[42px] text-forest-900 leading-[1.12]">
              Good for You.<br />Better for Tomorrow.
            </h2>
            <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
              From more than just a mushroom brand — we’re a step towards a healthier you and a healthier planet.
            </p>
          </div>

          <div>
            <Link
              to="/about"
              className="bg-forest-900 hover:bg-forest-800 text-white font-medium text-xs sm:text-sm px-6 py-3 rounded-full inline-flex items-center gap-2 shadow-level-1 hover-lift transition-all button-press"
            >
              <span>Our Story</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Organic Mushroom Culinary Visual */}
          <div className="pt-2">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-surface-border shadow-sm aspect-[4/3] group">
              <img
                src="/sporekart-why-choose.jpg"
                alt="Fresh organic mushrooms with natural herbs"
                width="800"
                height="600"
                loading="lazy"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: 2-Column Grid of 6 Trust Cards in Mobile & Tablet */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-2.5 sm:gap-4">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-3.5 sm:p-6 rounded-2xl bg-surface-white border border-surface-border shadow-sm hover:shadow-level-2 hover:border-forest-700/30 hover-lift transition-all duration-200 space-y-2 sm:space-y-3 flex flex-col justify-between"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-forest-900/10 text-forest-800 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-forest-800" strokeWidth={1.8} />
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <h3 className="font-bold text-xs sm:text-base text-forest-900 leading-snug line-clamp-1 sm:line-clamp-none">
                    {feat.title}
                  </h3>
                  <p className="text-[10px] sm:text-sm text-typography-secondary leading-relaxed line-clamp-3 sm:line-clamp-none">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
