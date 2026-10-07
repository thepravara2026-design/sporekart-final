import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sprout, GraduationCap, ArrowRight, Award, Zap, CheckCircle2, Sparkles, Flame, Star,
  Building2, Layers, ShieldCheck, HeartHandshake, BookOpen, FileText, 
  Clock, User, CheckCircle, Users, ChevronRight, HelpCircle, Plus, Minus,
  ChevronDown, Phone, Mail, MapPin, Send, MessageSquare, Wrench
} from 'lucide-react';
import { catalogApi, trainingApi } from '../api';
import SeoHead from '../components/SeoHead';
import AvailabilityBadge from '../components/AvailabilityBadge';
import MediaImage from '../components/MediaImage';
import HeroSection from '../components/HeroSection';
import LatestCustomerReviews from '../components/LatestCustomerReviews';
import ProductCard from '../components/ProductCard';
import ProductGrid from '../components/ProductGrid';
import CategoryCarousel from '../components/CategoryCarousel';
import TrainingCarousel from '../components/TrainingCarousel';
import TrainingGlimpseCarousel from '../components/TrainingGlimpseCarousel';
import AboutSection from '../components/AboutSection';
import BlogSection from '../components/BlogSection';
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
  const [selectedVariants, setSelectedVariants] = useState({});

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
        const prodRes = await catalogApi.getProducts();
        setProducts(prodRes.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch products for home page', err);
      }

      try {
        const catRes = await catalogApi.getCategories();
        setCategories(catRes.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch categories for home page', err);
      }

      try {
        const courseRes = await trainingApi.getCourses();
        setCourses(courseRes.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch courses for home page', err);
      }

      try {
        if (typeof trainingApi.getGlimpses === 'function') {
          const glimpseRes = await trainingApi.getGlimpses();
          setGlimpses(glimpseRes.data?.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch training glimpses for home page', err);
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
        <CategoryCarousel categories={displayCategories} />
      </section>

      {/* 3. PRODUCTS SECTION */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface-white p-4 rounded-2xl animate-pulse h-64 border border-surface-border"></div>
            ))}
          </div>
        ) : (
          <ProductGrid
            title="Featured Products & Seeds"
            subtitle="High-demand laboratory-certified mushroom products available across India"
            products={[...products].sort((a, b) => Boolean(b.isPopular) - Boolean(a.isPopular))}
            itemsPerPage={8}
            onAddToCart={propOnAddToCart}
          />
        )}
      </section>

      {/* 4. TRAINING SECTION */}
      <section id="training" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <TrainingCarousel courses={courses} />
        <TrainingGlimpseCarousel glimpses={glimpses} />
      </section>

      {/* 5. ABOUT SECTION */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AboutSection showLearnMore={true} />
      </section>

      {/* 6. BLOGS SECTION */}
      <section id="blogs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlogSection limit={3} />
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

      {/* 7.5. LATEST CUSTOMER REVIEWS SECTION */}
      <LatestCustomerReviews />

      {/* 8. CONTACT SECTION */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ContactSection />
      </section>
    </div>
  );
}
