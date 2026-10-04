import React from 'react';
import ProductGrid from './ProductGrid';

export default function ProductCarousel({
  title,
  subtitle,
  products = [],
  itemsPerPage = 8,
  onAddToCart,
  className = '',
}) {
  return (
    <ProductGrid
      title={title}
      subtitle={subtitle}
      products={products}
      itemsPerPage={itemsPerPage}
      onAddToCart={onAddToCart}
      className={className}
    />
  );
}
