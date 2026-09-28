import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CatalogPage from '../pages/CatalogPage';
import { CartProvider } from '../context/CartContext';
import { catalogApi, cartApi } from '../api';

vi.mock('../components/SeoHead', () => ({ default: () => null }));

vi.mock('../api', () => ({
  catalogApi: {
    getCategories: vi.fn(),
    searchProducts: vi.fn(),
  },
  cartApi: {
    getCart: vi.fn(),
    addItem: vi.fn(),
  },
}));

describe('FE-1: Catalog & Product Display Component Tests', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Mushroom Spawn', slug: 'mushroom-spawn' },
    { id: 'cat-2', name: 'Substrate & Mediums', slug: 'substrate' },
  ];

  const mockProducts = [
    {
      id: 'prod-1',
      title: 'Oyster Mushroom Spawn (Master Grain)',
      slug: 'oyster-mushroom-spawn',
      categoryName: 'Mushroom Spawn',
      images: ['https://example.com/oyster.jpg'],
      variants: [
        { id: 'var-1', name: '1 kg Pack', priceInr: 250, availableStock: 50 },
        { id: 'var-2', name: '5 kg Pack', priceInr: 1100, availableStock: 20 },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    catalogApi.getCategories.mockResolvedValue({
      data: { success: true, data: mockCategories },
    });
    catalogApi.searchProducts.mockResolvedValue({
      data: {
        success: true,
        data: {
          content: mockProducts,
          totalPages: 1,
          totalElements: 1,
        },
      },
    });
    cartApi.getCart.mockResolvedValue({
      data: {
        success: true,
        data: { items: [], subtotalInr: 0, itemCount: 0 },
      },
    });
  });

  it('renders product catalog listing with titles, prices, and images', async () => {
    render(
      <BrowserRouter>
        <CartProvider>
          <CatalogPage />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Oyster Mushroom Spawn (Master Grain)')).toBeInTheDocument();
    });

    expect(screen.getByText('₹250')).toBeInTheDocument();
  });

  it('triggers cart addition when variant selected and Add to Cart is clicked', async () => {
    cartApi.addItem.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [{ variantId: 'var-1', quantity: 1, priceInr: 250 }],
          subtotalInr: 250,
          itemCount: 1,
        },
      },
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <CatalogPage />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Oyster Mushroom Spawn (Master Grain)')).toBeInTheDocument();
    });

    const addToCartButtons = screen.getAllByRole('button', { name: /add to cart/i });
    expect(addToCartButtons.length).toBeGreaterThan(0);
    fireEvent.click(addToCartButtons[0]);

    await waitFor(() => {
      expect(cartApi.addItem).toHaveBeenCalledWith('var-1', 1);
    });
  });
});
