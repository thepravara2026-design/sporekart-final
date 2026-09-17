import React from 'react';
import { Sprout, ShieldCheck, Award, Building2, Users } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <SeoHead
        title="About Sporekart — Pioneer Mushroom Agritech & Grower Ecosystem in India"
        description="Learn about Sporekart Agritech India. We provide lab-certified mushroom spawn seeds, fresh gourmet mushrooms, climate-controlled farm setup consultancy, and commercial training."
        canonicalUrl="https://sporekart.in/about"
      />

      <Breadcrumbs items={[{ label: 'About Us', path: '/about' }]} />

      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3.5 py-1.5 rounded-full bg-spore-950 border border-spore-700/50 text-spore-300 text-xs font-semibold">
          India's Mushroom Agritech Ecosystem
        </span>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white">
          Pioneering Organic Mushroom Supply & <br />
          <span className="gradient-text">Grower Incubation in India</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Founded with a vision to revolutionize tropical mushroom agriculture, Sporekart bridges the gap between laboratory mycology and commercial mushroom farming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
          <ShieldCheck className="w-8 h-8 text-spore-400" />
          <h3 className="font-bold text-white text-lg">Lab-Certified Pure Spawn</h3>
          <p className="text-xs text-slate-400">First-generation wheat grain mother spawn cultured under HEPA laminar airflow conditions for maximum yield.</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
          <Building2 className="w-8 h-8 text-amber-400" />
          <h3 className="font-bold text-white text-lg">Turnkey Farm Engineering</h3>
          <p className="text-xs text-slate-400">Designing climate-controlled indoor button, oyster, and tropical milky mushroom fruiting facilities across India.</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
          <Award className="w-8 h-8 text-emerald-400" />
          <h3 className="font-bold text-white text-lg">Market Buyback Linkages</h3>
          <p className="text-xs text-slate-400">Connecting trained growers with hotel chains, supermarket suppliers, and dehydration units.</p>
        </div>
      </div>
    </div>
  );
}
