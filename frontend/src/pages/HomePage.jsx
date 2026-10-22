import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sprout, GraduationCap, ArrowRight, Award, Zap, CheckCircle2, Sparkles, 
  Layers, ShieldCheck, HeartHandshake, Phone, Mail, MapPin, Send, MessageSquare, 
  Wrench, ChevronRight, HelpCircle, ChevronDown, Truck
} from 'lucide-react';
import { catalogApi, trainingApi } from '../api';
import SeoHead from '../components/SeoHead';
import HeroSection from '../components/HeroSection';
import AgriTechTrustBar from '../components/AgriTechTrustBar';
import MushroomVarietiesSection from '../components/MushroomVarietiesSection';
import FarmTechnologySection from '../components/FarmTechnologySection';
import WhyChooseUsSection from '../components/WhyChooseUsSection';
import TrainingEducationSection from '../components/TrainingEducationSection';
import SustainabilitySection from '../components/SustainabilitySection';
import CustomerTestimonialsSection from '../components/CustomerTestimonialsSection';
import CategoryCarousel from '../components/CategoryCarousel';
import ContactSection from '../components/ContactSection';
import { useCart } from '../context/CartContext';

const PRESET_CAT_MAP = {
  'fresh-mushrooms': {
    defaultDesc: 'Daily harvested Button, Oyster & Milky varieties.',
    defaultImg: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80',
    icon: Sprout
  },
  'dry-mushrooms': {
    defaultDesc: 'Sun-dried & dehydrated rich umami mushroom slices.',
    defaultImg: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    icon: Layers
  },
  'spawn-seeds': {
    defaultDesc: '1st gen pure wheat grain master spawn for growers.',
    defaultImg: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80',
    icon: Zap
  },
  'growing-kits': {
    defaultDesc: 'Harvest mushrooms at home in 10-14 days.',
    defaultImg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    icon: Award
  },
  'equipment-supplies': {
    defaultDesc: 'Autoclave bags, PP bags, sprayers & lab tools.',
    defaultImg: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    icon: Wrench
  }
};

const DEFAULT_CATEGORY_IMG = 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80';

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
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      takeaway: "Shipped within 24-48 hours in sterile filter-patch bags with insulated cold-chain packaging.",
      answer: "Cultured on 1st generation sterile wheat grains under laminar air flow. Every batch is sealed in breathable filter-patch bags with temperature insulation to maintain 100% mycelial viability throughout transit.",
      specs: ['24-48h Express Dispatch', 'Breathable Filter Bags', 'Temperature Insulated'],
      trustBadge: "100% Viability Guaranteed"
    },
    {
      category: 'Training & Buyback',
      topic: 'Commercial Linkage',
      question: "Do you offer direct market buyback linkages for trained growers?",
      takeaway: "Direct market buyback network connecting certified graduates with verified buyers.",
      answer: "Commercial growers who complete our certified masterclasses gain access to our buyback network, connecting them with wholesale hotel chains, supermarket suppliers, and dry mushroom processing units.",
      specs: ['Verified Hotel Chains', 'Supermarket Linkages', 'Dry Processing Buyback'],
      trustBadge: "Certified Grower Network"
    },
    {
      category: 'Cultivation',
      topic: 'Beginner Growing',
      question: "Can beginners start mushroom cultivation at home without specialized equipment?",
      takeaway: "Zero specialized gear required — ready-to-fruit kits yield harvest in 10-14 days.",
      answer: "Our DIY Mushroom Growing Kits come fully colonized and ready to fruit. Simply place the kit in a humid indoor spot, spray with water twice daily, and harvest your first fresh gourmet mushrooms.",
      specs: ['10-14 Days to Harvest', 'No Machinery Needed', 'Twice-Daily Misting Only'],
      trustBadge: "Beginner Friendly"
    },
    {
      category: 'Spawn & Quality',
      topic: 'Storage & Shelf Life',
      question: "What is the shelf life and storage requirement for mushroom spawn?",
      takeaway: "Remains 100% viable for up to 60 days when refrigerated at 4°C–8°C.",
      answer: "Store in a cool, dark room between 15°C–20°C, or refrigerate at 4°C–8°C. Our sterile packaging prevents moisture loss and bacterial contamination, preserving mycelium vigor.",
      specs: ['Up to 60 Days Storage', 'Ideal Temp: 4°C–8°C', 'Contamination-Proof Seal'],
      trustBadge: "Lab-Tested Viability"
    },
    {
      category: 'Training & Buyback',
      topic: 'Practical Workshops',
      question: "Where are your hands-on practical training workshops conducted?",
      takeaway: "Pune AgriTech Innovation Hub + Interactive Weekend Online Masterclasses.",
      answer: "Practical hands-on lab training is hosted at our Innovation Hub in Pune, Maharashtra. Online growers across India receive live video coaching with a physical hands-on kit delivered beforehand.",
      specs: ['Pune Innovation Hub', 'Weekend Online Batches', 'Free Kit Included'],
      trustBadge: "Certified Mycology Faculty"
    },
    {
      category: 'Payment',
      topic: 'Secure Checkout',
      question: "What payment options are accepted on Sporekart?",
      takeaway: "100% secure 256-bit encrypted checkout via Razorpay with instant digital invoice.",
      answer: "We support UPI (Google Pay, PhonePe, Paytm), NetBanking, Credit/Debit Cards, and Wallets with real-time order tracking and GST-compliant invoicing.",
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
    <div className="space-y-12 sm:space-y-16 pb-20 animate-fade-in text-typography-primary">
      <SeoHead
        title="Sporekart — Fresh Mushrooms, Pure Grain Spawn & Certified Training in India"
        description="India's leading platform for organic fresh button & oyster mushrooms, 1st generation grain spawn seeds, indoor DIY growing kits, and certified commercial grower workshops."
        canonicalUrl="https://sporekart.in"
        structuredData={websiteSchema}
      />

      {/* SECTION B: HERO SECTION */}
      <HeroSection />

      {/* SECTION B2: AGRITECH TRUST BAR */}
      <AgriTechTrustBar />

      {/* SECTION C: MUSHROOM VARIETIES SHOWCASE */}
      <MushroomVarietiesSection />

      {/* SECTION D: OUR FARM AND TECHNOLOGY */}
      <div id="about">
        <FarmTechnologySection />
      </div>

      {/* SECTION E: WHY CHOOSE SPOREKART */}
      <WhyChooseUsSection />

      {/* SECTION F: TRAINING AND EDUCATION */}
      <div id="training">
        <TrainingEducationSection />
      </div>

      {/* SECTION G: SUSTAINABILITY COMMITMENT */}
      <SustainabilitySection />

      {/* SECTION H: CUSTOMER TESTIMONIALS */}
      <CustomerTestimonialsSection />

      {/* CATEGORY EXPLORATION & LIVE CATALOG SECTION */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CategoryCarousel categories={displayCategories} />
      </section>


      {/* FAQ SECTION WITH 80% VISIBILITY MUSHROOM GILL TEXTURE BACKGROUND */}
      <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8" aria-label="Frequently Asked Questions">
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
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-900/90 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-wider uppercase backdrop-blur-md shadow-sm">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>Got Questions? We Have Answers</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-forest-950 leading-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-forest-900/80 text-xs sm:text-sm md:text-base font-medium max-w-lg mx-auto">
                Transparent answers on sterile spawn quality, cold-chain transit, and commercial grower buyback.
              </p>
            </div>

            {/* 3 Minimal Descriptive Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/75 hover:bg-white/90 backdrop-blur-md border border-white/70 shadow-xs transition-all flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest-900/10 text-forest-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-forest-800" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-[13px] text-forest-950 leading-tight">
                    100% Pure Spawn
                  </div>
                  <div className="text-[11px] text-forest-800/80 leading-tight truncate">
                    Lab-certified 1st gen wheat grain
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/75 hover:bg-white/90 backdrop-blur-md border border-white/70 shadow-xs transition-all flex items-center gap-3">
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

              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/75 hover:bg-white/90 backdrop-blur-md border border-white/70 shadow-xs transition-all flex items-center gap-3">
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
                  Still have questions about spawn or commercial cultivation?
                </div>
                <div className="text-[11px] text-forest-800/80">
                  Our certified mycology specialists are available for custom grower advice.
                </div>
              </div>
              <a
                href="https://wa.me/919881174768?text=Hi%20Sporekart%20Team%2C%20I%20have%20a%20question%20about%20your%20spawn%20and%20cultivation."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest-900 hover:bg-forest-800 text-emerald-300 hover:text-emerald-200 text-xs font-bold shadow-sm transition-all shrink-0 button-press"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* CONTACT & ENTERPRISE SECTION */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ContactSection />
      </section>
    </div>
  );
}
