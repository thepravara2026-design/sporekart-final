import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sprout, GraduationCap, ArrowRight, Award, Zap, CheckCircle2, Sparkles, 
  Layers, ShieldCheck, HeartHandshake, Phone, Mail, MapPin, Send, MessageSquare, 
  Wrench, ChevronRight, HelpCircle, ChevronDown
} from 'lucide-react';
import { catalogApi, trainingApi } from '../api';
import SeoHead from '../components/SeoHead';
import HeroSection from '../components/HeroSection';
import MushroomVarietiesSection from '../components/MushroomVarietiesSection';
import FarmTechnologySection from '../components/FarmTechnologySection';
import WhyChooseUsSection from '../components/WhyChooseUsSection';
import TrainingEducationSection from '../components/TrainingEducationSection';
import SustainabilitySection from '../components/SustainabilitySection';
import CustomerTestimonialsSection from '../components/CustomerTestimonialsSection';
import CategoryCarousel from '../components/CategoryCarousel';
import TrainingGlimpseCarousel from '../components/TrainingGlimpseCarousel';
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
    <div className="space-y-12 sm:space-y-16 pb-20 animate-fade-in text-typography-primary">
      <SeoHead
        title="Sporekart — Fresh Mushrooms, Pure Grain Spawn & Certified Training in India"
        description="India's leading platform for organic fresh button & oyster mushrooms, 1st generation grain spawn seeds, indoor DIY growing kits, and certified commercial grower workshops."
        canonicalUrl="https://sporekart.in"
        structuredData={websiteSchema}
      />

      {/* SECTION B: HERO SECTION */}
      <HeroSection />

      {/* SECTION C: MUSHROOM VARIETIES SHOWCASE */}
      <MushroomVarietiesSection />

      {/* SECTION D: OUR FARM AND TECHNOLOGY */}
      <div id="about">
        <FarmTechnologySection />
      </div>

      {/* SECTION E: WHY CHOOSE SPOREKART */}
      <WhyChooseUsSection />

      {/* SECTION F: TRAINING AND EDUCATION */}
      <div id="training" className="space-y-10">
        <TrainingEducationSection />
        
        
        {glimpses.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TrainingGlimpseCarousel glimpses={glimpses} />
          </div>
        )}
      </div>

      {/* SECTION G: SUSTAINABILITY COMMITMENT */}
      <SustainabilitySection />

      {/* SECTION H: CUSTOMER TESTIMONIALS */}
      <CustomerTestimonialsSection />

      {/* CATEGORY EXPLORATION & LIVE CATALOG SECTION */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CategoryCarousel categories={displayCategories} />
      </section>


      {/* FAQ SECTION */}
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

      {/* CONTACT & ENTERPRISE SECTION */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ContactSection />
      </section>
    </div>
  );
}
