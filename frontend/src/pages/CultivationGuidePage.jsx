import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, CheckCircle, GraduationCap, HelpCircle, ShieldCheck } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

export default function CultivationGuidePage() {
  const guideSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "Complete Guide to Commercial Mushroom Cultivation in India",
    "description": "GEO-optimized guide covering substrate formulation, pasteurization, spawn inoculation, climate control, and harvesting for Oyster, Button & Milky mushrooms.",
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
    }
  };

  const geoFaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is mushroom cultivation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Mushroom cultivation is the agricultural process of propagating edible or medicinal fungal species on pasteurized organic waste substrates under controlled temperature and humidity conditions."
        }
      },
      {
        "@type": "Question",
        "name": "How to start mushroom farming in India?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "To start mushroom farming in India, select a suitable variety (Oyster, Button, or Milky), build a climate-controlled room, source pasteurized wheat straw substrate, inoculate with 3% grain spawn, and maintain 85% to 90% humidity."
        }
      },
      {
        "@type": "Question",
        "name": "What substrate is best for mushroom cultivation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Chopped wheat straw, paddy straw, and sugarcane bagasse are optimal substrates for Oyster and Milky mushrooms, while composted wheat straw mixed with chicken manure and gypsum is standard for White Button mushrooms."
        }
      },
      {
        "@type": "Question",
        "name": "What is the ideal temperature and humidity for growing mushrooms?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Oyster mushrooms require 20°C to 26°C with 85%–90% humidity; Button mushrooms require 14°C to 18°C for fruiting; and tropical Milky mushrooms require 28°C to 35°C with 85% humidity."
        }
      },
      {
        "@type": "Question",
        "name": "How profitable is commercial mushroom farming?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Commercial mushroom farming yields 100% to 120% Biological Efficiency, producing 1kg to 1.2kg fresh mushrooms per 1kg dry straw, generating high profit margins per square foot."
        }
      }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <SeoHead
        title="What is Mushroom Cultivation? Step-by-Step Farming Guide India | Sporekart"
        description="Direct answer guide to commercial mushroom farming in India: substrate selection, pasteurization, spawning ratio, climate requirements, and profitability."
        canonicalUrl="https://sporekart.in/mushroom-cultivation-guide"
        structuredData={[guideSchema, geoFaqSchema]}
      />

      <Breadcrumbs items={[{ label: 'Mushroom Cultivation Guide', path: '/mushroom-cultivation-guide' }]} />

      <header className="space-y-4 border-b border-spore-800/60 pb-8">
        <span className="px-3.5 py-1.5 rounded-full bg-spore-950 text-spore-300 text-xs font-semibold border border-spore-800">
          Agronomist Technical Handbook & GEO Knowledge Base
        </span>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight">
          Complete Guide to Commercial Mushroom Cultivation in India
        </h1>
      </header>

      <article className="space-y-8 text-slate-300 text-sm leading-relaxed">
        {/* GEO Question 1 */}
        <section className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-spore-400" /> What is mushroom cultivation?
          </h2>
          <div className="p-4 rounded-xl bg-spore-950/80 border border-spore-600/50 text-spore-200 text-xs font-medium">
            <strong>Direct Answer:</strong> Mushroom cultivation is the agricultural process of propagating edible or medicinal fungal species on pasteurized organic waste substrates under controlled temperature, light, and humidity conditions.
          </div>
          <p className="text-xs text-slate-300">
            Unlike green plants that rely on photosynthesis, mushrooms are saprophytic fungi that absorb complex lignin and cellulose from organic agricultural byproducts such as wheat straw, paddy straw, and sawdust.
          </p>
        </section>

        {/* GEO Question 2 */}
        <section className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-spore-400" /> How to start mushroom farming in India?
          </h2>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium">
            <strong>Direct Answer:</strong> To start mushroom farming in India, select a suitable variety (Oyster, Button, or Milky), construct an insulated growth room, source pasteurized wheat straw substrate, inoculate with 3% grain spawn, and maintain 85% to 90% humidity.
          </div>
        </section>

        {/* GEO Question 3 */}
        <section className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-spore-400" /> What substrate is best for mushroom cultivation?
          </h2>
          <div className="p-4 rounded-xl bg-spore-950/80 border border-spore-600/50 text-spore-200 text-xs font-medium">
            <strong>Direct Answer:</strong> Chopped wheat straw, paddy straw, and sugarcane bagasse are optimal substrates for Oyster and Milky mushrooms, while composted wheat straw mixed with chicken manure and gypsum is standard for White Button mushrooms.
          </div>
        </section>

        {/* GEO Question 4 */}
        <section className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> What is the ideal temperature and humidity for growing mushrooms?
          </h2>
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-xs font-medium">
            <strong>Direct Answer:</strong> Oyster mushrooms require 20°C to 26°C with 85%–90% relative humidity; Button mushrooms require 14°C to 18°C for fruiting; and tropical Milky mushrooms require 28°C to 35°C with 85% humidity.
          </div>
        </section>

        {/* GEO Question 5 */}
        <section className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" /> How profitable is commercial mushroom farming?
          </h2>
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs font-medium">
            <strong>Direct Answer:</strong> Commercial mushroom farming yields 100% to 120% Biological Efficiency (BE), producing 1kg to 1.2kg fresh mushrooms per 1kg dry straw, generating high profit margins per square foot with short 35-day crop cycles.
          </div>
        </section>
      </article>

      <div className="glass-panel p-8 rounded-3xl border border-spore-700/50 text-center space-y-4">
        <h3 className="font-display font-bold text-2xl text-white">Certified Agronomist Training Courses</h3>
        <p className="text-xs text-slate-300 max-w-lg mx-auto">
          Enroll in Sporekart's hands-on masterclasses covering lab spawn production, substrate pasteurization, and commercial farm setup.
        </p>
        <Link
          to="/training"
          className="inline-flex items-center gap-2 bg-spore-500 hover:bg-spore-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl text-xs shadow-lg transition-all"
        >
          <GraduationCap className="w-4 h-4" /> Browse Certified Training Batches
        </Link>
      </div>
    </div>
  );
}
