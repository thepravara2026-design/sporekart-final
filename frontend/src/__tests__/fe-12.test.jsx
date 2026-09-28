import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import OrderConfirmationPage from '../pages/OrderConfirmationPage';
import { orderApi } from '../api';

vi.mock('../components/SeoHead', () => ({ default: () => null }));

vi.mock('../api', () => ({
  orderApi: {
    getOrderById: vi.fn(),
    downloadInvoice: vi.fn(),
  },
}));

describe('FE-12: Order Confirmation & Invoice Rendering Component Tests', () => {
  const mockOrderData = {
    id: 'ord-888',
    orderNumber: 'ORD-2026-888',
    status: 'DELIVERED',
    paymentStatus: 'COMPLETED',
    createdAt: '2026-09-26T10:00:00Z',
    items: [
      {
        id: 'item-1',
        productTitle: 'Oyster Mushroom Spawn',
        variantName: '1 kg Pack',
        quantity: 2,
        unitPriceInr: 250,
        totalPriceInr: 500,
      },
    ],
    subtotalAmountInr: 500,
    shippingFeeInr: 70,
    gstTotalInr: 25,
    totalAmountInr: 595,
    shippingAddress: {
      recipientName: 'Alice Smith',
      phone: '9876543210',
      line1: '45 Green Park',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    orderApi.getOrderById.mockResolvedValue({
      data: { success: true, data: mockOrderData },
    });
    // Mock window URL methods for Blob downloads
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/invoice-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  it('renders order confirmation details, order number, line items, and pricing breakdown', async () => {
    render(
      <MemoryRouter initialEntries={['/order-confirmation/ord-888']}>
        <Routes>
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Payment Confirmed!')).toBeInTheDocument();
    });

    const orderNumberMatches = screen.getAllByText(/ORD-2026-888/);
    expect(orderNumberMatches.length).toBeGreaterThan(0);
    expect(screen.getByText('Oyster Mushroom Spawn')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('₹595')).toBeInTheDocument();
  });

  it('triggers invoice PDF download when download button is clicked', async () => {
    const dummyBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
    orderApi.downloadInvoice.mockResolvedValue({
      data: dummyBlob,
    });

    render(
      <MemoryRouter initialEntries={['/order-confirmation/ord-888']}>
        <Routes>
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Payment Confirmed!')).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /download tax invoice/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(orderApi.downloadInvoice).toHaveBeenCalledWith('ord-888');
    });
  });
});
