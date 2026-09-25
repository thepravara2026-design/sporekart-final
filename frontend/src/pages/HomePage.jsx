import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, GraduationCap, ArrowRight, Award, Zap, CheckCircle2, Sparkles, Building2, Layers, ShieldCheck, HeartHandshake, ShoppingBag } from 'lucide-react';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e2f2e6] border border-[#c5e5ce] text-[#16532f] text-xs font-extrabold tracking-wide shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#16532f] animate-pulse" />
                <span>India's Premier Mushroom Agritech & Training Platform</span>
              </div>

              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-900 leading-tight">
                Fresh Mushrooms, <br />
                <span className="text-[#16532f]">Pure Grain Spawn</span> & Certified Training
              </h1>

              <p className="text-slate-700 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                Sporekart delivers lab-tested high-yield mushroom spawn seeds, fresh button & oyster varieties, DIY home growing kits, and comprehensive commercial cultivation training across India.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/products"
                  className="w-full sm:w-auto bg-[#16532f] hover:bg-[#124426] text-white font-extrabold text-base px-8 py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all button-press"
                >
                  <Sprout className="w-5 h-5 text-emerald-300" /> Explore Products
                </Link>
                <Link
                  to="/training"
                  className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-[#16532f] font-extrabold text-base px-8 py-4 rounded-xl border border-[#16532f] flex items-center justify-center gap-2 transition-all button-press shadow-sm"
                >
                  <GraduationCap className="w-5 h-5 text-[#16532f]" /> Training Workshops
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-300 text-slate-800 text-xs sm:text-sm font-semibold">
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle2 className="w-4 h-4 text-[#16532f] shrink-0" />
                  <span>Lab Tested Spawn</span>
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle2 className="w-4 h-4 text-[#16532f] shrink-0" />
                  <span>Cold-Chain Express</span>
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle2 className="w-4 h-4 text-[#16532f] shrink-0" />
                  <span>100% Organic Fresh</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden bg-white p-3 border border-gray-200 shadow-xl group">
                <img
                  src="https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1000&q=80"
                  alt="Fresh Organic Oyster & Button Mushrooms Sporekart India"
                  width="1000"
                  height="800"
                  loading="eager"
                  decoding="async"
                  className="w-full h-80 sm:h-96 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Farm Fresh Organic Mushrooms</h3>
                      <p className="text-xs text-slate-600 font-medium">Harvested Daily • Delivered in 24-48 Hours</p>
                    </div>
                    <span className="px-3 py-1 bg-[#e2f2e6] text-[#16532f] text-xs font-bold rounded-full border border-[#c5e5ce]">
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
          <h2 className="font-display font-extrabold text-3xl text-slate-900">Explore Agriculture Categories</h2>
          <p className="text-slate-600 text-sm font-medium">Select from our laboratory-certified mushroom offerings</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/products/fresh-mushrooms" className="bg-white p-6 rounded-2xl group block border border-gray-200 hover:border-[#16532f] hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#e2f2e6] flex items-center justify-center text-[#16532f] mb-4 group-hover:scale-110 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-[#16532f] transition-colors">Fresh Mushrooms</h3>
            <p className="text-xs text-slate-600 mt-1">Daily harvested Button, Oyster & Milky varieties.</p>
          </Link>

          <Link to="/products/dry-mushrooms" className="bg-white p-6 rounded-2xl group block border border-gray-200 hover:border-[#16532f] hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#e2f2e6] flex items-center justify-center text-[#16532f] mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-[#16532f] transition-colors">Dry Mushrooms</h3>
            <p className="text-xs text-slate-600 mt-1">Sun-dried & dehydrated rich umami mushroom slices.</p>
          </Link>

          <Link to="/products/spawn-seeds" className="bg-white p-6 rounded-2xl group block border border-gray-200 hover:border-[#16532f] hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#e2f2e6] flex items-center justify-center text-[#16532f] mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-[#16532f] transition-colors">Spawn Seeds</h3>
            <p className="text-xs text-slate-600 mt-1">1st gen pure wheat grain master spawn for growers.</p>
          </Link>

          <Link to="/products/growing-kits" className="bg-white p-6 rounded-2xl group block border border-gray-200 hover:border-[#16532f] hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#e2f2e6] flex items-center justify-center text-[#16532f] mb-4 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-[#16532f] transition-colors">DIY Growing Kits</h3>
            <p className="text-xs text-slate-600 mt-1">Harvest mushrooms at home in 10-14 days.</p>
          </Link>
        </div>
      </section>

      {/* Featured Products Grid (Matching Reference Screenshot 2) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">Featured Products & Seeds</h2>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">High-demand mushroom products available across India</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-[#16532f] hover:underline flex items-center gap-1.5">
            View Full Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-2xl animate-pulse h-80 border border-gray-200"></div>
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
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden flex flex-col justify-between border border-gray-200/90 shadow-sm hover:shadow-md transition-all group">
                  <div>
                    <Link to={`/product/${product.slug}`} className="relative h-52 overflow-hidden block bg-gray-50">
                      <MediaImage
                        src={primaryImg}
                        alt={`${product.title} - Fresh mushroom & spawn supply India`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 text-[#16532f] text-[10px] font-extrabold rounded-full border border-[#c5e5ce] uppercase tracking-wider shadow-sm">
                        {product.categoryName}
                      </span>
                      <div className="absolute top-3 right-3">
                        <AvailabilityBadge availability={availability} />
                      </div>
                    </Link>
                    <div className="p-5 space-y-2">
                      <Link to={`/product/${product.slug}`} className="font-display font-extrabold text-lg text-slate-900 group-hover:text-[#16532f] transition-colors block">
                        {product.title}
                      </Link>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{product.description}</p>

                      {product.variants && product.variants.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 pt-2" data-testid="landing-product-variants">
                          {product.variants.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setSelectedVariants({ ...selectedVariants, [product.id]: v })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                activeVariant?.id === v.id
                                  ? 'bg-[#16532f] border-[#16532f] text-white shadow-sm'
                                  : 'bg-gray-50 border-gray-200 text-slate-700 hover:border-gray-400'
                              }`}
                            >
                              {v.variantName}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 flex items-center gap-2">
                        <span className="px-3 py-0.5 bg-[#e2f2e6] text-[#16532f] text-[11px] font-extrabold rounded-full">
                          Free shipping
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-100 mt-4">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">{activeVariant.variantName}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-[#16532f] font-display">₹{activeVariant.priceInr}.00</span>
                        {activeVariant.compareAtPriceInr && Number(activeVariant.compareAtPriceInr) > Number(activeVariant.priceInr) && (
                          <span className="text-xs text-slate-400 line-through font-semibold" data-testid="strikeout-price">
                            ₹{activeVariant.compareAtPriceInr}.00
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${
                        isAvailable
                          ? 'bg-[#16532f] hover:bg-[#124426] text-white button-press'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      aria-label="Add to cart"
                    >
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Our Training Glimpses Section (Matching Reference Screenshot 1) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-lg text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-[#16532f] text-xs font-extrabold uppercase tracking-widest">
            <span>🖼️ TRAINING GLIMPSES</span>
          </div>
          
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
            Our Training Glimpses
          </h2>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button className="w-10 h-10 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-slate-800 shadow-sm transition-all">
              &lt;
            </button>
            <button className="w-10 h-10 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-slate-800 shadow-sm transition-all">
              &gt;
            </button>
          </div>

          <div className="pt-4">
            <Link
              to="/training"
              className="inline-flex items-center gap-2 bg-[#16532f] hover:bg-[#124426] text-white font-extrabold text-sm px-6 py-3 rounded-lg shadow-md transition-all button-press"
            >
              <span>Explore Training</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Online & Offline Business Support Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="font-display font-extrabold text-3xl text-gray-900">Complete Grower Ecosystem</h2>
          <p className="text-gray-500 text-sm">Empowering mushroom growers across India with end-to-end solutions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#e2f2e6] flex items-center justify-center text-[#16532f]">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Lab & Farm Setup Consultancy</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Turnkey engineering design for climate-controlled mushroom fruiting rooms and spawn labs.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#e2f2e6] flex items-center justify-center text-[#16532f]">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Pest & Contamination Advisory</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Instant expert agronomist online support for mould, Trichoderma, and humidity control.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#e2f2e6] flex items-center justify-center text-[#16532f]">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Buyback & Market Linkages</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Connect with wholesale hotel buyers, retail chains, and dehydration processing units in India.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
