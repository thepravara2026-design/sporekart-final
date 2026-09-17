import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Clock, User, ArrowRight, Tag } from 'lucide-react';
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
    tags: ['Oyster Mushroom', 'Farming Cost', 'Agribusiness', 'Profitability']
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
    tags: ['Substrate Preparation', 'Pasteurization', 'Sterilization', 'Spawn Run']
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
    tags: ['Button Mushroom', 'Casing Soil', 'Agaricus', 'Soil pH']
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <SeoHead
        title="Mushroom Farming & Agritech Blog — Technical Guides & Business Models | Sporekart"
        description="Read technical articles on commercial mushroom cultivation, spawn lab protocols, substrate pasteurization, casing soil management, and agribusiness financial models in India."
        canonicalUrl="https://sporekart.in/blog"
        structuredData={[blogListSchema]}
      />

      <Breadcrumbs items={[{ label: 'Blog', path: '/blog' }]} />

      <div className="space-y-4 max-w-3xl">
        <span className="px-3.5 py-1 rounded-full bg-spore-950 border border-spore-700/50 text-spore-300 text-xs font-semibold">
          Agritech Knowledge Center
        </span>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white">
          Sporekart <span className="gradient-text">Mushroom Science Blog</span>
        </h1>
        <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
          Deep-dive technical articles written by certified agronomists and mycology researchers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BLOG_POSTS.map((post) => (
          <article
            key={post.id}
            className="glass-card p-6 rounded-3xl border border-spore-800/60 flex flex-col justify-between space-y-4 hover:border-spore-500/50 transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-spore-400 font-semibold">
                  {post.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {post.readTime}
                </span>
              </div>

              <h2 className="font-display font-bold text-lg text-white group-hover:text-spore-300 transition-colors line-clamp-2">
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <User className="w-3 h-3 text-spore-400" /> {post.author.split(' ')[0]} {post.author.split(' ')[1]}
              </span>
              <Link
                to={`/blog/${post.slug}`}
                className="text-spore-400 font-bold flex items-center gap-1 hover:gap-2 transition-all"
              >
                Read Guide <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
