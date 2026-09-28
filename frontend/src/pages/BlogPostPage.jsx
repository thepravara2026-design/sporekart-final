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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-typography-primary">
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
        className="inline-flex items-center gap-2 text-xs text-forest-700 font-semibold hover:text-forest-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Blog Posts
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-typography-muted">
          <span className="px-3 py-1 rounded-full bg-forest-900/10 border border-forest-900/15 text-forest-800 font-semibold">
            {post.category}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-forest-700" /> {post.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-forest-700" /> {post.readTime}
          </span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-typography-primary leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 pt-2 text-xs text-typography-secondary">
          <div className="w-8 h-8 rounded-full bg-forest-900/10 border border-forest-900/20 flex items-center justify-center font-bold text-forest-800">
            AS
          </div>
          <div>
            <p className="font-bold text-typography-primary">{post.author}</p>
            <p className="text-typography-muted text-[11px]">Sporekart Agritech Center, Pune</p>
          </div>
        </div>
      </header>

      <article className="bg-surface-white p-6 sm:p-10 rounded-card border border-surface-border shadow-level-1 space-y-6 text-typography-secondary text-xs sm:text-sm leading-relaxed">
        <p className="text-sm sm:text-base font-medium text-typography-primary bg-surface-cream p-4 rounded-2xl border border-surface-border">
          {post.excerpt}
        </p>

        <h2 className="font-display font-bold text-xl text-typography-primary">1. Infrastructure Requirements & Capital Expenditure</h2>
        <p>
          To establish a commercial 1,000 sq. ft. mushroom fruiting chamber in tropical or subtropical Indian climates, temperature control (18°C–24°C) and relative humidity (85%–90% RH) maintenance are non-negotiable.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-typography-primary">Insulated PUF Panels or Double-Brick Structure:</strong> Essential to lower cooling HVAC electricity consumption.</li>
          <li><strong className="text-typography-primary">Fogger & Humidifier Units:</strong> High-pressure ultrasonic nozzle humidifiers maintain fog without soaking bag surfaces.</li>
          <li><strong className="text-typography-primary">Spawn Requirement:</strong> 250kg of lab-certified wheat grain spawn per 10-ton wet substrate batch.</li>
        </ul>

        <h2 className="font-display font-bold text-xl text-typography-primary">2. Financial Projections & Payback Period</h2>
        <p>
          With an average market price of ₹120–₹160 per kg for fresh oyster mushrooms and ₹140–₹180 per kg for button mushrooms, small-to-mid scale farms achieve complete capital payback within 12 to 14 months.
        </p>
        <div className="p-4 rounded-2xl bg-forest-900/10 border border-forest-700/30 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" />
          <p className="text-xs text-forest-900">
            <strong className="font-bold">Pro Tip:</strong> Selling value-added dehydrated mushroom powder and mushroom soup premixes increases profit margins by up to 45% compared to raw fresh sales.
          </p>
        </div>
      </article>

      <div className="bg-surface-white p-6 rounded-card border border-surface-border shadow-level-1 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-typography-primary text-sm">Need Pure Spawn or Farm Consultancy?</h4>
          <p className="text-xs text-typography-secondary">Our agronomists help design setup blueprints and supply mother spawn batches.</p>
        </div>
        <Link
          to="/contact"
          className="btn-primary px-5 py-2.5 text-xs font-bold shrink-0"
        >
          Get Farm Consultation
        </Link>
      </div>
    </div>
  );
}
