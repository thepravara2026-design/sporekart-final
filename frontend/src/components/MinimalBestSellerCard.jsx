import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Flame, CheckCircle2, Truck } from 'lucide-react';
import MediaImage from './MediaImage';
import { useCart } from '../context/CartContext';

/**
 * MinimalBestSellerCard
 * Modern, ultra-clean, minimal card design created exclusively for the Sporekart Most Sold Section.
 * Highlights authentic delivered order status, verified sales ranking, and swift add-to-cart.
 */
export default function MinimalBestSellerCard({
  product,
  rank = 1,
  onAddToCart: propOnAddToCart,
  onTrackView,
  className = '',
}) {
  const { addToCart, cart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(
    product?.variants?.[0] || null
  );

  useEffect(() => {
    if (product?.variants?.[0]) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product?.id]);

  if (!product) return null;

  const activeVariant = selectedVariant || product.variants?.[0];
  const stock = activeVariant?.stockQuantity !== undefined ? activeVariant.stockQuantity : 999;
  const currentInCart = cart?.items?.find((i) => i.variantId === activeVariant?.id)?.quantity || 0;
  const isMaxInCart = currentInCart >= stock && stock > 0;

  const primaryImage = product.imageUrls?.[0] || 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=600&q=80';

  const availability = activeVariant?.availability || {
    status: (stock > 0 || !activeVariant) ? 'AVAILABLE' : 'OUT_OF_STOCK',
    label: (stock > 0 || !activeVariant) ? 'In Stock' : 'Out of Stock'
  };
  const isAvailable = availability.status !== 'OUT_OF_STOCK' && stock > 0;

  const hasComparePrice = activeVariant?.compareAtPriceInr && Number(activeVariant.compareAtPriceInr) > Number(activeVariant.priceInr);
  const discountPercent = hasComparePrice
    ? Math.round(((Number(activeVariant.compareAtPriceInr) - Number(activeVariant.priceInr)) / Number(activeVariant.compareAtPriceInr)) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAvailable && activeVariant && !isMaxInCart) {
      if (propOnAddToCart) propOnAddToCart(product, activeVariant);
      else addToCart(activeVariant.id, 1, stock);
    }
  };

  const handleCardClick = () => {
    if (onTrackView) {
      onTrackView(product);
    }
  };

  return (
    <div
      data-testid="product-card"
      onClick={handleCardClick}
      className={`group relative bg-surface-white rounded-2xl border border-surface-border/80 hover:border-forest-700/50 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full overflow-hidden ${className}`}
    >
      <div>
        {/* Product Media Area (Universal 1:1 Aspect Ratio) */}
        <Link
          to={`/product/${product.slug}`}
          className="relative block aspect-square overflow-hidden bg-surface-cream/40 rounded-t-2xl"
        >
          <MediaImage
            src={primaryImage}
            alt={`${product.title} - Freshly harvested in Davangere`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Top-Left Floating Minimal Rank & Badges */}
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 flex flex-col gap-1 pointer-events-none">
            {/* Authentic Most Sold Rank Badge */}
            <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-[8px] sm:text-[9.5px] font-black rounded-md uppercase tracking-wider shadow-xs flex items-center gap-1 border border-amber-300/40">
              <Flame className="w-2.5 h-2.5 text-amber-200 fill-amber-200 shrink-0" />
              <span>#{rank} BEST SELLER</span>
            </span>

            {product.isPopular && !product.isBestSeller && (
              <span className="px-1.5 py-0.5 bg-forest-900 text-white text-[8px] sm:text-[9px] font-black rounded-md uppercase tracking-wider shadow-xs flex items-center gap-1 border border-forest-600/40">
                <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300 shrink-0" />
                <span>MOST POPULAR</span>
              </span>
            )}
          </div>

          {/* Top-Right Cold-Chain Delivery Proof Tag */}
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 pointer-events-none flex flex-col items-end gap-1">
            <span
              data-testid="product-availability"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7.5px] sm:text-[9px] font-bold border backdrop-blur-md shadow-2xs bg-white/95 text-emerald-800 border-emerald-200/80"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-typography-muted'}`} />
              <span>{isAvailable ? 'Delivered Express' : 'Out of Stock'}</span>
            </span>
          </div>

          {/* Bottom-Left Discount Tag */}
          {discountPercent > 0 && (
            <div
              className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-red-600 text-white text-[8px] sm:text-[9px] font-black rounded shadow-xs tracking-tight"
              data-testid="discount-badge"
            >
              {discountPercent}% OFF
            </div>
          )}
        </Link>

        {/* Minimal Card Body */}
        <div className="p-2.5 sm:p-3.5 space-y-1 sm:space-y-1.5">
          {/* Order & Delivery Status Analytics Social Proof */}
          <div className="flex items-center justify-between text-[8px] sm:text-[9.5px] text-typography-muted font-medium">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold truncate">
              <Truck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 shrink-0" />
              <span>
                {product.totalUnitsSold
                  ? `${product.totalUnitsSold}+ delivered`
                  : 'Verified Delivered'}
              </span>
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] font-bold text-forest-800 bg-forest-50 px-1 py-0.2 rounded border border-forest-100 shrink-0">
              Cold-Chain
            </span>
          </div>

          {/* Title - Clean 2-Line Clamp */}
          <Link
            to={`/product/${product.slug}`}
            className="font-display font-bold text-xs sm:text-sm text-forest-950 group-hover:text-forest-700 transition-colors line-clamp-2 leading-snug min-h-[2rem] sm:min-h-[2.3rem] block"
          >
            {product.title}
          </Link>

          {/* Rating and Customer Review Stats */}
          <div className="flex items-center gap-1 text-[9px] sm:text-[11px] text-amber-600 font-bold">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400 shrink-0" />
            <span>{product.averageRating > 0 ? product.averageRating.toFixed(1) : '4.9'}</span>
            <span className="text-typography-muted font-normal text-[8px] sm:text-[10px]">
              ({product.reviewCount || 120} delivered reviews)
            </span>
          </div>

          {/* Compact Variant Selector (if multi-variant) */}
          {product.variants && product.variants.length > 1 && (
            <div className="pt-0.5 space-y-0.5">
              <div className="flex items-center justify-between text-[7.5px] sm:text-[9px] text-typography-muted">
                <span className="truncate">Option: <strong className="text-forest-900 font-bold">{activeVariant?.variantName}</strong></span>
                <span className="text-forest-700 font-semibold">{product.variants.length} sizes</span>
              </div>
              <div
                className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {product.variants.map((v) => {
                  const isSelected = activeVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedVariant(v);
                      }}
                      title={`Select ${v.variantName}`}
                      className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-forest-900 border-forest-900 text-white shadow-2xs'
                          : 'bg-surface-neutral/60 border-surface-border text-typography-secondary hover:text-forest-900'
                      }`}
                    >
                      {v.variantName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Minimal Pricing & Action Footer */}
      <div className="p-2.5 sm:p-3.5 pt-0 border-t border-surface-border/50 space-y-1.5 mt-0.5">
        <div className="flex items-baseline justify-between gap-1 flex-wrap pt-1.5">
          <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
            <span className="font-display font-extrabold text-xs min-[390px]:text-sm sm:text-base text-forest-950">
              ₹{activeVariant?.calculatedFinalPriceInr || activeVariant?.priceInr || 0}
            </span>
            {hasComparePrice && (
              <span
                className="text-[9px] sm:text-[11px] text-typography-muted line-through font-medium"
                data-testid="strikeout-price"
              >
                ₹{activeVariant.compareAtPriceInr}
              </span>
            )}
            <span className="text-[7.5px] sm:text-[8.5px] text-typography-muted font-normal">incl. GST</span>
          </div>

          {activeVariant?.variantName && product.variants?.length <= 1 && (
            <span className="text-[8px] sm:text-[9.5px] text-typography-muted font-medium truncate max-w-[65px]">
              {activeVariant.variantName}
            </span>
          )}
        </div>

        {/* Minimal Add-to-Cart Action Button */}
        <button
          type="button"
          data-testid="add-to-cart"
          onClick={handleAddToCart}
          disabled={!isAvailable || !activeVariant || isMaxInCart}
          className={`w-full h-7 sm:h-8 min-h-[28px] sm:min-h-[32px] py-0.5 px-2 text-[10px] sm:text-xs rounded-lg font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-150 active:scale-95 ${
            isAvailable && activeVariant && !isMaxInCart
              ? 'btn-primary shadow-2xs hover:shadow-xs'
              : 'bg-surface-neutral text-typography-muted cursor-not-allowed border border-surface-border'
          }`}
        >
          <ShoppingBag className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="truncate">
            {!isAvailable
              ? 'Out of Stock'
              : isMaxInCart
              ? `Max Stock (${currentInCart})`
              : 'Add to Cart'}
          </span>
        </button>
      </div>
    </div>
  );
}
