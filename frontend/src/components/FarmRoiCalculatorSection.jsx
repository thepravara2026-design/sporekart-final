import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calculator, TrendingUp, Sparkles, Award, ArrowRight, 
  CheckCircle2, DollarSign, Calendar, Clock, Sprout, ShoppingBag, ShieldCheck
} from 'lucide-react';

const STRAIN_ROI_DATA = {
  oyster: {
    key: 'oyster',
    name: 'Pearl Oyster (Pleurotus ostreatus)',
    shortName: 'Oyster Mushroom',
    cycleDays: 28,
    avgYieldPerBagKg: 1.2,
    buybackPricePerKg: 190,
    costPerBag: 45,
    tempRange: '20°C – 28°C',
    humidity: '85% – 90%',
    difficulty: 'Easiest (Beginner Friendly)',
    badge: 'Fastest 28-Day Turnaround',
    color: 'emerald'
  },
  button: {
    key: 'button',
    name: 'White Button (Agaricus bisporus)',
    shortName: 'Button Mushroom',
    cycleDays: 45,
    avgYieldPerBagKg: 1.6,
    buybackPricePerKg: 220,
    costPerBag: 60,
    tempRange: '14°C – 18°C',
    humidity: '85% – 95%',
    difficulty: 'Moderate (Cool / AC Setup)',
    badge: 'Highest Market Demand in India',
    color: 'blue'
  },
  milky: {
    key: 'milky',
    name: 'Tropical Milky (Calocybe indica)',
    shortName: 'Milky Mushroom',
    cycleDays: 35,
    avgYieldPerBagKg: 1.4,
    buybackPricePerKg: 240,
    costPerBag: 50,
    tempRange: '28°C – 36°C',
    humidity: '80% – 85%',
    difficulty: 'Summer Hardy (No AC Needed)',
    badge: 'Thrives in South & Central India Heat',
    color: 'amber'
  },
  shiitake: {
    key: 'shiitake',
    name: 'Gourmet Shiitake (Lentinula edodes)',
    shortName: 'Shiitake Mushroom',
    cycleDays: 60,
    avgYieldPerBagKg: 0.9,
    buybackPricePerKg: 650,
    costPerBag: 110,
    tempRange: '18°C – 22°C',
    humidity: '80% – 90%',
    difficulty: 'High-Value Gourmet Extract',
    badge: '₹650/kg Premium Buyback Price',
    color: 'purple'
  }
};

const SCALE_PRESETS = [
  { label: '100 Bags (Spare Room)', value: 100, area: '80 - 100 sq.ft' },
  { label: '250 Bags (Covered Terrace)', value: 250, area: '200 - 250 sq.ft' },
  { label: '500 Bags (Commercial Shed)', value: 500, area: '400 - 500 sq.ft' },
  { label: '1,000 Bags (AgriTech Farm)', value: 1000, area: '800 - 1,000 sq.ft' },
  { label: '2,000 Bags (Incubator Unit)', value: 2000, area: '1,500 - 1,800 sq.ft' },
];

export default function FarmRoiCalculatorSection() {
  const [selectedStrainKey, setSelectedStrainKey] = useState('oyster');
  const [bagCount, setBagCount] = useState(250);

  const strain = STRAIN_ROI_DATA[selectedStrainKey];

  const metrics = useMemo(() => {
    const totalYieldKg = Math.round(bagCount * strain.avgYieldPerBagKg);
    const grossRevenue = Math.round(totalYieldKg * strain.buybackPricePerKg);
    const operatingCost = Math.round(bagCount * strain.costPerBag);
    const netProfit = grossRevenue - operatingCost;
    const profitMargin = Math.round((netProfit / grossRevenue) * 100);
    const substrateWeightKg = Math.round(bagCount * 3.5);
    const approxAreaSqFt = Math.round(bagCount * 0.9);

    return {
      totalYieldKg,
      grossRevenue,
      operatingCost,
      netProfit,
      profitMargin,
      substrateWeightKg,
      approxAreaSqFt
    };
  }, [bagCount, strain]);

  return (
    <section 
      id="calculator" 
      aria-label="Interactive AgriTech Mushroom Cultivation Profit Calculator" 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16"
    >
      <div className="rounded-[28px] sm:rounded-[36px] bg-gradient-to-br from-[#173B2A] via-[#1F4D35] to-[#122A1E] text-white p-6 sm:p-10 lg:p-14 shadow-level-3 border border-emerald-500/20 relative overflow-hidden">
        {/* Ambient lighting glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gold/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative z-10 space-y-8 sm:space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-bold font-sans">
              <Calculator className="w-4 h-4 text-emerald-300" />
              <span>INTERACTIVE AGRITECH PROFIT &amp; YIELD CALCULATOR</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white leading-tight">
              See Your Farm Earnings with<br className="hidden sm:inline" /> Guaranteed Buyback
            </h2>
            <p className="text-surface-neutral/80 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Select your preferred mushroom variety and scale. All estimates are calibrated against real harvest data and Sporekart’s institutional minimum support buyback floor prices.
            </p>
          </div>

          {/* Calculator Interactive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            
            {/* Left Column: Variety Selector & Scale Slider */}
            <div className="lg:col-span-7 bg-white/5 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10 space-y-7 flex flex-col justify-between">
              
              {/* Step 1: Select Strain */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Step 1: Choose Mushroom Strain
                  </span>
                  <span className="text-xs text-surface-neutral/60">
                    Cycle: {strain.cycleDays} Days
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {Object.values(STRAIN_ROI_DATA).map((s) => {
                    const isSelected = selectedStrainKey === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setSelectedStrainKey(s.key)}
                        className={`p-3 sm:p-3.5 rounded-xl text-left border transition-all duration-200 ${
                          isSelected
                            ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-level-1 scale-[1.02]'
                            : 'bg-white/5 border-white/10 text-surface-neutral/80 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold text-xs sm:text-sm text-white truncate">
                          {s.shortName}
                        </div>
                        <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">
                          ₹{s.buybackPricePerKg}/kg buyback
                        </div>
                        <div className="text-[9px] text-surface-neutral/60 mt-1 line-clamp-1">
                          {s.tempRange}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-surface-neutral/80">
                  <span className="font-medium">Selected: <strong className="text-white">{strain.name}</strong></span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                    {strain.badge}
                  </span>
                </div>
              </div>

              {/* Step 2: Scale Selector & Presets */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Step 2: Choose Cultivation Scale (Number of Bags)
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-white">
                    {bagCount.toLocaleString('en-IN')} Bags
                  </span>
                </div>

                {/* Range Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="25"
                    value={bagCount}
                    onChange={(e) => setBagCount(Number(e.target.value))}
                    className="w-full h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[10px] text-surface-neutral/60 font-semibold">
                    <span>50 Bags (Home Trial)</span>
                    <span>500 Bags (Semi-Commercial)</span>
                    <span>2,000 Bags (Commercial)</span>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {SCALE_PRESETS.map((preset) => {
                    const isSelected = bagCount === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setBagCount(preset.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-emerald-400 text-forest-950 border-emerald-300 font-bold shadow-sm'
                            : 'bg-white/5 border-white/10 text-surface-neutral/80 hover:bg-white/10'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Physical Setup Requirements */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-surface-neutral/60 block">Space Needed</span>
                  <span className="font-bold text-white">~{metrics.approxAreaSqFt} sq. ft.</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-surface-neutral/60 block">Substrate Straw</span>
                  <span className="font-bold text-white">~{metrics.substrateWeightKg} kg</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-surface-neutral/60 block">Crop Turnaround</span>
                  <span className="font-bold text-emerald-300">{strain.cycleDays} Days</span>
                </div>
              </div>

            </div>

            {/* Right Column: Dynamic Financial Breakdown & Direct Action Box */}
            <div className="lg:col-span-5 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 flex flex-col justify-between space-y-6 shadow-level-2">
              
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-surface-neutral/80">
                    Financial Summary (Per Cropping Cycle)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    ~{metrics.profitMargin}% Margin
                  </span>
                </div>

                {/* Large Net Profit Callout */}
                <div className="rounded-2xl bg-gradient-to-tr from-emerald-950/80 to-forest-900/80 p-5 sm:p-6 border border-emerald-400/40 text-center space-y-1 shadow-inner">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Estimated Net Profit / Cycle
                  </span>
                  <div className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
                    ₹{metrics.netProfit.toLocaleString('en-IN')}
                  </div>
                  <span className="text-xs text-surface-neutral/70 block pt-1">
                    Based on {metrics.totalYieldKg} kg harvest @ ₹{strain.buybackPricePerKg}/kg
                  </span>
                </div>

                {/* Breakdown List */}
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between py-1.5 border-b border-white/10">
                    <span className="text-surface-neutral/70">Estimated Fresh Harvest</span>
                    <span className="font-bold text-white">{metrics.totalYieldKg} kg</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/10">
                    <span className="text-surface-neutral/70">Gross Revenue (@ ₹{strain.buybackPricePerKg}/kg)</span>
                    <span className="font-bold text-emerald-300">₹{metrics.grossRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/10">
                    <span className="text-surface-neutral/70">Operating Cost (Spawn + Substrate)</span>
                    <span className="font-bold text-red-300">-₹{metrics.operatingCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Buyback Guarantee Stamp */}
                <div className="p-3.5 rounded-xl bg-gold/15 border border-gold/30 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-gold-soft shrink-0 mt-0.5" />
                  <p className="text-[11px] text-surface-neutral/90 leading-relaxed">
                    <strong className="text-gold-soft">100% Institutional Buyback Linkage:</strong> All certified Sporekart trainees receive legal procurement contracts with assured purchase of fresh and dried mushroom harvests.
                  </p>
                </div>
              </div>

              {/* Direct Double CTA: Erupt to Get Trained OR Order Product */}
              <div className="space-y-3 pt-2">
                <Link
                  to="/training"
                  className="w-full py-3.5 px-5 rounded-xl bg-gold hover:bg-[#b5893b] text-forest-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-level-1 hover:scale-[1.01] transition-all"
                >
                  <Award className="w-4 h-4 text-forest-950" />
                  <span>Enroll in Masterclass with Buyback Contract</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#store"
                  className="w-full py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/20 transition-all"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-300" />
                  <span>Order 1st Gen Spawn for this Scale</span>
                </a>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
