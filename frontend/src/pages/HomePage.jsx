import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, GraduationCap, ArrowRight, Award, Zap, CheckCircle2, Sparkles, Building2, Layers, ShieldCheck, HeartHandshake } from 'lucide-react';
import { catalogApi, trainingApi } from '../api';
import SeoHead from '../components/SeoHead';
import AvailabilityBadge from '../components/AvailabilityBadge';
import MediaImage from '../components/MediaImage';

import { useCart } from '../context/CartContext';

export default function HomePage({ onAddToCart: propOnAddToCart }) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedVariants, setSelectedVariants] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const prodRes = await catalogApi.getProducts();
        setProducts(prodRes.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch products for home page', err);
      }

      try {
        const courseRes = await trainingApi.getCourses();
        setCourses(courseRes.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch courses for home page', err);
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
      "target": "https://sporekart.in/products?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="space-y-20 pb-20 animate-fade-in">
      <SeoHead
        title="Sporekart — Fresh Mushrooms, Pure Grain Spawn & Certified Training in India"
        description="India's leading platform for organic fresh button & oyster mushrooms, 1st generation grain spawn seeds, indoor DIY growing kits, and certified commercial grower workshops."
        canonicalUrl="https://sporekart.in"
        structuredData={websiteSchema}
      />

      {/* Hero Section */}
      <section className="relative pt-8 pb-16 md:pt-16 md:pb-24 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-spore-500/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-spore-950/80 border border-spore-700/50 text-spore-300 text-xs font-semibold tracking-wide shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>India's Premier Mushroom Agritech & Training Platform</span>
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
                  to="/products"
                  className="w-full sm:w-auto bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 text-slate-950 font-extrabold text-base px-8 py-4 rounded-2xl shadow-xl shadow-spore-950/60 flex items-center justify-center gap-2 transition-all button-press hover-lift"
                >
                  <Sprout className="w-5 h-5" /> Explore Products
                </Link>
                <Link
                  to="/training"
                  className="w-full sm:w-auto glass-panel hover:bg-spore-900/60 text-white font-bold text-base px-8 py-4 rounded-2xl border border-spore-700/50 flex items-center justify-center gap-2 transition-all button-press hover-lift"
                >
                  <GraduationCap className="w-5 h-5 text-spore-400" /> Training Workshops
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-spore-900/60 text-slate-300 text-xs sm:text-sm font-medium">
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle2 className="w-4 h-4 text-spore-400 shrink-0" />
                  <span>Lab Tested Spawn</span>
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle2 className="w-4 h-4 text-spore-400 shrink-0" />
                  <span>Cold-Chain Express</span>
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle2 className="w-4 h-4 text-spore-400 shrink-0" />
                  <span>100% Organic Fresh</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden glass-panel p-3 border border-spore-700/40 shadow-2xl group hover-lift">
                <img
                  src="https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1000&q=80"
                  alt="Fresh Organic Oyster & Button Mushrooms Sporekart India"
                  width="1000"
                  height="800"
                  loading="eager"
                  decoding="async"
                  className="w-full h-80 sm:h-96 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl glass-card border border-spore-600/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">Farm Fresh Organic Mushrooms</h3>
                      <p className="text-xs text-spore-300">Harvested Daily • Delivered in 24-48 Hours</p>
                    </div>
                    <span className="px-3 py-1 bg-spore-500/20 text-spore-300 text-xs font-bold rounded-xl border border-spore-500/40">
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
          <h2 className="font-display font-extrabold text-3xl text-white">Explore Agriculture Categories</h2>
          <p className="text-slate-400 text-sm">Select from our laboratory-certified mushroom offerings</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/products?category=FRESH_MUSHROOM" className="glass-card p-6 rounded-3xl group block border border-spore-800/40 hover:border-spore-500/50 hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-spore-950/80 border border-spore-700/50 flex items-center justify-center text-spore-400 mb-4 group-hover:scale-110 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-spore-300 transition-colors">Fresh Mushrooms</h3>
            <p className="text-xs text-slate-400 mt-1">Daily harvested Button, Oyster & Milky varieties.</p>
          </Link>

          <Link to="/products?category=DRY_MUSHROOM" className="glass-card p-6 rounded-3xl group block border border-spore-800/40 hover:border-spore-500/50 hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-spore-950/80 border border-spore-700/50 flex items-center justify-center text-spore-400 mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-spore-300 transition-colors">Dry Mushrooms</h3>
            <p className="text-xs text-slate-400 mt-1">Sun-dried & dehydrated rich umami mushroom slices.</p>
          </Link>

          <Link to="/products?category=SPAWN_SEED" className="glass-card p-6 rounded-3xl group block border border-spore-800/40 hover:border-spore-500/50 hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-spore-950/80 border border-spore-700/50 flex items-center justify-center text-spore-400 mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-spore-300 transition-colors">Spawn Seeds</h3>
            <p className="text-xs text-slate-400 mt-1">1st gen pure wheat grain master spawn for growers.</p>
          </Link>

          <Link to="/products?category=GROWING_KIT" className="glass-card p-6 rounded-3xl group block border border-spore-800/40 hover:border-spore-500/50 hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-spore-950/80 border border-spore-700/50 flex items-center justify-center text-spore-400 mb-4 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6 text-spore-300" />
            </div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-spore-300 transition-colors">DIY Growing Kits</h3>
            <p className="text-xs text-slate-400 mt-1">Harvest mushrooms at home in 10-14 days.</p>
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
          <Link to="/products" className="text-xs font-bold text-spore-400 hover:text-spore-300 flex items-center gap-1.5 hover-lift">
            View Full Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 rounded-3xl animate-pulse h-80 bg-slate-900/40"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 3).map((product) => {
              const activeVariant = selectedVariants[product.id] || product.variants?.[0] || { priceInr: 0, variantName: 'Default' };
              const primaryImg = product.imageUrls?.[0] || 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=600&q=80';
              const availability = activeVariant.availability || {
                status: (activeVariant.stockQuantity > 0 || !activeVariant) ? 'AVAILABLE' : 'OUT_OF_STOCK',
                label: (activeVariant.stockQuantity > 0 || !activeVariant) ? 'In Stock' : 'Out of Stock'
              };
              const isAvailable = availability.status !== 'OUT_OF_STOCK' && (activeVariant.stockQuantity === undefined || activeVariant.stockQuantity > 0);

              return (
                <div key={product.id} className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between border border-spore-800/40 group hover-lift">
                  <div>
                    <Link to={`/product/${product.slug}`} className="relative h-52 overflow-hidden block">
                      <MediaImage
                        src={primaryImg}
                        alt={`${product.title} - Fresh mushroom & spawn supply India`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 bg-slate-950/80 backdrop-blur-md text-spore-300 text-[10px] font-bold rounded-xl border border-spore-700/50">
                        {product.categoryName}
                      </span>
                      <div className="absolute top-3 right-3">
                        <AvailabilityBadge availability={availability} />
                      </div>
                    </Link>
                    <div className="p-5 space-y-2">
                      <Link to={`/product/${product.slug}`} className="font-display font-bold text-lg text-white group-hover:text-spore-300 transition-colors block">
                        {product.title}
                      </Link>
                      <p className="text-xs text-slate-400 line-clamp-2">{product.description}</p>

                      {product.variants && product.variants.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 pt-2" data-testid="landing-product-variants">
                          {product.variants.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setSelectedVariants({ ...selectedVariants, [product.id]: v })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all button-press ${
                                activeVariant?.id === v.id
                                  ? 'bg-spore-950 border-spore-400 text-spore-300 font-bold shadow-sm'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              {v.variantName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between border-t border-spore-900/40 mt-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">{activeVariant.variantName}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-spore-400 font-display">₹{activeVariant.priceInr}</span>
                        {activeVariant.compareAtPriceInr && Number(activeVariant.compareAtPriceInr) > Number(activeVariant.priceInr) && (
                          <span className="text-xs text-slate-500 line-through font-medium" data-testid="strikeout-price">
                            ₹{activeVariant.compareAtPriceInr}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (isAvailable && activeVariant) {
                          if (propOnAddToCart) propOnAddToCart(product, activeVariant);
                          else addToCart(activeVariant.id, 1);
                        }
                      }}
                      disabled={!isAvailable}
                      className={`font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md button-press ${
                        isAvailable
                          ? 'bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 text-slate-950 shadow-spore-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      {isAvailable ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Certified Training & Workshops Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-spore-700/50 relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spore-900/80 text-spore-300 text-xs font-bold border border-spore-700/40 shadow-inner">
                <GraduationCap className="w-4 h-4 text-spore-400" />
                <span>Certified Agri-Entrepreneurship Courses</span>
              </div>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white leading-tight">
                Mushroom Cultivation & <br />
                <span className="gradient-gold">Spawn Production Masterclasses</span>
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Join our expert agronomist-led online and offline laboratory workshops. Gain practical knowledge on substrate pasteurization, tissue isolation, laminar airflow operations, and direct buyback market linkage.
              </p>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  to="/training"
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all button-press hover-lift"
                >
                  View Upcoming Batches
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              {courses.slice(0, 3).map((c) => (
                <div key={c.id} className="p-4 rounded-2xl glass-card border border-spore-800/60 flex items-center justify-between hover-lift">
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">{c.title}</h4>
                    <p className="text-[11px] text-spore-300 mt-0.5">{c.mode} • {c.durationHours} Hours Duration</p>
                  </div>
                  <span className="text-sm font-extrabold text-amber-400 font-display">₹{c.priceInr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Online & Offline Business Support Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="font-display font-extrabold text-3xl text-white">Complete Grower Ecosystem</h2>
          <p className="text-slate-400 text-sm">Empowering mushroom growers across India with end-to-end solutions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl border border-spore-800/40 space-y-3 hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-spore-950/80 border border-spore-700/50 flex items-center justify-center text-spore-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-lg">Lab & Farm Setup Consultancy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Turnkey engineering design for climate-controlled mushroom fruiting rooms and spawn labs.</p>
          </div>
          <div className="glass-card p-6 rounded-3xl border border-spore-800/40 space-y-3 hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-spore-950/80 border border-spore-700/50 flex items-center justify-center text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-lg">Pest & Contamination Advisory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Instant expert agronomist online support for mould, Trichoderma, and humidity control.</p>
          </div>
          <div className="glass-card p-6 rounded-3xl border border-spore-800/40 space-y-3 hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-spore-950/80 border border-spore-700/50 flex items-center justify-center text-emerald-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-lg">Buyback & Market Linkages</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Connect with wholesale hotel buyers, retail chains, and dehydration processing units in India.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
