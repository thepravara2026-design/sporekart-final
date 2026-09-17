import React, { useState } from 'react';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=600&q=80';

export default function MediaImage({
  src,
  alt = 'Sporekart fresh mushroom product',
  width,
  height,
  className = '',
  aspectRatio = 'aspect-square',
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  loading = 'lazy',
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

  return (
    <div className={`relative overflow-hidden ${aspectRatio} ${className}`}>
      {/* Loading Skeleton */}
      {imageState.isLoading && (
        <div className="absolute inset-0 bg-slate-900/80 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-spore-400 border-t-transparent animate-spin"></div>
        </div>
      )}

      {/* Responsive WebP/Image */}
      <img
        src={displaySrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
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
