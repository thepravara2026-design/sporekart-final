import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
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

// Helper component that invokes addToCart to trigger popup drawer
const AddToCartTestConsumer = ({ variantId = 'var-101', quantity = 1 }) => {
  const { addToCart } = useCart();
  return (
    <div>
      <button 
        onClick={() => addToCart(variantId, quantity)}
        data-testid="test-add-btn"
      >
        Add Test Product
      </button>
      <ProductAddedPopupDrawer />
    </div>
  );
};

describe('Product Added Popup Drawer Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers popup drawer when item is added via addToCart', async () => {
    cartApi.getCart.mockResolvedValue({
      data: { success: true, data: { items: [], subtotalInr: 0, itemCount: 0 } }
    });

    const mockCartData = {
      items: [
        {
          variantId: 'var-101',
          productTitle: 'Oyster Mushroom Spawn',
          variantName: '500 g',
          unitPriceInr: 150,
          quantity: 2,
          availableStock: 20,
          imageUrl: 'https://example.com/oyster.jpg',
        }
      ],
      subtotalInr: 300,
      itemCount: 2,
    };

    cartApi.addItem.mockResolvedValue({
      data: { success: true, data: mockCartData }
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <AddToCartTestConsumer variantId="var-101" quantity={2} />
        </CartProvider>
      </BrowserRouter>
    );

    // Click Add to Cart button
    const addBtn = screen.getByTestId('test-add-btn');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Added to Basket!')).toBeInTheDocument();
    });

    expect(screen.getByText('Oyster Mushroom Spawn')).toBeInTheDocument();
    expect(screen.getByText('500 g')).toBeInTheDocument();
    expect(screen.getByText('+2 added')).toBeInTheDocument();
    expect(screen.getByText(/₹150/)).toBeInTheDocument();
  });

  it('closes popup drawer when X button is clicked', async () => {
    cartApi.getCart.mockResolvedValue({
      data: { success: true, data: { items: [], subtotalInr: 0, itemCount: 0 } }
    });

    cartApi.addItem.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [
            {
              variantId: 'var-102',
              productTitle: 'Shiitake Spawn',
              variantName: '1 kg',
              unitPriceInr: 450,
              quantity: 1,
              availableStock: 5,
            }
          ],
          subtotalInr: 450,
          itemCount: 1,
        }
      }
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <AddToCartTestConsumer variantId="var-102" quantity={1} />
        </CartProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('test-add-btn'));

    await waitFor(() => {
      expect(screen.getByText('Shiitake Spawn')).toBeInTheDocument();
    });

    const closeBtn = screen.getByLabelText('Close notification');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Shiitake Spawn')).not.toBeInTheDocument();
    });
  });

  it('calls updateQuantity API when plus button in popup drawer is clicked', async () => {
    cartApi.getCart.mockResolvedValue({
      data: { success: true, data: { items: [], subtotalInr: 0, itemCount: 0 } }
    });

    const mockCartData = {
      items: [
        {
          variantId: 'var-103',
          productTitle: 'Ganoderma Spawn',
          variantName: '500 g',
          unitPriceInr: 600,
          quantity: 1,
          availableStock: 10,
        }
      ],
      subtotalInr: 600,
      itemCount: 1,
    };

    cartApi.addItem.mockResolvedValue({
      data: { success: true, data: mockCartData }
    });

    cartApi.updateItemQuantity.mockResolvedValue({
      data: {
        success: true,
        data: { ...mockCartData, items: [{ ...mockCartData.items[0], quantity: 2 }] }
      }
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <AddToCartTestConsumer variantId="var-103" quantity={1} />
        </CartProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('test-add-btn'));

    await waitFor(() => {
      expect(screen.getByText('Ganoderma Spawn')).toBeInTheDocument();
    });

    const increaseBtn = screen.getByLabelText('Increase quantity');
    fireEvent.click(increaseBtn);

    await waitFor(() => {
      expect(cartApi.updateItemQuantity).toHaveBeenCalledWith('var-103', 2);
    });
  });
});
