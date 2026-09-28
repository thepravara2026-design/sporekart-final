import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, ArrowRight, Sprout, Package, GraduationCap, Compass } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

export const BLOG_POSTS = [
  {
    id: 1,
    slug: 'commercial-oyster-mushroom-farming-setup-cost-profitability',
    title: 'Commercial Oyster Mushroom Farming in India: Complete Cost & Profitability Guide 2026',
    excerpt: 'Detailed financial breakdown for starting a 1,000 sq ft indoor oyster mushroom farm in India. Includes substrate costs, spawn requirements, climate control, and ROI analysis.',
    category: 'Commercial Farming',
    author: 'Dr. Anand Shinde (Principal Agronomist)',
    date: 'September 12, 2026',
    readTime: '8 min read',
    tags: ['Oyster Mushroom', 'Farming Cost', 'Agribusiness', 'Profitability'],
    targetIntent: {
      guideTitle: 'Mushroom Cultivation Technical Guide',
      guidePath: '/mushroom-cultivation-guide',
      actionTitle: 'Join Certified Cultivation Masterclass',
      actionPath: '/training',
      actionLabel: 'Explore Training'
    }
  },
  {
    id: 2,
    slug: 'wheat-straw-sterilization-methods-for-oyster-spawn-run',
    title: 'Hot Water vs Chemical Pasteurization: Best Straw Preparation Methods for Spawn Run',
    excerpt: 'Compare thermal immersion at 80°C vs Bavistin-Formalin soak for wheat straw substrate. How moisture control prevents Trichoderma green mold outbreaks.',
    category: 'Cultivation Techniques',
    author: 'Priya Kulkarni (Lab Technical Lead)',
    date: 'August 28, 2026',
    readTime: '6 min read',
    tags: ['Substrate Preparation', 'Pasteurization', 'Sterilization', 'Spawn Run'],
    targetIntent: {
      guideTitle: 'Mushroom Spawn Technical Guide',
      guidePath: '/mushroom-spawn-guide',
      actionTitle: 'Buy Lab Certified Spawn Seeds',
      actionPath: '/products/mushroom-spawn',
      actionLabel: 'Order Spawn'
    }
  },
  {
    id: 3,
    slug: 'button-mushroom-casing-soil-formulation-and-peat-moss-alternatives',
    title: 'Button Mushroom Casing Soil: Formulations, Coir Pith Ratios & pH Buffer Management',
    excerpt: 'How to prepare disease-free casing soil for Agaricus bisporus using decomposed FYM, spent mushroom substrate (SMS), and chalk powder.',
    category: 'Substrate Science',
    author: 'Dr. Anand Shinde',
    date: 'August 15, 2026',
    readTime: '10 min read',
    tags: ['Button Mushroom', 'Casing Soil', 'Agaricus', 'Soil pH'],
    targetIntent: {
      guideTitle: 'Fresh Mushroom & DIY Kit Catalog',
      guidePath: '/products',
      actionTitle: 'Explore Growing Kits & Produce',
      actionPath: '/products/growing-kits',
      actionLabel: 'Browse Products'
    }
  }
];

export default function BlogIndexPage() {
  const blogListSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Sporekart Mushroom Agritech Blog",
    "description": "Expert technical articles, financial models, substrate science, and cultivation guides for commercial mushroom growers in India.",
    "url": "https://sporekart.in/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Sporekart"
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-fade-in text-typography-primary">
      <SeoHead
        title="Mushroom Farming & Agritech Blog — Technical Guides & Business Models | Sporekart"
        description="Read technical articles on commercial mushroom cultivation, spawn lab protocols, substrate pasteurization, casing soil management, and agribusiness financial models in India."
        canonicalUrl="https://sporekart.in/blog"
        structuredData={[blogListSchema]}
      />

      <Breadcrumbs items={[{ label: 'Blog', path: '/blog' }]} />

      <div className="space-y-4 max-w-3xl">
        <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-forest-900/10 border border-forest-900/20 text-forest-800 text-xs font-semibold">
          Agritech Knowledge Center & Interlinked Intent Hub
        </span>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-typography-primary">
          Sporekart <span className="text-forest-700">Mushroom Science Blog</span>
        </h1>
        <p className="text-typography-secondary text-xs sm:text-base leading-relaxed">
          Deep-dive technical articles connecting Commercial Intent, Informational Intent, and Certified Training.
        </p>
      </div>

      {/* Intent Hub Navigation Bar */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-white p-6 rounded-card border border-surface-border shadow-level-1 space-y-3 hover-lift">
          <div className="flex items-center gap-3 text-forest-700">
            <Sprout className="w-6 h-6" />
            <h2 className="font-display font-bold text-lg text-typography-primary">1. Cultivation Hub</h2>
          </div>
          <p className="text-xs text-typography-secondary leading-relaxed">
            Learn step-by-step substrate pasteurization & farm setup, then enroll in practical masterclasses.
          </p>
          <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-surface-border">
            <Link to="/blog" className="text-forest-700 hover:underline">Cultivation Guide</Link>
            <span className="text-typography-muted">➔</span>
            <Link to="/training" className="text-green-600 hover:underline flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> Training
            </Link>
          </div>
        </div>

        <div className="bg-surface-white p-6 rounded-card border border-surface-border shadow-level-1 space-y-3 hover-lift">
          <div className="flex items-center gap-3 text-gold">
            <Package className="w-6 h-6" />
            <h2 className="font-display font-bold text-lg text-typography-primary">2. Spawn Hub</h2>
          </div>
          <p className="text-xs text-typography-secondary leading-relaxed">
            Understand grain spawn viability, strain isolation, and order lab-certified mother spawn.
          </p>
          <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-surface-border">
            <Link to="/blog" className="text-forest-700 hover:underline">Spawn Guide</Link>
            <span className="text-typography-muted">➔</span>
            <Link to="/products/mushroom-spawn" className="text-gold hover:underline flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Spawn Products
            </Link>
          </div>
        </div>

        <div className="bg-surface-white p-6 rounded-card border border-surface-border shadow-level-1 space-y-3 hover-lift">
          <div className="flex items-center gap-3 text-green-600">
            <Compass className="w-6 h-6" />
            <h2 className="font-display font-bold text-lg text-typography-primary">3. Produce & Kits Hub</h2>
          </div>
          <p className="text-xs text-typography-secondary leading-relaxed">
            Discover gourmet mushroom recipes and order fresh produce or DIY mushroom growing kits.
          </p>
          <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-surface-border">
            <Link to="/products" className="text-forest-700 hover:underline">Products Catalog</Link>
            <span className="text-typography-muted">➔</span>
            <Link to="/products/growing-kits" className="text-green-600 hover:underline flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5" /> DIY Kits
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BLOG_POSTS.map((post) => (
          <article
            key={post.id}
            className="bg-surface-white p-6 rounded-card border border-surface-border shadow-level-1 flex flex-col justify-between space-y-4 hover:border-forest-700/40 transition-all group hover-lift"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-typography-muted">
                <span className="px-2.5 py-1 rounded-full bg-forest-900/10 border border-forest-900/15 text-forest-800 font-semibold">
                  {post.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-forest-700" /> {post.readTime}
                </span>
              </div>

              <h2 className="font-display font-bold text-lg text-typography-primary group-hover:text-forest-700 transition-colors line-clamp-2">
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>

              <p className="text-xs text-typography-secondary leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
            </div>

            {/* Interlinked Intent Callout in Each Card */}
            {post.targetIntent && (
              <div className="p-3 rounded-2xl bg-surface-cream border border-surface-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <Link to={post.targetIntent.guidePath} className="text-typography-primary hover:text-forest-700 font-medium text-[11px]">
                    📖 {post.targetIntent.guideTitle}
                  </Link>
                </div>
                <Link
                  to={post.targetIntent.actionPath}
                  className="w-full py-1.5 px-3 bg-surface-white hover:bg-forest-900/5 text-forest-800 font-bold rounded-xl border border-surface-border flex items-center justify-between text-[11px] transition-all"
                >
                  <span>{post.targetIntent.actionTitle}</span>
                  <ArrowRight className="w-3 h-3 text-forest-700" />
                </Link>
              </div>
            )}

            <div className="pt-4 border-t border-surface-border flex items-center justify-between text-xs">
              <span className="text-typography-muted text-[11px] flex items-center gap-1">
                <User className="w-3 h-3 text-forest-700" /> {post.author.split(' ')[0]} {post.author.split(' ')[1]}
              </span>
              <Link
                to={`/blog/${post.slug}`}
                className="text-forest-700 font-bold flex items-center gap-1 hover:gap-2 transition-all"
              >
                Read Article <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
