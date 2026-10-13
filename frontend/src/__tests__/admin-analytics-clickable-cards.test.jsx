import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminAnalyticsDetailModal, { AnalyticsMetricCard } from '../components/AdminAnalyticsDetailModal';
import AdminReviewsManager from '../components/AdminReviewsManager';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import { reviewApi, adminApi, catalogApi, trainingApi, orderApi, adminFinanceApi, shippingApi } from '../api';

vi.mock('../components/SeoHead', () => ({ default: () => null }));
vi.mock('../components/LocalImageUploader', () => ({ default: () => <div data-testid="image-uploader">Mock Image Uploader</div> }));

vi.mock('../api', () => ({
  adminApi: {
    getOverview: vi.fn().mockResolvedValue({ totalRevenueINR: 450000, totalOrdersCount: 320 }),
    getAnalytics: vi.fn().mockResolvedValue({
      totalRevenueINR: 450000,
      totalOrdersCount: 320,
      totalProducts: 48,
      activeOrders: 12,
      totalCustomers: 156,
      salesTrend: []
    }),
    getAuditLogs: vi.fn().mockResolvedValue({ content: [], totalPages: 1 }),
    getPromotions: vi.fn().mockResolvedValue({ content: [] }),
    createCategory: vi.fn(),
    createProduct: vi.fn(),
  },
  catalogApi: {
    getCategories: vi.fn().mockResolvedValue([
      { id: 'cat-1', name: 'Fresh Mushrooms', slug: 'fresh-mushrooms', isActive: true },
      { id: 'cat-2', name: 'Mushroom Spawn', slug: 'mushroom-spawn', isActive: true },
    ]),
    getProducts: vi.fn().mockResolvedValue({
      content: [
        { id: 'p-1', title: 'Oyster Mushroom Spawn 1Kg', productType: 'MUSHROOM_SPAWN', priceInr: 250, variants: [{ id: 'v-1', variantName: '1Kg', sku: 'SPW-OYST-1KG', stockQuantity: 35 }] },
        { id: 'p-2', title: 'Fresh Button Mushrooms 500g', productType: 'FRESH_MUSHROOM', priceInr: 120, variants: [{ id: 'v-2', variantName: '500g', sku: 'FSH-BTN-500G', stockQuantity: 5 }] },
      ],
      totalElements: 2
    }),
  },
  trainingApi: {
    getCourses: vi.fn().mockResolvedValue([
      { id: 'c-1', title: 'Commercial Oyster Cultivation', slug: 'commercial-oyster', durationDays: 14, feeInr: 4500 }
    ]),
    getAdminGlimpses: vi.fn().mockResolvedValue({ data: [] }),
    getBatches: vi.fn().mockResolvedValue({
      content: [
        { id: 'b-1', code: 'BATCH-2026-01', courseTitle: 'Commercial Oyster Cultivation', startDate: '2026-11-01', capacity: 20, enrolled: 16, status: 'CONFIRMED' }
      ]
    }),
    getEnrollments: vi.fn().mockResolvedValue({
      content: [
        { id: 'e-1', studentName: 'Vikas Patil', email: 'vikas@example.com', courseTitle: 'Commercial Oyster Cultivation', feePaid: 4500, status: 'CONFIRMED' }
      ]
    }),
    createGlimpse: vi.fn(),
    deleteGlimpse: vi.fn(),
  },
  orderApi: {
    getOrders: vi.fn().mockResolvedValue({
      content: [
        { id: 'ord-1', orderNumber: 'ORD-2026-001', totalAmountInr: 1250, status: 'PAID', createdAt: '2026-10-10' },
        { id: 'ord-2', orderNumber: 'ORD-2026-002', totalAmountInr: 450, status: 'DELIVERED', createdAt: '2026-10-11' }
      ]
    }),
  },
  adminFinanceApi: {
    getFinanceSummary: vi.fn().mockResolvedValue({ totalPlatformRevenue: 450000, walletHoldingsTotal: 50000 }),
    getPlatformTransactions: vi.fn().mockResolvedValue({ content: [] }),
    getPlatformWithdrawals: vi.fn().mockResolvedValue({ content: [] }),
  },
  shippingApi: {
    getShipments: vi.fn().mockResolvedValue({ content: [] }),
  },
  reviewApi: {
    getAdminReviews: vi.fn(),
    getAdminReviewSummary: vi.fn(),
    moderateReview: vi.fn(),
  },
}));

describe('FAANG-Grade Admin Analytics Interactive Cards & Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    reviewApi.getAdminReviews.mockResolvedValue({
      data: {
        data: {
          content: [
            { id: 'rev-1', productTitle: 'Spawn Seed 1Kg', rating: 5, reviewTitle: 'Super Fast Colonization', status: 'PENDING', customerName: 'Ramesh K.' },
            { id: 'rev-2', productTitle: 'Fresh Oyster 500g', rating: 4, reviewTitle: 'Very Fresh Produce', status: 'PUBLISHED', customerName: 'Anita P.' },
          ],
          totalPages: 1,
          totalElements: 2,
          number: 0,
        }
      }
    });

    reviewApi.getAdminReviewSummary.mockResolvedValue({
      data: {
        data: { totalReviews: 2, pendingReviews: 1, publishedReviews: 1, rejectedReviews: 0, averageRating: 4.5 }
      }
    });
  });

  it('renders AnalyticsMetricCard and triggers onClick via click, Enter, and Space keys', () => {
    const handleClick = vi.fn();
    render(
      <AnalyticsMetricCard
        title="Total In-Stock SKUs"
        value={128}
        subtext="Available items"
        badge="Healthy"
        onClick={handleClick}
        testId="test-metric-card"
      />
    );

    expect(screen.getByText('Total In-Stock SKUs')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();

    const card = screen.getByTestId('test-metric-card');
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(card, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it('renders AdminAnalyticsDetailModal with fast search filter and keyboard Escape closing', () => {
    const handleClose = vi.fn();
    const config = {
      domain: 'Catalog',
      title: 'Catalog Products & Inventory Registry',
      metric: '2 Products',
      subtitle: 'Complete cultivar breakdown',
      badge: 'Active Catalog',
      badgeColor: 'green',
      breakdown: [
        { label: 'Fresh Produce', value: 1 },
        { label: 'Spawn Cultures', value: 1 }
      ],
      items: [
        { id: 'p-1', title: 'Oyster Mushroom Spawn 1Kg', subtitle: 'Type: MUSHROOM_SPAWN', status: 'In Stock', statusColor: 'green', amount: 250 },
        { id: 'p-2', title: 'Fresh Button Mushrooms 500g', subtitle: 'Type: FRESH_MUSHROOM', status: 'Low Stock', statusColor: 'amber', amount: 120 }
      ]
    };

    const { rerender } = render(
      <AdminAnalyticsDetailModal
        isOpen={true}
        onClose={handleClose}
        config={config}
      />
    );

    expect(screen.getByText('Catalog Products & Inventory Registry')).toBeInTheDocument();
    expect(screen.getByText('Fresh Produce')).toBeInTheDocument();
    expect(screen.getByText('Oyster Mushroom Spawn 1Kg')).toBeInTheDocument();
    expect(screen.getByText('Fresh Button Mushrooms 500g')).toBeInTheDocument();

    // Test real-time search filtering
    const searchInput = screen.getByPlaceholderText(/Search .* items/i);
    fireEvent.change(searchInput, { target: { value: 'Button' } });

    expect(screen.queryByText('Oyster Mushroom Spawn 1Kg')).not.toBeInTheDocument();
    expect(screen.getByText('Fresh Button Mushrooms 500g')).toBeInTheDocument();

    // Test Escape key close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('AdminReviewsManager overview cards open drill-down modal with exact status details', async () => {
    render(<AdminReviewsManager />);

    await waitFor(() => {
      expect(screen.getByText(/Spawn Seed 1Kg/i)).toBeInTheDocument();
    });

    // Find the Pending Moderation card
    const pendingCard = screen.getByTestId('kpi-card-pending-moderation');
    expect(pendingCard).toBeInTheDocument();

    // Click it to open detail modal
    fireEvent.click(pendingCard);

    await waitFor(() => {
      expect(screen.getByText(/Pending Moderation Reviews/i)).toBeInTheDocument();
      expect(screen.getByText(/Spawn Seed 1Kg/i)).toBeInTheDocument();
    });

    // Close with Close modal button
    const closeBtn = screen.getByLabelText(/Close modal/i);
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Pending Moderation Reviews/i)).not.toBeInTheDocument();
    });
  });

  it('AdminDashboardPage overview Domain Metric ribbon opens drill-down modal instantly', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminDashboardPage user={{ role: 'ADMIN', fullName: 'Lead Admin' }} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('kpi-card-products')).toBeInTheDocument();
    });

    // Click Catalog Domain Card in Header
    fireEvent.click(screen.getByTestId('kpi-card-products'));

    await waitFor(() => {
      expect(screen.getByText(/Catalog Products & Inventory Registry/i)).toBeInTheDocument();
    });

    // Press Escape to dismiss
    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText(/Catalog Products & Inventory Registry/i)).not.toBeInTheDocument();
    });
  });
});
