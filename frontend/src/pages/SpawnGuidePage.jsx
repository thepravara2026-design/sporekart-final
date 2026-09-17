import React from 'react';
import { Sprout, ShieldCheck, Microscope, AlertTriangle, CheckCircle, ArrowRight, HelpCircle } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { Link } from 'react-router-dom';

export default function SpawnGuidePage() {
  const guideSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "Complete Guide to Mushroom Grain Spawn: Selection, Inoculation & Storage",
    "description": "Comprehensive GEO-optimized technical guide on mushroom spawn definitions, spawning ratios, shelf life, storage temperatures, and strain viability.",
    "author": {
      "@type": "Organization",
      "name": "Sporekart Agritech Center"
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
        "name": "What is mushroom spawn?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Mushroom spawn is a carrier substrate (such as sterilized cereal grain or sawdust) fully colonized by pure mushroom mycelium, used to inoculate bulk cultivation substrates."
        }
      },
      {
        "@type": "Question",
        "name": "How is mushroom spawn used?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Mushroom spawn is mixed into pasteurized or autoclaved substrate (such as wheat straw, sugarcane bagasse, or hardwood sawdust) at a 2.5% to 3% ratio under clean conditions to initiate mycelial colonization."
        }
      },
      {
        "@type": "Question",
        "name": "How long does spawn last?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pure wheat grain spawn lasts 30 to 45 days when stored under refrigerated conditions (2°C to 4°C). Tropical varieties like Milky Mushroom spawn last 20 to 30 days at room temperature (18°C to 22°C)."
        }
      },
      {
        "@type": "Question",
        "name": "How should spawn be stored?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Spawn should be stored in polypropylene bags with 0.2-micron filter patches in a clean, dark room or refrigerator at 2°C–4°C for temperate strains, and 18°C–22°C for tropical strains."
        }
      },
      {
        "@type": "Question",
        "name": "Which mushroom varieties use spawn?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Commercial mushroom species including Oyster (Pleurotus ostreatus), Button (Agaricus bisporus), Milky (Calocybe indica), Paddy Straw (Volvariella volvacea), and Shiitake (Lentinula edodes) utilize grain or sawdust spawn for propagation."
        }
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <SeoHead
        title="What is Mushroom Spawn? Complete Agronomist & Technical Guide | Sporekart"
        description="Direct answer guide to mushroom spawn: definition, preparation, spawning ratios, shelf life, storage temperatures, and species compatibility for Indian growers."
        canonicalUrl="https://sporekart.in/mushroom-spawn-guide"
        structuredData={[guideSchema, geoFaqSchema]}
      />

      <Breadcrumbs items={[{ label: 'Mushroom Spawn Guide', path: '/mushroom-spawn-guide' }]} />

      {/* Main Header */}
      <div className="space-y-4 max-w-4xl">
        <span className="px-3.5 py-1 rounded-full bg-spore-950 border border-spore-700/50 text-spore-300 text-xs font-semibold">
          Agronomist Technical Standard & GEO Knowledge Base
        </span>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight">
          Mushroom Spawn Technical Guide: <br />
          <span className="gradient-text">Definitions, Inoculation & Viability</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Question 1 & Direct Answer (GEO Architecture) */}
          <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-800/60 space-y-4">
            <h2 className="font-display font-bold text-2xl text-white flex items-center gap-3">
              <Microscope className="w-6 h-6 text-spore-400" /> What is mushroom spawn?
            </h2>
            <div className="p-4 rounded-2xl bg-spore-950/80 border border-spore-600/50 text-spore-200 text-sm font-medium leading-relaxed">
              <strong>Direct Answer:</strong> Mushroom spawn is a carrier substrate (such as sterilized cereal grain or hardwood sawdust) fully colonized by pure, vigorous mushroom mycelium, used to inoculate bulk cultivation substrates.
            </div>
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
              <p>
                In commercial mushroom farming, spawn functions as the vegetative "seed". Mycelium is grown in sterile laboratory cleanrooms on cereal grains like wheat (Triticum aestivum), bajra (pearl millet), or sorghum. The grain matrix provides initial starch carbohydrates and nutrients, allowing the fungal threadwork to rapidly spread once mixed into bulk substrate.
              </p>
            </div>
          </section>

          {/* Question 2 & Direct Answer */}
          <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-800/60 space-y-4">
            <h2 className="font-display font-bold text-2xl text-white flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" /> How is mushroom spawn used?
            </h2>
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-sm font-medium leading-relaxed">
              <strong>Direct Answer:</strong> Mushroom spawn is mixed into pasteurized or autoclaved substrate (such as wheat straw, sugarcane bagasse, or hardwood sawdust) at a 2.5% to 3% ratio under clean conditions to initiate mycelial colonization.
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p><strong>Step-by-step Spawning Protocol:</strong></p>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-spore-400 shrink-0 mt-0.5" />
                  <span><strong>Substrate Preparation:</strong> Ensure pasteurized wheat straw has cooled to below 28°C and retains 65% moisture content (squeeze test: drops of water without stream).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-spore-400 shrink-0 mt-0.5" />
                  <span><strong>Thorough Mixing:</strong> Break up grain spawn clumps gently and distribute evenly through the straw layers to maximize inoculation points.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-spore-400 shrink-0 mt-0.5" />
                  <span><strong>Incubation (Spawn Run):</strong> Incubate bags at 24°C–26°C in darkness with 85% relative humidity for 12–15 days until fully colonized.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Question 3 & Direct Answer */}
          <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-800/60 space-y-4">
            <h2 className="font-display font-bold text-2xl text-white flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-amber-400" /> How long does spawn last?
            </h2>
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/50 text-amber-200 text-sm font-medium leading-relaxed">
              <strong>Direct Answer:</strong> Pure wheat grain spawn lasts 30 to 45 days when stored under refrigerated conditions (2°C to 4°C). Tropical varieties like Milky Mushroom spawn last 20 to 30 days at room temperature (18°C to 22°C).
            </div>
          </section>

          {/* Question 4 & Direct Answer */}
          <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-800/60 space-y-4">
            <h2 className="font-display font-bold text-2xl text-white flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-spore-400" /> How should spawn be stored?
            </h2>
            <div className="p-4 rounded-2xl bg-slate-900 border border-spore-700/50 text-slate-200 text-sm font-medium leading-relaxed">
              <strong>Direct Answer:</strong> Spawn should be stored in polypropylene bags fitted with 0.2-micron hydrophobic filter patches in a clean, dark room or refrigerator at 2°C–4°C for temperate strains, and 18°C–22°C for tropical strains. Never freeze grain spawn.
            </div>
          </section>

          {/* Question 5 & Direct Answer */}
          <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-800/60 space-y-4">
            <h2 className="font-display font-bold text-2xl text-white flex items-center gap-3">
              <Sprout className="w-6 h-6 text-spore-400" /> Which mushroom varieties use spawn?
            </h2>
            <div className="p-4 rounded-2xl bg-spore-950/80 border border-spore-600/50 text-spore-200 text-sm font-medium leading-relaxed">
              <strong>Direct Answer:</strong> Commercial mushroom species including Oyster (Pleurotus ostreatus), Button (Agaricus bisporus), Milky (Calocybe indica), Paddy Straw (Volvariella volvacea), and Shiitake (Lentinula edodes) utilize grain or sawdust spawn for propagation.
            </div>
          </section>
        </div>

        {/* Sidebar Callout */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-spore-700/50 text-center space-y-4 sticky top-28">
            <Sprout className="w-10 h-10 text-spore-400 mx-auto" />
            <h3 className="font-display font-bold text-xl text-white">Order Lab Certified Spawn</h3>
            <p className="text-xs text-slate-400">
              Buy 100% pure mother grain spawn prepared under ISO cleanroom conditions with express cold-chain delivery.
            </p>
            <Link
              to="/products/mushroom-spawn"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-spore-500 hover:bg-spore-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-spore-950/40"
            >
              Explore Spawn Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
