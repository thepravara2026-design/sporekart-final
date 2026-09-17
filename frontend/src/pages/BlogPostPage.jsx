import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { BLOG_POSTS } from './BlogIndexPage';
import { Calendar, Clock, User, ArrowLeft, Tag, Share2, CheckCircle2 } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((p) => p.slug === slug) || BLOG_POSTS[0];

  const blogArticleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Sporekart",
      "logo": {
        "@type": "ImageObject",
        "url": "https://sporekart.in/logo.png"
      }
    },
    "datePublished": "2026-09-01",
    "mainEntityOfPage": `https://sporekart.in/blog/${post.slug}`
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <SeoHead
        title={`${post.title} | Sporekart Blog`}
        description={post.excerpt}
        canonicalUrl={`https://sporekart.in/blog/${post.slug}`}
        structuredData={[blogArticleSchema]}
      />

      <Breadcrumbs
        items={[
          { label: 'Blog', path: '/blog' },
          { label: post.title, path: `/blog/${post.slug}` }
        ]}
      />

      <Link
        to="/blog"
        className="inline-flex items-center gap-2 text-xs text-spore-400 font-semibold hover:text-spore-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Blog Posts
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="px-3 py-1 rounded-full bg-spore-950 border border-spore-700/50 text-spore-300 font-semibold">
            {post.category}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> {post.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {post.readTime}
          </span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 pt-2 text-xs text-slate-300">
          <div className="w-8 h-8 rounded-full bg-spore-900 border border-spore-700 flex items-center justify-center font-bold text-spore-300">
            AS
          </div>
          <div>
            <p className="font-bold text-white">{post.author}</p>
            <p className="text-slate-400 text-[11px]">Sporekart Agritech Center, Pune</p>
          </div>
        </div>
      </header>

      <article className="glass-panel p-6 sm:p-10 rounded-3xl border border-spore-800/60 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
        <p className="text-sm sm:text-base font-medium text-slate-200 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          {post.excerpt}
        </p>

        <h2 className="font-display font-bold text-xl text-white">1. Infrastructure Requirements & Capital Expenditure</h2>
        <p>
          To establish a commercial 1,000 sq. ft. mushroom fruiting chamber in tropical or subtropical Indian climates, temperature control (18°C–24°C) and relative humidity (85%–90% RH) maintenance are non-negotiable.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Insulated PUF Panels or Double-Brick Structure:</strong> Essential to lower cooling HVAC electricity consumption.</li>
          <li><strong>Fogger & Humidifier Units:</strong> High-pressure ultrasonic nozzle humidifiers maintain fog without soaking bag surfaces.</li>
          <li><strong>Spawn Requirement:</strong> 250kg of lab-certified wheat grain spawn per 10-ton wet substrate batch.</li>
        </ul>

        <h2 className="font-display font-bold text-xl text-white">2. Financial Projections & Payback Period</h2>
        <p>
          With an average market price of ₹120–₹160 per kg for fresh oyster mushrooms and ₹140–₹180 per kg for button mushrooms, small-to-mid scale farms achieve complete capital payback within 12 to 14 months.
        </p>
        <div className="p-4 rounded-2xl bg-spore-950/80 border border-spore-800/60 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-spore-400 shrink-0 mt-0.5" />
          <p className="text-xs text-spore-200">
            <strong>Pro Tip:</strong> Selling value-added dehydrated mushroom powder and mushroom soup premixes increases profit margins by up to 45% compared to raw fresh sales.
          </p>
        </div>
      </article>

      <div className="glass-panel p-6 rounded-3xl border border-spore-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-white text-sm">Need Pure Spawn or Farm Consultancy?</h4>
          <p className="text-xs text-slate-400">Our agronomists help design setup blueprints and supply mother spawn batches.</p>
        </div>
        <Link
          to="/contact"
          className="px-5 py-2.5 bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold rounded-xl text-xs transition-all shrink-0"
        >
          Get Farm Consultation
        </Link>
      </div>
    </div>
  );
}
