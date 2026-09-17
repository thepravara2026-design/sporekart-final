import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, GraduationCap, ShieldCheck, ArrowRight, Award, Zap, CheckCircle2, Star, Sparkles, Building2, Layers } from 'lucide-react';
import { catalogApi, trainingApi } from '../api';
import SeoHead from '../components/SeoHead';

export default function HomePage({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, courseRes] = await Promise.all([
          catalogApi.getProducts(),
          trainingApi.getCourses(),
        ]);
        setProducts(prodRes.data.data || []);
        setCourses(courseRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch home page data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Sporekart",
    "url": "https://sporekart.in",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://sporekart.in/catalog?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="space-y-20 pb-20">
      <SeoHead
        title="Sporekart — Fresh Mushrooms, Spawn Seeds & Certified Training in India"
        description="India's leading platform for organic fresh button & oyster mushrooms, 1st generation grain spawn seeds, indoor DIY growing kits, and certified commercial grower workshops."
        canonicalUrl="https://sporekart.in"
        structuredData={websiteSchema}
      />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-spore-500/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spore-950/80 border border-spore-700/50 text-spore-300 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>India's Premier Mushroom Agritech & Training Hub</span>
              </div>

              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-tight">
                Fresh Mushrooms, <br />
                <span className="gradient-text">Pure Grain Spawn</span> & Certified Training
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Sporekart delivers lab-tested high-yield mushroom spawn seeds, fresh button & oyster varieties, DIY home growing kits, and comprehensive commercial cultivation training across India.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/catalog"
                  className="w-full sm:w-auto bg-gradient-to-r from-spore-500 to-spore-600 hover:from-spore-400 hover:to-spore-500 text-slate-950 font-extrabold text-base px-8 py-4 rounded-xl shadow-xl shadow-spore-950/50 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  <Sprout className="w-5 h-5" /> Explore Products
                </Link>
                <Link
                  to="/training"
                  className="w-full sm:w-auto glass-panel hover:bg-spore-900/60 text-white font-bold text-base px-8 py-4 rounded-xl border border-spore-700/50 flex items-center justify-center gap-2 transition-all"
                >
                  <GraduationCap className="w-5 h-5 text-spore-400" /> Training Workshops
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-spore-900/60 text-slate-300 text-xs sm:text-sm font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-spore-400 shrink-0" />
                  <span>Lab Tested Spawn</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-spore-400 shrink-0" />
                  <span>Cold-Chain Express</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-spore-400 shrink-0" />
                  <span>100% Organic Fresh</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden glass-panel p-3 border border-spore-700/40 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1000&q=80"
                  alt="Fresh Organic Oyster & Button Mushrooms Sporekart India"
                  className="w-full h-80 sm:h-96 object-cover rounded-2xl"
                />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl glass-card border border-spore-600/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">Farm Fresh Organic Mushrooms</h3>
                      <p className="text-xs text-spore-300">Harvested Daily • Delivered in 24-48 Hours</p>
                    </div>
                    <span className="px-3 py-1 bg-spore-500/20 text-spore-300 text-xs font-bold rounded-lg border border-spore-500/40">
                      FSSAI Approved
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="font-display font-extrabold text-3xl text-white">Our Product Categories</h2>
          <p className="text-slate-400 text-sm">Select from our specialized mushroom agriculture offerings</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/catalog?type=FRESH_MUSHROOM" className="glass-card p-6 rounded-2xl group block border border-spore-800/40 hover:border-spore-500/50">
            <div className="w-12 h-12 rounded-xl bg-spore-950/80 border border-spore-700/50 flex items-center justify-center text-spore-400 mb-4 group-hover:scale-110 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-spore-300 transition-colors">Fresh Mushrooms</h3>
            <p className="text-xs text-slate-400 mt-1">Daily harvested Button, Oyster & Milky varieties.</p>
          </Link>

          <Link to="/catalog?type=DRY_MUSHROOM" className="glass-card p-6 rounded-2xl group block border border-spore-800/40 hover:border-spore-500/50">
            <div className="w-12 h-12 rounded-xl bg-spore-950/80 border border-spore-700/50 flex items-center justify-center text-spore-400 mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-spore-300 transition-colors">Dry Mushrooms</h3>
            <p className="text-xs text-slate-400 mt-1">Sun-dried & dehydrated rich umami mushroom slices.</p>
          </Link>

          <Link to="/catalog?type=SPAWN_SEED" className="glass-card p-6 rounded-2xl group block border border-spore-800/40 hover:border-spore-500/50">
            <div className="w-12 h-12 rounded-xl bg-spore-950/80 border border-spore-700/50 flex items-center justify-center text-spore-400 mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-spore-300 transition-colors">Spawn Seeds</h3>
            <p className="text-xs text-slate-400 mt-1">1st gen pure wheat grain master spawn for growers.</p>
          </Link>

          <Link to="/catalog?type=GROWING_KIT" className="glass-card p-6 rounded-2xl group block border border-spore-800/40 hover:border-spore-500/50">
            <div className="w-12 h-12 rounded-xl bg-spore-950/80 border border-spore-700/50 flex items-center justify-center text-spore-400 mb-4 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-spore-300 transition-colors">DIY Growing Kits</h3>
            <p className="text-xs text-slate-400 mt-1">Harvest mushrooms at home in 10 days.</p>
          </Link>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Featured Products & Seeds</h2>
            <p className="text-slate-400 text-xs sm:text-sm">High-demand mushroom products available across India</p>
          </div>
          <Link to="/catalog" className="text-xs font-bold text-spore-400 hover:text-spore-300 flex items-center gap-1">
            View Full Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 rounded-2xl animate-pulse h-64 bg-slate-900/40"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 3).map((product) => {
              const primaryVariant = product.variants?.[0] || { priceInr: 0, variantName: 'Default' };
              const primaryImg = product.imageUrls?.[0] || 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=600&q=80';

              return (
                <div key={product.id} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-spore-800/40 group">
                  <div>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={primaryImg}
                        alt={`${product.title} - Fresh mushroom & spawn supply India`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 bg-slate-950/80 backdrop-blur-md text-spore-300 text-[10px] font-bold rounded-lg border border-spore-700/50">
                        {product.categoryName}
                      </span>
                    </div>
                    <div className="p-5 space-y-2">
                      <Link to={`/catalog/${product.slug}`} className="font-display font-bold text-lg text-white group-hover:text-spore-300 transition-colors block">
                        {product.title}
                      </Link>
                      <p className="text-xs text-slate-400 line-clamp-2">{product.description}</p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between border-t border-spore-900/40 mt-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{primaryVariant.variantName}</span>
                      <span className="text-lg font-bold text-spore-400">₹{primaryVariant.priceInr}</span>
                    </div>
                    <button
                      onClick={() => onAddToCart(product, primaryVariant)}
                      className="bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Training & Workshops Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-spore-700/50 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spore-900/80 text-spore-300 text-xs font-bold border border-spore-700/40">
                <GraduationCap className="w-4 h-4 text-spore-400" />
                <span>Certified Agri-Entrepreneurship Courses</span>
              </div>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
                Mushroom Cultivation & <br />
                <span className="gradient-gold">Spawn Production Masterclasses</span>
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Join our expert agronomist-led online and offline laboratory workshops. Gain practical knowledge on substrate pasteurization, tissue isolation, laminar airflow operations, and direct buyback market linkage.
              </p>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  to="/training"
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm px-6 py-3 rounded-xl shadow-lg transition-all"
                >
                  View Upcoming Batches
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              {courses.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-950/70 border border-spore-800/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">{c.title}</h4>
                    <p className="text-[11px] text-spore-300">{c.mode} • {c.durationHours} Hours Duration</p>
                  </div>
                  <span className="text-sm font-extrabold text-amber-400">₹{c.priceInr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Online & Offline Business Support Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="font-display font-extrabold text-3xl text-white">Complete Grower Support Ecosystem</h2>
          <p className="text-slate-400 text-sm">Empowering mushroom growers with end-to-end business solutions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
            <Building2 className="w-8 h-8 text-spore-400" />
            <h3 className="font-bold text-white text-lg">Lab & Farm Setup Consultancy</h3>
            <p className="text-xs text-slate-400">Turnkey engineering design for climate-controlled mushroom fruiting rooms and spawn labs.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
            <Zap className="w-8 h-8 text-amber-400" />
            <h3 className="font-bold text-white text-lg">Pest & Contamination Advisory</h3>
            <p className="text-xs text-slate-400">Instant expert agronomist online support for mould, Trichoderma, and humidity control.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-spore-800/40 space-y-3">
            <Award className="w-8 h-8 text-emerald-400" />
            <h3 className="font-bold text-white text-lg">Buyback & Market Linkages</h3>
            <p className="text-xs text-slate-400">Connect with wholesale hotel buyers, retail chains, and dehydration processing units in India.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
