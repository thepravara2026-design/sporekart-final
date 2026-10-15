import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, GraduationCap, ArrowRight, Award, Zap, CheckCircle2, Sparkles, 
  Layers, ShieldCheck, HeartHandshake, Phone, Mail, MapPin, Send, MessageSquare, 
  Wrench, ChevronRight, HelpCircle, Star, TrendingUp, Calculator, Calendar, 
  Truck, Check, ArrowUpRight, DollarSign, Users, Clock, FileText, Download,
  ExternalLink, Play, ShoppingCart
} from 'lucide-react';
import SeoHead from '../components/SeoHead';
import { catalogApi, trainingApi } from '../api';
import { useCart } from '../context/CartContext';

// Strain ROI Parameters for Interactive Calculator
const STRAIN_ROI_DATA = {
  oyster: {
    name: 'Oyster Mushroom (Pleurotus ostreatus)',
    shortName: 'Oyster',
    cycleDays: 28,
    avgYieldPerBagKg: 1.2,
    buybackPricePerKg: 190,
    costPerBag: 45,
    tempRange: '20°C – 28°C',
    humidity: '85% – 90%',
    difficulty: 'Beginner-Friendly',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  button: {
    name: 'White Button Mushroom (Agaricus bisporus)',
    shortName: 'Button',
    cycleDays: 45,
    avgYieldPerBagKg: 1.6,
    buybackPricePerKg: 220,
    costPerBag: 60,
    tempRange: '14°C – 18°C',
    humidity: '85% – 95%',
    difficulty: 'Moderate (AC Setup)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  milky: {
    name: 'Milky Mushroom (Calocybe indica)',
    shortName: 'Milky',
    cycleDays: 35,
    avgYieldPerBagKg: 1.4,
    buybackPricePerKg: 240,
    costPerBag: 50,
    tempRange: '28°C – 36°C',
    humidity: '80% – 85%',
    difficulty: 'Ideal for Summer & South India',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  shiitake: {
    name: 'Gourmet Shiitake (Lentinula edodes)',
    shortName: 'Shiitake',
    cycleDays: 60,
    avgYieldPerBagKg: 0.9,
    buybackPricePerKg: 650,
    costPerBag: 110,
    tempRange: '18°C – 22°C',
    humidity: '80% – 90%',
    difficulty: 'High-Value Gourmet',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
  }
};

const CURATED_SHOWCASE_PRODUCTS = [
  {
    id: 'prod-oyster-spawn',
    slug: 'pearl-oyster-mushroom-spawn',
    name: 'Pearl Oyster 1st Gen Master Grain Spawn',
    category: 'spawn-seeds',
    price: 180,
    mrp: 240,
    rating: 4.9,
    reviews: 142,
    badge: 'Best Seller',
    stockStatus: 'IN_STOCK',
    image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80',
    specs: { purity: '99.9%', substrate: 'Sterile Wheat Grains', colonization: '12-14 Days' }
  },
  {
    id: 'prod-button-spawn',
    slug: 'button-mushroom-spawn',
    name: 'Commercial White Button Master Grain Spawn',
    category: 'spawn-seeds',
    price: 220,
    mrp: 280,
    rating: 4.8,
    reviews: 98,
    badge: 'High Yield',
    stockStatus: 'IN_STOCK',
    image: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80',
    specs: { purity: '99.8%', substrate: 'Sterile Wheat Grains', colonization: '15-18 Days' }
  },
  {
    id: 'prod-diy-oyster-kit',
    slug: 'diy-oyster-mushroom-growing-kit',
    name: 'DIY Organic Oyster Mushroom Indoor Fruiting Kit',
    category: 'growing-kits',
    price: 499,
    mrp: 699,
    rating: 4.9,
    reviews: 215,
    badge: 'Ready-to-Fruit',
    stockStatus: 'IN_STOCK',
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    specs: { harvestTime: '10-14 Days', flushes: '3-4 Harvests', yieldEst: '1.2 - 1.5 Kg' }
  },
  {
    id: 'prod-autoclave-pp-bags',
    slug: 'mushroom-autoclave-pp-bags-100pcs',
    name: 'High-Temperature Autoclave PP Bags with Filter Patch (100 Pcs)',
    category: 'equipment-supplies',
    price: 750,
    mrp: 950,
    rating: 4.7,
    reviews: 64,
    badge: 'Commercial Pack',
    stockStatus: 'IN_STOCK',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    specs: { filter: '0.2 Micron Patch', tempLimit: '125°C', material: 'Virgin Polypropylene' }
  },
  {
    id: 'prod-fresh-oyster',
    slug: 'farm-fresh-grey-oyster-mushrooms',
    name: 'Farm Fresh Organic Grey Oyster Mushrooms (500g)',
    category: 'fresh-mushrooms',
    price: 150,
    mrp: 190,
    rating: 5.0,
    reviews: 86,
    badge: 'Daily Harvest',
    stockStatus: 'IN_STOCK',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    specs: { harvesting: 'Today 5:00 AM', chemicals: '100% Zero Pesticides', shelfLife: '5-7 Days Chilled' }
  },
  {
    id: 'prod-milky-spawn',
    slug: 'milky-mushroom-grain-spawn',
    name: 'Tropical Milky Mushroom (Calocybe) Grain Spawn',
    category: 'spawn-seeds',
    price: 210,
    mrp: 270,
    rating: 4.8,
    reviews: 52,
    badge: 'Summer Hardy',
    stockStatus: 'IN_STOCK',
    image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80',
    specs: { purity: '99.9%', tempTolerance: 'Up to 38°C', colonization: '14-16 Days' }
  }
];

const SUCCESS_STORIES = [
  {
    name: 'Rajesh Patil',
    role: 'Commercial Grower',
    location: 'Satara, Maharashtra',
    scale: '500 Bags / 300 sq.ft Shed',
    monthlyProfit: '₹48,500 / Month',
    quote: 'Sporekart’s 1st-generation oyster spawn has zero contamination. Their buyback team picks up my dried mushroom batches on the 1st of every month without delayed payments.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    verifiedBadge: 'Sporekart Certified Partner'
  },
  {
    name: 'Sunita Sharma',
    role: 'Terrace Agri-Entrepreneur',
    location: 'Belagavi, Karnataka',
    scale: '150 Bags on Covered Terrace',
    monthlyProfit: '₹22,000 / Month',
    quote: 'I attended the 2-day Pune masterclass. As a homemaker with no previous farming knowledge, the step-by-step humidity controller setup made cultivation seamless.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    verifiedBadge: 'Trainee Cohort #18'
  },
  {
    name: 'Vikram & Rohan Joshi',
    role: 'Commercial Button Mushroom Unit',
    location: 'Pune AgriTech Hub',
    scale: '2,000 Bags Climate-Controlled Room',
    monthlyProfit: '₹1,85,000 / Month',
    quote: 'The direct buyback contract gave our bank the confidence to sanction our agricultural subsidy. Sporekart is the only end-to-end mycology partner in western India.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    verifiedBadge: 'Commercial Incubator'
  }
];

const FAQ_ITEMS = [
  {
    q: 'How does Sporekart guarantee 100% buyback for commercial growers?',
    a: 'Every grower who successfully completes our verified training curriculum receives an official Commercial Buyback Agreement. We procure both farm-fresh mushrooms (for regional hotel/supermarket linkages) and sun-dried/dehydrated mushrooms (for pharmaceutical and culinary extracts) at predetermined minimum support prices.'
  },
  {
    q: 'How is pure grain spawn packaged and shipped across India?',
    a: 'All spawn is cultured inside high-grade virgin polypropylene bags equipped with 0.2-micron breathable gas-exchange filter patches under Class 100 Laminar Air Flow. Shipments are packaged in thermal-barrier insulated cartons and dispatched via priority cold-chain express within 24 to 48 hours.'
  },
  {
    q: 'Can I start mushroom cultivation in a spare bedroom or terrace?',
    a: 'Yes! Oyster and Milky mushrooms do not require high-cost air conditioning. A well-ventilated 10x10 ft spare room or shaded terrace can easily accommodate 100–150 bags, producing 120–180 kg of fresh mushrooms per cropping cycle.'
  },
  {
    q: 'What is the shelf life and storage protocol for Sporekart grain spawn?',
    a: 'When stored in a clean, dark room at 18°C–22°C (or refrigerated at 4°C–8°C), our pure first-generation grain spawn retains full vigor for up to 60 days without loss of mycelial speed or yield potential.'
  },
  {
    q: 'When is the next practical mushroom cultivation training workshop?',
    a: 'We host monthly hands-on laboratory workshops at our incubation facility in Pune, along with interactive live weekend online bootcamps for growers across India with doorstep training material kits.'
  }
];

export default function LandingPage() {
  const { addToCart } = useCart();

  // Calculator State
  const [selectedStrainKey, setSelectedStrainKey] = useState('oyster');
  const [bagCount, setBagCount] = useState(250);

  // Lead Generation Form State
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadInterest, setLeadInterest] = useState('Commercial Farm Setup');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // Active Catalog Category Filter
  const [catalogFilter, setCatalogFilter] = useState('all');

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(0);

  // Notification Banner
  const [showBanner, setShowBanner] = useState(true);

  // Computed Financial Metrics from Calculator
  const currentStrain = STRAIN_ROI_DATA[selectedStrainKey];
  const calculations = useMemo(() => {
    const totalYieldKg = Math.round(bagCount * currentStrain.avgYieldPerBagKg);
    const grossRevenue = totalYieldKg * currentStrain.buybackPricePerKg;
    const estimatedCost = bagCount * currentStrain.costPerBag;
    const netProfit = grossRevenue - estimatedCost;
    const profitMargin = Math.round((netProfit / grossRevenue) * 100);
    const substrateWeightKg = bagCount * 3.5; // avg 3.5kg wet substrate per bag

    return {
      totalYieldKg,
      grossRevenue,
      estimatedCost,
      netProfit,
      profitMargin,
      substrateWeightKg
    };
  }, [bagCount, currentStrain]);

  const filteredProducts = useMemo(() => {
    if (catalogFilter === 'all') return CURATED_SHOWCASE_PRODUCTS;
    return CURATED_SHOWCASE_PRODUCTS.filter(p => p.category === catalogFilter);
  }, [catalogFilter]);

  const handleLeadSubmit = (e) => {
    e.preventDefault();
    if (!leadPhone.trim()) return;
    setLeadSubmitted(true);
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hello Sporekart Team! I am interested in ${currentStrain.name} with ${bagCount} bags. Can you send me the commercial project DPR and spawn pricing?`
    );
    window.open(`https://wa.me/919483861266?text=${text}`, '_blank');
  };

  return (
    <div className="bg-surface-cream text-typography-primary min-h-screen selection:bg-leaf/30 selection:text-forest-900 overflow-x-hidden">
      <SeoHead
        title="Sporekart — India's Premier Mushroom AgriTech, Pure Spawn & Grower Incubator"
        description="Launch high-yield commercial mushroom farms with lab-certified 1st-generation grain spawn, hands-on training masterclasses, automated farm setups, and 100% buyback linkages across India."
        canonicalUrl="https://sporekart.in/landing"
      />

      {/* 1. TOP ANNOUNCEMENT TICKER */}
      {showBanner && (
        <aside aria-label="Announcement" className="bg-gradient-to-r from-forest-900 via-forest-800 to-forest-900 text-surface-cream py-2.5 px-4 text-xs font-semibold border-b border-forest-700/60 sticky top-0 z-50 shadow-level-1">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider border border-gold/30">
                <Sparkles className="w-3 h-3 text-gold animate-pulse" /> Upcoming Batch
              </span>
              <span>Next Hands-on Mushroom Farming Masterclass starts Saturday in Pune &amp; Online (Only 6 Seats Remaining)</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link 
                to="/training" 
                className="underline text-gold hover:text-white transition-colors flex items-center gap-1 text-[11px]"
              >
                Reserve Seat <ArrowRight className="w-3 h-3" />
              </Link>
              <button 
                onClick={() => setShowBanner(false)} 
                className="text-surface-cream/70 hover:text-white text-sm leading-none ml-2"
                title="Dismiss banner"
              >
                &times;
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. CINEMATIC HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-16 lg:pb-24 overflow-hidden">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-leaf/20 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-40 right-10 w-[500px] h-[500px] bg-gold/15 rounded-full blur-[160px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto">
          {/* Main Hero Card Container */}
          <div className="relative rounded-hero overflow-hidden bg-forest-900 text-white shadow-level-3 border border-forest-700/60">
            {/* Background Graphic Canvas */}
            <div className="absolute inset-0 z-0">
              <img
                src="/hero-bg.png"
                alt="Modern Scientific Mushroom Cultivation & 1st Gen Spawn Sporekart"
                className="w-full h-full object-cover object-right md:object-center opacity-30 lg:opacity-40 filter contrast-125 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-forest-950 via-forest-900/90 to-transparent" />
            </div>

            {/* Hero Content Grid */}
            <div className="relative z-10 px-6 sm:px-12 lg:px-16 py-14 sm:py-20 lg:py-24 max-w-3xl space-y-8">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-pill bg-forest-800/80 backdrop-blur-md border border-forest-700/80 text-sage text-xs font-bold tracking-wide shadow-level-1">
                <ShieldCheck className="w-4 h-4 text-leaf shrink-0" />
                <span>ISO 9001:2015 Certified Cleanroom Mycology • Shriyap Enterprise</span>
              </div>

              {/* Headline */}
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.12]">
                Cultivate High-Yield Mushrooms with <span className="text-leaf">1st-Gen Pure Spawn</span> &amp; Guaranteed Buyback.
              </h1>

              {/* Subheadline */}
              <p className="text-surface-cream/90 text-base sm:text-lg leading-relaxed font-normal">
                India’s single integrated platform bridging laboratory mycology with commercial agriculture. We provide certified pure grain spawn, climate-controlled farm blueprints, 1-on-1 agronomist support, and direct market buyback linkages.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a
                  href="#calculator"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-pill bg-gold hover:bg-gold-soft text-forest-950 font-bold text-sm tracking-wide shadow-level-2 transition-all transform hover:-translate-y-0.5 button-press"
                >
                  <Calculator className="w-4 h-4 text-forest-950" />
                  <span>Calculate Farm Profits</span>
                </a>

                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-pill bg-surface-white/10 hover:bg-surface-white/20 text-white backdrop-blur-md border border-white/20 font-bold text-sm tracking-wide transition-all transform hover:-translate-y-0.5"
                >
                  <Sprout className="w-4 h-4 text-leaf" />
                  <span>Explore Spawn Catalog</span>
                </Link>
              </div>

              {/* Social Proof Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-forest-700/60">
                <div className="space-y-0.5">
                  <div className="font-display font-extrabold text-2xl sm:text-3xl text-white">5,000+</div>
                  <div className="text-[11px] text-sage font-medium">Trained Growers</div>
                </div>
                <div className="space-y-0.5">
                  <div className="font-display font-extrabold text-2xl sm:text-3xl text-leaf">99.8%</div>
                  <div className="text-[11px] text-sage font-medium">Spawn Purity Rate</div>
                </div>
                <div className="space-y-0.5">
                  <div className="font-display font-extrabold text-2xl sm:text-3xl text-gold">₹3.5 Cr+</div>
                  <div className="text-[11px] text-sage font-medium">Grower Buyback Paid</div>
                </div>
                <div className="space-y-0.5">
                  <div className="font-display font-extrabold text-2xl sm:text-3xl text-white">48 Hrs</div>
                  <div className="text-[11px] text-sage font-medium">Express Cold-Chain</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST MARQUEE STRIP */}
      <div className="border-y border-surface-border bg-surface-white/80 backdrop-blur-md py-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-around gap-6 text-xs text-typography-secondary font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-700" />
            <span>Class-100 HEPA Cleanroom Spawn</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-700" />
            <span>100% Guaranteed Harvest Buyback</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-700" />
            <span>Thermal Insulated Cold-Chain Logistics</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-700" />
            <span>FSSAI &amp; Agri-University Endorsed</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-700" />
            <span>24/7 Agronomist Hotline</span>
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE COMMERCIAL GROWER ROI & PROFIT CALCULATOR */}
      <section id="calculator" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-forest-900 text-xs font-bold shadow-level-1">
            <Calculator className="w-3.5 h-3.5 text-forest-700" /> Interactive Yield &amp; Revenue Estimator
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-forest-900 tracking-tight">
            Estimate Your Monthly Mushroom Farm Profits
          </h2>
          <p className="text-typography-secondary text-base leading-relaxed">
            Select your mushroom variety and intended production capacity to preview estimated harvest volume, production expenses, and net profit with Sporekart’s direct buyback price.
          </p>
        </div>

        {/* Calculator Interactive Card */}
        <div className="bg-surface-white rounded-hero border border-surface-border shadow-level-2 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Controls Column */}
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-8 bg-surface-white">
            {/* Step 1: Mushroom Variety Picker */}
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-typography-primary uppercase tracking-wider">
                Step 1: Choose Commercial Mushroom Variety
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Object.entries(STRAIN_ROI_DATA).map(([key, data]) => {
                  const isSelected = selectedStrainKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedStrainKey(key)}
                      className={`p-3.5 rounded-card text-left transition-all border text-xs flex flex-col justify-between ${
                        isSelected
                          ? 'bg-forest-900 text-white border-forest-900 shadow-level-1 ring-2 ring-forest-700/40'
                          : 'bg-surface-cream/50 text-typography-primary border-surface-border hover:border-forest-700/50 hover:bg-surface-cream'
                      }`}
                    >
                      <span className="font-bold text-sm block mb-1">{data.shortName}</span>
                      <span className={`text-[10px] block ${isSelected ? 'text-sage' : 'text-typography-secondary'}`}>
                        ₹{data.buybackPricePerKg}/kg Buyback
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Variety Meta Pill */}
            <div className="p-4 rounded-card bg-surface-cream border border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-forest-900">{currentStrain.name}</span>
                <span className="text-typography-secondary block text-[11px]">
                  Fruiting Cycle: {currentStrain.cycleDays} Days • Ideal Temp: {currentStrain.tempRange}
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${currentStrain.badgeColor}`}>
                {currentStrain.difficulty}
              </span>
            </div>

            {/* Step 2: Production Scale Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-typography-primary uppercase tracking-wider">
                  Step 2: Number of Substrate Bags per Cropping Cycle
                </label>
                <span className="font-display font-extrabold text-2xl text-forest-900">
                  {bagCount.toLocaleString()} Bags
                </span>
              </div>

              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={bagCount}
                onChange={(e) => setBagCount(Number(e.target.value))}
                className="w-full h-2.5 bg-surface-border rounded-lg appearance-none cursor-pointer accent-forest-700"
              />

              {/* Preset Quick Scale Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: '50 Bags (Hobby/Terrace)', count: 50 },
                  { label: '250 Bags (1-Room Setup)', count: 250 },
                  { label: '500 Bags (Semi-Commercial)', count: 500 },
                  { label: '1,500 Bags (Full Commercial)', count: 1500 }
                ].map((preset) => (
                  <button
                    key={preset.count}
                    type="button"
                    onClick={() => setBagCount(preset.count)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                      bagCount === preset.count
                        ? 'bg-forest-800 text-white border-forest-800'
                        : 'bg-white text-typography-secondary border-surface-border hover:bg-surface-cream'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Production Specifications Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-compact bg-surface-cream/40 border border-surface-border">
                <span className="text-typography-secondary text-[11px] block">Wet Substrate Needed</span>
                <span className="font-bold text-typography-primary text-sm">{calculations.substrateWeightKg.toLocaleString()} Kg</span>
              </div>
              <div className="p-3 rounded-compact bg-surface-cream/40 border border-surface-border">
                <span className="text-typography-secondary text-[11px] block">Harvest Yield Est.</span>
                <span className="font-bold text-typography-primary text-sm">{calculations.totalYieldKg.toLocaleString()} Kg Fresh</span>
              </div>
              <div className="p-3 rounded-compact bg-surface-cream/40 border border-surface-border">
                <span className="text-typography-secondary text-[11px] block">Estimated Cost</span>
                <span className="font-bold text-typography-primary text-sm">₹{calculations.estimatedCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Results Summary Column */}
          <div className="lg:col-span-5 bg-gradient-to-br from-forest-900 to-forest-950 text-white p-6 sm:p-10 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-forest-700/60 pb-4">
                <span className="text-xs uppercase tracking-wider text-sage font-bold">Financial Forecast</span>
                <span className="text-xs bg-leaf/20 text-leaf border border-leaf/30 px-2.5 py-0.5 rounded-full font-bold">
                  {currentStrain.cycleDays}-Day Cycle
                </span>
              </div>

              {/* Net Estimated Profit Hero */}
              <div className="space-y-1">
                <span className="text-xs text-sage font-medium">Estimated Net Profit (Per Cycle)</span>
                <div className="font-display font-extrabold text-4xl sm:text-5xl text-gold">
                  ₹{calculations.netProfit.toLocaleString()}
                </div>
                <div className="text-xs text-surface-cream/80 flex items-center gap-1.5 pt-1">
                  <TrendingUp className="w-3.5 h-3.5 text-leaf" />
                  <span>Estimated ROI Margin: <strong className="text-white">{calculations.profitMargin}%</strong></span>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 pt-2 text-xs border-t border-forest-800">
                <div className="flex justify-between items-center text-surface-cream/90">
                  <span>Gross Harvest Sales (Buyback Rate)</span>
                  <span className="font-mono font-bold text-white">₹{calculations.grossRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-surface-cream/70">
                  <span>Substrate &amp; Spawn Cost</span>
                  <span className="font-mono text-red-300">- ₹{calculations.estimatedCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-surface-cream/70">
                  <span>Estimated Space Needed</span>
                  <span className="font-mono text-white">{Math.round(bagCount * 0.75)} Sq. Ft.</span>
                </div>
              </div>
            </div>

            {/* Direct Action Block */}
            <div className="space-y-3 pt-4 border-t border-forest-800">
              <button
                type="button"
                onClick={handleWhatsAppDirect}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-pill bg-gold hover:bg-gold-soft text-forest-950 font-bold text-xs tracking-wider uppercase transition-all shadow-level-2 button-press"
              >
                <MessageSquare className="w-4 h-4 text-forest-950" />
                <span>Get Detailed Project Report (DPR)</span>
              </button>
              <p className="text-[11px] text-center text-sage/80">
                Calculations based on verified farmer field reports &amp; Sporekart contract procurement rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOUR PILLARS ECOSYSTEM SECTION */}
      <section className="py-20 bg-surface-white border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-forest-700 bg-forest-900/10 px-3 py-1 rounded-full">
              The Sporekart Ecosystem
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-typography-primary">
              Why India’s Top Commercial Mushroom Farms Rely on Us
            </h2>
            <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
              We eliminate the common points of failure in mushroom cultivation: contamination, temperature stress, low-vigor spawn, and lack of market linkages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-hero bg-surface-cream border border-surface-border space-y-4 hover:border-forest-700/50 hover:shadow-level-2 transition-all">
              <div className="w-12 h-12 rounded-card bg-forest-900 text-leaf flex items-center justify-center shadow-level-1">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-typography-primary">
                1st Gen Master Cultures
              </h3>
              <p className="text-xs text-typography-secondary leading-relaxed">
                Propagated directly from tissue-cultured mother slants in HEPA-filtered cleanrooms. Zero generational degradation and 99.8% contamination-free colonization.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-hero bg-surface-cream border border-surface-border space-y-4 hover:border-forest-700/50 hover:shadow-level-2 transition-all">
              <div className="w-12 h-12 rounded-card bg-forest-900 text-gold flex items-center justify-center shadow-level-1">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-typography-primary">
                Turnkey Climate Blueprints
              </h3>
              <p className="text-xs text-typography-secondary leading-relaxed">
                Step-by-step schematics for indoor temperature regulation, ultrasonic fogger humidity control (85–90%), and CO2 exhaust ducting tailored for Indian climates.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-hero bg-surface-cream border border-surface-border space-y-4 hover:border-forest-700/50 hover:shadow-level-2 transition-all">
              <div className="w-12 h-12 rounded-card bg-forest-900 text-leaf flex items-center justify-center shadow-level-1">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-typography-primary">
                100% Buyback Assurance
              </h3>
              <p className="text-xs text-typography-secondary leading-relaxed">
                Legally backed commercial purchase agreements. We buy back fresh and dehydrated mushroom yields directly from certified trainees at guaranteed fair-trade rates.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-hero bg-surface-cream border border-surface-border space-y-4 hover:border-forest-700/50 hover:shadow-level-2 transition-all">
              <div className="w-12 h-12 rounded-card bg-forest-900 text-gold flex items-center justify-center shadow-level-1">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-typography-primary">
                Insulated Cold-Chain Freight
              </h3>
              <p className="text-xs text-typography-secondary leading-relaxed">
                Specially designed breathable PP bags packed inside thermal insulated cartons to keep mycelium fresh and dormant across 24–48 hours transit pan-India.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CURATED STRAIN & SUPPLY SHOWCASE (TABS) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-surface-border pb-6">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-forest-700">
              Laboratory Certified Supplies
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-typography-primary">
              Best-Selling Spawn &amp; Growing Equipment
            </h2>
            <p className="text-xs sm:text-sm text-typography-secondary max-w-xl">
              Fresh master grain spawn batches prepared weekly under laminar flow hoods. Ready for immediate dispatch.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Products' },
              { id: 'spawn-seeds', label: 'Master Spawn' },
              { id: 'growing-kits', label: 'Grow Kits' },
              { id: 'equipment-supplies', label: 'Lab Supplies' },
              { id: 'fresh-mushrooms', label: 'Fresh Harvest' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCatalogFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  catalogFilter === tab.id
                    ? 'bg-forest-900 text-white shadow-level-1'
                    : 'bg-surface-white text-typography-secondary border border-surface-border hover:bg-surface-cream'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-surface-white rounded-hero border border-surface-border overflow-hidden hover:border-forest-700/60 hover:shadow-level-2 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image Aspect Box */}
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-cream">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-forest-900 text-white shadow-level-1">
                      {product.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-forest-900 flex items-center gap-1 shadow-level-1">
                    <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                    <span>{product.rating}</span>
                    <span className="text-typography-muted font-normal text-[10px]">({product.reviews})</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-typography-primary text-base line-clamp-1 group-hover:text-forest-700 transition-colors">
                    {product.name}
                  </h3>

                  {/* Micro Specs Pill List */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] text-typography-secondary">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <span key={key} className="px-2 py-0.5 rounded-full bg-surface-cream border border-surface-border">
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price & Purchase Footer */}
              <div className="p-5 pt-0 flex items-center justify-between border-t border-surface-border/50 mt-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-xl text-forest-900">₹{product.price}</span>
                    {product.mrp && (
                      <span className="text-xs text-typography-muted line-through font-mono">₹{product.mrp}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">● Ready for Dispatch</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/product/${product.slug}`}
                    className="p-2.5 rounded-full border border-surface-border text-typography-secondary hover:text-forest-900 hover:bg-surface-cream transition-colors"
                    title="View Product Specs"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      if (addToCart) {
                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          imageUrl: product.image,
                          slug: product.slug
                        }, 1);
                      }
                    }}
                    className="px-4 py-2 rounded-full bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold transition-all shadow-level-1 flex items-center gap-1.5 button-press"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-pill bg-surface-white hover:bg-surface-cream text-forest-900 border border-surface-border font-bold text-xs tracking-wide shadow-level-1 transition-all"
          >
            <span>Browse All 28+ Strains &amp; Supplies in Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 7. CERTIFIED MASTERCLASS SPOTLIGHT SECTION */}
      <section className="py-20 bg-forest-900 text-white relative overflow-hidden">
        {/* Ambient glow accent */}
        <div className="absolute top-1/2 left-10 w-96 h-96 bg-leaf/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-800 border border-forest-700 text-sage text-xs font-bold">
              <GraduationCap className="w-4 h-4 text-gold" /> Certified Agri-Entrepreneurship Masterclass
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white leading-tight">
              Master Commercial Mushroom Farming with Hands-On Lab Practical Training
            </h2>

            <p className="text-surface-cream/90 text-sm sm:text-base leading-relaxed">
              Don’t learn through expensive trial and error. Our intensive training teaches sterile cleanroom culturing, substrate pasteurization, climatic fruiting chamber design, disease diagnosis, and commercial buyback delivery.
            </p>

            {/* Curriculum Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              {[
                'Tissue Culture & Mother Spawn Inoculation',
                'Paddy Straw & Sawdust Substrate Sterilization',
                'Oyster, Button & Milky Temperature Management',
                'Green Mould & Trichoderma Infection Control',
                'Post-Harvest Dehydration & Moisture Packaging',
                'Guaranteed Market Buyback Formal Agreement'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-surface-cream/90">
                  <CheckCircle2 className="w-4 h-4 text-leaf shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/training"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-pill bg-gold hover:bg-gold-soft text-forest-950 font-bold text-xs uppercase tracking-wider shadow-level-2 transition-all button-press"
              >
                <span>Enroll in Next Upcoming Batch</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#consultation"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-pill bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-wider transition-all"
              >
                <span>Request Workshop Syllabus</span>
              </a>
            </div>
          </div>

          {/* Workshop Showcase Card */}
          <div className="lg:col-span-5 bg-forest-800/80 rounded-hero p-6 sm:p-8 border border-forest-700/80 backdrop-blur-md space-y-6 shadow-level-3">
            <div className="space-y-2 border-b border-forest-700 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Workshop Mode</span>
              <h3 className="font-display font-extrabold text-xl text-white">Hybrid: Pune Campus &amp; Online Pan-India</h3>
              <p className="text-xs text-sage">Join in-person for live laminar hood training or attend live online with our physical home training kit.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-compact bg-forest-900/60 border border-forest-700/50">
                <span className="text-surface-cream/80">Batch Frequency:</span>
                <span className="font-bold text-white">Every 2nd Saturday &amp; Sunday</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-compact bg-forest-900/60 border border-forest-700/50">
                <span className="text-surface-cream/80">Certification:</span>
                <span className="font-bold text-white">ISO Endorsed Certificate Included</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-compact bg-forest-900/60 border border-forest-700/50">
                <span className="text-surface-cream/80">Market Buyback:</span>
                <span className="font-bold text-leaf">Eligible for Trainees</span>
              </div>
            </div>

            <div className="p-4 rounded-card bg-gold/15 border border-gold/30 text-xs text-surface-cream space-y-1">
              <span className="font-bold text-gold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" /> Kit Delivered to Your Doorstep
              </span>
              <p className="text-[11px] text-surface-cream/90">
                Online participants receive 2kg live spawn, sterile PP bags, humidity meter, and step-by-step masterclass manual via courier before class starts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. VERIFIED GROWER TESTIMONIALS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-forest-700 bg-forest-900/10 px-3 py-1 rounded-full">
            Real Grower Results
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-typography-primary">
            Trusted by Commercial Farms &amp; Terrace Growers Across India
          </h2>
          <p className="text-typography-secondary text-sm leading-relaxed">
            From rural entrepreneurs in Maharashtra to urban home growers in Karnataka, see how Sporekart mycelium delivers consistent harvests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUCCESS_STORIES.map((story, i) => (
            <div
              key={i}
              className="bg-surface-white p-6 sm:p-8 rounded-hero border border-surface-border shadow-level-1 hover:shadow-level-2 transition-all space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Rating */}
                <div className="flex gap-1 text-gold">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-xs sm:text-sm text-typography-secondary leading-relaxed italic">
                  "{story.quote}"
                </p>

                {/* Scale & Monthly Profit Pill */}
                <div className="p-3 rounded-compact bg-surface-cream border border-surface-border space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-typography-secondary">Farm Scale:</span>
                    <span className="font-bold text-typography-primary">{story.scale}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-typography-secondary">Net Income:</span>
                    <span className="font-bold text-forest-800">{story.monthlyProfit}</span>
                  </div>
                </div>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-3 border-t border-surface-border">
                <img
                  src={story.avatar}
                  alt={story.name}
                  className="w-10 h-10 rounded-full object-cover border border-forest-700"
                />
                <div>
                  <h4 className="font-bold text-xs text-typography-primary">{story.name}</h4>
                  <p className="text-[10px] text-typography-secondary">{story.location}</p>
                  <span className="text-[9px] font-bold text-forest-700">{story.verifiedBadge}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. INTERACTIVE FAQ ACCORDION */}
      <section className="py-20 bg-surface-white border-y border-surface-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-forest-700">
              Clear Answers
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-typography-primary">
              Frequently Asked Questions by Commercial Growers
            </h2>
            <p className="text-xs sm:text-sm text-typography-secondary">
              Everything you need to know about spawn quality, logistics, buyback agreements, and farm incubation.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-card border border-surface-border overflow-hidden transition-all bg-surface-cream/30"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? -1 : idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm text-typography-primary hover:text-forest-700 transition-colors"
                  >
                    <span>{item.q}</span>
                    <span className="text-forest-700 shrink-0 font-mono text-base">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-typography-secondary leading-relaxed border-t border-surface-border/50 bg-surface-white">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. VIP LEAD GENERATION & FREE STARTER KIT CONSULTATION */}
      <section id="consultation" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="rounded-hero bg-forest-900 text-white p-8 sm:p-12 lg:p-16 border border-forest-700 shadow-level-3 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-leaf/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-2xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-800 border border-forest-700 text-gold text-xs font-bold">
              <Download className="w-3.5 h-3.5 text-gold" /> Free 28-Page AgriTech Project Report (DPR)
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white leading-tight">
              Ready to Launch Your Mushroom Farm? Speak with an Agronomist Today.
            </h2>

            <p className="text-surface-cream/90 text-sm leading-relaxed">
              Get our comprehensive 2026 Commercial Mushroom Farming Blueprint with exact equipment lists, seasonal temperature charts, subsidy guidelines, and spawn price discounts.
            </p>

            {leadSubmitted ? (
              <div className="p-6 rounded-card bg-forest-800 border border-leaf/40 text-leaf space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 font-bold text-base text-white">
                  <CheckCircle2 className="w-5 h-5 text-leaf" /> Thank You, {leadName || 'Grower'}!
                </div>
                <p className="text-xs text-surface-cream/90">
                  Our senior mycology advisor will reach out to you at <strong>{leadPhone}</strong> via WhatsApp within 2 hours with your complete project report.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-sage mb-1 uppercase tracking-wider">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="e.g. Ramesh Kulkarni"
                      className="w-full px-4 py-3 rounded-input bg-forest-950 border border-forest-700 text-white text-xs focus:outline-none focus:border-leaf placeholder:text-surface-cream/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-sage mb-1 uppercase tracking-wider">
                      WhatsApp / Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-4 py-3 rounded-input bg-forest-950 border border-forest-700 text-white text-xs focus:outline-none focus:border-leaf placeholder:text-surface-cream/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-sage mb-1 uppercase tracking-wider">
                    Primary Area of Interest
                  </label>
                  <select
                    value={leadInterest}
                    onChange={(e) => setLeadInterest(e.target.value)}
                    className="w-full px-4 py-3 rounded-input bg-forest-950 border border-forest-700 text-white text-xs focus:outline-none focus:border-leaf"
                  >
                    <option value="Commercial Farm Setup">Commercial Mushroom Farm Setup (100–1000+ Bags)</option>
                    <option value="Master Grain Spawn Purchase">Bulk Grain Spawn Purchase (Weekly Supply)</option>
                    <option value="Certified Training Workshop">Hands-on Certified Training Masterclass</option>
                    <option value="Home Terrace Cultivation">Terrace / Home DIY Mushroom Growing</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-8 py-3.5 rounded-pill bg-gold hover:bg-gold-soft text-forest-950 font-bold text-xs uppercase tracking-wider transition-all shadow-level-2 button-press flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5 text-forest-950" />
                    <span>Download DPR &amp; Request Callback</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppDirect}
                    className="px-6 py-3.5 rounded-pill bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Instant WhatsApp Chat</span>
                  </button>
                </div>
              </form>
            )}

            <div className="flex items-center gap-4 pt-2 text-[11px] text-sage">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-leaf" /> No Spam Guarantee
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-leaf" /> Verified Project Plan
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-leaf" /> Free Consultation
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
