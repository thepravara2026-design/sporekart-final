import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CartProvider } from '../context/CartContext';
import { HelmetProvider } from 'react-helmet-async';
import HomePage from '../pages/HomePage';
import AnnouncementBar from '../components/AnnouncementBar';
import CircularCategoryNav from '../components/CircularCategoryNav';
import HeroCarousel, { HERO_SLIDES } from '../components/HeroCarousel';
import RecentlyViewedSection from '../components/RecentlyViewedSection';
import BestSellersSection from '../components/BestSellersSection';
import AllProductsSection from '../components/AllProductsSection';
import FloatingOrderBar from '../components/FloatingOrderBar';
import { catalogApi, cartApi } from '../api';

const mockProducts = [
  {
    id: 'prod-1',
    title: 'Fresh Button Mushrooms 200g',
    slug: 'fresh-button-mushrooms',
    categoryName: 'Fresh Mushrooms',
    isBestSeller: true,
    isPopular: true,
    imageUrls: ['/sporekart-white-button.jpg'],
    variants: [
      { id: 'var-1', name: '200g Pack', priceInr: 99, compareAtPriceInr: 120, stockQuantity: 15, isActive: true }
    ]
  },
  {
    id: 'prod-2',
    title: 'Pure Wheat Grain Oyster Spawn 1kg',
    slug: 'pure-wheat-grain-oyster-spawn',
    categoryName: 'Spawn Seeds',
    isBestSeller: true,
    isPopular: false,
    imageUrls: ['/sporekart-cultivation-stage1-lab.jpg'],
    variants: [
      { id: 'var-2', name: '1kg Bag', priceInr: 249, compareAtPriceInr: 300, stockQuantity: 20, isActive: true }
    ]
  },
  {
    id: 'prod-3',
    title: 'DIY Oyster Mushroom Growing Kit',
    slug: 'diy-oyster-growing-kit',
    categoryName: 'Growing Kits',
    isBestSeller: false,
    isPopular: true,
    imageUrls: ['/sporekart-oyster-cluster.jpg'],
    variants: [
      { id: 'var-3', name: 'Standard Kit', priceInr: 499, compareAtPriceInr: 599, stockQuantity: 10, isActive: true }
    ]
  }
];

const mockCategories = [
  { id: 'c1', slug: 'fresh-mushrooms', name: 'Fresh Mushrooms', imageUrl: '/sporekart-white-button.jpg' },
  { id: 'c2', slug: 'spawn-seeds', name: 'Spawn Seeds', imageUrl: '/sporekart-cultivation-stage1-lab.jpg' },
  { id: 'c3', slug: 'growing-kits', name: 'Growing Kits', imageUrl: '/sporekart-oyster-cluster.jpg' },
  { id: 'c4', slug: 'dry-mushrooms', name: 'Dry Mushrooms', imageUrl: '/sporekart-shiitake.jpg' },
  { id: 'c5', slug: 'equipment-supplies', name: 'Equipment & Supplies', imageUrl: '/sporekart-farm-scientist.jpg' }
];

const renderWithProviders = (ui) => {
  return render(
    <HelmetProvider>
      <CartProvider>
        <MemoryRouter>
          {ui}
        </MemoryRouter>
      </CartProvider>
    </HelmetProvider>
  );
};

describe('SPOREKART — Complete Homepage Transformation Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    vi.spyOn(catalogApi, 'getCategories').mockResolvedValue({
      data: { success: true, data: mockCategories }
    });

    vi.spyOn(catalogApi, 'getBestSellingProducts').mockResolvedValue({
      data: { success: true, data: mockProducts }
    });

    vi.spyOn(catalogApi, 'searchProducts').mockResolvedValue({
      data: {
        success: true,
        data: {
          content: mockProducts,
          totalElements: 28,
          totalPages: 3,
          number: 0,
          size: 12
        }
      }
    });

    vi.spyOn(catalogApi, 'getProducts').mockResolvedValue({
      data: { success: true, data: mockProducts }
    });

    vi.spyOn(cartApi, 'getCart').mockResolvedValue({
      data: { success: true, data: { items: [], totalAmountInr: 0 } }
    });

    vi.spyOn(cartApi, 'getAvailablePromotions').mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: 'promo-1', code: 'SPORE10', description: '10% Flat Discount on Spawn', discountPercent: 10 }
        ]
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Layer 1: Announcement & Customer Contact Marquee Bar', () => {
    it('renders the official helpline number and contact link', async () => {
      renderWithProviders(<AnnouncementBar />);
      const helplineLinks = screen.getAllByRole('link', { name: /Order Helpline/i });
      expect(helplineLinks.length).toBeGreaterThan(0);
      expect(helplineLinks[0].getAttribute('href')).toBe('tel:+917204709870');
    });

    it('displays promotional announcements and farm harvest notices in marquee', async () => {
      renderWithProviders(<AnnouncementBar />);
      await waitFor(() => {
        expect(screen.getAllByText(/Daily Fresh Harvest at 5:00 AM/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Pan-India Cold Chain Dispatch/i).length).toBeGreaterThan(0);
      });
    });

    it('renders the official WhatsApp support channel link', async () => {
      renderWithProviders(<AnnouncementBar />);
      const whatsappLinks = screen.getAllByRole('link', { name: /WhatsApp Us/i });
      expect(whatsappLinks.length).toBeGreaterThan(0);
      expect(whatsappLinks[0].getAttribute('href')).toContain('wa.me/917204709870');
    });
  });

  describe('2. Layer 3: Circular Product Category Navigation', () => {
    it('fetches and displays circular category cards with images and titles', async () => {
      renderWithProviders(<CircularCategoryNav />);
      await waitFor(() => {
        expect(screen.getByText('Fresh Mushrooms')).toBeInTheDocument();
        expect(screen.getByText('Spawn Seeds')).toBeInTheDocument();
        expect(screen.getByText('Growing Kits')).toBeInTheDocument();
      });
    });

    it('navigates to corresponding category listing route when category is clicked', async () => {
      renderWithProviders(<CircularCategoryNav />);
      await waitFor(() => {
        const freshCategoryLink = screen.getByRole('link', { name: /Fresh Mushrooms/i });
        expect(freshCategoryLink.getAttribute('href')).toBe('/products/fresh-mushrooms');
      });
    });
  });

  describe('3. Four-Slide Automatic Hero Carousel', () => {
    it('renders exactly four distinct agricultural hero slides', () => {
      expect(HERO_SLIDES).toHaveLength(4);
      expect(HERO_SLIDES[0].tag).toBe('FARM-TO-HOME FRESHNESS');
      expect(HERO_SLIDES[1].tag).toBe('LAB CERTIFIED GRAIN SPAWN');
      expect(HERO_SLIDES[2].tag).toBe('BEGINNER INDOOR KITS');
      expect(HERO_SLIDES[3].tag).toBe('HANDS-ON MASTERCLASSES');
    });

    it('renders primary CTA with destination to products storefront', () => {
      renderWithProviders(<HeroCarousel />);
      const primaryCta = screen.getByRole('link', { name: /Shop Fresh Harvest/i });
      expect(primaryCta).toBeInTheDocument();
      expect(primaryCta.getAttribute('href')).toBe('/products/fresh-mushrooms');
    });

    it('advances slides when next and previous navigation buttons are clicked', () => {
      renderWithProviders(<HeroCarousel />);
      const nextBtn = screen.getByRole('button', { name: /Next slide/i });
      const prevBtn = screen.getByRole('button', { name: /Previous slide/i });

      expect(screen.getByText('Gourmet Fresh Mushrooms, Cultivated with Science')).toBeInTheDocument();

      fireEvent.click(nextBtn);
      expect(screen.getByText(/1st-Gen Pure Wheat Grain Spawn/i)).toBeInTheDocument();

      fireEvent.click(prevBtn);
      expect(screen.getByText('Gourmet Fresh Mushrooms, Cultivated with Science')).toBeInTheDocument();
    });

    it('navigates directly to a slide when its indicator pill is clicked', () => {
      renderWithProviders(<HeroCarousel />);
      const slide4Pill = screen.getByRole('button', { name: /Go to slide 4/i });
      fireEvent.click(slide4Pill);

      expect(screen.getByText(/Commercial Cultivation Masterclasses/i)).toBeInTheDocument();
      const masterclassCta = screen.getByRole('link', { name: /Explore Masterclasses/i });
      expect(masterclassCta.getAttribute('href')).toBe('/training');
    });
  });

  describe('4. Personalized Recently Viewed Section & Customer Isolation', () => {
    it('renders clean empty state with discovery links when browsing history is empty', () => {
      renderWithProviders(<RecentlyViewedSection user={null} />);
      expect(screen.getByText(/No Recently Viewed Items Yet/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Explore Products/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Browse Masterclasses/i })).toBeInTheDocument();
    });

    it('isolates viewing history between customer accounts and guest browsing', () => {
      // Store item under User A
      const userAItem = [{ id: 'prod-1', title: 'User A Viewed Mushroom', slug: 'mushroom-a', type: 'product', priceInr: 100 }];
      localStorage.setItem('sporekart_recently_viewed_user_user-a', JSON.stringify(userAItem));

      // Store item under User B
      const userBItem = [{ id: 'prod-2', title: 'User B Viewed Kit', slug: 'kit-b', type: 'product', priceInr: 250 }];
      localStorage.setItem('sporekart_recently_viewed_user_user-b', JSON.stringify(userBItem));

      // Render as User A -> Should only see User A item
      const { unmount } = renderWithProviders(<RecentlyViewedSection user={{ id: 'user-a' }} />);
      expect(screen.getByText('User A Viewed Mushroom')).toBeInTheDocument();
      expect(screen.queryByText('User B Viewed Kit')).not.toBeInTheDocument();
      unmount();

      // Render as User B -> Should only see User B item
      renderWithProviders(<RecentlyViewedSection user={{ id: 'user-b' }} />);
      expect(screen.getByText('User B Viewed Kit')).toBeInTheDocument();
      expect(screen.queryByText('User A Viewed Mushroom')).not.toBeInTheDocument();
    });

    it('clears viewing history when clear button is clicked', () => {
      const items = [{ id: 'prod-1', title: 'Viewed Product', slug: 'viewed-product', type: 'product', priceInr: 100 }];
      localStorage.setItem('sporekart_recently_viewed_guest', JSON.stringify(items));

      renderWithProviders(<RecentlyViewedSection user={null} />);
      expect(screen.getByText('Viewed Product')).toBeInTheDocument();

      const clearBtn = screen.getByRole('button', { name: /Clear/i });
      fireEvent.click(clearBtn);

      expect(screen.getByText(/No Recently Viewed Items Yet/i)).toBeInTheDocument();
    });
  });

  describe('5. Best Sellers Section Integration', () => {
    it('fetches and renders best-selling products from sales data', async () => {
      renderWithProviders(<BestSellersSection onAddToCart={vi.fn()} onTrackView={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Sporekart Best Sellers')).toBeInTheDocument();
        expect(screen.getByText('Fresh Button Mushrooms 200g')).toBeInTheDocument();
        expect(screen.getByText('Pure Wheat Grain Oyster Spawn 1kg')).toBeInTheDocument();
      });
    });

    it('displays Best Seller badges and price formatting on cards', async () => {
      renderWithProviders(<BestSellersSection onAddToCart={vi.fn()} onTrackView={vi.fn()} />);

      await waitFor(() => {
        const badges = screen.getAllByText(/BEST SELLER/i);
        expect(badges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('6. All Products Section & Functional Pagination', () => {
    it('renders product grid with category pills and count status', async () => {
      renderWithProviders(<AllProductsSection onAddToCart={vi.fn()} onTrackView={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Explore All Sporekart Offerings')).toBeInTheDocument();
        expect(screen.getByText(/Showing/i)).toBeInTheDocument();
        expect(screen.getByText('All Products')).toBeInTheDocument();
        expect(screen.getByText('Fresh Mushrooms')).toBeInTheDocument();
      });
    });

    it('updates current page and triggers pagination when page buttons are clicked', async () => {
      renderWithProviders(<AllProductsSection onAddToCart={vi.fn()} onTrackView={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
      });

      const page2Btn = screen.getByRole('button', { name: 'Go to page 2' });
      fireEvent.click(page2Btn);

      await waitFor(() => {
        expect(catalogApi.searchProducts).toHaveBeenCalledWith(expect.objectContaining({
          page: 1,
          size: 12
        }));
      });
    });

    it('filters products when category pill is selected and resets to page 1', async () => {
      renderWithProviders(<AllProductsSection onAddToCart={vi.fn()} onTrackView={vi.fn()} />);

      await waitFor(() => {
        const spawnPill = screen.getByRole('button', { name: 'Spawn Seeds' });
        fireEvent.click(spawnPill);
      });

      await waitFor(() => {
        expect(catalogApi.searchProducts).toHaveBeenCalledWith(expect.objectContaining({
          category: 'spawn-seeds',
          page: 0
        }));
      });
    });
  });

  describe('7. Floating Order Now + WhatsApp Conversion Bar', () => {
    it('renders Order Now and WhatsApp action buttons on scroll', async () => {
      // Simulate scroll to make floating bar visible
      renderWithProviders(<FloatingOrderBar />);
      act(() => {
        window.scrollY = 200;
        window.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        const orderBtns = screen.getAllByRole('button', { name: /Order Now/i });
        expect(orderBtns.length).toBeGreaterThan(0);
        const whatsappLinks = screen.getAllByRole('link', { name: /WhatsApp/i });
        expect(whatsappLinks.length).toBeGreaterThan(0);
        expect(whatsappLinks[0].getAttribute('href')).toContain('wa.me/917204709870');
      });
    });
  });

  describe('8. Integrated HomePage Complete Architecture', () => {
    it('renders all architectural sections without errors', async () => {
      renderWithProviders(<HomePage user={null} onAddToCart={vi.fn()} />);

      await waitFor(() => {
        // 1. Circular Category Nav
        expect(screen.getByLabelText(/Product categories navigation/i)).toBeInTheDocument();
        // 2. Hero Carousel
        expect(screen.getByLabelText(/Sporekart Featured Agricultural Showcase/i)).toBeInTheDocument();
        // 3. Recently Viewed Section
        expect(screen.getByLabelText(/Recently viewed products/i)).toBeInTheDocument();
        // 4. Best Sellers
        expect(screen.getByLabelText(/Sporekart best selling agricultural products/i)).toBeInTheDocument();
        // 5. All Products
        expect(screen.getByLabelText(/All Sporekart Agricultural Products with Pagination/i)).toBeInTheDocument();
      });
    });
  });
});
