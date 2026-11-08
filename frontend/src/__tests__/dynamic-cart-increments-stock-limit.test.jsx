import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CartDrawer from '../components/CartDrawer';
import ProductAddedPopupDrawer from '../components/ProductAddedPopupDrawer';
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

// Test helper to open CartDrawer with custom variantId
const CartDrawerHarness = ({ onAddVariantId = 'var-200', onAddStock = 3 }) => {
  const { setIsDrawerOpen, addToCart } = useCart();
  React.useEffect(() => {
    setIsDrawerOpen(true);
  }, [setIsDrawerOpen]);

  return (
    <div>
      <button
        data-testid="add-increment-btn"
        onClick={() => addToCart(onAddVariantId, 1, onAddStock)}
      >
        Add Increment
      </button>
      <CartDrawer />
      <ProductAddedPopupDrawer />
    </div>
  );
};

describe('Dynamic Cart Drawer Increments & Available Stock Enforcement Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dynamically displays incremented quantity in cart drawer and updates line price', async () => {
    const mockCartData = {
      items: [
        {
          variantId: 'var-200',
          productTitle: 'Oyster Mushroom Spawn',
          variantName: '500 g',
          unitPriceInr: 200,
          quantity: 1,
          availableStock: 5,
          inStock: true,
        },
      ],
      subtotalInr: 200,
      gstTotalInr: 10,
      estimatedTotalInr: 210,
      itemCount: 1,
      valid: true,
    };

    cartApi.getCart.mockResolvedValue({
      data: { success: true, data: mockCartData },
    });

    cartApi.updateItemQuantity.mockImplementation((variantId, qty) => {
      return Promise.resolve({
        data: {
          success: true,
          data: {
            ...mockCartData,
            items: [{ ...mockCartData.items[0], quantity: qty }],
            subtotalInr: 200 * qty,
            estimatedTotalInr: (200 * qty) + 10,
            itemCount: qty,
          },
        },
      });
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <CartDrawerHarness />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Oyster Mushroom Spawn')).toBeInTheDocument();
    });

    // Initial quantity is 1
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('₹200.00')).toBeInTheDocument();

    // Click plus button once
    const plusButton = screen.getByLabelText('Increase quantity');
    fireEvent.click(plusButton);

    // Quantity should dynamically update to 2 immediately in the UI
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('₹400.00')).toBeInTheDocument();
    });

    expect(cartApi.updateItemQuantity).toHaveBeenCalledWith('var-200', 2);
  });

  it('prevents customer from ordering more than available stock by disabling plus button at max stock', async () => {
    const mockCartData = {
      items: [
        {
          variantId: 'var-201',
          productTitle: 'Cordyceps Militaris Spawn',
          variantName: '250 g',
          unitPriceInr: 800,
          quantity: 2,
          availableStock: 2, // Maximum stock is 2
          inStock: true,
        },
      ],
      subtotalInr: 1600,
      gstTotalInr: 80,
      estimatedTotalInr: 1680,
      itemCount: 2,
      valid: true,
    };

    cartApi.getCart.mockResolvedValue({
      data: { success: true, data: mockCartData },
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <CartDrawerHarness />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Cordyceps Militaris Spawn')).toBeInTheDocument();
    });

    // Plus button should be disabled because quantity (2) == availableStock (2)
    const plusButton = screen.getByLabelText('Increase quantity');
    expect(plusButton).toBeDisabled();
    expect(screen.getByText(/Max stock reached/i)).toBeInTheDocument();

    // Attempting to click should not trigger API call
    fireEvent.click(plusButton);
    expect(cartApi.updateItemQuantity).not.toHaveBeenCalled();
  });

  it('supports rapid multiple increments dynamically in cart drawer up to available stock limit', async () => {
    const mockCartData = {
      items: [
        {
          variantId: 'var-202',
          productTitle: 'Milky Mushroom Spawn',
          variantName: '1 kg',
          unitPriceInr: 250,
          quantity: 1,
          availableStock: 3, // Max stock is 3
          inStock: true,
        },
      ],
      subtotalInr: 250,
      gstTotalInr: 12.5,
      estimatedTotalInr: 262.5,
      itemCount: 1,
      valid: true,
    };

    cartApi.getCart.mockResolvedValue({
      data: { success: true, data: mockCartData },
    });

    cartApi.updateItemQuantity.mockImplementation((variantId, qty) => {
      return Promise.resolve({
        data: {
          success: true,
          data: {
            ...mockCartData,
            items: [{ ...mockCartData.items[0], quantity: qty }],
            subtotalInr: 250 * qty,
            estimatedTotalInr: (250 * qty) + 12.5,
            itemCount: qty,
          },
        },
      });
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <CartDrawerHarness />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Milky Mushroom Spawn')).toBeInTheDocument();
    });

    const plusButton = screen.getByLabelText('Increase quantity');

    // First increment: 1 -> 2
    fireEvent.click(plusButton);
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Second increment: 2 -> 3 (Max stock reached)
    fireEvent.click(plusButton);
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(plusButton).toBeDisabled();
      expect(screen.getByText(/Max stock reached/i)).toBeInTheDocument();
    });

    expect(cartApi.updateItemQuantity).toHaveBeenCalled();
  });

  it('dynamically reflects increments in popup drawer and prevents exceeding stock', async () => {
    cartApi.getCart.mockResolvedValue({
      data: { success: true, data: { items: [], subtotalInr: 0, itemCount: 0 } },
    });

    const mockCartWithItem = {
      items: [
        {
          variantId: 'var-203',
          productTitle: 'Lion Mane Spawn',
          variantName: '500 g',
          unitPriceInr: 400,
          quantity: 1,
          availableStock: 2,
          inStock: true,
        },
      ],
      subtotalInr: 400,
      itemCount: 1,
    };

    cartApi.addItem.mockResolvedValue({
      data: { success: true, data: mockCartWithItem },
    });

    cartApi.updateItemQuantity.mockImplementation((variantId, qty) => {
      return Promise.resolve({
        data: {
          success: true,
          data: {
            ...mockCartWithItem,
            items: [{ ...mockCartWithItem.items[0], quantity: qty }],
            subtotalInr: 400 * qty,
            itemCount: qty,
          },
        },
      });
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <CartDrawerHarness onAddVariantId="var-203" onAddStock={2} />
        </CartProvider>
      </BrowserRouter>
    );

    // Click button to add item
    const addBtn = screen.getByTestId('add-increment-btn');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Added to Basket!')).toBeInTheDocument();
    });

    // Inside popup drawer, click plus button
    const popupPlusBtn = screen.getAllByLabelText('Increase quantity')[1] || screen.getAllByLabelText('Increase quantity')[0];
    fireEvent.click(popupPlusBtn);

    await waitFor(() => {
      expect(cartApi.updateItemQuantity).toHaveBeenCalledWith('var-203', 2);
    });

    // Max stock (2) is reached, plus button in popup drawer is disabled
    await waitFor(() => {
      expect(popupPlusBtn).toBeDisabled();
    });
  });
});
