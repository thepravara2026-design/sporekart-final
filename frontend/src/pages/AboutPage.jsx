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
        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-forest-900/10 border border-forest-900/20 text-forest-800 text-xs font-semibold">
          India's Mushroom Agritech Ecosystem
        </span>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-typography-primary">
          Pioneering Organic Mushroom Supply & <br />
          <span className="text-forest-700">Grower Incubation in India</span>
        </h1>
        <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
          Founded with a vision to revolutionize tropical mushroom agriculture, Sporekart bridges the gap between laboratory mycology and commercial mushroom farming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-white p-6 rounded-card border border-surface-border shadow-level-1 space-y-3 hover-lift">
          <ShieldCheck className="w-8 h-8 text-forest-700" />
          <h3 className="font-bold text-typography-primary text-lg">Lab-Certified Pure Spawn</h3>
          <p className="text-xs text-typography-secondary leading-relaxed">First-generation wheat grain mother spawn cultured under HEPA laminar airflow conditions for maximum yield.</p>
        </div>
        <div className="bg-surface-white p-6 rounded-card border border-surface-border shadow-level-1 space-y-3 hover-lift">
          <Building2 className="w-8 h-8 text-gold" />
          <h3 className="font-bold text-typography-primary text-lg">Turnkey Farm Engineering</h3>
          <p className="text-xs text-typography-secondary leading-relaxed">Designing climate-controlled indoor button, oyster, and tropical milky mushroom fruiting facilities across India.</p>
        </div>
        <div className="bg-surface-white p-6 rounded-card border border-surface-border shadow-level-1 space-y-3 hover-lift">
          <Award className="w-8 h-8 text-green-600" />
          <h3 className="font-bold text-typography-primary text-lg">Market Buyback Linkages</h3>
          <p className="text-xs text-typography-secondary leading-relaxed">Connecting trained growers with hotel chains, supermarket suppliers, and dehydration units.</p>
        </div>
      </div>
    </div>
  );
}
