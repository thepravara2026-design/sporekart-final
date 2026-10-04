import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CatalogPage from '../pages/CatalogPage';
import { catalogApi } from '../api';
import { CartProvider } from '../context/CartContext';

vi.mock('../api', () => ({
  catalogApi: {
    getProducts: vi.fn(),
    searchProducts: vi.fn(),
    getCategories: vi.fn(),
    getPopularProducts: vi.fn(),
    getBestSellingProducts: vi.fn(),
  },
  authApi: {
    getCurrentUser: vi.fn().mockResolvedValue({ data: { data: null } }),
  },
  cartApi: {
    getCart: vi.fn().mockResolvedValue({ data: { data: { items: [], totalInr: 0 } } }),
  },
}));

describe('Smart Product Discovery & Badging Tests', () => {
  const mockProducts = [
    {
      id: 'prod-1',
      title: 'Oyster Mushroom Cultivation Kit',
      slug: 'oyster-kit',
      description: 'Complete home growing kit',
      categoryName: 'Growing Kits',
      categorySlug: 'growing-kits',
      isActive: true,
      isPopular: true,
      isBestSeller: true,
      averageRating: 4.9,
      reviewCount: 142,
      totalUnitsSold: 350,
      imageUrls: ['/images/oyster-kit.jpg'],
      variants: [
        {
          id: 'var-1',
          variantName: 'Standard Kit',
          priceInr: 499,
          stockQuantity: 20,
          isActive: true,
          availability: { status: 'AVAILABLE', label: 'In Stock' },
        },
      ],
    },
    {
      id: 'prod-2',
      title: 'Milky Mushroom Grain Spawn',
      slug: 'milky-spawn',
      description: 'First generation pure grain spawn',
      categoryName: 'Spawn Seeds',
      categorySlug: 'spawn-seeds',
      isActive: true,
      isPopular: false,
      isBestSeller: true,
      averageRating: 4.5,
      reviewCount: 38,
      totalUnitsSold: 210,
      imageUrls: ['/images/milky-spawn.jpg'],
      variants: [
        {
          id: 'var-2',
          variantName: '1 kg Bag',
          priceInr: 299,
          stockQuantity: 15,
          isActive: true,
          availability: { status: 'AVAILABLE', label: 'In Stock' },
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    catalogApi.searchProducts.mockResolvedValue({
      data: {
        success: true,
        data: {
          content: mockProducts,
          totalPages: 1,
          totalElements: 2,
          number: 0,
        },
      },
    });
    catalogApi.getCategories.mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: 'cat-1', name: 'Growing Kits', slug: 'growing-kits' },
          { id: 'cat-2', name: 'Spawn Seeds', slug: 'spawn-seeds' },
        ],
      },
    });
  });

  it('renders BEST SELLER and MOST POPULAR badges correctly on qualifying product cards', async () => {
    render(
      <BrowserRouter>
        <CartProvider>
          <CatalogPage />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Oyster Mushroom Cultivation Kit')).toBeInTheDocument();
    });

    // Check for BEST SELLER badge
    const bestSellerBadges = screen.getAllByText(/BEST SELLER/i);
    expect(bestSellerBadges.length).toBeGreaterThanOrEqual(1);

    // Check for MOST POPULAR badge
    const popularBadges = screen.getAllByText(/MOST POPULAR/i);
    expect(popularBadges.length).toBeGreaterThanOrEqual(1);

    // Check for rating snippet display (4.9)
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('(142 reviews)')).toBeInTheDocument();
  });
});
