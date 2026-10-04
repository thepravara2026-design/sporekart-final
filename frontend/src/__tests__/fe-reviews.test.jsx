import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import StarRatingInput from '../components/StarRatingInput';
import ProductReviewFormModal from '../components/ProductReviewFormModal';
import ProductReviewsSection from '../components/ProductReviewsSection';
import LatestCustomerReviews from '../components/LatestCustomerReviews';
import AdminReviewsManager from '../components/AdminReviewsManager';
import { reviewApi } from '../api';

vi.mock('../components/SeoHead', () => ({ default: () => null }));

vi.mock('../api', () => ({
  reviewApi: {
    createReview: vi.fn(),
    getProductReviews: vi.fn(),
    getProductReviewSummary: vi.fn(),
    getLatestReviews: vi.fn(),
    getCustomerReviews: vi.fn(),
    getPendingReviews: vi.fn(),
    skipInvitation: vi.fn(),
    getAdminReviews: vi.fn(),
    getAdminReviewSummary: vi.fn(),
    moderateReview: vi.fn(),
  },
}));

describe('FE-ProductReviews: Product Review, Ratings & Moderation Component Tests', () => {
  const mockReviewSummary = {
    productId: 'prod-101',
    averageRating: 4.8,
    totalReviews: 12,
    ratingDistribution: { 5: 10, 4: 2, 3: 0, 2: 0, 1: 0 },
  };

  const mockReviews = [
    {
      id: 'rev-1',
      productId: 'prod-101',
      productTitle: 'Oyster Mushroom Growing Kit',
      productSlug: 'oyster-mushroom-growing-kit',
      productImageFallback: 'https://example.com/oyster-kit.jpg',
      variantName: '1 Kg Box',
      customerName: 'Ananya S.',
      rating: 5,
      reviewTitle: 'High Yield Master Kit!',
      reviewText: 'Harvested 800g of fresh oyster mushrooms in just 10 days. Excellent quality!',
      isVerifiedPurchase: true,
      status: 'PUBLISHED',
      hasCustomerImages: true,
      primaryImageUrl: 'https://example.com/customer-photo.jpg',
      customerImages: [{ id: 'img-1', imageUrl: 'https://example.com/customer-photo.jpg', displayOrder: 0 }],
      createdAt: '2026-10-04T09:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    reviewApi.getProductReviewSummary.mockResolvedValue({
      data: { success: true, data: mockReviewSummary },
    });
    reviewApi.getProductReviews.mockResolvedValue({
      data: {
        success: true,
        data: {
          content: mockReviews,
          totalPages: 1,
          totalElements: 1,
          number: 0,
        },
      },
    });
    reviewApi.getLatestReviews.mockResolvedValue({
      data: { success: true, data: mockReviews },
    });
    reviewApi.getAdminReviewSummary.mockResolvedValue({
      data: {
        success: true,
        data: {
          totalReviews: 15,
          pendingCount: 2,
          publishedCount: 12,
          hiddenCount: 1,
          rejectedCount: 0,
          averageRating: 4.8,
        },
      },
    });
    reviewApi.getAdminReviews.mockResolvedValue({
      data: {
        success: true,
        data: {
          content: mockReviews,
          totalPages: 1,
          totalElements: 1,
          number: 0,
        },
      },
    });
  });

  it('renders StarRatingInput with correct accessibility roles and satisfaction labels', () => {
    const handleChange = vi.fn();
    render(<StarRatingInput value={4} onChange={handleChange} />);

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByText('Satisfied (4/5)')).toBeInTheDocument();

    const starButtons = screen.getAllByRole('radio');
    expect(starButtons.length).toBe(5);

    fireEvent.click(starButtons[4]); // Click 5th star
    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it('renders ProductReviewFormModal with delivered product details and handles review submission', async () => {
    reviewApi.createReview.mockResolvedValue({
      data: { success: true, data: mockReviews[0] },
    });

    const mockItem = {
      orderId: 'ord-101',
      orderItemId: 'item-101',
      orderNumber: 'ORD-98765',
      productId: 'prod-101',
      productTitle: 'Oyster Mushroom Growing Kit',
      variantName: '1 Kg Box',
      productImage: 'https://example.com/oyster-kit.jpg',
      quantity: 1,
    };

    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <ProductReviewFormModal item={mockItem} onClose={handleClose} onSuccess={handleSuccess} />
    );

    expect(screen.getByText('Write a Verified Product Review')).toBeInTheDocument();
    expect(screen.getByText('Oyster Mushroom Growing Kit')).toBeInTheDocument();
    expect(screen.getByText('Order #ORD-98765')).toBeInTheDocument();

    // Type review text
    const textarea = screen.getByPlaceholderText(/Describe product quality/i);
    fireEvent.change(textarea, {
      target: { value: 'Harvested amazing fresh mushrooms! Very satisfied with Sporekart delivery.' },
    });

    // Submit review
    const submitBtn = screen.getByRole('button', { name: /Submit Verified Review/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(reviewApi.createReview).toHaveBeenCalledWith({
        orderId: 'ord-101',
        orderItemId: 'item-101',
        rating: 5,
        reviewTitle: null,
        reviewText: 'Harvested amazing fresh mushrooms! Very satisfied with Sporekart delivery.',
        imageUrls: null,
      });
      expect(screen.getByText('Thank You for Your Review!')).toBeInTheDocument();
    });
  });

  it('renders ProductReviewsSection with average rating, breakdown bars, and review cards', async () => {
    render(
      <BrowserRouter>
        <ProductReviewsSection productId="prod-101" productTitle="Oyster Mushroom Growing Kit" />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Customer Ratings & Reviews')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('High Yield Master Kit!')).toBeInTheDocument();
    });

    expect(screen.getByText('Verified Purchase')).toBeInTheDocument();
    expect(screen.getByText('Ananya S.')).toBeInTheDocument();
  });

  it('renders LatestCustomerReviews section for landing page with customer photos and verified badge', async () => {
    render(
      <BrowserRouter>
        <LatestCustomerReviews />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Loved by Our Customers')).toBeInTheDocument();
      expect(screen.getByText('Oyster Mushroom Growing Kit')).toBeInTheDocument();
    });

    expect(screen.getByText('Ananya S.')).toBeInTheDocument();
  });

  it('renders AdminReviewsManager with review statistics, table entries, and moderation controls', async () => {
    reviewApi.moderateReview.mockResolvedValue({
      data: { success: true, data: { ...mockReviews[0], status: 'HIDDEN' } },
    });

    render(<AdminReviewsManager />);

    await waitFor(() => {
      expect(screen.getByText('Product Reviews & Moderation')).toBeInTheDocument();
      expect(screen.getByText('Oyster Mushroom Growing Kit')).toBeInTheDocument();
    });

    // Open Moderation Modal
    const moderateBtn = screen.getByRole('button', { name: /Moderate/i });
    fireEvent.click(moderateBtn);

    expect(screen.getByText('Review Moderation Control')).toBeInTheDocument();

    // Click Hide Review
    const hideBtn = screen.getByRole('button', { name: /Hide Review/i });
    fireEvent.click(hideBtn);

    await waitFor(() => {
      expect(reviewApi.moderateReview).toHaveBeenCalledWith('rev-1', 'HIDDEN', '');
    });
  });
});
