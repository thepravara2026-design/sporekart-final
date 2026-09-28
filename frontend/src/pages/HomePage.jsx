import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sprout, GraduationCap, ArrowRight, Award, Zap, CheckCircle2, Sparkles, 
  Building2, Layers, ShieldCheck, HeartHandshake, BookOpen, FileText, 
  Clock, User, CheckCircle, Users, ChevronRight, HelpCircle, Plus, Minus,
  ChevronDown, Phone, Mail, MapPin, Send, MessageSquare
} from 'lucide-react';
import { catalogApi, trainingApi } from '../api';
import SeoHead from '../components/SeoHead';
import AvailabilityBadge from '../components/AvailabilityBadge';
import MediaImage from '../components/MediaImage';
import HeroSection from '../components/HeroSection';
import { BLOG_POSTS } from './BlogIndexPage';
import { useCart } from '../context/CartContext';

export default function HomePage({ onAddToCart: propOnAddToCart }) {
  const { addToCart } = useCart();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedVariants, setSelectedVariants] = useState({});

  // FAQ State
  const [openFaq, setOpenFaq] = useState(0);

  // Contact Form State
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    emailOrPhone: '',
    inquiryType: 'Spawn Order Inquiry',
    message: ''
  });

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

  // Smooth scroll support for hash navigation (e.g. /#training, /#faq)
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }
  }, [location]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (contactFormData.name && contactFormData.emailOrPhone) {
      setContactSubmitted(true);
    }
  };

  const FAQS = [
    {
      question: "How is Sporekart grain spawn packaged and shipped across India?",
      answer: "Our mother spawn is cultured on 1st generation sterile wheat grains inside breathable filter-patch bags under laminar air flow. Orders are packed with temperature-preserving insulation and shipped via expedited cold-chain logistics across India within 24-48 hours."
    },
    {
      question: "Do you offer direct market buyback linkages for trained growers?",
      answer: "Yes! Commercial growers who complete our certified masterclasses gain access to our buyback network. We connect growers with wholesale hotel chains, supermarket suppliers, and dry mushroom processing units."
    },
    {
      question: "Can beginners start mushroom cultivation at home without specialized equipment?",
      answer: "Absolutely. Our DIY Mushroom Growing Kits come fully colonized and ready to fruit. Simply place the kit in a humid indoor location, mist with water twice daily, and harvest your first fresh batch of mushrooms in 10-14 days."
    },
    {
      question: "What is the shelf life and storage requirement for mushroom spawn?",
      answer: "When stored in a cool, dark environment between 15°C–20°C (or refrigerated at 4°C–8°C), our pure mother spawn remains 100% viable for up to 60 days without loss of mycelial vigor."
    },
    {
      question: "Where are your hands-on practical training workshops conducted?",
      answer: "Our practical laboratory workshops are hosted at our AgriTech Innovation Hub in Pune, Maharashtra. For growers outside Maharashtra, we offer live interactive weekend online masterclasses with physical kit delivery."
    },
    {
      question: "What payment options are accepted on Sporekart?",
      answer: "We support all major Indian payment gateways via Razorpay: UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and Digital Wallets with instant digital order confirmation."
    }
  ];

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
    <div className="space-y-20 pb-20 animate-fade-in text-typography-primary">
      <SeoHead
        title="Sporekart — Fresh Mushrooms, Pure Grain Spawn & Certified Training in India"
        description="India's leading platform for organic fresh button & oyster mushrooms, 1st generation grain spawn seeds, indoor DIY growing kits, and certified commercial grower workshops."
        canonicalUrl="https://sporekart.in"
        structuredData={websiteSchema}
      />

      {/* 1. HERO SECTION */}
      <HeroSection />

      {/* 2. CATEGORY SECTION */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="font-display font-bold text-3xl text-forest-900">Explore Agriculture Categories</h2>
          <p className="text-typography-secondary text-sm">Select from our laboratory-certified mushroom offerings</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/products/fresh-mushrooms" className="bg-surface-white p-6 rounded-feature group block border border-surface-border hover:border-forest-700/40 shadow-level-1 hover-lift transition-all">
            <div className="w-12 h-12 rounded-container bg-surface-cream border border-surface-border flex items-center justify-center text-forest-700 mb-4 group-hover:scale-110 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-forest-900 group-hover:text-forest-700 transition-colors">Fresh Mushrooms</h3>
            <p className="text-xs text-typography-secondary mt-1">Daily harvested Button, Oyster & Milky varieties.</p>
          </Link>

          <Link to="/products/dry-mushrooms" className="bg-surface-white p-6 rounded-feature group block border border-surface-border hover:border-forest-700/40 shadow-level-1 hover-lift transition-all">
            <div className="w-12 h-12 rounded-container bg-surface-cream border border-surface-border flex items-center justify-center text-forest-700 mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6 text-forest-700" />
            </div>
            <h3 className="font-display font-bold text-lg text-forest-900 group-hover:text-forest-700 transition-colors">Dry Mushrooms</h3>
            <p className="text-xs text-typography-secondary mt-1">Sun-dried & dehydrated rich umami mushroom slices.</p>
          </Link>

          <Link to="/products/spawn-seeds" className="bg-surface-white p-6 rounded-feature group block border border-surface-border hover:border-forest-700/40 shadow-level-1 hover-lift transition-all">
            <div className="w-12 h-12 rounded-container bg-surface-cream border border-surface-border flex items-center justify-center text-gold mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-forest-900 group-hover:text-forest-700 transition-colors">Spawn Seeds</h3>
            <p className="text-xs text-typography-secondary mt-1">1st gen pure wheat grain master spawn for growers.</p>
          </Link>

          <Link to="/products/growing-kits" className="bg-surface-white p-6 rounded-feature group block border border-surface-border hover:border-forest-700/40 shadow-level-1 hover-lift transition-all">
            <div className="w-12 h-12 rounded-container bg-surface-cream border border-surface-border flex items-center justify-center text-forest-700 mb-4 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-forest-900 group-hover:text-forest-700 transition-colors">DIY Growing Kits</h3>
            <p className="text-xs text-typography-secondary mt-1">Harvest mushrooms at home in 10-14 days.</p>
          </Link>
        </div>
      </section>

      {/* 3. PRODUCTS SECTION */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-forest-900">Featured Products & Seeds</h2>
            <p className="text-typography-secondary text-xs sm:text-sm">High-demand mushroom products available across India</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1.5 hover-lift">
            View Full Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-white p-6 rounded-feature animate-pulse h-80 border border-surface-border"></div>
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
                <div key={product.id} className="bg-surface-white rounded-feature overflow-hidden flex flex-col justify-between border border-surface-border shadow-level-1 group hover-lift">
                  <div>
                    <Link to={`/product/${product.slug}`} className="relative h-52 overflow-hidden block bg-surface-cream">
                      <MediaImage
                        src={primaryImg}
                        alt={`${product.title} - Fresh mushroom & spawn supply India`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 bg-surface-white/90 backdrop-blur-md text-forest-900 text-[10px] font-bold rounded-input border border-surface-border shadow-level-1">
                        {product.categoryName}
                      </span>
                      <div className="absolute top-3 right-3">
                        <AvailabilityBadge availability={availability} />
                      </div>
                    </Link>
                    <div className="p-5 space-y-2">
                      <Link to={`/product/${product.slug}`} className="font-display font-bold text-lg text-forest-900 group-hover:text-forest-700 transition-colors block">
                        {product.title}
                      </Link>
                      <p className="text-xs text-typography-secondary line-clamp-2">{product.description}</p>

                      {product.variants && product.variants.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 pt-2" data-testid="landing-product-variants">
                          {product.variants.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setSelectedVariants({ ...selectedVariants, [product.id]: v })}
                              className={`px-2.5 py-1 rounded-compact text-[11px] font-medium border transition-all button-press ${
                                activeVariant?.id === v.id
                                  ? 'bg-surface-cream border-forest-700 text-forest-900 font-bold shadow-level-1'
                                  : 'bg-surface-neutral border-surface-border text-typography-secondary hover:border-surface-border'
                              }`}
                            >
                              {v.variantName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between border-t border-surface-border mt-4">
                    <div>
                      <span className="text-[10px] text-typography-muted block font-medium">{activeVariant.variantName}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-forest-900 font-display">₹{activeVariant.priceInr}</span>
                        {activeVariant.compareAtPriceInr && Number(activeVariant.compareAtPriceInr) > Number(activeVariant.priceInr) && (
                          <span className="text-xs text-typography-muted line-through font-medium" data-testid="strikeout-price">
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
                      className={`font-semibold text-xs px-4 py-2.5 rounded-input transition-all button-press ${
                        isAvailable
                          ? 'btn-primary shadow-level-1'
                          : 'bg-surface-neutral text-typography-muted cursor-not-allowed border border-surface-border'
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

      {/* 4. TRAINING SECTION */}
      <section id="training" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-forest-900 text-white rounded-hero p-8 sm:p-12 border border-forest-800 relative overflow-hidden shadow-level-2 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-forest-700/60 pb-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-forest-800 text-sage text-xs font-bold border border-forest-700/60 shadow-level-1">
                <GraduationCap className="w-4 h-4 text-leaf" />
                <span>Certified Agribusiness Masterclasses</span>
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white leading-tight">
                Mushroom Cultivation & <br />
                <span className="text-gold">Spawn Production Masterclasses</span>
              </h2>
              <p className="text-surface-cream/90 text-sm max-w-2xl leading-relaxed">
                Join our expert agronomist-led online and offline laboratory workshops. Gain practical knowledge on substrate pasteurization, tissue isolation, cleanroom operations, and direct buyback market linkage.
              </p>
            </div>

            <Link
              to="/training"
              className="btn-premium text-xs font-bold px-6 py-3.5 shadow-level-2 shrink-0 flex items-center justify-center gap-2"
            >
              <span>Explore All Masterclasses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.length > 0 ? (
              courses.slice(0, 3).map((c) => (
                <div key={c.id} className="p-6 rounded-card bg-forest-800/80 border border-forest-700/60 flex flex-col justify-between space-y-4 hover-lift">
                  <div className="space-y-3">
                    <span className="px-2.5 py-1 rounded-pill bg-forest-900 border border-forest-700 text-sage text-[10px] font-bold uppercase">
                      {c.mode || 'ONLINE & OFFLINE'}
                    </span>
                    <h3 className="font-bold text-white text-base font-display">{c.title}</h3>
                    <p className="text-xs text-sage line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="pt-4 border-t border-forest-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-sage block font-medium">Course Fee</span>
                      <span className="text-lg font-bold text-gold font-display">₹{c.priceInr?.toLocaleString('en-IN') || c.feeInr?.toLocaleString('en-IN')}</span>
                    </div>
                    <Link
                      to={`/training/${c.slug}`}
                      className="px-4 py-2 bg-leaf hover:bg-green-600 text-forest-900 font-bold rounded-input text-xs transition-colors"
                    >
                      Enroll Now
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              [
                { title: 'Commercial Oyster Mushroom Cultivation Masterclass', duration: '7 Days', fee: '2,999', slug: 'commercial-oyster-mushroom-masterclass' },
                { title: 'Spawn Production & Lab Setup Workshop', duration: '10 Days', fee: '4,999', slug: 'spawn-production-lab-setup' },
                { title: 'Button Mushroom Environmental Control Course', duration: '5 Days', fee: '3,499', slug: 'button-mushroom-environmental-control' }
              ].map((c, idx) => (
                <div key={idx} className="p-6 rounded-card bg-forest-800/80 border border-forest-700/60 flex flex-col justify-between space-y-4 hover-lift">
                  <div className="space-y-3">
                    <span className="px-2.5 py-1 rounded-pill bg-forest-900 border border-forest-700 text-sage text-[10px] font-bold uppercase">
                      CERTIFIED WORKSHOP
                    </span>
                    <h3 className="font-bold text-white text-base font-display">{c.title}</h3>
                    <p className="text-xs text-sage leading-relaxed">Hands-on practical substrate preparation, inoculation techniques, and buyback market linkages.</p>
                  </div>

                  <div className="pt-4 border-t border-forest-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-sage block font-medium">Fee</span>
                      <span className="text-lg font-bold text-gold font-display">₹{c.fee}</span>
                    </div>
                    <Link
                      to="/training"
                      className="px-4 py-2 bg-leaf hover:bg-green-600 text-forest-900 font-bold rounded-input text-xs transition-colors"
                    >
                      Enroll Now
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. ABOUT SECTION */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-white rounded-hero p-8 sm:p-12 border border-surface-border shadow-level-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-forest-900/10 border border-forest-900/20 text-forest-800 text-xs font-semibold">
                About Sporekart Agritech
              </span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-typography-primary leading-tight">
                Pioneering Organic Mushroom Supply & <br />
                <span className="text-forest-700">Grower Incubation in India</span>
              </h2>
              <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
                Sporekart bridges the gap between laboratory mycology and commercial mushroom farming. We equip agricultural entrepreneurs and home growers with lab-certified mother spawn, climate-controlled farm blueprints, and direct market buyback linkages across India.
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

              <div className="pt-2">
                <Link
                  to="/about"
                  className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-xs font-bold"
                >
                  <span>Learn More About Sporekart</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
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
                <HeartHandshake className="w-7 h-7 text-green-600" />
                <h3 className="font-bold text-typography-primary text-sm">Market Buyback Linkage</h3>
                <p className="text-xs text-typography-secondary leading-relaxed">Connecting trained growers with hotel chains, supermarket suppliers, and dehydration units.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BLOGS SECTION */}
      <section id="blogs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-forest-900">Agritech Science Blog & Guides</h2>
            <p className="text-typography-secondary text-xs sm:text-sm">Expert technical articles, financial models, and cultivation guides</p>
          </div>
          <Link to="/blog" className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1.5 hover-lift">
            View All Articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_POSTS.slice(0, 3).map((post) => (
            <article
              key={post.id}
              className="bg-surface-white p-6 rounded-feature border border-surface-border shadow-level-1 flex flex-col justify-between space-y-4 hover:border-forest-700/40 transition-all group hover-lift"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-typography-muted">
                  <span className="px-2.5 py-1 rounded-pill bg-forest-900/10 border border-forest-900/15 text-forest-800 font-semibold">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-forest-700" /> {post.readTime}
                  </span>
                </div>

                <h3 className="font-display font-bold text-base text-typography-primary group-hover:text-forest-700 transition-colors line-clamp-2">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>

                <p className="text-xs text-typography-secondary leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-surface-border flex items-center justify-between text-xs">
                <span className="text-typography-muted text-[11px] flex items-center gap-1">
                  <User className="w-3 h-3 text-forest-700" /> {post.author.split(' ')[0]} {post.author.split(' ')[1]}
                </span>
                <Link
                  to={`/blog/${post.slug}`}
                  className="text-forest-700 font-bold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Read Guide <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-white rounded-hero p-8 sm:p-12 border border-surface-border shadow-level-1 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-surface-cream border border-surface-border text-forest-700 text-xs font-bold">
              <HelpCircle className="w-4 h-4 text-forest-700" />
              <span>Got Questions? We Have Answers</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-forest-900">
              Frequently Asked Questions
            </h2>
            <p className="text-typography-secondary text-sm">
              Everything you need to know about spawn ordering, cold-chain delivery, masterclasses, and grower buyback support.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`rounded-feature border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-surface-cream/70 border-forest-700/40 shadow-level-1'
                      : 'bg-surface-white border-surface-border hover:border-surface-border'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-forest-900 text-sm sm:text-base focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-forest-900/10 text-forest-800 text-xs flex items-center justify-center font-extrabold shrink-0">
                        Q{index + 1}
                      </span>
                      <span>{faq.question}</span>
                    </span>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-200 ${
                      isOpen ? 'bg-forest-700 text-white border-forest-700 rotate-180' : 'bg-surface-cream text-typography-secondary border-surface-border'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-typography-secondary leading-relaxed border-t border-forest-700/10 animate-fade-in pl-14">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. CONTACT SECTION */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-cream rounded-hero p-8 sm:p-12 border border-surface-border shadow-level-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Contact Details Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-forest-900/10 border border-forest-900/20 text-forest-800 text-xs font-bold">
                  <Phone className="w-3.5 h-3.5 text-forest-700" />
                  <span>Agronomist Helpline & Support</span>
                </span>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-forest-900 leading-tight">
                  Get in Touch with Sporekart
                </h2>
                <p className="text-typography-secondary text-xs sm:text-sm leading-relaxed">
                  Have inquiries regarding bulk spawn seeds, climate-controlled farm blueprints, or course enrollments? Our team of certified agronomists is here to assist you.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-card bg-surface-white border border-surface-border shadow-level-1 hover-lift">
                  <div className="w-10 h-10 rounded-xl bg-forest-900/10 border border-forest-900/20 flex items-center justify-center text-forest-700 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-forest-900 text-xs sm:text-sm">AgriTech Innovation Hub</h3>
                    <p className="text-xs text-typography-secondary mt-0.5">Plot 45, Agritech Park, Shivajinagar, Pune, MH 411001</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-card bg-surface-white border border-surface-border shadow-level-1 hover-lift">
                  <div className="w-10 h-10 rounded-xl bg-forest-900/10 border border-forest-900/20 flex items-center justify-center text-forest-700 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-forest-900 text-xs sm:text-sm">Grower Helpline</h3>
                    <p className="text-xs text-typography-secondary mt-0.5">+91 98765 43210 / +91 98230 11223</p>
                    <p className="text-[11px] text-typography-muted">Mon - Sat: 9:00 AM - 7:00 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-card bg-surface-white border border-surface-border shadow-level-1 hover-lift">
                  <div className="w-10 h-10 rounded-xl bg-forest-900/10 border border-forest-900/20 flex items-center justify-center text-forest-700 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-forest-900 text-xs sm:text-sm">Email Support</h3>
                    <p className="text-xs text-typography-secondary mt-0.5">support@sporekart.in / advisory@sporekart.in</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Inquiry Form Column */}
            <div className="lg:col-span-7 bg-surface-white p-6 sm:p-8 rounded-feature border border-surface-border shadow-level-1">
              <h3 className="font-display font-bold text-xl text-forest-900 mb-2 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-forest-700" />
                <span>Send Quick Agronomist Inquiry</span>
              </h3>
              <p className="text-xs text-typography-secondary mb-6">Fill out the quick form below and an agronomist will respond within 2-4 business hours.</p>

              {contactSubmitted ? (
                <div className="p-6 rounded-card bg-surface-cream border border-forest-700/40 text-center space-y-3 animate-scale-in">
                  <div className="w-12 h-12 rounded-full bg-forest-700 text-white flex items-center justify-center mx-auto shadow-level-1">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-forest-900 text-lg">Inquiry Submitted Successfully!</h4>
                  <p className="text-xs text-typography-secondary max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-forest-900">{contactFormData.name}</strong>. Our senior mushroom agronomist team has received your message and will reach out to you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactFormData({ name: '', emailOrPhone: '', inquiryType: 'Spawn Order Inquiry', message: '' });
                    }}
                    className="btn-secondary text-xs px-5 py-2.5 rounded-input mt-2 font-bold"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-forest-900 mb-1.5">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={contactFormData.name}
                        onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-input bg-surface-cream border border-surface-border focus:border-forest-700 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-forest-900 mb-1.5">Phone or Email *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +91 9876543210"
                        value={contactFormData.emailOrPhone}
                        onChange={(e) => setContactFormData({ ...contactFormData, emailOrPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-input bg-surface-cream border border-surface-border focus:border-forest-700 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-forest-900 mb-1.5">Inquiry Type</label>
                    <select
                      value={contactFormData.inquiryType}
                      onChange={(e) => setContactFormData({ ...contactFormData, inquiryType: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-input bg-surface-cream border border-surface-border focus:border-forest-700 focus:outline-none transition-colors font-medium"
                    >
                      <option value="Spawn Order Inquiry">Bulk Mother Spawn Order</option>
                      <option value="Training & Masterclass">Training Workshop & Certification</option>
                      <option value="Farm Setup Consultancy">Climate-Controlled Farm Setup</option>
                      <option value="Buyback Linkage">Grower Buyback Program</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-forest-900 mb-1.5">Your Message / Requirements</label>
                    <textarea
                      rows="3"
                      placeholder="Briefly describe your requirements or farm location..."
                      value={contactFormData.message}
                      onChange={(e) => setContactFormData({ ...contactFormData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-input bg-surface-cream border border-surface-border focus:border-forest-700 focus:outline-none transition-colors"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary py-3 text-xs sm:text-sm font-bold shadow-level-1 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Submit Agronomist Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
