import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import OrderConfirmationPage from '../pages/OrderConfirmationPage';
import { adminApi, orderApi, reviewApi, catalogApi, trainingApi, adminFinanceApi, shippingApi } from '../api';

vi.mock('../components/SeoHead', () => ({ default: () => null }));
vi.mock('../components/LocalImageUploader', () => ({ default: () => null }));
vi.mock('../components/AdminReviewsManager', () => ({ default: () => null }));
vi.mock('../components/AdminTrainingGalleryManager', () => ({ default: () => null }));

vi.mock('../api', () => ({
  adminApi: {
    getOverview: vi.fn().mockResolvedValue({ data: { success: true, data: { activeOrders: 2, totalRevenueInr: 1500 } } }),
    getAnalyticsOverview: vi.fn().mockResolvedValue({ data: { success: true, data: { activeOrders: 2, totalRevenueInr: 1500 } } }),
    getOrders: vi.fn(),
    getOrderById: vi.fn(),
    updateOrderStatus: vi.fn(),
    downloadPackingSlip: vi.fn(),
    getCustomers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getTickets: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getCsatSummary: vi.fn().mockResolvedValue({ data: { success: true, data: { averageRating: 5.0 } } }),
    getAuditLogs: vi.fn().mockResolvedValue({ data: { success: true, data: { content: [] } } }),
    getPromotions: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getEnrollments: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
  },
  catalogApi: {
    getCategories: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getProducts: vi.fn().mockResolvedValue({ data: { success: true, data: { content: [] } } }),
  },
  trainingApi: {
    getCourses: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
  },
  orderApi: {
    getOrderById: vi.fn(),
    downloadInvoice: vi.fn(),
  },
  adminFinanceApi: {
    getOverview: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getTransactions: vi.fn().mockResolvedValue({ data: { success: true, data: { content: [] } } }),
    getWithdrawals: vi.fn().mockResolvedValue({ data: { success: true, data: { content: [] } } }),
  },
  shippingApi: {
    getShipments: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
  },
  reviewApi: {
    getAdminReviews: vi.fn().mockResolvedValue({ data: { success: true, data: { content: [] } } }),
    getAdminReviewSummary: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
  },
}));

describe('Admin Orders & Customer Confirmation Payment Verification Enhancement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Admin Console displays only confirmed paid orders and excludes unconfirmed PENDING_PAYMENT orders', async () => {
    const mockOrders = [
      { id: 'ord-unpaid-1', orderNumber: 'ORD-UNPAID-001', totalAmountInr: 999, status: 'PENDING_PAYMENT', createdAt: '2026-10-14T01:00:00Z' },
      { id: 'ord-paid-2', orderNumber: 'ORD-PAID-002', totalAmountInr: 1450, status: 'PAID', createdAt: '2026-10-14T02:00:00Z' },
      { id: 'ord-shipped-3', orderNumber: 'ORD-SHIPPED-003', totalAmountInr: 2100, status: 'SHIPPED', courierPartner: 'BlueDart', trackingNumber: 'AWB123', createdAt: '2026-10-14T03:00:00Z' },
    ];

    adminApi.getOrders.mockResolvedValue({
      data: { success: true, data: mockOrders }
    });

    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <AdminDashboardPage user={{ role: 'ROLE_ADMIN', fullName: 'Super Admin' }} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-PAID-002')).toBeInTheDocument();
      expect(screen.getByText('ORD-SHIPPED-003')).toBeInTheDocument();
    });

    // Unpaid PENDING_PAYMENT order must NOT be displayed in the Admin Orders Directory
    expect(screen.queryByText('ORD-UNPAID-001')).not.toBeInTheDocument();

    // Active Fulfillment Queue must count only confirmed orders (PAID) and exclude PENDING_PAYMENT
    const activeQueueCard = screen.getByTestId('kpi-card-orders-active');
    expect(activeQueueCard).toBeInTheDocument();
    expect(activeQueueCard).toHaveTextContent('1'); // Only ORD-PAID-002
  });

  it('OrderConfirmationPage renders success only after payment is confirmed (PAID)', async () => {
    const confirmedOrder = {
      id: 'ord-conf-1',
      orderNumber: 'ORD-CONF-001',
      status: 'PAID',
      paymentStatus: 'PAID',
      totalAmountInr: 1250,
      subtotalAmountInr: 1150,
      shippingFeeInr: 100,
      items: [{ productTitle: 'Oyster Grain Spawn', variantName: '1kg', quantity: 2, unitPriceInr: 575 }],
      shippingAddress: { recipientName: 'Dr. Pravara', line1: 'Mushroom Farm Rd', city: 'Pune', state: 'MH', pincode: '411001' },
      razorpayPaymentId: 'pay_rzp_success_99',
    };

    orderApi.getOrderById.mockResolvedValue({
      data: { success: true, data: confirmedOrder }
    });

    render(
      <MemoryRouter initialEntries={['/order-confirmation/ord-conf-1']}>
        <Routes>
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Payment Confirmed!')).toBeInTheDocument();
      expect(screen.getByText('Total Amount Paid')).toBeInTheDocument();
      expect(screen.getByText('pay_rzp_success_99')).toBeInTheDocument();
    });

    expect(screen.queryByText('Payment Pending Confirmation')).not.toBeInTheDocument();
  });

  it('OrderConfirmationPage prompts for payment completion if order is still PENDING_PAYMENT', async () => {
    const unpaidOrder = {
      id: 'ord-unpaid-2',
      orderNumber: 'ORD-UNPAID-002',
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      totalAmountInr: 750,
      subtotalAmountInr: 700,
      shippingFeeInr: 50,
      items: [{ productTitle: 'Spawn Bag', variantName: '500g', quantity: 1, unitPriceInr: 700 }],
      shippingAddress: { recipientName: 'Buyer', line1: 'Lane 1', city: 'Mumbai', state: 'MH', pincode: '400001' },
    };

    orderApi.getOrderById.mockResolvedValue({
      data: { success: true, data: unpaidOrder }
    });

    render(
      <MemoryRouter initialEntries={['/order-confirmation/ord-unpaid-2']}>
        <Routes>
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Payment Pending Confirmation')).toBeInTheDocument();
    });

    expect(screen.queryByText('Payment Confirmed!')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete payment now/i })).toBeInTheDocument();
    expect(screen.getByText('Total Amount Due')).toBeInTheDocument();
  });
});
