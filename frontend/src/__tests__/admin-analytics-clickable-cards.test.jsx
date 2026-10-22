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
    getAnalyticsOverview: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          totalProducts: 48,
          activeOrders: 12,
          totalCustomers: 156,
          activeCourses: 3,
          totalRevenueInr: 450000
        }
      }
    }),
    getAdminProducts: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          content: [
            { id: 'p-1', title: 'Oyster Mushroom Spawn 1Kg', productType: 'MUSHROOM_SPAWN', priceInr: 250, variants: [{ id: 'v-1', variantName: '1Kg', sku: 'SPW-OYST-1KG', stockQuantity: 35 }] },
            { id: 'p-2', title: 'Fresh Button Mushrooms 500g', productType: 'FRESH_MUSHROOM', priceInr: 120, variants: [{ id: 'v-2', variantName: '500g', sku: 'FSH-BTN-500G', stockQuantity: 5 }] },
          ],
          totalElements: 2
        }
      }
    }),
    getOrders: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getCustomers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getAuditLogs: vi.fn().mockResolvedValue({ data: { success: true, data: { content: [], totalPages: 1 } } }),
    getPromotions: vi.fn().mockResolvedValue({ data: { success: true, data: { content: [] } } }),
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

  it('renders all 4 Sporekart Control Panel header & overview cards with correct integrated data and formats', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminDashboardPage user={{ role: 'ADMIN', fullName: 'Lead Admin' }} />
      </MemoryRouter>
    );

    // Verify Executive Ribbon Header Cards
    await waitFor(() => {
      const catalogHeaderCard = screen.getByTestId('header-metric-catalog');
      expect(catalogHeaderCard).toBeInTheDocument();
      expect(catalogHeaderCard).toHaveTextContent('48');
      expect(catalogHeaderCard).toHaveTextContent(/SKUs in Warehouse/i);

      const ordersHeaderCard = screen.getByTestId('header-metric-orders');
      expect(ordersHeaderCard).toBeInTheDocument();
      expect(ordersHeaderCard).toHaveTextContent('12');
      expect(ordersHeaderCard).toHaveTextContent(/Orders Processing/i);

      const customersHeaderCard = screen.getByTestId('header-metric-customers');
      expect(customersHeaderCard).toBeInTheDocument();
      expect(customersHeaderCard).toHaveTextContent('156');
      expect(customersHeaderCard).toHaveTextContent(/Farmers & Trainees/i);

      const revenueHeaderCard = screen.getByTestId('header-metric-revenue');
      expect(revenueHeaderCard).toBeInTheDocument();
      expect(revenueHeaderCard).toHaveTextContent('₹4,50,000');
      expect(revenueHeaderCard).toHaveTextContent(/Settled via Razorpay/i);
    });

    // Verify Overview KPI Analytics Grid Cards
    const kpiProducts = screen.getByTestId('kpi-card-products');
    expect(kpiProducts).toHaveTextContent('48');
    expect(kpiProducts).toHaveTextContent(/Active Catalog Sync/i);

    const kpiOrders = screen.getByTestId('kpi-card-orders');
    expect(kpiOrders).toHaveTextContent('12');
    expect(kpiOrders).toHaveTextContent(/Fulfillment Queue/i);

    const kpiCustomers = screen.getByTestId('kpi-card-customers');
    expect(kpiCustomers).toHaveTextContent('156');
    expect(kpiCustomers).toHaveTextContent(/Verified Accounts/i);

    const kpiRevenue = screen.getByTestId('kpi-card-revenue');
    expect(kpiRevenue).toHaveTextContent('₹4,50,000');
    expect(kpiRevenue).toHaveTextContent(/Razorpay Settlement Verified/i);

    // Test clicking Fulfillment Queue card opens Active Orders modal
    fireEvent.click(screen.getByTestId('header-metric-orders'));
    await waitFor(() => {
      expect(screen.getByText(/Active Orders Fulfillment Queue/i)).toBeInTheDocument();
    });
    fireEvent.keyDown(window, { key: 'Escape' });

    // Test clicking Registered Users card opens CRM modal
    fireEvent.click(screen.getByTestId('header-metric-customers'));
    await waitFor(() => {
      expect(screen.getByText(/Registered Customers & Trainees/i)).toBeInTheDocument();
    });
    fireEvent.keyDown(window, { key: 'Escape' });

    // Test clicking Gross Sales card opens Revenue modal
    fireEvent.click(screen.getByTestId('header-metric-revenue'));
    await waitFor(() => {
      expect(screen.getByText(/Gross Sales Revenue & Settlement/i)).toBeInTheDocument();
    });
    fireEvent.keyDown(window, { key: 'Escape' });
  });

  it('renders AdminAnalyticsDetailModal with category pills, live prior counts, and interactive sorting pills', () => {
    const handleClose = vi.fn();
    const config = {
      domain: 'Catalog & Products',
      title: 'Catalog Products & Inventory Registry',
      metric: '3 Products',
      subtitle: 'Complete cultivar breakdown',
      badge: 'Active Catalog',
      badgeColor: 'green',
      filterPills: [
        { id: 'ALL', label: 'All Products', count: 3, isHighlighted: true },
        { id: 'FRESH', label: 'Fresh Mushrooms', count: 2, filterFn: (i) => i.subtitle.includes('FRESH') },
        { id: 'SPAWN', label: 'Mushroom Spawn', count: 1, filterFn: (i) => i.subtitle.includes('SPAWN') },
      ],
      sortingPills: [
        { id: 'DEFAULT', label: 'Default' },
        { id: 'NAME_ASC', label: 'Name (A → Z)' },
        { id: 'NAME_DESC', label: 'Name (Z → A)' },
        { id: 'PRICE_DESC', label: 'Price: High → Low' },
        { id: 'PRICE_ASC', label: 'Price: Low → High' },
      ],
      items: [
        { id: 'p-1', title: 'Oyster Mushroom Spawn 1Kg', subtitle: 'Type: SPAWN', status: 'In Stock', statusColor: 'green', amount: 250 },
        { id: 'p-2', title: 'Fresh Button Mushrooms 500g', subtitle: 'Type: FRESH', status: 'Available', statusColor: 'green', amount: 120 },
        { id: 'p-3', title: 'Fresh Portobello Mushrooms 250g', subtitle: 'Type: FRESH', status: 'Available', statusColor: 'green', amount: 350 },
      ]
    };

    render(
      <AdminAnalyticsDetailModal
        isOpen={true}
        onClose={handleClose}
        config={config}
      />
    );

    // Verify highlighted total products pill and prior category counts
    expect(screen.getByTestId('filter-pill-all')).toHaveTextContent('All Products');
    expect(screen.getByTestId('filter-pill-all')).toHaveTextContent('3');

    expect(screen.getByTestId('filter-pill-fresh')).toHaveTextContent('Fresh Mushrooms');
    expect(screen.getByTestId('filter-pill-fresh')).toHaveTextContent('2');

    expect(screen.getByTestId('filter-pill-spawn')).toHaveTextContent('Mushroom Spawn');
    expect(screen.getByTestId('filter-pill-spawn')).toHaveTextContent('1');

    // Verify sorting pills render
    expect(screen.getByTestId('sort-pill-name-asc')).toHaveTextContent('Name (A → Z)');
    expect(screen.getByTestId('sort-pill-price-desc')).toHaveTextContent('Price: High → Low');

    // Test clicking category filter pill filters the displayed items
    fireEvent.click(screen.getByTestId('filter-pill-spawn'));
    expect(screen.getByText('Oyster Mushroom Spawn 1Kg')).toBeInTheDocument();
    expect(screen.queryByText('Fresh Button Mushrooms 500g')).not.toBeInTheDocument();
    expect(screen.queryByText('Fresh Portobello Mushrooms 250g')).not.toBeInTheDocument();

    // Reset back to All Products
    fireEvent.click(screen.getByTestId('filter-pill-all'));
    expect(screen.getByText('Oyster Mushroom Spawn 1Kg')).toBeInTheDocument();
    expect(screen.getByText('Fresh Button Mushrooms 500g')).toBeInTheDocument();
    expect(screen.getByText('Fresh Portobello Mushrooms 250g')).toBeInTheDocument();

    // Test sorting by Price: High → Low
    fireEvent.click(screen.getByTestId('sort-pill-price-desc'));
    const items = screen.getAllByText(/₹350|₹250|₹120/);
    expect(items[0]).toHaveTextContent('₹350');
    expect(items[1]).toHaveTextContent('₹250');
    expect(items[2]).toHaveTextContent('₹120');
  });

  it('renders Total Catalog card drill-down with highlighted products and prior category counts in Sporekart Control Panel', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminDashboardPage user={{ role: 'ADMIN', fullName: 'Lead Admin' }} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('kpi-card-products')).toBeInTheDocument();
    });

    // Click Total Products card
    fireEvent.click(screen.getByTestId('kpi-card-products'));

    await waitFor(() => {
      expect(screen.getByText(/Catalog Products & Inventory Registry/i)).toBeInTheDocument();
      // Highlighted All Products pill
      expect(screen.getByTestId('filter-pill-all')).toBeInTheDocument();
      expect(screen.getByTestId('filter-pill-all')).toHaveTextContent('All Products');
    });

    // Check that sorting pills are present in the opened catalog modal
    expect(screen.getByTestId('sort-pill-name-asc')).toBeInTheDocument();
    expect(screen.getByTestId('sort-pill-price-asc')).toBeInTheDocument();
    expect(screen.getByTestId('sort-pill-price-desc')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
  });

  it('renders Products and Orders card display pages with category/status filter pills with prior counts and sorting pills', async () => {
    // Render Products display page
    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin/products']}>
        <AdminDashboardPage user={{ role: 'ADMIN', fullName: 'Lead Admin' }} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-category-pill-all')).toBeInTheDocument();
      expect(screen.getByTestId('product-category-pill-all')).toHaveTextContent('All Products');
      expect(screen.getByTestId('product-sort-pill-name-asc')).toBeInTheDocument();
      expect(screen.getByTestId('product-sort-pill-price-asc')).toBeInTheDocument();
      expect(screen.getByTestId('product-sort-pill-stock-desc')).toBeInTheDocument();
    });

    // Click a sorting pill on Products page
    fireEvent.click(screen.getByTestId('product-sort-pill-price-desc'));

    unmount();

    // Render Orders display page
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <AdminDashboardPage user={{ role: 'ADMIN', fullName: 'Lead Admin' }} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('order-filter-pill-all')).toBeInTheDocument();
      expect(screen.getByTestId('order-filter-pill-active')).toBeInTheDocument();
      expect(screen.getByTestId('order-sort-pill-date-desc')).toBeInTheDocument();
      expect(screen.getByTestId('order-sort-pill-amount-desc')).toBeInTheDocument();
    });

    // Click an order sorting pill
    fireEvent.click(screen.getByTestId('order-sort-pill-amount-desc'));
  });
});

