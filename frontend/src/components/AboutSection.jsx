import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Building2, Award, ArrowRight } from 'lucide-react';
import { WhatsAppIcon, InstagramIcon } from './ContactSection';

export default function AboutSection({ showLearnMore = false, isCompact = false }) {
  return (
    <div className="bg-surface-white rounded-hero p-6 sm:p-12 border border-surface-border shadow-level-1 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-forest-900/10 border border-forest-900/20 text-forest-800 text-xs font-bold">
            <Building2 className="w-4 h-4 text-forest-700" /> Shriyap Enterprise • Davangere, KA
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-typography-primary leading-tight">
            Pioneering Organic Mushroom Supply & <br />
            <span className="text-forest-700">Grower Incubation in India</span>
          </h2>
          <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
            Managed by <strong>Shriyap Enterprise</strong>, Sporekart bridges the gap between laboratory mycology and commercial mushroom farming. We equip agricultural entrepreneurs and home growers with lab-certified mother spawn, climate-controlled farm blueprints, and direct market buyback linkages across India.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-card bg-surface-cream border border-surface-border space-y-1">
              <div className="text-2xl font-extrabold text-forest-800 font-display">5,000+</div>
              <div className="text-xs text-typography-secondary font-medium">Trained Agri-Growers</div>
            </div>
            <div className="p-4 rounded-card bg-surface-cream border border-surface-border space-y-1">
              <div className="text-2xl font-extrabold text-forest-800 font-display">99.2%</div>
              <div className="text-xs text-typography-secondary font-medium">Spawn Purity Rate</div>
            </div>
          </div>

          {showLearnMore && (
            <div className="pt-2">
              <Link
                to="/about"
                className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-xs font-bold"
              >
                <span>Learn More About Sporekart</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-card bg-surface-cream border border-surface-border space-y-3 hover-lift">
            <ShieldCheck className="w-7 h-7 text-forest-700" />
            <h3 className="font-bold text-typography-primary text-sm">Lab-Certified Pure Spawn</h3>
            <p className="text-xs text-typography-secondary leading-relaxed">First-generation wheat grain mother spawn cultured under HEPA laminar airflow.</p>
          </div>

          <div className="p-5 rounded-card bg-surface-cream border border-surface-border space-y-3 hover-lift">
            <Building2 className="w-7 h-7 text-gold" />
            <h3 className="font-bold text-typography-primary text-sm">Turnkey Farm Setup</h3>
            <p className="text-xs text-typography-secondary leading-relaxed">Designing climate-controlled indoor button, oyster, and tropical milky mushroom fruiting rooms.</p>
          </div>

          <div className="p-5 rounded-card bg-surface-cream border border-surface-border space-y-3 hover-lift">
            <Award className="w-7 h-7 text-green-600" />
            <h3 className="font-bold text-typography-primary text-sm">Market Buyback Linkage</h3>
            <p className="text-xs text-typography-secondary leading-relaxed">Connecting trained growers with hotel chains, supermarket suppliers, and dehydration units.</p>
          </div>
        </div>
      </div>

      {!isCompact && (
        <div className="p-6 sm:p-8 rounded-2xl bg-surface-cream border border-surface-border space-y-4 max-w-4xl mx-auto shadow-level-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-forest-900">Shriyap Enterprise Headquarters</h3>
                <p className="text-xs text-typography-secondary">Basapura village, Behind Taralabalu school, Davangere-577001, Karnataka</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                href="https://wa.me/917204709870"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all button-press flex-1 sm:flex-none"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>WhatsApp</span>
              </a>
              <a
                href="https://www.instagram.com/sporekart"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all button-press hover:opacity-95 flex-1 sm:flex-none"
              >
                <InstagramIcon className="w-4 h-4 text-white" />
                <span>Instagram</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
