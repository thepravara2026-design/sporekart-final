import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Sprout, ShoppingBag, CheckCircle2, Truck, ShieldCheck, MapPin, 
  ChevronDown, HelpCircle, Package, Layers, GraduationCap, ChevronLeft, 
  ChevronRight, Info, AlertTriangle, Thermometer, Award
} from 'lucide-react';
import { catalogApi, shippingApi, analyticsApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AvailabilityBadge from '../components/AvailabilityBadge';
import PageSkeleton from '../components/PageSkeleton';
import EmptyState from '../components/EmptyState';
import MediaImage from '../components/MediaImage';

import { useCart } from '../context/CartContext';

export default function ProductDetailPage({ onAddToCart: propOnAddToCart }) {
  const { addToCart, cart } = useCart();
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartError, setCartError] = useState(null);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    if (selectedVariant) {
      setQuantity(1);
      setCartError(null);
    }
  }, [selectedVariant?.id]);

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
        setActiveImageIndex(0);

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
    return <PageSkeleton type="detail" />;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon={Sprout}
          title="Product Not Found"
          description="The product you are looking for does not exist or has been relocated."
          actionText="Explore Catalog"
          actionLink="/products"
        />
      </div>
    );
  }

  const images = (product.imageUrls && product.imageUrls.length > 0) 
    ? product.imageUrls 
    : ['https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80'];
  
  const currentImage = images[activeImageIndex] || images[0];

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') handlePrevImage();
    if (e.key === 'ArrowRight') handleNextImage();
  };

  const price = selectedVariant?.priceInr || 0;
  const canonicalUrl = `https://sporekart.in/product/${product.slug}`;

  const availabilityInfo = selectedVariant?.availability || {
    status: (selectedVariant?.stockQuantity > 0 || !selectedVariant) ? 'AVAILABLE' : 'OUT_OF_STOCK',
    label: (selectedVariant?.stockQuantity > 0 || !selectedVariant) ? 'In Stock' : 'Out of Stock'
  };

  const isAvailable = availabilityInfo.status !== 'OUT_OF_STOCK';
  const info = product ? (product.productInformation || {}) : {};

  const currentInCart = cart?.items?.find((i) => i.variantId === selectedVariant?.id)?.quantity || 0;
  const availableStock = selectedVariant?.stockQuantity !== undefined ? selectedVariant.stockQuantity : 999;
  const remainingStock = Math.max(0, availableStock - currentInCart);
  const isOutOfStock = availableStock <= 0 || !isAvailable;
  const isMaxInCart = currentInCart >= availableStock && availableStock > 0;

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": images,
    "description": product.description,
    "sku": selectedVariant?.sku || product.slug,
    "hsnCode": product.hsnCode || "07095900",
    "brand": {
      "@type": "Brand",
      "name": info.brandName || "Sporekart Agritech"
    },
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "priceCurrency": "INR",
      "price": price,
      "priceValidUntil": "2026-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Sporekart Agritech India"
      }
    }
  };

  const productFaqs = [
    {
      q: `How should ${product.title} be stored upon delivery?`,
      a: info.storageInstructions || "Keep stored in a cool, dark environment or refrigerated between 2°C and 4°C for maximum freshness and viability."
    },
    {
      q: "What is the dispatch & delivery timeline across India?",
      a: info.shelfLifeGuidance 
        ? `Dispatch within 24 hours. ${info.shelfLifeGuidance}`
        : "Orders are processed within 24 hours. Fresh produce & live spawn ship via express insulated cold-chain courier in 2-5 business days."
    },
    {
      q: "Is GST invoice provided for agritech & commercial orders?",
      a: "Yes, all orders include a GST-compliant tax invoice with HSN classification for agricultural input tax credits."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-fade-in pb-24 md:pb-12" data-testid="product-detail">
      <SeoHead
        title={`${product.title} (${selectedVariant?.variantName || ''}) — Buy Online in India | Sporekart`}
        description={product.description?.substring(0, 160)}
        canonicalUrl={canonicalUrl}
        ogImage={currentImage}
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
        
        {/* Multi-Image Product Gallery Column */}
        <div className="lg:col-span-6 space-y-4" data-testid="product-gallery" tabIndex={0} onKeyDown={handleKeyDown}>
          
          {/* Main Primary Image Viewport */}
          <div className="relative bg-surface-cream p-3 rounded-container border border-surface-border overflow-hidden shadow-level-2 group">
            <MediaImage
              src={currentImage}
              alt={`${product.title} view ${activeImageIndex + 1}`}
              data-testid="product-primary-image"
              className="w-full h-80 sm:h-96 object-cover rounded-feature transition-all duration-300"
            />

            {/* Gallery Navigation Overlay Controls */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  data-testid="gallery-previous"
                  aria-label="Previous image"
                  className="absolute left-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-surface-white/90 text-forest-900 border border-surface-border hover:bg-forest-700 hover:text-white transition-all shadow-level-1 button-press"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  data-testid="gallery-next"
                  aria-label="Next image"
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-surface-white/90 text-forest-900 border border-surface-border hover:bg-forest-700 hover:text-white transition-all shadow-level-1 button-press"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                {/* Image Counter Badge */}
                <div 
                  className="absolute bottom-5 right-5 px-3 py-1 bg-surface-white/90 text-forest-900 font-mono text-xs font-bold rounded-input border border-surface-border shadow-level-1 backdrop-blur-md"
                  data-testid="gallery-counter"
                >
                  {activeImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {images.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  data-testid="product-thumbnail"
                  aria-label={`Select product image ${idx + 1}`}
                  className={`w-20 h-20 rounded-input overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx 
                      ? 'border-forest-700 scale-105 shadow-level-1' 
                      : 'border-surface-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <MediaImage
                    src={url}
                    alt={`${product.title} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Section */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-surface-cream text-forest-800 text-xs font-bold rounded-pill border border-surface-border uppercase tracking-wider">
                {product.categoryName || 'Mushroom Agritech'}
              </span>

              {info.isVegetarian && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-600/10 text-green-600 text-xs font-bold rounded-pill border border-green-600/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block"></span>
                  100% Vegetarian
                </span>
              )}
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-4xl text-forest-900 mt-2" data-testid="product-title">
              {product.title}
            </h1>
            
            <p className="text-xs text-typography-muted">
              SKU: <code className="text-forest-700 font-mono">{selectedVariant?.sku || product.slug}</code> 
              {product.hsnCode && (
                <> | HSN: <code className="text-typography-secondary">{product.hsnCode}</code></>
              )}
              {info.brandName && (
                <> | Brand: <span className="text-forest-900 font-semibold">{info.brandName}</span></>
              )}
            </p>
          </div>

          {/* Pricing & Stock Availability Container */}
          <div className="p-4 rounded-card bg-surface-white border border-surface-border flex items-center justify-between gap-4 flex-wrap shadow-level-1">
            <div>
              <span className="text-xs text-typography-muted block font-medium">Price (incl. GST)</span>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl font-bold text-forest-900 font-display" data-testid="product-price">
                  ₹{selectedVariant?.priceInr || price}
                </span>
                {selectedVariant?.compareAtPriceInr && Number(selectedVariant.compareAtPriceInr) > Number(selectedVariant?.priceInr || price) && (
                  <>
                    <span className="text-sm text-typography-muted line-through">₹{selectedVariant.compareAtPriceInr}</span>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-extrabold rounded-full shadow-sm tracking-wide border border-emerald-500/40" data-testid="discount-badge">
                      SAVE {Math.round(((Number(selectedVariant.compareAtPriceInr) - Number(selectedVariant.priceInr || price)) / Number(selectedVariant.compareAtPriceInr)) * 100)}%
                    </span>
                  </>
                )}
              </div>
            </div>

            <AvailabilityBadge availability={availabilityInfo} />
          </div>

          <p className="text-xs sm:text-sm text-typography-secondary leading-relaxed">{product.description}</p>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs text-typography-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-forest-700" /> Select Pack / Variant
              </label>
              <div className="flex flex-wrap gap-2" data-testid="product-variant">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2.5 rounded-input text-xs font-bold border transition-all button-press ${
                      selectedVariant?.id === v.id
                        ? 'bg-surface-cream border-forest-700 text-forest-900 shadow-level-1'
                        : 'bg-surface-white border-surface-border text-typography-secondary hover:border-surface-border'
                    }`}
                  >
                    {v.variantName} — ₹{v.priceInr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock & Quantity Banner */}
          {selectedVariant && (
            <div className="space-y-1">
              {availableStock > 0 && availableStock <= 10 && (
                <p className="text-xs font-bold text-soil flex items-center gap-1">
                  ⚡ Only {availableStock} units left in stock!
                </p>
              )}
              {currentInCart > 0 && (
                <p className="text-xs font-medium text-forest-700">
                  🛒 {currentInCart} already in your cart (Max available: {availableStock})
                </p>
              )}
              {cartError && (
                <div className="p-2.5 rounded-input bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  ⚠️ {cartError}
                </div>
              )}
            </div>
          )}

          {/* Quantity Selector & Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-surface-neutral border border-surface-border rounded-input p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isOutOfStock || isMaxInCart}
                className="w-8 h-8 flex items-center justify-center text-forest-900 font-bold hover:bg-surface-cream rounded-compact transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={Math.max(1, remainingStock)}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.min(Math.max(1, remainingStock), Math.max(1, val)));
                }}
                disabled={isOutOfStock || isMaxInCart}
                className="w-12 text-center bg-transparent text-forest-900 font-bold text-xs focus:outline-none disabled:opacity-40"
                data-testid="quantity-input"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(Math.max(1, remainingStock), q + 1))}
                disabled={quantity >= remainingStock || isOutOfStock || isMaxInCart}
                className="w-8 h-8 flex items-center justify-center text-forest-900 font-bold hover:bg-surface-cream rounded-compact transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={async () => {
                setCartError(null);
                if (isAvailable && selectedVariant && !isMaxInCart) {
                  if (propOnAddToCart) {
                    propOnAddToCart(product, selectedVariant, quantity);
                  } else {
                    const res = await addToCart(selectedVariant.id, quantity, availableStock);
                    if (res && !res.success) {
                      setCartError(res.message);
                    }
                  }
                }
              }}
              disabled={!isAvailable || isOutOfStock || isMaxInCart}
              data-testid="add-to-cart"
              className={`flex-1 font-bold text-xs sm:text-sm py-4 rounded-input shadow-level-1 flex items-center justify-center gap-2 transition-all button-press ${
                !isAvailable || isOutOfStock || isMaxInCart
                  ? 'bg-surface-neutral text-typography-muted cursor-not-allowed border border-surface-border'
                  : 'btn-primary shadow-level-2 hover-lift'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> 
              {isOutOfStock 
                ? 'Out of Stock' 
                : isMaxInCart 
                  ? `Max Stock Reached (${currentInCart}/${availableStock})` 
                  : `Add ${selectedVariant?.variantName || ''} to Cart`}
            </button>
          </div>

          {/* Buy Now Direct Button */}
          {isAvailable && (
            <button
              type="button"
              onClick={() => {
                if (selectedVariant) {
                  if (propOnAddToCart) propOnAddToCart(product, selectedVariant, quantity);
                  else addToCart(selectedVariant.id, quantity);
                }
              }}
              data-testid="buy-now"
              className="w-full btn-secondary text-xs py-3.5 shadow-level-1 flex items-center justify-center gap-2"
            >
              Buy Now with Instant Express Shipping ➔
            </button>
          )}

          {/* Shipping & Delivery Pincode Checker */}
          <div className="p-4 rounded-card bg-surface-white border border-surface-border space-y-3 shadow-level-1">
            <h3 className="font-bold text-xs text-forest-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-forest-700" /> Courier & Cold-Chain Pincode Serviceability
            </h3>
            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit PIN code"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="flex-1 bg-surface-neutral border border-surface-border rounded-input px-3 py-2 text-xs text-forest-900 focus:outline-none focus:border-forest-700"
              />
              <button
                type="submit"
                disabled={checkingPincode}
                className="btn-primary px-4 py-2 text-xs"
              >
                {checkingPincode ? 'Checking...' : 'Check Delivery'}
              </button>
            </form>

            {pincodeResult && (
              <div className="text-xs text-forest-700">
                {pincodeResult.isServiceable ? (
                  <p className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-forest-700" /> {pincodeResult.message} ({pincodeResult.estimatedDeliveryDays} Days)</p>
                ) : (
                  <p className="text-rose-600">{pincodeResult.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Mobile Purchase Controls Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-white/95 backdrop-blur-xl border-t border-surface-border p-3 flex items-center justify-between gap-3 shadow-level-3">
        <div>
          <span className="text-[10px] text-typography-muted block">{selectedVariant?.variantName}</span>
          <span className="text-lg font-bold text-forest-900 font-display">₹{selectedVariant?.priceInr || price}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isAvailable && selectedVariant) {
              if (propOnAddToCart) propOnAddToCart(product, selectedVariant, quantity);
              else addToCart(selectedVariant.id, quantity);
            }
          }}
          disabled={!isAvailable}
          className={`flex-1 font-bold text-xs py-3 rounded-input shadow-level-1 flex items-center justify-center gap-2 ${
            !isAvailable
              ? 'bg-surface-neutral text-typography-muted'
              : 'btn-primary'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          {!isAvailable ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>

      {/* Structured Key Product Information & Highlights */}
      <section className="bg-surface-white p-6 sm:p-8 rounded-container border border-surface-border space-y-6 shadow-level-1" data-testid="product-information">
        <h2 className="font-display font-bold text-xl text-forest-900 flex items-center gap-2">
          <Info className="w-5 h-5 text-forest-700" /> Key Consumer & Product Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          
          {info.brandName && (
            <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
              <span className="text-typography-muted font-medium">Brand</span>
              <p className="text-forest-900 font-bold text-sm">{info.brandName}</p>
            </div>
          )}

          {info.countryOfOrigin && (
            <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
              <span className="text-typography-muted font-medium">Country of Origin</span>
              <p className="text-forest-900 font-bold text-sm">{info.countryOfOrigin}</p>
            </div>
          )}

          {info.netQuantity && (
            <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
              <span className="text-typography-muted font-medium">Net Quantity</span>
              <p className="text-forest-900 font-bold text-sm">{info.netQuantity} {info.unitOfMeasure || ''}</p>
            </div>
          )}

          {info.mushroomSpecies && (
            <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
              <span className="text-typography-muted font-medium">Mushroom Species</span>
              <p className="text-forest-700 font-bold font-mono text-sm">{info.mushroomSpecies}</p>
            </div>
          )}

          {info.strainVariety && (
            <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
              <span className="text-typography-muted font-medium">Strain / Variety</span>
              <p className="text-forest-900 font-bold text-sm">{info.strainVariety}</p>
            </div>
          )}

          {info.foodCategory && (
            <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
              <span className="text-typography-muted font-medium">Food Category</span>
              <p className="text-forest-900 font-bold text-sm">{info.foodCategory}</p>
            </div>
          )}
        </div>
      </section>

      {/* Technical Specifications Section */}
      <section className="bg-surface-white p-6 sm:p-8 rounded-container border border-surface-border space-y-4 shadow-level-1" data-testid="product-specifications">
        <h2 className="font-display font-bold text-xl text-forest-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-forest-700" /> Technical & Tax Specifications
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
            <span className="text-typography-muted font-medium">HSN Classification</span>
            <p className="text-forest-900 font-bold">{product.hsnCode || '07095900'}</p>
          </div>
          <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
            <span className="text-typography-muted font-medium">GST Rate</span>
            <p className="text-forest-900 font-bold">{product.gstRatePercent || 5}% Tax Included</p>
          </div>
          <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
            <span className="text-typography-muted font-medium">Storage Requirement</span>
            <p className="text-forest-900 font-bold">{info.storageTemperatureGuidance || '2°C - 4°C Cold Storage'}</p>
          </div>
          <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
            <span className="text-typography-muted font-medium">Shelf Life</span>
            <p className="text-forest-900 font-bold">{info.shelfLifeGuidance || '30 Days from dispatch'}</p>
          </div>
        </div>
      </section>

      {/* Food & FSSAI Compliance Section */}
      {(info.fssaiLicenseNumber || info.ingredients || info.allergenInfo) && (
        <section className="bg-surface-white p-6 sm:p-8 rounded-container border border-surface-border space-y-4 shadow-level-1" data-testid="compliance-information">
          <h2 className="font-display font-bold text-xl text-forest-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-forest-700" /> Food Safety & FSSAI Disclosures
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {info.fssaiLicenseNumber && (
              <div className="p-4 bg-surface-cream rounded-card border border-surface-border flex items-center gap-3">
                <div className="px-2.5 py-1 bg-surface-white text-forest-900 font-bold border border-surface-border rounded-compact">
                  FSSAI
                </div>
                <div>
                  <span className="text-typography-muted block font-medium">FSSAI License Number</span>
                  <span className="text-forest-900 font-mono font-bold">{info.fssaiLicenseNumber}</span>
                </div>
              </div>
            )}

            {info.ingredients && (
              <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
                <span className="text-typography-muted font-medium">Ingredients</span>
                <p className="text-forest-900">{info.ingredients}</p>
              </div>
            )}

            {info.allergenInfo && (
              <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1 md:col-span-2">
                <span className="text-soil font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Allergen Information
                </span>
                <p className="text-typography-secondary">{info.allergenInfo}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Storage & Handling Instructions */}
      {(info.storageInstructions || info.handlingInstructions || info.safetyWarnings) && (
        <section className="bg-surface-white p-6 sm:p-8 rounded-container border border-surface-border space-y-4 shadow-level-1" data-testid="storage-information">
          <h2 className="font-display font-bold text-xl text-forest-900 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-forest-700" /> Storage, Handling & Care Guidance
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-typography-secondary leading-relaxed">
            {info.storageInstructions && (
              <p><strong className="text-forest-900">Storage Instructions:</strong> {info.storageInstructions}</p>
            )}
            {info.handlingInstructions && (
              <p data-testid="handling-information"><strong className="text-forest-900">Handling Guidance:</strong> {info.handlingInstructions}</p>
            )}
            {info.safetyWarnings && (
              <p className="text-soil font-medium"><strong>Safety & Cautions:</strong> {info.safetyWarnings}</p>
            )}
          </div>
        </section>
      )}

      {/* Agricultural & Cultivation Disclosures */}
      {(info.recommendedSubstrate || info.inoculationGuidance || info.kitContents || info.environmentRequirements) && (
        <section className="bg-surface-white p-6 sm:p-8 rounded-container border border-surface-border space-y-4 shadow-level-1">
          <h2 className="font-display font-bold text-xl text-forest-900 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-forest-700" /> Agricultural & Cultivation Disclosures
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {info.recommendedSubstrate && (
              <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
                <span className="text-typography-muted font-medium">Recommended Substrate</span>
                <p className="text-forest-900 font-bold">{info.recommendedSubstrate}</p>
              </div>
            )}
            {info.kitContents && (
              <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
                <span className="text-typography-muted font-medium">Kit Contents</span>
                <p className="text-forest-900">{info.kitContents}</p>
              </div>
            )}
            {info.inoculationGuidance && (
              <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1 md:col-span-2">
                <span className="text-typography-muted font-medium">Inoculation & Preparation Guidance</span>
                <p className="text-typography-secondary leading-relaxed">{info.inoculationGuidance}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Manufacturer & Customer Care Disclosures */}
      {(info.manufacturerDetails || info.customerCareDetails) && (
        <section className="bg-surface-white p-6 sm:p-8 rounded-container border border-surface-border space-y-4 shadow-level-1">
          <h2 className="font-display font-bold text-xl text-forest-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-forest-700" /> Manufacturer & Consumer Care Contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-typography-secondary">
            {info.manufacturerDetails && (
              <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
                <span className="text-typography-muted font-medium block">Manufacturer / Packer Details</span>
                <p className="text-forest-900">{info.manufacturerDetails}</p>
              </div>
            )}
            {info.customerCareDetails && (
              <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-1">
                <span className="text-typography-muted font-medium block">Customer Care Contact</span>
                <p className="text-forest-900">{info.customerCareDetails}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Insulated Cold-Chain Logistics Details */}
      <section className="bg-surface-white p-6 sm:p-8 rounded-container border border-surface-border space-y-4 shadow-level-1">
        <h2 className="font-display font-bold text-xl text-forest-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-forest-700" /> Insulated Cold-Chain Logistics Details
        </h2>
        <p className="text-xs sm:text-sm text-typography-secondary leading-relaxed">
          Sporekart utilizes temperature-controlled, multi-layer insulated cold-chain packaging for fresh mushrooms and high-grade spawn seeds. All shipments are dispatched via Shiprocket integration with real-time AWB courier tracking.
        </p>
      </section>

      {/* Product FAQ Section */}
      <section className="bg-surface-white p-6 sm:p-8 rounded-container border border-surface-border space-y-4 shadow-level-1">
        <h2 className="font-display font-bold text-xl text-forest-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-forest-700" /> Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {productFaqs.map((faq, idx) => (
            <div key={idx} className="bg-surface-cream rounded-card border border-surface-border overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full text-left p-4 flex items-center justify-between text-xs sm:text-sm font-bold text-forest-900 hover:text-forest-700 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-forest-700 transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaqIndex === idx && (
                <div className="px-4 pb-4 text-xs text-typography-secondary leading-relaxed border-t border-surface-border pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display font-bold text-2xl text-forest-900">
            Related Mushroom Agritech Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => {
              const relVariant = rel.variants?.[0];
              const hasRelCompare = relVariant?.compareAtPriceInr && Number(relVariant.compareAtPriceInr) > Number(relVariant.priceInr);
              const relDiscount = hasRelCompare
                ? Math.round(((Number(relVariant.compareAtPriceInr) - Number(relVariant.priceInr)) / Number(relVariant.compareAtPriceInr)) * 100)
                : 0;

              return (
                <Link
                  key={rel.id}
                  to={`/product/${rel.slug}`}
                  className="bg-surface-white p-4 rounded-feature border border-surface-border hover:border-forest-700/40 transition-all group hover-lift shadow-level-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative overflow-hidden rounded-card mb-3 bg-surface-cream h-40">
                      <MediaImage
                        src={rel.imageUrls?.[0] || 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=400&q=80'}
                        alt={`${rel.title} - Sporekart Mushroom Agritech Produce`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {relDiscount > 0 && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-gradient-to-r from-emerald-700 to-forest-800 text-white text-[10px] font-extrabold rounded-full shadow-md backdrop-blur-md uppercase tracking-wider" data-testid="discount-badge">
                          {relDiscount}% OFF
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-forest-900 group-hover:text-forest-700 transition-colors line-clamp-1">
                      {rel.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <p className="text-xs text-forest-700 font-bold font-display">₹{relVariant?.priceInr || '—'}</p>
                    {hasRelCompare && (
                      <>
                        <span className="text-[10px] text-typography-muted line-through font-medium">₹{relVariant.compareAtPriceInr}</span>
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                          {relDiscount}% OFF
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
