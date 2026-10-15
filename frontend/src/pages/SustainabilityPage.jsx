import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Recycle, Droplets, Sun, ShieldCheck, Sprout, ArrowRight, 
  Leaf, Award, CheckCircle2, Globe, HeartHandshake, Zap, 
  Sparkles, RefreshCw, BarChart3, TreePine
} from 'lucide-react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

const SUSTAINABILITY_PILLARS = [
  {
    icon: Recycle,
    badge: 'Circular Bio-Economy',
    title: 'Agricultural Substrate Upcycling',
    subtitle: 'Transforming crop residues into nutrient-rich food and biofertilizer',
    description: 'Every year, millions of tons of agricultural stubble (paddy straw, wheat husks, and sugarcane bagasse) are burned, causing severe seasonal air pollution across India. Sporekart directly procures this clean crop biomass from local agrarian communities, converting what was once burned waste into pasteurized, sterile growing substrate for organic oyster, button, and milky mushrooms.',
    highlights: [
      'Zero burning: Diverts over 45 metric tons of agricultural straw annually',
      'Spent Mushroom Substrate (SMS) is aged into premium nitrogen-rich vermicompost',
      'Provides supplementary income to rural farmers during harvest seasons',
    ],
    stat: '100%',
    statLabel: 'Bio-Substrate Upcycled',
  },
  {
    icon: Droplets,
    badge: 'Water Stewardship',
    title: 'Closed-Loop Micro-Misting & Water Recovery',
    subtitle: 'Conserving every drop with 90%+ condensation and humidity recycling',
    description: 'Conventional outdoor horticulture consumes hundreds of liters of ground water per kilogram of produce. At Sporekart, our vertical indoor fruiting chambers utilize ultrasonic micro-droplet misting systems (5-10 micron droplets) coupled with automated chiller condensation collectors that filter, sterilize, and recirculate atmospheric humidity.',
    highlights: [
      'Consumes 95% less water than traditional field crop cultivation',
      'Condensation recapture loops harvest and reuse environmental moisture',
      'Precision sensor arrays maintain optimal 85-92% RH without excess runoff',
    ],
    stat: '90%+',
    statLabel: 'Water Recovery Rate',
  },
  {
    icon: Sun,
    badge: 'Clean Energy',
    title: 'Solar-Powered Cold-Chain & Incubation',
    subtitle: 'Harnessing rooftop solar photovoltaics for clean climate automation',
    description: 'Indoor climate management and post-harvest preservation require steady thermal regulation. Our Davangere facility integrates high-efficiency rooftop photovoltaic micro-grids that supply renewable energy directly to our HEPA cleanrooms, autoclave pasteurization systems, and temperature-controlled cold-chain preservation rooms.',
    highlights: [
      'Generates clean solar energy to offset refrigeration peak loads',
      'High-grade thermal insulation panels prevent cool air dissipation',
      'Continuous monitoring lowers greenhouse gas emissions by 3.8 tons CO2e/year',
    ],
    stat: '65%',
    statLabel: 'Solar Power Integration',
  },
  {
    icon: ShieldCheck,
    badge: 'Purity & Biocontrol',
    title: 'Zero Chemical Residues & HEPA Cleanrooms',
    subtitle: '100% pesticide-free biological cultivation with clean air technology',
    description: 'Mushrooms act as natural bio-accumulators, meaning synthetic pesticides or chemical fungicides sprayed onto them become concentrated in the harvest. We completely eliminate chemical inputs by utilizing positive-pressure Class 100/1000 HEPA H14 laminar airflow filtration in our inoculation and spawn production laboratories.',
    highlights: [
      'Zero synthetic chemical pesticides, weedicides, or chemical additives',
      '1st-generation pure mother cultures cultivated in certified sterile cleanrooms',
      'Natural physical biocontrol barriers and automated positive-air locks',
    ],
    stat: '0 ppm',
    statLabel: 'Synthetic Chemical Residues',
  },
];

const CIRCULAR_STEPS = [
  {
    step: '01',
    title: 'Stubble Procurement',
    desc: 'Clean paddy and wheat straw collected directly from local agrarian farmers, preventing seasonal stubble burning.',
  },
  {
    step: '02',
    title: 'Clean Pasteurization',
    desc: 'Thermal steam autoclaving pasteurizes the organic straw, neutralizing pathogens without harsh chemical disinfectants.',
  },
  {
    step: '03',
    title: 'Pure Spawn Inoculation',
    desc: 'High-viability 1st-generation mother mycelium is mixed into bags in sterile HEPA laminar airflow cleanrooms.',
  },
  {
    step: '04',
    title: 'Vertical Indoor Fruiting',
    desc: 'Micro-climate controlled humidity and oxygenation yield 4x more mushrooms per square foot than horizontal land farming.',
  },
  {
    step: '05',
    title: 'Spent Substrate Return',
    desc: 'Post-harvest substrate is vermicomposted into organic fertilizer, returning bio-nutrients directly back to farmland soil.',
  },
];

export default function SustainabilityPage() {
  return (
    <div className="w-full bg-surface-cream text-typography-primary min-h-screen">
      <SeoHead
        title="Sustainability & Eco-Agritech Practices — Sporekart"
        description="Discover Sporekart's zero-waste circular mushroom agriculture, agricultural substrate upcycling, 90%+ water recycling, clean solar energy, and chemical-free indoor cultivation."
        canonicalUrl="https://sporekart.in/sustainability"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10 sm:space-y-14">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={[{ label: 'Sustainability', path: '/sustainability' }]} />

        {/* HERO BANNER */}
        <section className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden border border-surface-border shadow-level-2 bg-[#0C2518] text-white">
          {/* Panoramic Solar Farm Background */}
          <div className="absolute inset-0">
            <img
              src="/sporekart-sustainability-farm.jpg"
              alt="Sporekart eco-friendly sustainable solar greenhouse farm"
              width="1440"
              height="810"
              className="w-full h-full object-cover opacity-30 transform scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0C2518] via-[#0C2518]/90 to-transparent sm:to-[#0C2518]/50" />
          </div>

          <div className="relative z-10 p-6 sm:p-12 lg:p-16 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wider uppercase font-sans">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>CIRCULAR AGRITECH &amp; ZERO-WASTE COMMITMENT</span>
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.12]">
              Farming That Gives Back to the Earth
            </h1>

            <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed font-sans">
              Mushrooms are nature&apos;s greatest recyclers. At Sporekart, we harness this natural biological superpower through smart precision agritech—converting agricultural straw into gourmet nutrition, recycling over 90% of our water, and restoring depleted soils.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                to="/products"
                className="bg-emerald-500 hover:bg-emerald-400 text-forest-950 font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full inline-flex items-center gap-2 shadow-level-1 hover-lift transition-all button-press"
              >
                <span>Shop Sustainable Produce</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/training"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full inline-flex items-center gap-2 transition-all button-press"
              >
                <span>Learn Eco-Cultivation</span>
              </Link>
            </div>
          </div>
        </section>

        {/* IMPACT METRICS STRIP */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" aria-label="Key Sustainability Metrics">
          <div className="bg-surface-white p-5 sm:p-6 rounded-2xl border border-surface-border shadow-level-1 space-y-2 text-center hover-lift transition-all">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
              <Recycle className="w-5 h-5" />
            </div>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-forest-900">100%</div>
            <div className="text-xs sm:text-sm font-bold text-typography-primary">Substrate Upcycled</div>
            <p className="text-[11px] sm:text-xs text-typography-muted">Zero post-harvest crop burning</p>
          </div>

          <div className="bg-surface-white p-5 sm:p-6 rounded-2xl border border-surface-border shadow-level-1 space-y-2 text-center hover-lift transition-all">
            <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-1">
              <Droplets className="w-5 h-5" />
            </div>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-forest-900">90%+</div>
            <div className="text-xs sm:text-sm font-bold text-typography-primary">Water Recovered</div>
            <p className="text-[11px] sm:text-xs text-typography-muted">Closed-loop condensation cycles</p>
          </div>

          <div className="bg-surface-white p-5 sm:p-6 rounded-2xl border border-surface-border shadow-level-1 space-y-2 text-center hover-lift transition-all">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mb-1">
              <Sun className="w-5 h-5" />
            </div>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-forest-900">65%</div>
            <div className="text-xs sm:text-sm font-bold text-typography-primary">Clean Solar Energy</div>
            <p className="text-[11px] sm:text-xs text-typography-muted">Photovoltaic powered cooling</p>
          </div>

          <div className="bg-surface-white p-5 sm:p-6 rounded-2xl border border-surface-border shadow-level-1 space-y-2 text-center hover-lift transition-all">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-forest-900">0 ppm</div>
            <div className="text-xs sm:text-sm font-bold text-typography-primary">Chemical Residues</div>
            <p className="text-[11px] sm:text-xs text-typography-muted">Class 100 HEPA air filtration</p>
          </div>
        </section>

        {/* 4 CORE SUSTAINABILITY PILLARS IN DETAIL */}
        <section className="space-y-8" aria-label="Our Sustainability Pillars">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold tracking-widest uppercase text-forest-700">OUR COMPREHENSIVE APPROACH</span>
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-forest-900">
              The Four Pillars of Eco-Agritech
            </h2>
            <p className="text-xs sm:text-sm text-typography-secondary">
              A detailed breakdown of how our operations in Davangere, Karnataka lead the agritech sector in environmental stewardship.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {SUSTAINABILITY_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="bg-surface-white p-6 sm:p-8 rounded-[24px] border border-surface-border shadow-level-1 space-y-5 hover-lift transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-forest-900 text-emerald-300 flex items-center justify-center shadow-sm">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-surface-neutral border border-surface-border text-forest-900 text-[11px] font-bold">
                        {pillar.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-forest-900">
                        {pillar.title}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                        {pillar.subtitle}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-typography-secondary leading-relaxed">
                      {pillar.description}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-surface-border/60">
                      {pillar.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-typography-primary">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-surface-border flex items-center justify-between bg-surface-cream/50 -mx-6 -mb-6 p-4 sm:px-6 rounded-b-[24px]">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-typography-muted block">Verified Metric</span>
                      <span className="text-xs font-semibold text-typography-primary">{pillar.statLabel}</span>
                    </div>
                    <div className="font-display font-extrabold text-2xl text-forest-900">
                      {pillar.stat}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CIRCULAR BIO-ECONOMY WORKFLOW */}
        <section className="bg-surface-white rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 lg:p-12 border border-surface-border shadow-level-1 space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold tracking-widest uppercase text-forest-700">CLOSED-LOOP LIFECYCLE</span>
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-forest-900">
              How the Circular Mushroom Cycle Works
            </h2>
            <p className="text-xs sm:text-sm text-typography-secondary leading-relaxed">
              Unlike traditional extractive agriculture, mushroom farming is a closed regenerative loop where every byproduct becomes the valuable foundation for the next stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {CIRCULAR_STEPS.map((step, idx) => (
              <div 
                key={step.step}
                className="p-5 rounded-2xl bg-surface-cream border border-surface-border space-y-3 relative group hover:border-forest-700/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold text-2xl text-forest-800/40 group-hover:text-forest-800 transition-colors">
                    {step.step}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <h3 className="font-bold text-sm text-forest-900">
                  {step.title}
                </h3>
                <p className="text-xs text-typography-secondary leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SOCIAL & COMMUNITY SUSTAINABILITY */}
        <section className="bg-gradient-to-br from-forest-900 via-forest-800 to-forest-950 text-white rounded-[28px] sm:rounded-[36px] p-6 sm:p-12 border border-forest-700 shadow-level-2 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold">
              <HeartHandshake className="w-3.5 h-3.5" /> SOCIAL SUSTAINABILITY
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-4xl leading-tight">
              Empowering Smallholder Farmers &amp; Agritech Entrepreneurs
            </h2>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
              True sustainability encompasses people as well as the planet. Our masterclass training program incubates over 5,000 farmers and youth across rural Karnataka and India, giving them the technical skills to generate sustainable year-round agricultural income from minimal space.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-white/90 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Provides viable farm entrepreneurship opportunities on land as small as 500 sq ft</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Guaranteed market buyback linkages for trained growers to ensure stable livelihood</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Specialized subsidies and support for women farmers and rural youth cooperatives</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                to="/training"
                className="bg-white hover:bg-surface-cream text-forest-900 font-bold text-xs sm:text-sm px-6 py-3 rounded-full inline-flex items-center gap-2 shadow-level-1 transition-all button-press"
              >
                <span>Explore Farmer Training Programs</span>
                <ArrowRight className="w-4 h-4 text-forest-900" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="rounded-2xl overflow-hidden border border-white/20 shadow-level-2">
              <img
                src="/sporekart-training-workshop.jpg"
                alt="Sporekart agricultural training and farmer empowerment workshop"
                width="600"
                height="400"
                loading="lazy"
                className="w-full h-64 sm:h-72 object-cover"
              />
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="text-center py-6 sm:py-8 space-y-4 bg-surface-white rounded-[24px] border border-surface-border p-8 shadow-level-1">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-forest-900">
            Join India&apos;s Sustainable Agritech Movement
          </h2>
          <p className="text-xs sm:text-sm text-typography-secondary max-w-xl mx-auto">
            Whether you want fresh organic produce on your table, pure mother spawn for your commercial farm, or practical grower certification, Sporekart is your trusted partner.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/products"
              className="bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full inline-flex items-center gap-2 shadow-level-1 button-press transition-colors"
            >
              <span>Explore Organic Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="bg-surface-neutral hover:bg-surface-border text-typography-primary font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full inline-flex items-center gap-2 transition-colors button-press"
            >
              <span>Contact Sustainability Team</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
