import React from 'react';
import { Sprout, ShieldCheck, Award, Building2, Users, MapPin, Phone } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.143 4.174 4.174-1.143zm11.758-5.321c-.244-.122-1.446-.713-1.67-.795-.224-.082-.387-.122-.55.122-.163.244-.632.795-.774.958-.143.163-.285.183-.529.061-.244-.122-1.033-.381-1.968-1.215-.727-.648-1.218-1.449-1.36-1.693-.143-.244-.015-.376.107-.497.11-.11.244-.285.366-.427.122-.143.163-.244.244-.407.082-.163.041-.305-.02-.427-.061-.122-.55-1.323-.753-1.812-.197-.477-.398-.413-.55-.421-.143-.008-.305-.008-.467-.008-.163 0-.427.061-.65.305-.224.244-.855.835-.855 2.036 0 1.201.875 2.361.997 2.524.122.163 1.723 2.632 4.174 3.69 1.748.755 2.432.83 3.3.702.535-.079 1.646-.672 1.878-1.322.232-.65.232-1.206.163-1.322-.069-.116-.231-.177-.475-.299z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <SeoHead
        title="About Sporekart — Shriyap Enterprise, Davangere"
        description="Learn about Sporekart managed by Shriyap Enterprise (Basapura village, Behind Taralabalu school, Davangere-577001). We provide lab-certified mushroom spawn seeds, fresh gourmet mushrooms, and commercial training."
        canonicalUrl="https://sporekart.in/about"
      />

      <Breadcrumbs items={[{ label: 'About Us', path: '/about' }]} />

      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-forest-900/10 border border-forest-900/20 text-forest-800 text-xs font-semibold">
          <Building2 className="w-4 h-4 text-forest-700" /> Shriyap Enterprise • Davangere, Karnataka
        </span>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-typography-primary">
          Pioneering Organic Mushroom Supply & <br />
          <span className="text-forest-700">Grower Incubation in India</span>
        </h1>
        <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
          Managed by <strong>Shriyap Enterprise</strong>, Sporekart bridges the gap between laboratory mycology, high-yield grain spawn production, and commercial mushroom farming.
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

      {/* Enterprise Contact Card */}
      <div className="p-8 rounded-2xl bg-surface-cream border border-surface-border space-y-4 max-w-3xl mx-auto shadow-level-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-forest-900">Shriyap Enterprise Headquarters</h3>
            <p className="text-xs text-typography-secondary">Basapura village, Behind Taralabalu school, Davangere-577001, Karnataka</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-surface-border">
          <a
            href="https://wa.me/917204709870"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all button-press"
          >
            <WhatsAppIcon className="w-4 h-4 text-white" />
            <span>WhatsApp: +91 7204709870</span>
          </a>

          <a
            href="https://www.instagram.com/sporekart"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all button-press hover:opacity-95"
          >
            <InstagramIcon className="w-4 h-4 text-white" />
            <span>Instagram: www.instagram.com/sporekart</span>
          </a>
        </div>
      </div>
    </div>
  );
}
