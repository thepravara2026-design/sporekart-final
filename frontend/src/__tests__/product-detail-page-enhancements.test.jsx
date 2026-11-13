import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProductDetailPage from '../pages/ProductDetailPage';
import { CartProvider } from '../context/CartContext';
import { catalogApi, reviewApi, shippingApi } from '../api';

vi.mock('../components/SeoHead', () => ({ default: () => null }));

vi.mock('../api', () => ({
  catalogApi: {
    getProductBySlug: vi.fn(),
    getProducts: vi.fn(),
  },
  reviewApi: {
    getProductReviewSummary: vi.fn(),
    getProductReviews: vi.fn(),
    createReview: vi.fn(),
  },
  shippingApi: {
    checkPincode: vi.fn(),
  },
  analyticsApi: {
    trackProductView: vi.fn().mockResolvedValue({}),
  },
  cartApi: {
    getCart: vi.fn().mockResolvedValue({ data: { success: true, data: { items: [], subtotalInr: 0, itemCount: 0 } } }),
    addItem: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

describe('ProductDetailPage Interactive Layout, Hover Zoom & Reviews Suite', () => {
  const mockProduct = {
    id: 'prod-001',
    title: 'Gourmet Shiitake Mushroom Spawn',
    slug: 'gourmet-shiitake-spawn',
    description: 'Laboratory-grade sterile mycelium on high-energy wheat substrate for fast commercial colonization.',
    categoryName: 'Spawn Seeds',
    categorySlug: 'spawn-seeds',
    hsnCode: '07095900',
    imageUrls: [
      'https://example.com/shiitake-main.jpg',
      'https://example.com/shiitake-sub.jpg',
    ],
    productInformation: {
      brandName: 'Sporekart Agritech',
      countryOfOrigin: 'India',
      netQuantity: '1000',
      unitOfMeasure: 'g',
      mushroomSpecies: 'Lentinula edodes',
      isVegetarian: true,
      storageInstructions: 'Keep in refrigerator at 2-4°C.',
    },
    variants: [
      {
        id: 'var-1',
        variantName: '500 g Pack',
        priceInr: 320,
        compareAtPriceInr: 450,
        stockQuantity: 15,
        sku: 'SHII-500',
        availability: { status: 'AVAILABLE', label: 'In Stock' },
      },
      {
        id: 'var-2',
        variantName: '1 kg Commercial Bag',
        priceInr: 580,
        compareAtPriceInr: 800,
        stockQuantity: 8,
        sku: 'SHII-1000',
        availability: { status: 'AVAILABLE', label: 'In Stock' },
      },
    ],
  };

  const mockReviewSummary = {
    productId: 'prod-001',
    averageRating: 4.9,
    totalReviews: 5,
    ratingDistribution: { 5: 4, 4: 1, 3: 0, 2: 0, 1: 0 },
  };

  const mockReviews = [
    {
      id: 'rev-1',
      customerName: 'Devangere Cultivator',
      rating: 5,
      reviewTitle: 'Exceptional spawn vigour',
      reviewText: 'Colonized paddy straw bags in record 11 days. Incredible flush yields!',
      isVerifiedPurchase: true,
      createdAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 'rev-2',
      customerName: 'Priya Sharma',
      rating: 5,
      reviewTitle: 'Fresh and uncontaminated',
      reviewText: 'Grain was 100% white mycelium with zero trichoderma. Very impressed.',
      isVerifiedPurchase: true,
      createdAt: '2026-10-28T14:30:00Z',
    },
    {
      id: 'rev-3',
      customerName: 'Karthik Gowda',
      rating: 4,
      reviewTitle: 'Solid yields',
      reviewText: 'Got three heavy flushes before block spent. Will reorder.',
      isVerifiedPurchase: true,
      createdAt: '2026-10-20T08:15:00Z',
    },
    {
      id: 'rev-4',
      customerName: 'Older Reviewer',
      rating: 5,
      reviewTitle: 'Older Review',
      reviewText: 'This is the 4th review that should be clipped in the initial recent 3 view.',
      isVerifiedPurchase: false,
      createdAt: '2026-09-15T12:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    catalogApi.getProductBySlug.mockResolvedValue({
      data: { success: true, data: mockProduct },
    });
    catalogApi.getProducts.mockResolvedValue({
      data: { success: true, data: [] },
    });
    reviewApi.getProductReviewSummary.mockResolvedValue({
      data: { success: true, data: mockReviewSummary },
    });
    reviewApi.getProductReviews.mockResolvedValue({
      data: {
        success: true,
        data: {
          content: mockReviews,
          totalPages: 1,
          totalElements: 4,
        },
      },
    });
  });

  it('renders sticky static left gallery and interactive hover zoom lens effect', async () => {
    render(
      <MemoryRouter initialEntries={['/product/gourmet-shiitake-spawn']}>
        <CartProvider>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetailPage />} />
          </Routes>
        </CartProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-title')).toHaveTextContent('Gourmet Shiitake Mushroom Spawn');
    });

    // Check sticky gallery container
    const gallery = screen.getByTestId('product-gallery');
    expect(gallery).toHaveClass('lg:sticky');
    expect(gallery).toHaveClass('lg:top-28');

    // Check hover zoom hint
    expect(screen.getByText(/Hover over image to zoom/i)).toBeInTheDocument();

    const primaryImage = screen.getByTestId('product-primary-image');
    expect(primaryImage).toBeInTheDocument();

    // Trigger mouse enter and mouse move on image viewport
    const zoomContainer = primaryImage.closest('.cursor-crosshair');
    expect(zoomContainer).not.toBeNull();

    fireEvent.mouseEnter(zoomContainer);
    fireEvent.mouseMove(zoomContainer, { clientX: 200, clientY: 200 });

    // When mouse moves, scale is increased to 2.2
    expect(primaryImage.style.transform).toContain('scale(2.2)');

    // Trigger mouse leave to reset
    fireEvent.mouseLeave(zoomContainer);
    expect(primaryImage.style.transform).toBe('scale(1)');
  });

  it('displays total reviews on the particular product with score and rating breakdown', async () => {
    render(
      <MemoryRouter initialEntries={['/product/gourmet-shiitake-spawn']}>
        <CartProvider>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetailPage />} />
          </Routes>
        </CartProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-reviews-container')).toBeInTheDocument();
      const scoreElements = screen.getAllByText('4.9');
      expect(scoreElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/Based on/i)).toHaveTextContent('5');
    });

    expect(screen.getByText(/verified reviews for this product/i)).toBeInTheDocument();
  });

  it('displays the recent 3 reviews and clips older reviews with a View All toggle', async () => {
    render(
      <MemoryRouter initialEntries={['/product/gourmet-shiitake-spawn']}>
        <CartProvider>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetailPage />} />
          </Routes>
        </CartProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Exceptional spawn vigour')).toBeInTheDocument();
    });

    // Recent 3 reviews should be in document
    expect(screen.getByText('Devangere Cultivator')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Karthik Gowda')).toBeInTheDocument();

    // 4th older review should not be shown initially (only recent 3)
    expect(screen.queryByText('Older Reviewer')).not.toBeInTheDocument();

    // Toggle button should show
    const viewAllBtn = screen.getByRole('button', { name: /View All \(4\)/i });
    expect(viewAllBtn).toBeInTheDocument();

    // Click View All
    fireEvent.click(viewAllBtn);
    expect(screen.getByText('Older Reviewer')).toBeInTheDocument();
  });

  it('provides an Ask for a Review call-to-action banner and triggers review modal', async () => {
    const mockOnOpenReviewModal = vi.fn();

    render(
      <MemoryRouter initialEntries={['/product/gourmet-shiitake-spawn']}>
        <CartProvider>
          <Routes>
            <Route
              path="/product/:slug"
              element={<ProductDetailPage onOpenReviewModal={mockOnOpenReviewModal} />}
            />
          </Routes>
        </CartProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Have You Grown or Tasted This Variety\?/i)).toBeInTheDocument();
    });

    // Find the Write a Product Review button in the Ask for a Review card
    const writeReviewBtns = screen.getAllByRole('button', { name: /Write a (Product )?Review/i });
    expect(writeReviewBtns.length).toBeGreaterThan(0);

    fireEvent.click(writeReviewBtns[writeReviewBtns.length - 1]);

    expect(mockOnOpenReviewModal).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod-001',
        productTitle: 'Gourmet Shiitake Mushroom Spawn',
      })
    );
  });

  it('hides the entire reviews section when no reviews have been given for the product', async () => {
    // Mock zero reviews scenario
    reviewApi.getProductReviewSummary.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      },
    });
    reviewApi.getProductReviews.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          content: [],
          totalPages: 0,
          totalElements: 0,
        },
      },
    });

    const mockOnOpenReviewModal = vi.fn();

    render(
      <MemoryRouter initialEntries={['/product/gourmet-shiitake-spawn']}>
        <CartProvider>
          <Routes>
            <Route
              path="/product/:slug"
              element={<ProductDetailPage onOpenReviewModal={mockOnOpenReviewModal} />}
            />
          </Routes>
        </CartProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-title')).toHaveTextContent('Gourmet Shiitake Mushroom Spawn');
    });

    // The review scorecard and review section must be hidden
    expect(screen.queryByTestId('product-reviews-container')).not.toBeInTheDocument();
    expect(screen.queryByText(/Customer Ratings & Verified Reviews/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Based on 0 verified reviews/i)).not.toBeInTheDocument();

    // The "Be the first to write a review" trigger should be present
    const firstReviewBtn = screen.getByRole('button', { name: /Be the first to write a review/i });
    expect(firstReviewBtn).toBeInTheDocument();

    // Clicking it triggers the review workflow cleanly
    fireEvent.click(firstReviewBtn);
    expect(mockOnOpenReviewModal).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod-001',
        productTitle: 'Gourmet Shiitake Mushroom Spawn',
      })
    );
  });

  it('shows pincode delivery availability in green when serviceable and in red when not available', async () => {
    shippingApi.checkPincode
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            pincode: '411001',
            serviceable: true,
            estimatedDeliveryDays: 4,
            message: 'Delivery available to pincode 411001',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            pincode: '999999',
            serviceable: false,
            message: 'Delivery currently not available to 999999',
          },
        },
      });

    render(
      <MemoryRouter initialEntries={['/product/gourmet-shiitake-spawn']}>
        <CartProvider>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetailPage />} />
          </Routes>
        </CartProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-title')).toHaveTextContent('Gourmet Shiitake Mushroom Spawn');
    });

    const pincodeInput = screen.getByPlaceholderText('Enter 6-digit PIN code');
    const checkBtn = screen.getByRole('button', { name: /Check Delivery/i });

    // Serviceable pincode -> green
    fireEvent.change(pincodeInput, { target: { value: '411001' } });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText(/Delivery available to pincode 411001/i)).toBeInTheDocument();
    });
    const availableMsg = screen.getByTestId('pincode-result').querySelector('p');
    expect(availableMsg).toHaveClass('text-green-600');
    expect(availableMsg).not.toHaveClass('text-red-600');

    // Non-serviceable pincode -> red
    fireEvent.change(pincodeInput, { target: { value: '999999' } });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText(/Delivery currently not available to 999999/i)).toBeInTheDocument();
    });
    const unavailableMsg = screen.getByTestId('pincode-result').querySelector('p');
    expect(unavailableMsg).toHaveClass('text-red-600');
    expect(unavailableMsg).not.toHaveClass('text-green-600');
  });
});
