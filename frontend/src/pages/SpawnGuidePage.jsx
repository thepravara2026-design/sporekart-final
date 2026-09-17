import React from 'react';
import { Sprout, ShieldCheck, Microscope, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { Link } from 'react-router-dom';

export default function SpawnGuidePage() {
  const guideSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "Complete Guide to Mushroom Grain Spawn: Selection, Inoculation & Storage",
    "description": "Comprehensive guide on selecting pure strain wheat grain spawn, maintaining HEPA laminar flow sterile environment, storage temperatures, and spawn run techniques.",
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How long can mushroom grain spawn be stored before inoculation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pure wheat grain spawn can be stored in a clean refrigerator at 2°C - 4°C for up to 30 days without losing viability."
        }
      },
      {
        "@type": "Question",
        "name": "What is the recommended spawn-to-substrate ratio for Oyster Mushrooms?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The optimal spawning ratio is 2.5% to 3% spawn weight based on wet pasteurized straw weight (approx. 250g-300g spawn per 10kg wet straw bag)."
        }
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <SeoHead
        title="Mushroom Grain Spawn Guide — Selection, Inoculation & Storage | Sporekart"
        description="Learn how to select high-yield mother grain spawn, store pure cultures, avoid mold contamination, and optimize spawn run speed in wheat straw & sawdust substrates."
        canonicalUrl="https://sporekart.in/mushroom-spawn-guide"
        structuredData={[guideSchema, faqSchema]}
      />

      <Breadcrumbs items={[{ label: 'Mushroom Spawn Guide', path: '/mushroom-spawn-guide' }]} />

      <div className="space-y-4 max-w-4xl">
        <span className="px-3.5 py-1 rounded-full bg-spore-950 border border-spore-700/50 text-spore-300 text-xs font-semibold">
          Agronomist Handbook & Lab Guidelines
        </span>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight">
          Complete Mushroom Spawn Guide: <br />
          <span className="gradient-text">Lab Standards, Inoculation & Viability</span>
        </h1>
        <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
          Mushroom spawn is the living vegetative mycelium grown on sterilized cereal grains (wheat, bajra, or sorghum). High-quality spawn is the single most critical factor in achieving high Biological Efficiency (BE) and consistent farm yields.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-800/60 space-y-4">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white flex items-center gap-3">
              <Microscope className="w-6 h-6 text-spore-400" /> 1. Characteristics of High-Quality Grain Spawn
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              When receiving grain spawn bags, inspect the following physical parameters before opening:
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-spore-400 shrink-0 mt-0.5" />
                <span><strong>Dense White Mycelium:</strong> Bright silky or rhizomorphic white growth evenly binding all wheat grains together.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-spore-400 shrink-0 mt-0.5" />
                <span><strong>Fresh Mushroom Aroma:</strong> Clean, pleasant earthy smell. Any sour, alcoholic, or foul ammonia odor indicates bacterial wet spot (Bacillus spp.).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-spore-400 shrink-0 mt-0.5" />
                <span><strong>Zero Mold Discoloration:</strong> Complete absence of green (Trichoderma), black (Aspergillus), or yellow patches.</span>
              </li>
            </ul>
          </section>

          <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-800/60 space-y-4">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" /> 2. Storage & Handling Protocols
            </h2>
            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <p>
                Sporekart spawn is packed in high-density polypropylene bags fitted with 0.2-micron hydrophobic filter patches allowing gas exchange while blocking bacterial contaminants.
              </p>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-xs">Recommended Storage Temperature Ranges:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
                  <li><strong>Oyster & Button Spawn:</strong> Store at 2°C – 4°C (Viable for 30–45 days).</li>
                  <li><strong>Tropical Milky Spawn (Calocybe indica):</strong> Store at 18°C – 22°C (Do NOT refrigerate below 15°C).</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-800/60 space-y-4">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400" /> 3. Common Contamination Hazards & Prevention
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40 text-amber-200/90 space-y-1">
                <h4 className="font-bold text-amber-400">Green Mold (Trichoderma harzianum)</h4>
                <p>Caused by unsterilized handling, dirty hands, or straw pasteurization below 65°C. Always sanitize hands with 70% IPA alcohol before spawning.</p>
              </div>
              <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/40 text-red-200/90 space-y-1">
                <h4 className="font-bold text-red-400">Bacterial Wet Spot (Bacillus)</h4>
                <p>Caused by excess grain moisture during boiling or grain bag tears. Grains appear slimy with a foul fermented odor.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-spore-700/50 text-center space-y-4">
            <Sprout className="w-10 h-10 text-spore-400 mx-auto" />
            <h3 className="font-display font-bold text-xl text-white">Order Lab Spawn</h3>
            <p className="text-xs text-slate-400">
              Get 100% pure mother grain spawn cultured under cleanroom conditions with fast delivery across India.
            </p>
            <Link
              to="/products/mushroom-spawn"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
            >
              Browse Spawn Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
