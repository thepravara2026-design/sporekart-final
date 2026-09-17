import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sprout, ShoppingBag, CheckCircle2, Truck, ShieldCheck, MapPin, Star } from 'lucide-react';
import { catalogApi, shippingApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

export default function ProductDetailPage({ onAddToCart }) {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await catalogApi.getProductBySlug(slug);
        const prod = res.data.data;
        setProduct(prod);
        if (prod.variants && prod.variants.length > 0) {
          setSelectedVariant(prod.variants[0]);
        }
        if (prod.imageUrls && prod.imageUrls.length > 0) {
          setSelectedImage(prod.imageUrls[0]);
        }
      } catch (err) {
        console.error('Failed to load product detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
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
        <Link to="/catalog" className="inline-block px-6 py-2.5 bg-spore-500 text-slate-950 font-bold rounded-xl text-xs">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const primaryImage = selectedImage || product.imageUrls?.[0] || 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80';
  const price = selectedVariant?.priceInr || 0;

  // JSON-LD Product Schema for Google, Bing, ChatGPT, Perplexity
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": [primaryImage],
    "description": product.description,
    "sku": selectedVariant?.sku || product.slug,
    "brand": {
      "@type": "Brand",
      "name": "Sporekart"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://sporekart.in/catalog/${product.slug}`,
      "priceCurrency": "INR",
      "price": price,
      "priceValidUntil": "2026-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": selectedVariant?.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Sporekart Agritech India"
      }
    }
  };

  const canonicalUrl = `https://sporekart.in/catalog/${product.slug}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
          { label: 'Catalog', path: '/catalog' },
          { label: product.categoryName || 'Products', path: `/catalog?category=${product.categorySlug}` },
          { label: product.title, path: `/catalog/${product.slug}` },
        ]}
      />

      {/* Main Product Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-3 rounded-3xl border border-spore-700/40 overflow-hidden">
            <img
              src={primaryImage}
              alt={`${product.title} - Fresh mushroom & spawn seeds supply India`}
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
                  <img src={url} alt={`${product.title} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pricing & Purchase Options */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="px-3 py-1 bg-spore-950 text-spore-300 text-xs font-bold rounded-lg border border-spore-800 uppercase tracking-wider">
              {product.categoryName}
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mt-3">
              {product.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-xs text-amber-400">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-current text-amber-400" />
                ))}
              </div>
              <span className="text-slate-400">(4.9/5 based on grower reviews)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-spore-800/60 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Price (inclusive of GST)</span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-spore-400">₹{selectedVariant?.priceInr}</span>
                {selectedVariant?.compareAtPriceInr && (
                  <span className="text-sm text-slate-500 line-through">₹{selectedVariant.compareAtPriceInr}</span>
                )}
              </div>
            </div>
            <span className="text-xs text-spore-300 font-semibold bg-spore-900/60 px-3 py-1 rounded-lg border border-spore-700/40">
              In Stock ({selectedVariant?.stockQuantity} available)
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{product.description}</p>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs text-slate-300 font-bold uppercase tracking-wider">Select Weight / Pack Size</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
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
            onClick={() => onAddToCart(product, selectedVariant)}
            className="w-full bg-gradient-to-r from-spore-500 to-spore-600 hover:from-spore-400 hover:to-spore-500 text-slate-950 font-extrabold text-base py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <ShoppingBag className="w-5 h-5" /> Add {selectedVariant?.variantName} to Cart
          </button>

          {/* Pincode Delivery Checker */}
          <div className="p-4 rounded-2xl bg-spore-950/60 border border-spore-800/60 space-y-3">
            <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-spore-400" /> Check Estimated Delivery Date in India
            </h4>
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
                {checkingPincode ? 'Checking...' : 'Check'}
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
    </div>
  );
}
