import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sprout, ShoppingBag, CheckCircle2, Truck, ShieldCheck, MapPin, ChevronDown, HelpCircle, Package, Layers } from 'lucide-react';
import { catalogApi, shippingApi, analyticsApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

export default function ProductDetailPage({ onAddToCart }) {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const res = await catalogApi.getProductBySlug(slug);
        const prod = res.data.data;
        setProduct(prod);
        
        if (prod.id) {
          analyticsApi.trackProductView(prod.id, prod.slug, prod.title).catch(() => {});
        }
        
        if (prod.variants && prod.variants.length > 0) {
          setSelectedVariant(prod.variants[0]);
        }
        if (prod.imageUrls && prod.imageUrls.length > 0) {
          setSelectedImage(prod.imageUrls[0]);
        }

        // Fetch related products in the same category
        if (prod.categorySlug) {
          const relatedRes = await catalogApi.getProducts(null, prod.categorySlug);
          const allRelated = relatedRes.data.data?.content || relatedRes.data.data || [];
          setRelatedProducts(allRelated.filter(p => p.slug !== slug).slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load product detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [slug]);

  const handlePincodeCheck = async (e) => {
    e.preventDefault();
    if (!pincode) return;
    setCheckingPincode(true);
    try {
      const res = await shippingApi.checkPincode(pincode);
      setPincodeResult(res.data.data);
    } catch (err) {
      setPincodeResult({ isServiceable: false, message: 'Verification failed' });
    } finally {
      setCheckingPincode(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="glass-card h-96 rounded-3xl animate-pulse bg-slate-900/40"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <Sprout className="w-12 h-12 text-spore-700 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Product Not Found</h2>
        <p className="text-slate-400 text-sm">The product you are looking for does not exist or has been relocated.</p>
        <Link to="/products" className="inline-block px-6 py-2.5 bg-spore-500 text-slate-950 font-bold rounded-xl text-xs">
          Back to Products Catalog
        </Link>
      </div>
    );
  }

  const primaryImage = selectedImage || product.imageUrls?.[0] || 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80';
  const price = selectedVariant?.priceInr || 0;
  const canonicalUrl = `https://sporekart.in/product/${product.slug}`;

  // Authentic Product Structured Data schema (NO fake ratings/reviews)
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [primaryImage],
    "description": product.description,
    "sku": selectedVariant?.sku || product.slug,
    "hsnCode": product.hsnCode || "07095900",
    "brand": {
      "@type": "Brand",
      "name": "Sporekart Agritech"
    },
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "priceCurrency": "INR",
      "price": price,
      "priceValidUntil": "2026-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": (selectedVariant?.stockQuantity ?? 10) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Sporekart Agritech India"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "99",
          "currency": "INR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": "1",
            "maxValue": "2",
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": "2",
            "maxValue": "5",
            "unitCode": "DAY"
          }
        }
      }
    }
  };

  const productFaqs = [
    {
      q: `How should ${product.title} be stored upon delivery?`,
      a: "Keep stored in a cool, dark environment or refrigerated between 2°C and 4°C for maximum freshness and viability."
    },
    {
      q: "What is the dispatch & delivery timeline across India?",
      a: "Orders are processed within 24 hours. Fresh produce & live spawn ship via express insulated cold-chain courier in 2-5 business days."
    },
    {
      q: "Is GST invoice provided for agritech & commercial orders?",
      a: "Yes, all orders include a GST-compliant tax invoice with HSN classification for agricultural input tax credits."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <SeoHead
        title={`${product.title} (${selectedVariant?.variantName || ''}) — Buy Online in India | Sporekart`}
        description={product.description?.substring(0, 160)}
        canonicalUrl={canonicalUrl}
        ogImage={primaryImage}
        ogType="product"
        structuredData={productSchema}
      />

      <Breadcrumbs
        items={[
          { label: 'Products', path: '/products' },
          { label: product.categoryName || 'Category', path: `/products/${product.categorySlug || ''}` },
          { label: product.title, path: `/product/${product.slug}` },
        ]}
      />

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Images Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-3 rounded-3xl border border-spore-700/40 overflow-hidden shadow-2xl">
            <img
              src={primaryImage}
              alt={`${product.title} - Fresh mushroom & lab spawn seeds India`}
              width="800"
              height="800"
              loading="eager"
              decoding="async"
              className="w-full h-80 sm:h-96 object-cover rounded-2xl"
            />
          </div>
          {product.imageUrls && product.imageUrls.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(url)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === url ? 'border-spore-400 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt={`${product.title} detailed view thumbnail ${idx + 1}`}
                    width="160"
                    height="160"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Variant Options */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="px-3 py-1 bg-spore-950 text-spore-300 text-xs font-bold rounded-lg border border-spore-800 uppercase tracking-wider">
              {product.categoryName || 'Mushroom Agritech'}
            </span>
            {/* Single Strict H1 for Product Title */}
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mt-3">
              {product.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">SKU: <code className="text-spore-300 font-mono">{selectedVariant?.sku || product.slug}</code> | HSN: <code className="text-slate-300">{product.hsnCode || '07095900'}</code></p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-spore-800/60 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Server-Authoritative Price (incl. GST)</span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-spore-400">₹{selectedVariant?.priceInr || price}</span>
                {selectedVariant?.compareAtPriceInr && (
                  <span className="text-sm text-slate-500 line-through">₹{selectedVariant.compareAtPriceInr}</span>
                )}
              </div>
            </div>
            <span className="text-xs text-spore-300 font-semibold bg-spore-900/60 px-3 py-1 rounded-lg border border-spore-700/40">
              {(selectedVariant?.stockQuantity ?? 10) > 0 ? `In Stock (${selectedVariant?.stockQuantity || 10} available)` : 'Out of Stock'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{product.description}</p>

          {/* Variant Weight/Pack Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-spore-400" /> Select Variant & Pack Size
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedVariant?.id === v.id
                        ? 'bg-spore-500/20 border-spore-400 text-spore-300 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {v.variantName} — ₹{v.priceInr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart CTA */}
          <button
            onClick={() => onAddToCart && onAddToCart(product, selectedVariant)}
            className="w-full bg-gradient-to-r from-spore-500 to-spore-600 hover:from-spore-400 hover:to-spore-500 text-slate-950 font-extrabold text-base py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <ShoppingBag className="w-5 h-5" /> Add {selectedVariant?.variantName || ''} to Shopping Cart
          </button>

          {/* Shipping & Delivery Checker */}
          <div className="p-4 rounded-2xl bg-spore-950/60 border border-spore-800/60 space-y-3">
            <h3 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-spore-400" /> Courier & Cold-Chain Pincode Serviceability
            </h3>
            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit PIN code"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="flex-1 bg-slate-900 border border-spore-700/50 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                disabled={checkingPincode}
                className="bg-spore-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
              >
                {checkingPincode ? 'Checking...' : 'Check Delivery'}
              </button>
            </form>

            {pincodeResult && (
              <div className="text-xs text-spore-300">
                {pincodeResult.isServiceable ? (
                  <p className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-spore-400" /> {pincodeResult.message} ({pincodeResult.estimatedDeliveryDays} Days)</p>
                ) : (
                  <p className="text-red-400">{pincodeResult.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Specifications Section */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/40 space-y-4">
        <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-spore-400" /> Product Technical Specifications
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-spore-800/60 space-y-1">
            <span className="text-slate-500 font-medium">HSN Classification</span>
            <p className="text-white font-bold">{product.hsnCode || '07095900'}</p>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-spore-800/60 space-y-1">
            <span className="text-slate-500 font-medium">GST Rate</span>
            <p className="text-white font-bold">{product.gstRatePercent || 5}% Tax Included</p>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-spore-800/60 space-y-1">
            <span className="text-slate-500 font-medium">Storage & Shelf Life</span>
            <p className="text-white font-bold">2-4°C Refrigerated (30 Days)</p>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-spore-800/60 space-y-1">
            <span className="text-slate-500 font-medium">Origin & Quality</span>
            <p className="text-white font-bold">Lab Certified • Organically Grown</p>
          </div>
        </div>
      </section>

      {/* Shipping & Handling Information Section */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/40 space-y-4">
        <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-spore-400" /> Shipping & Packaging Details
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Sporekart utilizes temperature-controlled, multi-layer insulated cold-chain packaging for fresh mushrooms and high-grade spawn seeds. All shipments are dispatched via Shiprocket integration with real-time AWB courier tracking.
        </p>
      </section>

      {/* Product FAQ Section */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/40 space-y-4">
        <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-spore-400" /> Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {productFaqs.map((faq, idx) => (
            <div key={idx} className="bg-slate-900/80 rounded-xl border border-spore-800/60 overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full text-left p-4 flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-spore-300 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-spore-400 transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaqIndex === idx && (
                <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Intent Linking Chain Section (Product -> Related Guide -> Training) */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/50 space-y-4">
        <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-spore-400" /> Agronomist Masterclass & Cultivation Resources
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Master the commercial cultivation techniques for <strong className="text-white">{product.title}</strong>. Read our expert guides or enroll in certified hands-on training batches.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold">
          <Link
            to="/mushroom-cultivation-guide"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-spore-300 rounded-xl border border-spore-700/60 transition-all flex items-center gap-2"
          >
            📖 Read {product.title} Cultivation Guide
          </Link>
          <span className="text-slate-500 font-extrabold text-sm">➔</span>
          <Link
            to="/training"
            className="px-4 py-2.5 bg-spore-500 hover:bg-spore-400 text-slate-950 rounded-xl transition-all flex items-center gap-2 shadow-lg"
          >
            🎓 Enroll in Certified Training Masterclass
          </Link>
        </div>
      </section>

      {/* Related Products Internal Links Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display font-bold text-2xl text-white">
            Related Mushroom Agritech Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <Link
                key={rel.id}
                to={`/product/${rel.slug}`}
                className="glass-card p-4 rounded-2xl border border-spore-800/50 hover:border-spore-600/60 transition-all group"
              >
                <img
                  src={rel.imageUrls?.[0] || 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=400&q=80'}
                  alt={`${rel.title} - Sporekart Mushroom Agritech Produce`}
                  width="400"
                  height="400"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-40 object-cover rounded-xl mb-3 group-hover:scale-105 transition-transform"
                />
                <h3 className="font-bold text-sm text-white group-hover:text-spore-300 transition-colors line-clamp-1">
                  {rel.title}
                </h3>
                <p className="text-xs text-spore-400 font-bold mt-1">₹{rel.variants?.[0]?.priceInr || '—'}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
