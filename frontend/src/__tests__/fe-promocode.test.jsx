import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PromoCodeSection from '../components/PromoCodeSection';
import CheckoutPage from '../pages/CheckoutPage';
import { CartProvider } from '../context/CartContext';
import { cartApi, customerApi } from '../api';

vi.mock('../components/SeoHead', () => ({ default: () => null }));

vi.mock('../api', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
  },
  customerApi: {
    getAddresses: vi.fn(),
    addAddress: vi.fn(),
  },
  cartApi: {
    getCart: vi.fn(),
    validateCart: vi.fn(),
    applyPromotion: vi.fn(),
    removePromotion: vi.fn(),
    getAvailablePromotions: vi.fn(),
  },
  orderApi: {
    createOrder: vi.fn(),
  },
}));

describe('Promo Code Feature Tests (Cart & Checkout)', () => {
  const mockUser = {
    id: 'user-1',
    fullName: 'Test User',
    phone: '9876543210',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('sporekart_token', 'mock_jwt_token_123');
    cartApi.getAvailablePromotions.mockResolvedValue({
      data: {
        success: true,
        data: [
          { code: 'SPORE10', name: '10% OFF', description: 'Min order ₹299' },
          { code: 'WELCOME50', name: 'FLAT ₹50 OFF', description: 'Min order ₹199' },
        ],
      },
    });
    cartApi.getCart.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [
            {
              variantId: 'var-1',
              productTitle: 'Oyster Mushroom Spawn',
              variantName: '1 kg',
              quantity: 2,
              unitPriceInr: 250,
              lineTotalInr: 500,
              inStock: true,
              availableStock: 10,
            },
          ],
          subtotalInr: 500,
          gstTotalInr: 25,
          shippingFeeInr: 0,
          discountTotalInr: 0,
          promoDiscountInr: 0,
          estimatedTotalInr: 525,
          itemCount: 2,
          valid: true,
          appliedPromoCode: null,
          promoMessage: null,
        },
      },
    });
    cartApi.validateCart.mockResolvedValue({ valid: true });
    customerApi.getAddresses.mockResolvedValue({
      data: { success: true, data: [] },
    });
  });

  it('renders PromoCodeSection with input field and coupon chips', async () => {
    render(
      <BrowserRouter>
        <CartProvider>
          <PromoCodeSection />
        </CartProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Have a Promo Code?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter code/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('SPORE10')).toBeInTheDocument();
      expect(screen.getByText('WELCOME50')).toBeInTheDocument();
    });
  });

  it('applies promo code when clicking coupon chip', async () => {
    cartApi.applyPromotion.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [],
          subtotalInr: 500,
          gstTotalInr: 25,
          shippingFeeInr: 0,
          discountTotalInr: 50,
          promoDiscountInr: 50,
          estimatedTotalInr: 475,
          itemCount: 2,
          valid: true,
          appliedPromoCode: 'SPORE10',
          promoMessage: "Offer 'SPORE10' applied successfully!",
        },
      },
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <PromoCodeSection />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('SPORE10')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('SPORE10'));

    await waitFor(() => {
      expect(cartApi.applyPromotion).toHaveBeenCalledWith('SPORE10');
    });
  });

  it('renders promo code input and applied discount in CheckoutPage sidebar', async () => {
    cartApi.getCart.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [
            {
              variantId: 'var-1',
              productTitle: 'Oyster Mushroom Spawn',
              variantName: '1 kg',
              quantity: 2,
              unitPriceInr: 250,
              lineTotalInr: 500,
              inStock: true,
              availableStock: 10,
            },
          ],
          subtotalInr: 500,
          gstTotalInr: 25,
          shippingFeeInr: 0,
          discountTotalInr: 50,
          promoDiscountInr: 50,
          estimatedTotalInr: 475,
          itemCount: 2,
          valid: true,
          appliedPromoCode: 'SPORE10',
          promoMessage: "Offer 'SPORE10' applied successfully!",
        },
      },
    });

    render(
      <BrowserRouter>
        <CartProvider>
          <CheckoutPage user={mockUser} setUser={vi.fn()} />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
      expect(screen.getByText('SPORE10')).toBeInTheDocument();
      expect(screen.getByText(/Promo Discount \(SPORE10\)/i)).toBeInTheDocument();
      expect(screen.getByText('- ₹50')).toBeInTheDocument();
      expect(screen.getByText('₹475')).toBeInTheDocument();
    });
  });
});
