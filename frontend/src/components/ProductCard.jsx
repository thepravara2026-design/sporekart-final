import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Flame, Sparkles, Check, ChevronRight } from 'lucide-react';
import MediaImage from './MediaImage';
import AvailabilityBadge from './AvailabilityBadge';
import { useCart } from '../context/CartContext';

export default function ProductCard({
  product,
  onAddToCart: propOnAddToCart,
  className = '',
  compact = false,
}) {
  const { addToCart, cart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(
    product?.variants?.[0] || null
  );

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

  return (
    <div
      data-testid="product-card"
      className={`bg-surface-white rounded-2xl overflow-hidden border border-surface-border shadow-level-1 hover:border-forest-700/40 hover-lift transition-all duration-300 flex flex-col justify-between group ${className}`}
    >
      <div>
        {/* Product Image Area */}
        <Link
          to={`/product/${product.slug}`}
          className="relative block aspect-[4/3] sm:aspect-square overflow-hidden bg-surface-cream"
        >
          <MediaImage
            src={primaryImage}
            alt={`${product.title} - Fresh mushroom & spawn supply India`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Top Left Badges */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
            {product.isBestSeller && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[9px] sm:text-[10px] font-black rounded-md uppercase tracking-wider shadow-level-2 flex items-center gap-1 border border-amber-300/40">
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-200" /> BEST SELLER
              </span>
            )}
            {product.isPopular && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] sm:text-[10px] font-black rounded-md uppercase tracking-wider shadow-level-2 flex items-center gap-1 border border-amber-300">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-200" /> MOST POPULAR
              </span>
            )}
            {!product.isBestSeller && !product.isPopular && product.categoryName && (
              <span className="px-2 py-0.5 bg-surface-white/90 backdrop-blur-md text-forest-900 text-[9px] sm:text-[10px] font-bold rounded-md border border-surface-border shadow-level-1 truncate max-w-[120px]">
                {product.categoryName}
              </span>
            )}
          </div>

          {/* Top Right Availability Badge */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
            <AvailabilityBadge availability={availability} />
          </div>

          {/* Bottom Left Discount Badge */}
          {discountPercent > 0 && (
            <div
              className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-emerald-700 to-forest-800 text-white text-[9px] sm:text-[10px] font-extrabold rounded-full shadow-md border border-emerald-500/30 backdrop-blur-md uppercase tracking-wider"
              data-testid="discount-badge"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{discountPercent}% OFF</span>
            </div>
          )}
        </Link>

        {/* Product Details Section */}
        <div className="p-3 sm:p-4 space-y-2">
          {/* Rating Row */}
          {product.averageRating > 0 ? (
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-amber-600 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
              <span>{product.averageRating.toFixed(1)}</span>
              <span className="text-typography-muted font-normal text-[10px] sm:text-[11px]">
                ({product.reviewCount || 0} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          ) : (
            <div className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Lab Certified
            </div>
          )}

          {/* Title */}
          <Link
            to={`/product/${product.slug}`}
            className="font-display font-bold text-sm sm:text-base text-forest-900 group-hover:text-forest-700 transition-colors block leading-snug line-clamp-2 min-h-[2.5rem]"
          >
            {product.title}
          </Link>

          {/* Variant Selectors if multiple */}
          {product.variants && product.variants.length > 1 && (
            <div className="flex flex-wrap gap-1 pt-1" data-testid="landing-product-variants">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold border transition-all ${
                    activeVariant?.id === v.id
                      ? 'bg-surface-cream border-forest-700 text-forest-900 shadow-sm'
                      : 'bg-surface-neutral border-surface-border text-typography-secondary hover:border-slate-300'
                  }`}
                >
                  {v.variantName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price & Add to Cart Footer */}
      <div className="p-3 sm:p-4 pt-0 border-t border-surface-border/60 mt-1 space-y-2">
        <div className="flex items-baseline justify-between gap-1 flex-wrap pt-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-display font-extrabold text-base sm:text-lg text-forest-900">
              ₹{activeVariant?.priceInr || 0}
            </span>
            {hasComparePrice && (
              <span
                className="text-[11px] sm:text-xs text-typography-muted line-through font-medium"
                data-testid="strikeout-price"
              >
                ₹{activeVariant.compareAtPriceInr}
              </span>
            )}
          </div>

          {activeVariant?.variantName && product.variants?.length <= 1 && (
            <span className="text-[10px] text-typography-muted font-medium truncate max-w-[80px]">
              {activeVariant.variantName}
            </span>
          )}
        </div>

        {/* Add to Cart Button with minimum 44px touch target */}
        <button
          type="button"
          data-testid="add-to-cart"
          onClick={handleAddToCart}
          disabled={!isAvailable || !activeVariant || isMaxInCart}
          className={`w-full min-h-[44px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all button-press ${
            isAvailable && activeVariant && !isMaxInCart
              ? 'btn-primary shadow-level-1 hover:shadow-md'
              : 'bg-surface-neutral text-typography-muted cursor-not-allowed border border-surface-border'
          }`}
        >
          <ShoppingBag className="w-4 h-4 shrink-0" />
          <span>
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
