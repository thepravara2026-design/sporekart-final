import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminReviewsManager from '../components/AdminReviewsManager';
import AdminTrainingGalleryManager from '../components/AdminTrainingGalleryManager';
import { reviewApi, trainingApi } from '../api';

vi.mock('../components/SeoHead', () => ({ default: () => null }));
vi.mock('../components/LocalImageUploader', () => ({ default: () => <div data-testid="image-uploader">Mock Image Uploader</div> }));

vi.mock('../api', () => ({
  adminApi: {
    getOverview: vi.fn().mockResolvedValue({ totalRevenueINR: 450000, totalOrdersCount: 320 }),
    getAnalytics: vi.fn().mockResolvedValue({ salesTrend: [] }),
    getAuditLogs: vi.fn().mockResolvedValue({ content: [], totalPages: 1 }),
    getPromotions: vi.fn().mockResolvedValue({ content: [] }),
    createCategory: vi.fn(),
    createProduct: vi.fn(),
  },
  catalogApi: {
    getCategories: vi.fn().mockResolvedValue([]),
    getProducts: vi.fn().mockResolvedValue({ content: [] }),
  },
  trainingApi: {
    getCourses: vi.fn().mockResolvedValue([]),
    getAdminGlimpses: vi.fn(),
    createGlimpse: vi.fn(),
    deleteGlimpse: vi.fn(),
  },
  orderApi: {
    getOrders: vi.fn().mockResolvedValue({ content: [] }),
  },
  adminFinanceApi: {
    getFinanceSummary: vi.fn().mockResolvedValue({}),
    getPlatformTransactions: vi.fn().mockResolvedValue({ content: [] }),
    getPlatformWithdrawals: vi.fn().mockResolvedValue({ content: [] }),
  },
  reviewApi: {
    getAdminReviews: vi.fn(),
    getAdminReviewSummary: vi.fn(),
    moderateReview: vi.fn(),
  },
}));

describe('FE-AdminConsole: Full Admin Console Modules & Flow Validation Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    reviewApi.getAdminReviews.mockResolvedValue({
      data: {
        data: {
          content: [
            { id: 'rev-101', productTitle: 'Spawn Seed 1Kg', rating: 5, reviewTitle: 'Great Spawn', reviewText: 'Very high germination rate.', status: 'PENDING', customerName: 'Ramesh K.' }
          ],
          totalPages: 1,
          totalElements: 1,
          number: 0,
        }
      }
    });

    reviewApi.getAdminReviewSummary.mockResolvedValue({
      data: {
        data: { totalReviews: 1, pendingReviews: 1, publishedReviews: 0, rejectedReviews: 0 }
      }
    });

    trainingApi.getAdminGlimpses.mockResolvedValue({
      data: [
        { id: 'glimp-1', title: 'Batch #4 Harvest Day', courseTitle: 'Oyster Mushroom Cultivation', imageUrl: 'https://example.com/harvest.jpg', eventDate: '2026-09-20', active: true }
      ]
    });
  });

  it('ADMIN-FE-01: Admin Reviews Manager renders pending customer reviews correctly', async () => {
    render(<AdminReviewsManager />);

    await waitFor(() => {
      expect(screen.getByText(/Spawn Seed 1Kg/i)).toBeInTheDocument();
    });
  });

  it('ADMIN-FE-02: Admin Reviews Manager handles review moderation flow', async () => {
    reviewApi.moderateReview.mockResolvedValueOnce({
      data: { data: { id: 'rev-101', status: 'PUBLISHED' } }
    });

    render(<AdminReviewsManager />);

    await waitFor(() => {
      expect(screen.getByText(/Spawn Seed 1Kg/i)).toBeInTheDocument();
    });

    const moderateBtn = screen.getByRole('button', { name: /Moderate/i });
    expect(moderateBtn).toBeInTheDocument();
    fireEvent.click(moderateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Review Moderation Control/i)).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole('button', { name: /Approve & Publish/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(reviewApi.moderateReview).toHaveBeenCalledWith('rev-101', 'PUBLISHED', '');
    });
  });

  it('ADMIN-FE-03: Admin Training Gallery renders glimpses gallery and prevents saving without mandatory fields', async () => {
    render(<AdminTrainingGalleryManager />);

    await waitFor(() => {
      expect(screen.getByText(/Batch #4 Harvest Day/i)).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Add New Glimpse/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText(/Add New Training Glimpse/i)).toBeInTheDocument();
    });

    // Validates that submitting without mandatory title does not invoke API
    const submitBtn = screen.getByRole('button', { name: /Save & Publish Glimpse/i });
    fireEvent.click(submitBtn);

    expect(trainingApi.createGlimpse).not.toHaveBeenCalled();
  });
});
