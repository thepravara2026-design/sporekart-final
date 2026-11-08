import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Sprout, ShoppingBag, CheckCircle2, Truck, ShieldCheck, MapPin, 
  ChevronDown, HelpCircle, Package, Layers, ChevronLeft, 
  ChevronRight, Info, AlertTriangle, Thermometer, Award,
  ZoomIn, Star, MessageSquare, Sparkles, Image as ImageIcon, X
} from 'lucide-react';
import { catalogApi, shippingApi, analyticsApi, reviewApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AvailabilityBadge from '../components/AvailabilityBadge';
import PageSkeleton from '../components/PageSkeleton';
import EmptyState from '../components/EmptyState';
import MediaImage from '../components/MediaImage';
import StarRatingInput from '../components/StarRatingInput';
import ProductReviewFormModal from '../components/ProductReviewFormModal';
import ProductCarousel from '../components/ProductCarousel';

import { useCart } from '../context/CartContext';

export default function ProductDetailPage({ onAddToCart: propOnAddToCart, user, onOpenReviewModal }) {
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

  // Hover zoom lens state
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center', transform: 'scale(1)' });
  const [isZooming, setIsZooming] = useState(false);
  const imageContainerRef = useRef(null);

  // Reviews state
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewsList, setReviewsList] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState(null);
  const [showLocalReviewModal, setShowLocalReviewModal] = useState(false);

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
          analyticsApi.trackProductView(prod.id, prod.slug, prod.title).catch((err) => console.warn('Failed to track product view:', err));
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

  // Fetch reviews and review summary for this specific product
  const fetchReviewsData = async () => {
    if (!product?.id) return;
    setLoadingReviews(true);
    try {
      const [summaryRes, reviewsRes] = await Promise.allSettled([
        reviewApi.getProductReviewSummary(product.id),
        reviewApi.getProductReviews(product.id, 0, 10),
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data?.data) {
        setReviewSummary(summaryRes.value.data.data);
      }
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value?.data?.data) {
        setReviewsList(reviewsRes.value.data.data.content || []);
      }
    } catch (err) {
      console.warn('Failed to load product reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (product?.id) {
      fetchReviewsData();
    }
  }, [product?.id]);

  const handlePincodeCheck = async (e) => {
    e.preventDefault();
    const cleanPin = (pincode || '').trim();
    if (!cleanPin) return;
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setPincodeResult({ isServiceable: false, message: 'Please enter a valid 6-digit Indian PIN code (e.g. 411001)' });
      return;
    }
    setCheckingPincode(true);
    try {
      const res = await shippingApi.checkPincode(cleanPin);
      setPincodeResult(res.data.data);
    } catch (err) {
      setPincodeResult({ isServiceable: false, message: 'Verification failed' });
    } finally {
      setCheckingPincode(false);
    }
  };

  const availabilityInfo = selectedVariant?.availability || {
    status: (selectedVariant?.stockQuantity > 0 || !selectedVariant) ? 'AVAILABLE' : 'OUT_OF_STOCK',
    label: (selectedVariant?.stockQuantity > 0 || !selectedVariant) ? 'In Stock' : 'Out of Stock'
  };

  const isAvailable = availabilityInfo.status !== 'OUT_OF_STOCK';
  const currentInCart = cart?.items?.find((i) => i.variantId === selectedVariant?.id)?.quantity || 0;
  const availableStock = selectedVariant?.stockQuantity !== undefined ? selectedVariant.stockQuantity : 999;
  const remainingStock = Math.max(0, availableStock - currentInCart);
  const isOutOfStock = availableStock <= 0 || !isAvailable;
  const isMaxInCart = currentInCart >= availableStock && availableStock > 0;

  useEffect(() => {
    if (selectedVariant && remainingStock > 0 && quantity > remainingStock) {
      setQuantity(remainingStock);
    } else if (selectedVariant && remainingStock === 0 && !isOutOfStock) {
      setQuantity(1);
    }
  }, [remainingStock, quantity, isOutOfStock, selectedVariant]);

  // Hover Zoom Event Handlers
  const handleMouseMove = (e) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setZoomStyle({
      transformOrigin: `${clampedX}% ${clampedY}%`,
      transform: 'scale(2.2)',
    });
  };

  const handleMouseEnter = () => {
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)',
    });
  };

  const handleOpenReviewModal = () => {
    const itemData = {
      productId: product?.id,
      productTitle: product?.title,
      orderId: 'direct-order',
      orderItemId: 'item-1',
      imageUrl: images?.[0],
    };

    if (onOpenReviewModal) {
      onOpenReviewModal(itemData);
    } else {
      setShowLocalReviewModal(true);
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
    setIsZooming(false);
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZooming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') handlePrevImage();
    if (e.key === 'ArrowRight') handleNextImage();
  };

  const price = selectedVariant?.priceInr || 0;
  const canonicalUrl = `https://sporekart.in/product/${product.slug}`;

  const info = product ? (product.productInformation || {}) : {};

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

  // Review calculations
  const ratingDistribution = reviewSummary?.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalReviewsCount = reviewSummary?.totalReviews || reviewsList.length || 0;
  const averageRating = reviewSummary?.averageRating || (totalReviewsCount > 0 ? (reviewsList.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewsList.length) : 0);
  const recentReviews = showAllReviews ? reviewsList : reviewsList.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-24 md:pb-16 space-y-10 sm:space-y-12 animate-fade-in" data-testid="product-detail">
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

      {/* Main Product Hero Split Layout:
          Left side pinned/static on desktop (sticky top-28 self-start)
          Right side scrolling smoothly with all product details & specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start relative">
        
        {/* Left Column: Static / Sticky Product Media Gallery with Hover Zoom Effect */}
        <div 
          className="lg:col-span-6 space-y-4 lg:sticky lg:top-28 lg:self-start transition-all"
          data-testid="product-gallery" 
          tabIndex={0} 
          onKeyDown={handleKeyDown}
        >
          {/* Main Primary Image with Smooth Hover Zoom Effect */}
          <div 
            ref={imageContainerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative bg-surface-cream p-3 rounded-container border border-surface-border overflow-hidden shadow-level-2 group cursor-crosshair select-none"
          >
            <div className="w-full h-80 sm:h-96 lg:h-[450px] overflow-hidden rounded-feature relative">
              <MediaImage
                src={currentImage}
                alt={`${product.title} view ${activeImageIndex + 1}`}
                data-testid="product-primary-image"
                className="w-full h-full object-cover rounded-feature transition-transform duration-200 ease-out will-change-transform"
                style={isZooming ? zoomStyle : { transform: 'scale(1)', transformOrigin: 'center center' }}
              />
            </div>

            {/* Hover Zoom Hint Badge (Fades when actively zooming) */}
            <div 
              className={`absolute bottom-5 left-5 z-10 px-3 py-1.5 bg-forest-950/75 backdrop-blur-md text-white text-xs font-semibold rounded-full flex items-center gap-1.5 pointer-events-none transition-opacity duration-200 shadow-md ${
                isZooming ? 'opacity-0' : 'opacity-90'
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hover over image to zoom</span>
            </div>

            {/* Gallery Navigation Overlay Controls */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  data-testid="gallery-previous"
                  aria-label="Previous image"
                  className="absolute left-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-surface-white/90 text-forest-900 border border-surface-border hover:bg-forest-700 hover:text-white transition-all shadow-level-1 button-press z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  data-testid="gallery-next"
                  aria-label="Next image"
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-surface-white/90 text-forest-900 border border-surface-border hover:bg-forest-700 hover:text-white transition-all shadow-level-1 button-press z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                {/* Image Counter Badge */}
                <div 
                  className="absolute bottom-5 right-5 px-3 py-1 bg-surface-white/90 text-forest-900 font-mono text-xs font-bold rounded-input border border-surface-border shadow-level-1 backdrop-blur-md z-10"
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
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setIsZooming(false);
                  }}
                  data-testid="product-thumbnail"
                  aria-label={`Select product image ${idx + 1}`}
                  className={`w-20 h-20 rounded-input overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImageIndex === idx 
                      ? 'border-forest-700 scale-105 shadow-level-1 ring-2 ring-forest-700/20' 
                      : 'border-surface-border opacity-70 hover:opacity-100 hover:border-forest-400'
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

        {/* Right Column: Complete Product Information Scrolling Smoothly Alongside Static Gallery */}
        <div className="lg:col-span-6 space-y-6 sm:space-y-8 scroll-smooth">
          
          {/* Header Title & Tags */}
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

              {/* Jump to Reviews Link */}
              {totalReviewsCount > 0 && (
                <a 
                  href="#reviews-section" 
                  className="inline-flex items-center gap-1 text-xs text-amber-600 font-bold hover:underline ml-1"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{averageRating ? averageRating.toFixed(1) : '5.0'}</span>
                  <span className="text-typography-muted font-normal">({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})</span>
                </a>
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
                  ₹{selectedVariant?.calculatedFinalPriceInr || selectedVariant?.priceInr || price}
                </span>
                {selectedVariant?.compareAtPriceInr && Number(selectedVariant.compareAtPriceInr) > Number(selectedVariant?.calculatedFinalPriceInr || selectedVariant?.priceInr || price) && (
                  <>
                    <span className="text-sm text-typography-muted line-through">₹{selectedVariant.compareAtPriceInr}</span>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-extrabold rounded-full shadow-sm tracking-wide border border-emerald-500/40" data-testid="discount-badge">
                      SAVE {Math.round(((Number(selectedVariant.compareAtPriceInr) - Number(selectedVariant?.calculatedFinalPriceInr || selectedVariant?.priceInr || price)) / Number(selectedVariant.compareAtPriceInr)) * 100)}%
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
                    {v.variantName} — ₹{v.calculatedFinalPriceInr || v.priceInr}
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
                    } else {
                      setQuantity(1);
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
                if (selectedVariant && !isMaxInCart) {
                  if (propOnAddToCart) propOnAddToCart(product, selectedVariant, quantity);
                  else addToCart(selectedVariant.id, quantity, availableStock);
                }
              }}
              disabled={isOutOfStock || isMaxInCart}
              data-testid="buy-now"
              className={`w-full text-xs py-3.5 shadow-level-1 flex items-center justify-center gap-2 ${
                isOutOfStock || isMaxInCart
                  ? 'bg-surface-neutral text-typography-muted cursor-not-allowed border border-surface-border'
                  : 'btn-secondary'
              }`}
            >
              {isMaxInCart ? `Max Stock In Cart (${currentInCart})` : 'Buy Now with Instant Express Shipping ➔'}
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

          {/* Structured Key Product Information & Highlights */}
          <section className="bg-surface-white p-6 sm:p-7 rounded-container border border-surface-border space-y-5 shadow-level-1" data-testid="product-information">
            <h2 className="font-display font-bold text-lg sm:text-xl text-forest-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-forest-700" /> Key Consumer & Product Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {info.brandName && (
                <div className="p-3.5 bg-surface-cream rounded-card border border-surface-border space-y-1">
                  <span className="text-typography-muted font-medium">Brand</span>
                  <p className="text-forest-900 font-bold text-sm">{info.brandName}</p>
                </div>
              )}

              {info.countryOfOrigin && (
                <div className="p-3.5 bg-surface-cream rounded-card border border-surface-border space-y-1">
                  <span className="text-typography-muted font-medium">Country of Origin</span>
                  <p className="text-forest-900 font-bold text-sm">{info.countryOfOrigin}</p>
                </div>
              )}

              {info.netQuantity && (
                <div className="p-3.5 bg-surface-cream rounded-card border border-surface-border space-y-1">
                  <span className="text-typography-muted font-medium">Net Quantity</span>
                  <p className="text-forest-900 font-bold text-sm">{info.netQuantity} {info.unitOfMeasure || ''}</p>
                </div>
              )}

              {info.mushroomSpecies && (
                <div className="p-3.5 bg-surface-cream rounded-card border border-surface-border space-y-1">
                  <span className="text-typography-muted font-medium">Mushroom Species</span>
                  <p className="text-forest-700 font-bold font-mono text-sm">{info.mushroomSpecies}</p>
                </div>
              )}

              {info.strainVariety && (
                <div className="p-3.5 bg-surface-cream rounded-card border border-surface-border space-y-1">
                  <span className="text-typography-muted font-medium">Strain / Variety</span>
                  <p className="text-forest-900 font-bold text-sm">{info.strainVariety}</p>
                </div>
              )}

              {info.foodCategory && (
                <div className="p-3.5 bg-surface-cream rounded-card border border-surface-border space-y-1">
                  <span className="text-typography-muted font-medium">Food Category</span>
                  <p className="text-forest-900 font-bold text-sm">{info.foodCategory}</p>
                </div>
              )}
            </div>
          </section>

          {/* Technical Specifications Section */}
          <section className="bg-surface-white p-6 sm:p-7 rounded-container border border-surface-border space-y-4 shadow-level-1" data-testid="product-specifications">
            <h2 className="font-display font-bold text-lg sm:text-xl text-forest-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-forest-700" /> Technical & Tax Specifications
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 bg-surface-cream rounded-card border border-surface-border space-y-1">
                <span className="text-typography-muted font-medium">HSN Classification</span>
                <p className="text-forest-900 font-bold">{product.hsnCode || '07095900'}</p>
              </div>
              <div className="p-3.5 bg-surface-cream rounded-card border border-surface-border space-y-1">
                <span className="text-typography-muted font-medium">GST Rate</span>
                <p className="text-forest-900 font-bold">{product.gstRatePercent || 5}% Tax Included</p>
              </div>
              <div className="p-3.5 bg-surface-cream rounded-card border border-surface-border space-y-1">
                <span className="text-typography-muted font-medium">Storage Requirement</span>
                <p className="text-forest-900 font-bold">{info.storageTemperatureGuidance || '2°C - 4°C Cold Storage'}</p>
              </div>
              <div className="p-3.5 bg-surface-cream rounded-card border border-surface-border space-y-1">
                <span className="text-typography-muted font-medium">Shelf Life</span>
                <p className="text-forest-900 font-bold">{info.shelfLifeGuidance || '30 Days from dispatch'}</p>
              </div>
            </div>
          </section>

          {/* Food & FSSAI Compliance Section */}
          {(info.fssaiLicenseNumber || info.ingredients || info.allergenInfo) && (
            <section className="bg-surface-white p-6 sm:p-7 rounded-container border border-surface-border space-y-4 shadow-level-1" data-testid="compliance-information">
              <h2 className="font-display font-bold text-lg sm:text-xl text-forest-900 flex items-center gap-2">
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
            <section className="bg-surface-white p-6 sm:p-7 rounded-container border border-surface-border space-y-4 shadow-level-1" data-testid="storage-information">
              <h2 className="font-display font-bold text-lg sm:text-xl text-forest-900 flex items-center gap-2">
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
            <section className="bg-surface-white p-6 sm:p-7 rounded-container border border-surface-border space-y-4 shadow-level-1">
              <h2 className="font-display font-bold text-lg sm:text-xl text-forest-900 flex items-center gap-2">
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
            <section className="bg-surface-white p-6 sm:p-7 rounded-container border border-surface-border space-y-4 shadow-level-1">
              <h2 className="font-display font-bold text-lg sm:text-xl text-forest-900 flex items-center gap-2">
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
          <section className="bg-surface-white p-6 sm:p-7 rounded-container border border-surface-border space-y-3 shadow-level-1">
            <h2 className="font-display font-bold text-lg sm:text-xl text-forest-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-forest-700" /> Insulated Cold-Chain Logistics Details
            </h2>
            <p className="text-xs sm:text-sm text-typography-secondary leading-relaxed">
              Sporekart utilizes temperature-controlled, multi-layer insulated cold-chain packaging for fresh mushrooms and high-grade spawn seeds. All shipments are dispatched via Shiprocket integration with real-time AWB courier tracking.
            </p>
          </section>

          {/* Product FAQ Section */}
          <section className="bg-surface-white p-6 sm:p-7 rounded-container border border-surface-border space-y-4 shadow-level-1">
            <h2 className="font-display font-bold text-lg sm:text-xl text-forest-900 flex items-center gap-2">
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
                    <ChevronDown className={`w-4 h-4 text-forest-700 transition-transform duration-200 ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-4 pb-4 text-xs text-typography-secondary leading-relaxed border-t border-surface-border pt-3 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Mobile Purchase Controls Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-white/95 backdrop-blur-xl border-t border-surface-border p-3 flex items-center justify-between gap-3 shadow-level-3">
        <div>
          <span className="text-[10px] text-typography-muted block truncate max-w-[120px]">{selectedVariant?.variantName}</span>
          <span className="text-lg font-bold text-forest-900 font-display">₹{selectedVariant?.priceInr || price}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isAvailable && selectedVariant && !isMaxInCart) {
              if (propOnAddToCart) propOnAddToCart(product, selectedVariant, quantity);
              else addToCart(selectedVariant.id, quantity, availableStock);
            }
          }}
          disabled={!isAvailable || isOutOfStock || isMaxInCart}
          className={`flex-1 font-bold text-xs py-3 rounded-input shadow-level-1 flex items-center justify-center gap-2 ${
            !isAvailable || isOutOfStock || isMaxInCart
              ? 'bg-surface-neutral text-typography-muted cursor-not-allowed border border-surface-border'
              : 'btn-primary'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          {!isAvailable || isOutOfStock
            ? 'Out of Stock'
            : isMaxInCart
              ? `Max Stock (${currentInCart})`
              : 'Add to Cart'}
        </button>
      </div>

      {/* Product Ratings & Reviews Experience Section:
          1. Total reviews on the particular product with score breakdown
          2. Display the recent 3 reviews with customer details & photos
          3. At the last: High-conversion "Ask for a Review" card */}
      <section id="reviews-section" className="pt-8 border-t border-surface-border space-y-8 animate-fade-in" data-testid="product-reviews-container">
        {/* Total Reviews Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-forest-900 tracking-tight flex items-center gap-2.5">
              <MessageSquare className="w-7 h-7 text-forest-700 shrink-0" />
              <span>Customer Ratings & Verified Reviews</span>
            </h2>
            <p className="text-xs sm:text-sm text-typography-secondary mt-1">
              Authentic cultivation feedback and culinary insights from verified buyers of {product.title}.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenReviewModal}
            className="btn-primary text-xs sm:text-sm font-bold px-5 py-2.5 flex items-center gap-2 shadow-sm rounded-xl shrink-0"
          >
            <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Rating Breakdown & Total Reviews Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-cream p-6 sm:p-8 rounded-3xl border border-surface-border shadow-level-1">
          {/* Average Rating Score */}
          <div className="flex flex-col items-center justify-center text-center p-6 bg-surface-white rounded-2xl border border-surface-border space-y-2.5 shadow-xs">
            <div className="text-5xl font-extrabold text-forest-900 font-mono tracking-tight">
              {averageRating ? averageRating.toFixed(1) : '0.0'}
            </div>
            <StarRatingInput value={Math.round(averageRating || 0)} readOnly size="md" showLabel={false} />
            <div className="text-xs text-typography-secondary font-medium">
              Based on <strong className="text-forest-900 font-bold">{totalReviewsCount}</strong> verified {totalReviewsCount === 1 ? 'review' : 'reviews'} for this product
            </div>
          </div>

          {/* Star Distribution Breakdown */}
          <div className="md:col-span-2 space-y-2.5 flex flex-col justify-center">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star] || 0;
              const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-12 text-right font-bold text-typography-primary flex items-center justify-end gap-1">
                    {star} <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  </span>
                  <div className="flex-1 h-2.5 bg-surface-white rounded-full overflow-hidden border border-surface-border">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-typography-muted font-mono text-[11px]">
                    {count} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent 3 Reviews Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-surface-border/60">
            <h3 className="font-display font-bold text-lg text-forest-900 flex items-center gap-2">
              <span>Recent Customer Reviews</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800">
                {showAllReviews ? `Showing All ${reviewsList.length}` : `Showing Recent ${Math.min(3, reviewsList.length)} of ${totalReviewsCount}`}
              </span>
            </h3>

            {reviewsList.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="text-xs font-bold text-forest-700 hover:text-forest-900 hover:underline transition-all"
              >
                {showAllReviews ? 'Show Recent 3 Only' : `View All (${reviewsList.length})`}
              </button>
            )}
          </div>

          {loadingReviews ? (
            <div className="py-8 text-center text-xs text-typography-muted animate-pulse">
              Loading customer reviews for {product.title}...
            </div>
          ) : recentReviews.length > 0 ? (
            <div className="space-y-4">
              {recentReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 sm:p-6 bg-surface-white rounded-2xl border border-surface-border shadow-sm hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-forest-900">{rev.customerName || 'Verified Cultivator'}</span>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Purchase
                          </span>
                        )}
                        {rev.variantName && (
                          <span className="text-[10px] text-typography-muted font-medium bg-surface-cream px-2 py-0.5 rounded border border-surface-border">
                            {rev.variantName}
                          </span>
                        )}
                      </div>
                      <StarRatingInput value={rev.rating} readOnly size="sm" showLabel={false} />
                    </div>

                    <span className="text-[11px] text-typography-muted font-mono shrink-0">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }) : 'Recent'}
                    </span>
                  </div>

                  {rev.reviewTitle && (
                    <h4 className="font-bold text-sm text-forest-900">{rev.reviewTitle}</h4>
                  )}

                  <p className="text-xs sm:text-sm text-typography-secondary leading-relaxed whitespace-pre-line">
                    {rev.reviewText}
                  </p>

                  {/* Customer Uploaded Photos */}
                  {rev.hasCustomerImages && rev.customerImages?.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] font-semibold text-typography-secondary mb-1.5 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-forest-700" /> Customer Photos ({rev.customerImages.length})
                      </div>
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                        {rev.customerImages.map((img, idx) => (
                          <img
                            key={img.id || idx}
                            src={img.imageUrl}
                            alt="Customer harvest photo"
                            onClick={() => setActiveImageModal({ images: rev.customerImages, activeIndex: idx })}
                            className="w-16 h-16 object-cover rounded-xl border border-surface-border cursor-pointer hover:scale-105 transition-transform"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-cream/50 rounded-2xl border border-surface-border space-y-2">
              <Star className="w-8 h-8 text-typography-muted mx-auto opacity-40" />
              <h4 className="text-sm font-bold text-typography-primary">No published reviews yet</h4>
              <p className="text-xs text-typography-secondary">
                Be the first verified customer to share your cultivation or culinary experience!
              </p>
            </div>
          )}
        </div>

        {/* At the last: Ask for a Review Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-forest-900 via-forest-900 to-forest-950 text-white border border-forest-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Have You Grown or Tasted This Variety?</span>
            </div>
            <h4 className="text-xl sm:text-2xl font-display font-bold">Share Your Experience & Help the Grower Community</h4>
            <p className="text-xs sm:text-sm text-surface-neutral/80 max-w-xl leading-relaxed">
              Your verified review and cultivation photos help fellow growers across India choose the highest-yielding spawn and freshest mushrooms.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenReviewModal}
            className="btn-primary bg-amber-400 hover:bg-amber-300 text-forest-950 font-bold px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-2 shrink-0 transition-transform active:scale-95 text-xs sm:text-sm"
          >
            <Star className="w-4 h-4 fill-forest-950 text-forest-950" />
            <span>Write a Product Review</span>
          </button>
        </div>
      </section>

      {/* Lightbox Photo Modal for Reviews */}
      {activeImageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-2xl w-full bg-surface-white rounded-3xl overflow-hidden p-4 space-y-3">
            <button
              onClick={() => setActiveImageModal(null)}
              className="absolute top-3 right-3 p-2 text-white bg-black/60 rounded-full hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-96 bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              <img
                src={activeImageModal.images[activeImageModal.activeIndex]?.imageUrl}
                alt="Enlarged customer photo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-center gap-2 overflow-x-auto">
              {activeImageModal.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.imageUrl}
                  alt="thumbnail"
                  onClick={() => setActiveImageModal({ ...activeImageModal, activeIndex: idx })}
                  className={`w-12 h-12 object-cover rounded-lg cursor-pointer border-2 ${
                    activeImageModal.activeIndex === idx ? 'border-forest-700 scale-105' : 'border-transparent opacity-70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Standalone Fallback Review Submission Modal */}
      {showLocalReviewModal && (
        <ProductReviewFormModal
          item={{
            productId: product?.id,
            productTitle: product?.title,
            orderId: 'direct-order',
            orderItemId: 'item-1',
            imageUrl: currentImage,
          }}
          onClose={() => setShowLocalReviewModal(false)}
          onSuccess={() => {
            setShowLocalReviewModal(false);
            fetchReviewsData();
          }}
        />
      )}

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <ProductCarousel
          title="Related Mushroom Agritech Products"
          products={relatedProducts}
          onAddToCart={propOnAddToCart}
        />
      )}
    </div>
  );
}
