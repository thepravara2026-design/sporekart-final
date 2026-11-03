import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sprout, GraduationCap, ArrowRight, Award, Zap, CheckCircle2, 
  Layers, ShieldCheck, HeartHandshake, Phone, Mail, MapPin, Send, MessageSquare, 
  Wrench, ChevronRight, HelpCircle, ChevronDown, Truck, PackageCheck
} from 'lucide-react';
import { catalogApi, trainingApi } from '../api';
import SeoHead from '../components/SeoHead';
import HeroSection from '../components/HeroSection';
import AgriTechTrustBar from '../components/AgriTechTrustBar';
import FarmTechnologySection from '../components/FarmTechnologySection';
import TrainingEducationSection from '../components/TrainingEducationSection';
import CustomerTestimonialsSection from '../components/CustomerTestimonialsSection';
import CategoryCarousel from '../components/CategoryCarousel';
import ProductCard from '../components/ProductCard';
import ContactSection from '../components/ContactSection';
import LandingPageScrollExperience from '../components/LandingPageScrollExperience';
import { useCart } from '../context/CartContext';

const PRESET_CAT_MAP = {
  'fresh-mushrooms': {
    defaultDesc: 'Daily harvested Button, Oyster & Milky varieties.',
    defaultImg: '/sporekart-white-button.jpg',
    icon: Sprout
  },
  'spawn-seeds': {
    defaultDesc: '1st-gen pure wheat grain spawn with guaranteed 99.8% viability.',
    defaultImg: '/sporekart-cultivation-stage1-lab.jpg',
    icon: Zap
  },
  'growing-kits': {
    defaultDesc: 'Ready-to-fruit indoor kits — harvest fresh in 10-14 days.',
    defaultImg: '/sporekart-oyster-cluster.jpg',
    icon: Award
  },
  'equipment-supplies': {
    defaultDesc: 'Steam-sterilized paddy straw, PP bags, sprayers & lab tools.',
    defaultImg: '/sporekart-farm-scientist.jpg',
    icon: Wrench
  },
  'dry-mushrooms': {
    defaultDesc: 'Naturally dried mushroom slices rich in aroma and umami.',
    defaultImg: '/sporekart-shiitake.jpg',
    icon: Layers
  }
};

const DEFAULT_CATEGORY_IMG = '/sporekart-white-button.jpg';

const getCategoryIcon = (slug = '', name = '') => {
  const norm = (slug + ' ' + name).toLowerCase();
  if (norm.includes('fresh')) return Sprout;
  if (norm.includes('dry') || norm.includes('dried')) return Layers;
  if (norm.includes('spawn') || norm.includes('seed')) return Zap;
  if (norm.includes('kit') || norm.includes('grow')) return Award;
  if (norm.includes('equipment') || norm.includes('tool') || norm.includes('supply')) return Wrench;
  if (norm.includes('medicinal') || norm.includes('health') || norm.includes('extract')) return ShieldCheck;
  if (norm.includes('course') || norm.includes('train')) return GraduationCap;
  return Layers;
};

export default function HomePage({ onAddToCart: propOnAddToCart }) {
  const { addToCart } = useCart();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [glimpses, setGlimpses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);

  const displayCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((cat) => {
        const preset = PRESET_CAT_MAP[cat.slug] || {};
        return {
          id: cat.id || cat.slug,
          slug: cat.slug,
          name: cat.name,
          desc: cat.description || preset.defaultDesc || `Explore our laboratory-certified ${cat.name} offerings.`,
          imgUrl: cat.imageUrl || preset.defaultImg || DEFAULT_CATEGORY_IMG,
          IconComp: preset.icon || getCategoryIcon(cat.slug, cat.name)
        };
      });
    }

    return Object.entries(PRESET_CAT_MAP).map(([slug, preset]) => ({
      id: slug,
      slug,
      name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      desc: preset.defaultDesc,
      imgUrl: preset.defaultImg,
      IconComp: preset.icon
    }));
  }, [categories]);

  // FAQ State
  const [openFaq, setOpenFaq] = useState(0);
  const [faqCategory, setFaqCategory] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes, courseRes, glimpseRes] = await Promise.allSettled([
          catalogApi.getProducts(),
          catalogApi.getCategories(),
          trainingApi.getCourses(),
          typeof trainingApi.getGlimpses === 'function' ? trainingApi.getGlimpses() : Promise.resolve({ data: { data: [] } }),
        ]);

        if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data?.data || []);
        if (catRes.status === 'fulfilled') setCategories(catRes.value.data?.data || []);
        if (courseRes.status === 'fulfilled') setCourses(courseRes.value.data?.data || []);
        if (glimpseRes.status === 'fulfilled') setGlimpses(glimpseRes.value.data?.data || []);
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Smooth scroll support for hash navigation (e.g. /#farm, /#training, /#sustainability, /#faq)
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          const yOffset = -76;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }, 120);
      }
    }
  }, [location]);

  const FAQ_CATEGORIES = ['All', 'Spawn & Quality', 'Cultivation', 'Training & Buyback', 'Payment'];

  const FAQS = [
    {
      category: 'Spawn & Quality',
      topic: 'Cold-Chain Logistics',
      question: "How is Sporekart grain spawn packaged and shipped across India?",
      takeaway: "Shipped within 24-48 hours in breathable microporous filter bags with insulated cold-chain boxes.",
      answer: "Cultured on 1st-generation sterile wheat grains under sterile laminar air flow in Davangere. Every batch is sealed in breathable filter-patch bags with temperature insulation to maintain 99.8% mycelial viability throughout transit.",
      specs: ['24-48h Express Dispatch', 'Breathable Filter Bags', 'Temperature Insulated'],
      trustBadge: "99.8% Viability Guaranteed"
    },
    {
      category: 'Cultivation',
      topic: 'Farm Gate & Substrate',
      question: "Where are Sporekart fresh mushrooms grown and what substrate is used?",
      takeaway: "Harvested fresh at 5:00 AM in Davangere on steam-sterilized organic paddy straw with zero chemical sprays.",
      answer: "Our fruiting chambers are located in Davangere, Karnataka. We cultivate Button, Oyster, and Milky mushrooms exclusively on high-pressure steam-sterilized organic paddy straw, guaranteeing 100% pesticide-free, chemical-free produce.",
      specs: ['Harvested at 5:00 AM', 'Steam-Sterilized Straw', 'Zero Pesticides'],
      trustBadge: "FSSAI Lic. #10020011000123"
    },
    {
      category: 'Training & Buyback',
      topic: 'Commercial Linkage',
      question: "Do you offer direct market buyback linkages for trained growers?",
      takeaway: "Direct contractual buyback network connecting certified graduates with verified buyers.",
      answer: "Commercial growers who complete our certified masterclasses gain access to our buyback network, connecting them with wholesale hotel chains, supermarket suppliers, and dry mushroom processing units with transparent floor pricing.",
      specs: ['Verified Hotel Chains', 'Supermarket Linkages', 'Dry Processing Buyback'],
      trustBadge: "Contractual Buyback"
    },
    {
      category: 'Cultivation',
      topic: 'Beginner Growing',
      question: "Can beginners start mushroom cultivation at home without specialized equipment?",
      takeaway: "Zero specialized gear required — ready-to-fruit kits yield harvest in 10-14 days.",
      answer: "Our DIY Mushroom Growing Kits come fully colonized and ready to fruit. Simply place the kit in a humid indoor spot away from direct sunlight, mist with water twice daily, and harvest your first fresh gourmet mushrooms.",
      specs: ['10-14 Days to Harvest', 'No Machinery Needed', 'Twice-Daily Misting Only'],
      trustBadge: "Beginner Friendly"
    },
    {
      category: 'Spawn & Quality',
      topic: 'Storage & Shelf Life',
      question: "What is the shelf life and storage requirement for mushroom spawn?",
      takeaway: "Remains 100% viable for up to 60 days when refrigerated at 4°C–8°C.",
      answer: "Store in a cool, dark room between 15°C–20°C for up to 20 days, or refrigerate at 4°C–8°C for up to 60 days. Our sterile packaging prevents moisture loss and contamination, preserving pure mycelium vigor.",
      specs: ['Up to 60 Days Storage', 'Ideal Temp: 4°C–8°C', 'Contamination-Proof Seal'],
      trustBadge: "Lab-Tested Viability"
    },
    {
      category: 'Training & Buyback',
      topic: 'Practical Workshops',
      question: "Where are your hands-on practical training workshops conducted?",
      takeaway: "Davangere Farm & Culture Laboratory in Karnataka + Interactive Online Masterclasses.",
      answer: "Practical hands-on training is hosted at our commercial farm and laboratory in Davangere, Karnataka. Trainees receive direct guidance on paddy straw sterilization, cleanroom inoculation, and climate management with assured buyback support.",
      specs: ['Davangere Farm Facility', 'Hands-On Lab Training', 'Assured Buyback Linkage'],
      trustBadge: "Certified Mycology Faculty"
    },
    {
      category: 'Payment',
      topic: 'Secure Checkout',
      question: "What payment options are accepted on Sporekart?",
      takeaway: "100% secure 256-bit encrypted checkout via Razorpay with instant digital GST invoice.",
      answer: "We support UPI (Google Pay, PhonePe, Paytm), NetBanking, and all major Credit/Debit Cards via Razorpay with real-time order tracking and GST-compliant invoicing.",
      specs: ['Instant UPI & Cards', 'Razorpay 256-Bit SSL', 'Instant Digital GST Invoice'],
      trustBadge: "100% Safe Payments"
    }
  ];

  const filteredFaqs = useMemo(() => {
    if (faqCategory === 'All') return FAQS;
    return FAQS.filter(faq => faq.category === faqCategory);
  }, [faqCategory, FAQS]);

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
    <div className="space-y-12 sm:space-y-16 pb-20 animate-fade-in text-typography-primary relative">
      <LandingPageScrollExperience />
      <SeoHead
        title="Sporekart — Fresh Mushrooms, Pure Grain Spawn & Certified Training in India"
        description="Fresh gourmet button & oyster mushrooms harvested daily at 5:00 AM, 1st-generation pure wheat grain spawn, and certified grower training in Davangere, Karnataka."
        canonicalUrl="https://sporekart.in"
        structuredData={websiteSchema}
      />

      {/* 1. HERO SECTION */}
      <div id="hero" className="scroll-mt-20">
        <HeroSection />
      </div>

      {/* 2. AGRI-TRUST STRIP */}
      <div id="trust-standards" className="landing-scroll-reveal scroll-mt-24">
        <AgriTechTrustBar />
      </div>

      {/* 3. FEATURED CATEGORIES & FRESH HARVEST CATALOG */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 landing-scroll-reveal scroll-mt-24">
        <div id="store" className="scroll-mt-24" />
        <div id="varieties" className="scroll-mt-24" />
        <CategoryCarousel categories={displayCategories} />

        {/* Fresh Harvest & Spawn Products Grid */}
        {products && products.length > 0 && (
          <div className="pt-10 sm:pt-14 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-surface-border/60">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest-800 font-sans mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  <span>HARVESTED FRESH DAILY &bull; DAVANGERE FARM</span>
                </div>
                <h3 className="font-display font-bold text-2xl sm:text-3xl text-forest-900">
                  Fresh Pickings &amp; Laboratory Pure Spawn
                </h3>
                <p className="text-typography-secondary text-xs sm:text-sm mt-0.5">
                  Hand-picked at 5:00 AM today and freshly inoculated 1st-generation wheat grain cultures.
                </p>
              </div>
              <Link
                to="/products"
                className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 hover-lift shrink-0 bg-surface-cream px-3 py-2 rounded-xl border border-surface-border shadow-level-1"
              >
                <span>View Full Storefront ({products.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.slice(0, 8).map((prod) => (
                <ProductCard key={prod.id} product={prod} onAddToCart={propOnAddToCart} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 4. THE FARM & HYGIENE STORY (CONCISE) */}
      <div id="about" className="landing-scroll-reveal scroll-mt-24">
        <div id="farm" className="scroll-mt-24" />
        <FarmTechnologySection showLearnMore={true} />
      </div>

      {/* 5. COMMERCIAL GROWER & TRAINING SPOTLIGHT */}
      <div id="training" className="landing-scroll-reveal scroll-mt-24">
        <div id="calculator" className="scroll-mt-24" />
        <TrainingEducationSection />
      </div>

      {/* 6. VERIFIED CUSTOMER & FARMER FEEDBACK */}
      <div id="testimonials" className="landing-scroll-reveal scroll-mt-24">
        <div id="testimonials-container" className="scroll-mt-24" />
        <CustomerTestimonialsSection />
      </div>

      {/* Navigation Anchor aliases for legacy bookmarks */}
      <div id="why-choose-us" className="scroll-mt-24" />
      <div id="sustainability" className="scroll-mt-24" />

      {/* 7. TRANSPARENT FAQ SECTION */}
      <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 landing-scroll-reveal scroll-mt-24" aria-label="Frequently Asked Questions">
        <div className="relative rounded-[26px] sm:rounded-[36px] overflow-hidden border border-surface-border shadow-2xl bg-surface-cream text-forest-950">
          
          {/* Background Image: 80% Clearly Visible Fitted into Entire Section */}
          <div className="absolute inset-0 z-0">
            <img
              src="/sporekart-faq-bg.jpg"
              alt="Organic mushroom gill patterns texture"
              width="1920"
              height="1080"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center opacity-80 transition-transform duration-700 hover:scale-[1.01]"
            />
            {/* Ambient natural gradient preserving 80% visible gill texture with high text contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-surface-cream/40 via-transparent to-surface-cream/50 pointer-events-none" />
          </div>

          {/* Interactive Content Container */}
          <div className="relative z-10 p-5 sm:p-8 lg:p-12 space-y-7 sm:space-y-8">
            
            {/* Header Titles */}
            <div className="text-center max-w-2xl mx-auto space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest-800 font-sans flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                <span>TRANSPARENT FARM DIRECT ANSWERS</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-forest-950 leading-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-forest-900/80 text-xs sm:text-sm md:text-base font-medium max-w-lg mx-auto">
                Honest answers on daily harvest timing, sterile wheat spawn viability, and commercial buyback.
              </p>
            </div>

            {/* 3 Minimal Descriptive Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto landing-stagger-parent">
              <div className="stagger-item card-interactive p-3 sm:p-3.5 rounded-2xl bg-white/75 hover:bg-white/95 backdrop-blur-md border border-white/70 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest-900/10 text-forest-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-forest-800" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-[13px] text-forest-950 leading-tight">
                    100% Pure Spawn
                  </div>
                  <div className="text-[11px] text-forest-800/80 leading-tight truncate">
                    1st gen wheat grain &bull; 99.8% viability
                  </div>
                </div>
              </div>

              <div className="stagger-item card-interactive p-3 sm:p-3.5 rounded-2xl bg-white/75 hover:bg-white/95 backdrop-blur-md border border-white/70 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest-900/10 text-forest-800 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-forest-800" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-[13px] text-forest-950 leading-tight">
                    Pan-India Cold Chain
                  </div>
                  <div className="text-[11px] text-forest-800/80 leading-tight truncate">
                    24-48h insulated express transit
                  </div>
                </div>
              </div>

              <div className="stagger-item card-interactive p-3 sm:p-3.5 rounded-2xl bg-white/75 hover:bg-white/95 backdrop-blur-md border border-white/70 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest-900/10 text-forest-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-forest-800" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-[13px] text-forest-950 leading-tight">
                    Market Buyback Linkage
                  </div>
                  <div className="text-[11px] text-forest-800/80 leading-tight truncate">
                    Direct hotel & wholesale network
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Category Filter Pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
              {FAQ_CATEGORIES.map((cat) => {
                const isActive = faqCategory === cat;
                const count = cat === 'All' ? FAQS.length : FAQS.filter(f => f.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setFaqCategory(cat);
                      setOpenFaq(0);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-forest-900 text-emerald-300 shadow-sm scale-[1.02]'
                        : 'bg-white/70 hover:bg-white text-forest-800 border border-white/60'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-forest-800 text-emerald-200' : 'bg-forest-900/10 text-forest-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Accordion Questions List */}
            <div className="max-w-3xl mx-auto space-y-3 sm:space-y-3.5">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={faq.question}
                    className={`rounded-2xl transition-all duration-200 overflow-hidden backdrop-blur-md ${
                      isOpen
                        ? 'bg-white/95 border-2 border-forest-700/50 shadow-level-2'
                        : 'bg-white/80 hover:bg-white/95 border border-white/70 hover:border-forest-700/30 shadow-level-1'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full text-left p-3.5 sm:p-4.5 flex items-start justify-between gap-3 font-bold text-forest-950 text-xs sm:text-sm md:text-base focus:outline-none cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-forest-900/10 text-forest-800">
                            {faq.topic}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-800/80">
                            ✓ {faq.trustBadge}
                          </span>
                        </div>
                        <div className="leading-snug pt-0.5">
                          {faq.question}
                        </div>
                      </div>
                      <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-200 mt-0.5 ${
                        isOpen 
                          ? 'bg-forest-700 text-white border-forest-700 rotate-180' 
                          : 'bg-surface-cream text-forest-800 border-surface-border'
                      }`}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-forest-700/10 animate-fade-in space-y-2.5">
                        {/* Minimal Highlight Pill */}
                        <div className="p-2.5 rounded-xl bg-forest-900/5 border border-forest-700/15 flex items-start gap-2 mt-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-[13px] font-bold text-forest-950 leading-tight">
                            {faq.takeaway}
                          </p>
                        </div>

                        {/* Descriptive Detail */}
                        <p className="text-xs sm:text-[13px] text-forest-900/85 leading-relaxed font-normal">
                          {faq.answer}
                        </p>

                        {/* Minimal Specs Micro-Pills */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {faq.specs.map((spec) => (
                            <span key={spec} className="text-[10px] px-2.5 py-0.5 rounded-full bg-forest-900/5 text-forest-800 border border-forest-700/15 font-medium">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Trust & Direct Grower Assistance Footer */}
            <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="space-y-0.5">
                <div className="font-bold text-xs sm:text-sm text-forest-950">
                  Have questions about spawn viability or commercial cultivation?
                </div>
                <div className="text-[11px] text-forest-800/80">
                  Our Davangere farm agronomists are available for direct grower advice.
                </div>
              </div>
              <a
                href="https://wa.me/918277559093?text=Hi%20Sporekart%20Team%2C%20I%20have%20a%20question%20about%20your%20spawn%20and%20cultivation."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest-900 hover:bg-forest-800 text-emerald-300 hover:text-emerald-200 text-xs font-bold shadow-sm transition-all shrink-0 button-press"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp (+91 8277559093)</span>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 8. CONTACT & ENTERPRISE SECTION */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 landing-scroll-reveal scroll-mt-24">
        <ContactSection />
      </section>
    </div>
  );
}
