import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'fresh-mushrooms',
    name: 'Fresh Mushrooms',
    subtitle: 'Daily Farm Harvest',
    image: '/sporekart-white-button.jpg',
    link: '/products/fresh-mushrooms',
  },
  {
    id: 'dry-mushrooms',
    name: 'Dry Mushrooms',
    subtitle: 'Rich Umami & Dried',
    image: '/sporekart-shiitake.jpg',
    link: '/products/dry-mushrooms',
  },
  {
    id: 'spawn-seeds',
    name: 'Grain Spawn',
    subtitle: '1st Gen Pure Seeds',
    image: '/sporekart-hands-oyster.jpg',
    link: '/products/spawn-seeds',
  },
  {
    id: 'growing-kits',
    name: 'Growing Kits',
    subtitle: 'Ready-to-Fruit DIY',
    image: '/sporekart-oyster-cluster.jpg',
    link: '/products/growing-kits',
  },
  {
    id: 'equipment-supplies',
    name: 'Equipment & Supplies',
    subtitle: 'Lab Tools & Hygiene',
    image: '/sporekart-farm-scientist.jpg',
    link: '/products/equipment-supplies',
  },
  {
    id: 'training',
    name: 'Agritech Training',
    subtitle: 'Certified Masterclasses',
    image: '/sporekart-training-workshop.jpg',
    link: '/training',
  },
];

export default function MushroomVarietiesSection() {
  return (
    <section 
      id="varieties" 
      className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-7 sm:py-12"
      aria-label="Product Categories Showcase"
    >
      {/* Mobile Compressed Header (Visible on < lg screens) */}
      <div className="lg:hidden flex items-end justify-between gap-3 mb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-[0.2em] text-forest-800 uppercase font-sans block">
            OUR CATEGORIES &amp; VARIETIES
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-forest-900 leading-tight">
            Explore Varieties
          </h2>
          <p className="text-[11px] sm:text-xs text-typography-secondary line-clamp-1">
            Fresh mushrooms, pure spawn seeds &amp; DIY kits.
          </p>
        </div>
        <Link
          to="/products"
          className="shrink-0 bg-forest-900 hover:bg-forest-800 text-white font-semibold text-xs px-3.5 py-2 rounded-full inline-flex items-center gap-1.5 shadow-sm transition-all button-press"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        
        {/* Desktop Left Column: Heading, Description & CTA (>= lg screens) */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-3.5">
          <span className="text-xs font-bold tracking-[0.2em] text-forest-800 uppercase font-sans">
            OUR CATEGORIES &amp; VARIETIES
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-forest-900 leading-[1.15]">
            Explore Nature’s<br />Finest Categories
          </h2>
          <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
            From farm-fresh mushrooms and pure grain spawn to ready-to-fruit kits, cultivation supplies, and certified grower training.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="bg-forest-900 hover:bg-forest-800 text-white font-medium text-xs sm:text-sm px-6 py-3 rounded-full inline-flex items-center gap-2 shadow-level-1 hover-lift transition-all button-press"
            >
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 6 Category Cards: 2 Columns on Mobile, 3 on Tablet, 6 on Desktop */}
        <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 lg:gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={cat.link}
              className="group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl bg-surface-white border border-surface-border/80 shadow-[0_2px_8px_rgba(23,59,42,0.04)] hover:shadow-level-2 hover:border-forest-700/40 hover-lift transition-all duration-300 text-center"
            >
              {/* Card Image */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-cream/50 mb-2">
                <img
                  src={cat.image}
                  alt={`${cat.name} Sporekart`}
                  width="240"
                  height="180"
                  loading="lazy"
                  className="w-full h-full object-cover rounded-xl transform group-hover:scale-108 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>

              {/* Title & Subtitle */}
              <div className="flex-1 flex flex-col justify-between space-y-1">
                <div>
                  <h3 className="text-xs sm:text-xs xl:text-sm font-bold text-forest-900 group-hover:text-forest-700 transition-colors leading-snug line-clamp-2 min-h-[1.85rem] sm:min-h-[2.2rem] flex items-center justify-center">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-typography-muted line-clamp-1 mt-0.5">
                    {cat.subtitle}
                  </p>
                </div>

                {/* Micro Action Button */}
                <div className="pt-1.5 flex items-center justify-between text-forest-800/70 group-hover:text-forest-900 transition-colors">
                  <span className="text-[10px] font-semibold tracking-wide text-forest-700 uppercase group-hover:underline">
                    Explore
                  </span>
                  <div className="w-5 h-5 rounded-full bg-forest-900/5 group-hover:bg-forest-900 group-hover:text-white flex items-center justify-center transition-all">
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
