import React, { useState } from 'react';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80';

export default function MediaImage({
  src,
  alt = 'Fresh organic mushroom produce and lab certified spawn seeds India',
  width = 800,
  height = 800,
  className = '',
  aspectRatio = 'aspect-square',
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  loading = 'lazy',
  decoding = 'async',
  ...props
}) {
  const [imageState, setImageState] = useState({
    isLoading: true,
    isError: false,
  });

  const handleLoad = () => {
    setImageState({ isLoading: false, isError: false });
  };

  const handleError = () => {
    setImageState({ isLoading: false, isError: true });
  };

  const displaySrc = imageState.isError ? fallbackSrc : (src || fallbackSrc);

  // Validate alt text to prevent generic names like image1.jpg or IMG_92831.jpg
  const sanitizedAlt = (alt && !alt.match(/^(image|img_\d+|final|photo)\d*\.(jpg|png|webp)/i))
    ? alt
    : 'Fresh organic mushroom produce, lab certified spawn seeds, and DIY growing kits in India';

  return (
    <div className={`relative overflow-hidden ${aspectRatio} ${className}`}>
      {/* Loading Skeleton */}
      {imageState.isLoading && (
        <div className="absolute inset-0 bg-slate-900/80 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-spore-400 border-t-transparent animate-spin"></div>
        </div>
      )}

      {/* SEO-Optimized Responsive Image */}
      <img
        src={displaySrc}
        alt={sanitizedAlt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageState.isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
    </div>
  );
}
