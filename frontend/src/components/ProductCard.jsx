import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Flame, CheckCircle2 } from 'lucide-react';
import MediaImage from './MediaImage';
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

  // Synchronize variant when product changes
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

  return (
    <div
      data-testid="product-card"
      className={`bg-surface-white rounded-xl sm:rounded-2xl overflow-hidden border border-surface-border/90 shadow-xs hover:shadow-md hover:border-forest-700/40 transition-all duration-300 flex flex-col justify-between group ${className}`}
    >
      <div>
        {/* Product Image Area - Universal 1:1 Aspect Ratio (Amazon standard) */}
        <Link
          to={`/product/${product.slug}`}
          className="relative block aspect-square overflow-hidden bg-surface-cream/50"
        >
          <MediaImage
            src={primaryImage}
            alt={`${product.title} - Cultivated fresh in Davangere, Karnataka`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Top Left Mini Amazon-style Badges */}
          <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
            {product.isBestSeller && (
              <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[8px] sm:text-[9.5px] font-black rounded uppercase tracking-wider shadow-xs flex items-center gap-0.5 border border-amber-300/30">
                <Flame className="w-2.5 h-2.5 text-amber-200 shrink-0" /> BEST SELLER
              </span>
            )}
            {product.isPopular && (
              <span className="px-1.5 py-0.5 bg-amber-600 text-white text-[8px] sm:text-[9.5px] font-black rounded uppercase tracking-wider shadow-xs flex items-center gap-0.5 border border-amber-300/30">
                <Star className="w-2.5 h-2.5 fill-amber-200 text-amber-200 shrink-0" /> MOST POPULAR
              </span>
            )}
            {!product.isBestSeller && !product.isPopular && product.categoryName && (
              <span className="px-1.5 py-0.5 bg-surface-white/90 backdrop-blur-md text-forest-900 text-[8px] sm:text-[9px] font-bold rounded border border-surface-border shadow-xs truncate max-w-[100px] sm:max-w-[120px]">
                {product.categoryName}
              </span>
            )}
          </div>

          {/* Top Right Discreet Availability Badge */}
          <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-10 pointer-events-none">
            <span
              data-testid="product-availability"
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-semibold border backdrop-blur-md shadow-xs ${
                isAvailable
                  ? 'bg-white/95 text-emerald-800 border-emerald-200/80'
                  : 'bg-white/95 text-typography-muted border-surface-border'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-typography-muted'}`} />
              <span>{availability.label || (isAvailable ? 'In Stock' : 'Out of Stock')}</span>
            </span>
          </div>

          {/* Bottom Left Discount Deal Pill (Amazon Style) */}
          {discountPercent > 0 && (
            <div
              className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 flex items-center gap-1 px-1.5 py-0.5 bg-red-600 text-white text-[8.5px] sm:text-[9.5px] font-black rounded shadow-xs tracking-tight uppercase"
              data-testid="discount-badge"
            >
              <span>{discountPercent}% OFF</span>
            </div>
          )}
        </Link>

        {/* Product Details Section - Compact & Systematic Layout */}
        <div className="p-2.5 sm:p-3.5 space-y-1.5">
          {/* Rating Row (Amazon Style) */}
          {product.averageRating > 0 ? (
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-600 font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <span>{product.averageRating.toFixed(1)}</span>
              <span className="text-typography-muted font-normal text-[9px] sm:text-[10px]">
                ({product.reviewCount || 0} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          ) : (
            <div className="text-[9px] sm:text-[10px] text-emerald-700 font-semibold tracking-wide flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> Lab Tested
            </div>
          )}

          {/* Title - Clean 2-Line Clamp with Systematic Height */}
          <Link
            to={`/product/${product.slug}`}
            className="font-display font-semibold sm:font-bold text-xs sm:text-sm text-forest-950 group-hover:text-forest-700 transition-colors block leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[2.25rem]"
          >
            {product.title}
          </Link>

          {/* Creative, Modern Variant Selector (Zero-Mess Single-Line Track) */}
          {product.variants && product.variants.length > 1 && (
            <div className="pt-0.5 space-y-1">
              <div className="flex items-center justify-between text-[8.5px] sm:text-[9.5px] text-typography-muted">
                <span className="truncate pr-1">Option: <strong className="text-forest-900 font-bold">{activeVariant?.variantName}</strong></span>
                <span className="text-[8px] sm:text-[8.5px] font-semibold text-forest-700 bg-forest-50 px-1 py-0.2 rounded border border-forest-100 shrink-0">
                  {product.variants.length} sizes
                </span>
              </div>
              <div 
                className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 flex-nowrap overscroll-contain"
                data-testid="landing-product-variants"
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
                      className={`shrink-0 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-forest-900 border-forest-900 text-white shadow-xs scale-[1.02]'
                          : 'bg-surface-neutral/80 border-surface-border text-typography-secondary hover:border-forest-600 hover:text-forest-900 hover:bg-surface-cream'
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

      {/* Price & Add to Cart Footer (Compact, Amazon-style Spacing) */}
      <div className="p-2.5 sm:p-3.5 pt-0 border-t border-surface-border/50 space-y-1.5 mt-0.5">
        <div className="flex items-baseline justify-between gap-1 flex-wrap pt-1.5">
          <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
            <span className="font-display font-extrabold text-sm sm:text-base text-forest-950">
              ₹{activeVariant?.calculatedFinalPriceInr || activeVariant?.priceInr || 0}
            </span>
            {hasComparePrice && (
              <span
                className="text-[10px] sm:text-[11px] text-typography-muted line-through font-medium"
                data-testid="strikeout-price"
              >
                ₹{activeVariant.compareAtPriceInr}
              </span>
            )}
            <span className="text-[8.5px] sm:text-[9.5px] text-typography-muted font-normal">incl. GST</span>
          </div>

          {activeVariant?.variantName && product.variants?.length <= 1 && (
            <span className="text-[9px] sm:text-[10px] text-typography-muted font-medium truncate max-w-[70px]">
              {activeVariant.variantName}
            </span>
          )}
        </div>

        {/* Compact Add to Cart Button with Smaller Icon */}
        <button
          type="button"
          data-testid="add-to-cart"
          onClick={handleAddToCart}
          disabled={!isAvailable || !activeVariant || isMaxInCart}
          className={`w-full h-8 sm:h-9 min-h-[34px] sm:min-h-[38px] py-1 px-2.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 ${
            isAvailable && activeVariant && !isMaxInCart
              ? 'btn-primary shadow-xs hover:shadow-sm'
              : 'bg-surface-neutral text-typography-muted cursor-not-allowed border border-surface-border'
          }`}
        >
          <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
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
