import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CartDrawer from '../components/CartDrawer';
import { CartProvider, useCart } from '../context/CartContext';
import { cartApi } from '../api';

vi.mock('../components/SeoHead', () => ({ default: () => null }));

vi.mock('../api', () => ({
  cartApi: {
    getCart: vi.fn(),
    addItem: vi.fn(),
    updateItemQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
  },
}));

// Test helper component to force drawer open
const CartDrawerWrapper = () => {
  const { setIsDrawerOpen } = useCart();
  React.useEffect(() => {
    setIsDrawerOpen(true);
  }, [setIsDrawerOpen]);
  return <CartDrawer />;
};

describe('FE-3: Cart Drawer Component & Calculations Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty cart drawer state correctly', async () => {
    cartApi.getCart.mockResolvedValue({
      data: {
        success: true,
        data: { items: [], subtotalInr: 0, itemCount: 0 },
      },
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <CartDrawerWrapper />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
  });

  it('renders cart items, quantities, prices, and free shipping progress bar', async () => {
    const mockCartData = {
      items: [
        {
          variantId: 'var-100',
          productTitle: 'Button Mushroom Spawn',
          variantName: '1 kg',
          unitPriceInr: 300,
          quantity: 2,
          totalPriceInr: 600,
          availableStock: 10,
        },
      ],
      subtotalInr: 600,
      gstTotalInr: 30,
      estimatedTotalInr: 630,
      itemCount: 2,
    };

    cartApi.getCart.mockResolvedValue({
      data: { success: true, data: mockCartData },
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <CartDrawerWrapper />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Button Mushroom Spawn')).toBeInTheDocument();
    });

    expect(screen.getByText('₹300')).toBeInTheDocument();
    expect(screen.getByText(/Add/i)).toBeInTheDocument();
    expect(screen.getByText(/₹399/i)).toBeInTheDocument(); // 999 - 600 = 399 needed for free shipping
  });

  it('calls updateItemQuantity API when plus button is clicked', async () => {
    const mockCartData = {
      items: [
        {
          variantId: 'var-100',
          productTitle: 'Button Mushroom Spawn',
          variantName: '1 kg',
          unitPriceInr: 300,
          quantity: 1,
          availableStock: 10,
        },
      ],
      subtotalInr: 300,
      itemCount: 1,
    };

    cartApi.getCart.mockResolvedValue({
      data: { success: true, data: mockCartData },
    });
    cartApi.updateItemQuantity.mockResolvedValue({
      data: {
        success: true,
        data: { ...mockCartData, items: [{ ...mockCartData.items[0], quantity: 2 }] },
      },
    });

    const { container } = render(
      <BrowserRouter>
        <CartProvider>
          <CartDrawerWrapper />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Button Mushroom Spawn')).toBeInTheDocument();
    });

    // Find the plus icon inside the quantity control box
    const plusSvg = container.querySelector('svg.lucide-plus');
    expect(plusSvg).not.toBeNull();
    const plusButton = plusSvg.closest('button');
    fireEvent.click(plusButton);

    await waitFor(() => {
      expect(cartApi.updateItemQuantity).toHaveBeenCalledWith('var-100', 2);
    });
  });

  it('calls removeItem API when trash icon button is clicked', async () => {
    const mockCartData = {
      items: [
        {
          variantId: 'var-100',
          productTitle: 'Button Mushroom Spawn',
          variantName: '1 kg',
          unitPriceInr: 300,
          quantity: 1,
          availableStock: 10,
        },
      ],
      subtotalInr: 300,
      itemCount: 1,
    };

    cartApi.getCart.mockResolvedValue({
      data: { success: true, data: mockCartData },
    });
    cartApi.removeItem.mockResolvedValue({
      data: {
        success: true,
        data: { items: [], subtotalInr: 0, itemCount: 0 },
      },
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <CartDrawerWrapper />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Button Mushroom Spawn')).toBeInTheDocument();
    });

    const removeButton = screen.getByTitle('Remove item');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(cartApi.removeItem).toHaveBeenCalledWith('var-100');
    });
  });
});
