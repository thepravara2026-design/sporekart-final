import React from 'react';
import { Sprout, ShieldCheck, Microscope, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AeoFaqGraph from '../components/AeoFaqGraph';
import { Link } from 'react-router-dom';

export default function SpawnGuidePage() {
  const guideSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "Complete Guide to Mushroom Grain Spawn: Selection, Inoculation & Storage",
    "description": "Comprehensive AEO-optimized technical guide on mushroom spawn definitions, spawning ratios, shelf life, storage temperatures, and strain viability.",
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

  const aeoGraphData = [
    {
      id: 'what-is-spawn',
      question: 'What is mushroom spawn?',
      answer: 'Mushroom spawn is a carrier substrate (such as sterilized cereal grain or hardwood sawdust) fully colonized by pure mushroom mycelium, used to inoculate bulk cultivation substrates.',
      relatedQuestions: [
        { question: 'How is mushroom spawn used?', anchor: '#spawn-use' },
        { question: 'How long does spawn last?', anchor: '#spawn-storage' }
      ],
      relatedArticles: [
        { title: 'Wheat Straw Sterilization Methods for Spawn Run', path: '/blog/wheat-straw-sterilization-methods-for-oyster-spawn-run' },
        { title: 'Complete Mushroom Cultivation Guide', path: '/mushroom-cultivation-guide' }
      ],
      relatedProducts: [
        { title: 'Mushroom Spawn Seeds Catalog', path: '/products/spawn-seeds', price: 'Catalog' },
        { title: 'Spawn Production Lab Setup Masterclass', path: '/training/spawn-production-lab-setup-training', price: '₹4,999' }
      ]
    },
    {
      id: 'how-is-spawn-used',
      question: 'How is mushroom spawn used in farming?',
      answer: 'Mushroom spawn is mixed into pasteurized or autoclaved substrate (such as wheat straw, sugarcane bagasse, or hardwood sawdust) at a 2.5% to 3% ratio under clean conditions to initiate mycelial colonization.',
      relatedQuestions: [
        { question: 'What is the optimal incubation temperature?', anchor: '#temp' },
        { question: 'How to prevent mold during spawn run?', anchor: '#mold' }
      ],
      relatedArticles: [
        { title: 'Commercial Oyster Mushroom Farming Setup', path: '/blog/commercial-oyster-mushroom-farming-setup-cost-profitability' },
        { title: 'Button Mushroom Casing Soil Formulation', path: '/blog/button-mushroom-casing-soil-formulation-and-peat-moss-alternatives' }
      ],
      relatedProducts: [
        { title: 'Indoor Growing Kits Catalog', path: '/products/growing-kits', price: 'Catalog' },
        { title: 'Commercial Mushroom Cultivation Masterclass', path: '/training/commercial-mushroom-cultivation-masterclass', price: '₹2,999' }
      ]
    },
    {
      id: 'how-long-does-spawn-last',
      question: 'How long does grain spawn remain viable?',
      answer: 'Pure wheat grain spawn lasts 30 to 45 days when stored under refrigerated conditions (2°C to 4°C). Tropical varieties like Milky Mushroom spawn last 20 to 30 days at room temperature (18°C to 22°C).',
      relatedQuestions: [
        { question: 'How should spawn be stored?', anchor: '#storage' }
      ],
      relatedArticles: [
        { title: 'Mushroom Spawn Guide Knowledge Center', path: '/mushroom-spawn-guide' }
      ],
      relatedProducts: [
        { title: 'Lab Certified Oyster Spawn', path: '/products/mushroom-spawn', price: 'Catalog' }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-typography-primary">
      <SeoHead
        title="What is Mushroom Spawn? Complete AEO Answer Engine Guide | Sporekart"
        description="Direct AEO answers for mushroom spawn: definitions, spawning ratios, shelf life, storage temperatures, products, and training interlinking."
        canonicalUrl="https://sporekart.in/mushroom-spawn-guide"
        structuredData={guideSchema}
      />

      <Breadcrumbs items={[{ label: 'Mushroom Spawn Guide', path: '/mushroom-spawn-guide' }]} />

      {/* Main Header */}
      <div className="space-y-4 max-w-4xl">
        <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-forest-900/10 border border-forest-900/20 text-forest-800 text-xs font-semibold">
          Agronomist Technical Standard & AEO Content Graph
        </span>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-typography-primary leading-tight">
          Mushroom Spawn Technical Guide & AEO Graph: <br />
          <span className="text-forest-700">Lab Standards, Products & Training</span>
        </h1>
      </div>

      {/* Reusable AEO Content Graph Component */}
      <AeoFaqGraph faqs={aeoGraphData} title="Mushroom Spawn AEO Knowledge Graph" />

      {/* Interlinked Path Summary */}
      <section className="bg-surface-white p-6 sm:p-8 rounded-card border border-surface-border shadow-level-1 space-y-4 text-xs sm:text-sm text-typography-secondary">
        <h2 className="font-display font-bold text-xl text-typography-primary">Complete Interlinked Content Path</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-forest-800">
          <span className="bg-surface-cream px-3 py-1.5 rounded-lg border border-surface-border text-typography-primary">1. Spawn Definition Question</span>
          <span>➔</span>
          <Link to="/products/mushroom-spawn" className="bg-surface-white px-3 py-1.5 rounded-lg border border-surface-border hover:text-forest-700">2. Lab Spawn Products</Link>
          <span>➔</span>
          <Link to="/mushroom-spawn-guide" className="bg-surface-white px-3 py-1.5 rounded-lg border border-surface-border hover:text-forest-700">3. Spawn Cultivation Guide</Link>
          <span>➔</span>
          <Link to="/training/spawn-production" className="bg-surface-white px-3 py-1.5 rounded-lg border border-surface-border hover:text-forest-700">4. Certified Spawn Training</Link>
        </div>
      </section>
    </div>
  );
}
