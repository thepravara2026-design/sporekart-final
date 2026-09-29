import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CheckoutPage from '../pages/CheckoutPage';
import { CartProvider } from '../context/CartContext';
import { customerApi, cartApi } from '../api';

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
    getAvailablePromotions: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
  },
  orderApi: {
    createOrder: vi.fn(),
  },
}));

const getInputByLabelText = (container, labelText) => {
  const label = screen.getByText(labelText);
  return label.parentElement.querySelector('input');
};

describe('FE-5: Address Form Validation & Management Tests', () => {
  const mockUser = {
    id: 'user-1',
    fullName: 'Jane Doe',
    phone: '9876543210',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('sporekart_token', 'mock_jwt_token_123');
    cartApi.getCart.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [
            {
              variantId: 'var-1',
              productTitle: 'Spawn Pack',
              quantity: 1,
              priceInr: 500,
            },
          ],
          subtotalInr: 500,
          itemCount: 1,
        },
      },
    });
    cartApi.validateCart.mockResolvedValue({ valid: true });
    customerApi.getAddresses.mockResolvedValue({
      data: { success: true, data: [] },
    });
  });

  it('renders shipping address form input fields for logged in user', async () => {
    const { container } = render(
      <BrowserRouter>
        <CartProvider>
          <CheckoutPage user={mockUser} setUser={vi.fn()} />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1. Shipping Address')).toBeInTheDocument();
    });

    expect(getInputByLabelText(container, 'Recipient Name')).toBeInTheDocument();
    expect(getInputByLabelText(container, 'Phone Number')).toBeInTheDocument();
    expect(getInputByLabelText(container, 'Address Line 1')).toBeInTheDocument();
    expect(getInputByLabelText(container, 'City')).toBeInTheDocument();
    expect(getInputByLabelText(container, 'State')).toBeInTheDocument();
    expect(getInputByLabelText(container, 'PIN Code')).toBeInTheDocument();
  });

  it('validates invalid PIN code and missing fields on form submission', async () => {
    const { container } = render(
      <BrowserRouter>
        <CartProvider>
          <CheckoutPage user={mockUser} setUser={vi.fn()} />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1. Shipping Address')).toBeInTheDocument();
    });

    fireEvent.change(getInputByLabelText(container, 'Address Line 1'), {
      target: { value: '123 Farm House Road' },
    });
    fireEvent.change(getInputByLabelText(container, 'City'), { target: { value: 'Pune' } });
    fireEvent.change(getInputByLabelText(container, 'State'), { target: { value: 'Maharashtra' } });
    fireEvent.change(getInputByLabelText(container, 'PIN Code'), { target: { value: '123' } }); // Invalid 3 digit pincode

    const submitBtn = screen.getByRole('button', { name: /^save address$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const matches = screen.getAllByText(/PIN code must be a valid 6-digit/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it('submits valid address and calls addAddress API', async () => {
    customerApi.addAddress.mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 'addr-100',
          recipientName: 'Jane Doe',
          phone: '9876543210',
          line1: '123 Farm House Road',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          isDefault: true,
        },
      },
    });

    const { container } = render(
      <BrowserRouter>
        <CartProvider>
          <CheckoutPage user={mockUser} setUser={vi.fn()} />
        </CartProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1. Shipping Address')).toBeInTheDocument();
    });

    fireEvent.change(getInputByLabelText(container, 'Address Line 1'), {
      target: { value: '123 Farm House Road' },
    });
    fireEvent.change(getInputByLabelText(container, 'City'), { target: { value: 'Pune' } });
    fireEvent.change(getInputByLabelText(container, 'State'), { target: { value: 'Maharashtra' } });
    fireEvent.change(getInputByLabelText(container, 'PIN Code'), { target: { value: '411001' } });

    const submitBtn = screen.getByRole('button', { name: /^save address$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(customerApi.addAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientName: 'Jane Doe',
          phone: '9876543210',
          line1: '123 Farm House Road',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
        })
      );
    });
  });
});
