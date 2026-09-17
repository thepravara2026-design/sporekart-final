import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, CheckCircle, GraduationCap, ArrowRight } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

export default function CultivationGuidePage() {
  const guideSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Complete Guide to Commercial Mushroom Cultivation in India",
    "description": "Comprehensive guide covering substrate formulation, pasteurization, spawn inoculation, climate control, and harvesting for Oyster, Button & Milky mushrooms in India.",
    "author": {
      "@type": "Organization",
      "name": "Sporekart Agritech Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Sporekart",
      "logo": {
        "@type": "ImageObject",
        "url": "https://sporekart.in/logo.png"
      }
    },
    "datePublished": "2026-01-15",
    "dateModified": "2026-09-17"
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <SeoHead
        title="Commercial Mushroom Cultivation Guide India — Step-by-Step Farming | Sporekart"
        description="Learn step-by-step commercial mushroom farming in India. Detailed guide on substrate preparation, spawning ratio, humidity control, and market selling."
        canonicalUrl="https://sporekart.in/mushroom-cultivation-guide"
        structuredData={guideSchema}
      />

      <Breadcrumbs items={[{ label: 'Mushroom Cultivation Guide', path: '/mushroom-cultivation-guide' }]} />

      <header className="space-y-4 border-b border-spore-800/60 pb-8">
        <span className="px-3.5 py-1.5 rounded-full bg-spore-950 text-spore-300 text-xs font-semibold border border-spore-800">
          Comprehensive Agritech Knowledge Base
        </span>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight">
          Complete Guide to Commercial Mushroom Cultivation in India
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Mushroom cultivation is one of the highest profit-per-square-foot agricultural ventures in India. Whether growing tropical Milky mushrooms, Pearl Oyster varieties, or White Button mushrooms, success depends on biological substrate sterilization, spawn purity, and precise climate management.
        </p>
      </header>

      <article className="space-y-8 text-slate-300 text-sm leading-relaxed">
        <section className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-spore-400" /> 1. Substrate Selection & Pasteurization
          </h2>
          <p>
            For Oyster mushrooms, chopped wheat or paddy straw is the standard substrate in India. Substrates must be hot-water pasteurized at 80°C for 2 hours or chemical pasteurized to destroy competing mold spores (Trichoderma).
          </p>
        </section>

        <section className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-spore-400" /> 2. Spawning Ratio & Inoculation
          </h2>
          <p>
            Use 2% to 3% lab-certified first-generation wheat grain spawn by wet weight of substrate. Ensure clean, disinfected hands and environment during spawning to prevent contamination.
          </p>
        </section>

        <section className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-spore-400" /> 3. Incubation & Fruiting Room Climate
          </h2>
          <p>
            Keep bags in dark incubation rooms at 24°C–28°C until white mycelium fully covers the substrate (12–15 days). Move to fruiting rooms with 85%–90% relative humidity and fresh air exchange.
          </p>
        </section>
      </article>

      <div className="glass-panel p-8 rounded-3xl border border-spore-700/50 text-center space-y-4">
        <h3 className="font-display font-bold text-2xl text-white">Want Live Practical Training?</h3>
        <p className="text-xs text-slate-300 max-w-lg mx-auto">
          Enroll in Sporekart's certified online & laboratory masterclasses led by senior agronomists.
        </p>
        <Link
          to="/training"
          className="inline-flex items-center gap-2 bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs"
        >
          <GraduationCap className="w-4 h-4" /> View Certified Training Batches
        </Link>
      </div>
    </div>
  );
}
