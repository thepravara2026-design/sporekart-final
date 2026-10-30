import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../components/Footer';

describe('Footer Navigation & Routing Validation Tests', () => {
  const renderFooter = () => {
    return render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
  };

  it('renders brand logo linking directly to home (/)', () => {
    renderFooter();
    const brandLink = screen.getByLabelText('Sporekart Agritech Home');
    expect(brandLink).toBeInTheDocument();
    expect(brandLink.getAttribute('href')).toBe('/');
  });

  it('renders interactive trust badges with valid destination routes', () => {
    renderFooter();
    
    const spawnBadge = screen.getByRole('link', { name: /Lab Certified Spawn/i });
    expect(spawnBadge.getAttribute('href')).toBe('/products/spawn-seeds');

    const expressBadge = screen.getByRole('link', { name: /Cold-Chain Express/i });
    expect(expressBadge.getAttribute('href')).toBe('/contact');

    const razorpayBadge = screen.getByRole('link', { name: /Secure Razorpay/i });
    expect(razorpayBadge.getAttribute('href')).toBe('/orders');

    const trainingBadge = screen.getByRole('link', { name: /Certified Training/i });
    expect(trainingBadge.getAttribute('href')).toBe('/training');
  });

  it('renders catalog category links with proper product routes', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'All Mushroom Products' }).getAttribute('href')).toBe('/products');
    expect(screen.getByRole('link', { name: 'Fresh Button & Oyster Mushrooms' }).getAttribute('href')).toBe('/products/fresh-mushrooms');
    expect(screen.getByRole('link', { name: 'Dehydrated Gourmet Mushrooms' }).getAttribute('href')).toBe('/products/dry-mushrooms');
    expect(screen.getByRole('link', { name: 'Milky & Oyster Grain Spawn Seeds' }).getAttribute('href')).toBe('/products/spawn-seeds');
    expect(screen.getByRole('link', { name: 'Indoor DIY Mushroom Growing Kits' }).getAttribute('href')).toBe('/products/growing-kits');
    expect(screen.getByRole('link', { name: 'Cultivation Equipment & Supplies' }).getAttribute('href')).toBe('/products/equipment-supplies');
  });

  it('renders dedicated training and technical guide links with proper routing', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'All Training Masterclasses' }).getAttribute('href')).toBe('/training');
    expect(screen.getByRole('link', { name: 'Commercial Cultivation Masterclass' }).getAttribute('href')).toBe('/training/commercial-mushroom-cultivation-masterclass');
    expect(screen.getByRole('link', { name: 'Spawn Production & Lab Setup' }).getAttribute('href')).toBe('/training/spawn-production-tissue-culture-masterclass');
    expect(screen.getByRole('link', { name: 'Mushroom Cultivation Handbook' }).getAttribute('href')).toBe('/mushroom-cultivation-guide');
    expect(screen.getByRole('link', { name: 'Mushroom Spawn Technical Guide' }).getAttribute('href')).toBe('/mushroom-spawn-guide');
    expect(screen.getByRole('link', { name: 'Agritech Knowledge Blog' }).getAttribute('href')).toBe('/blog');
  });

  it('renders quick access company and customer care links', () => {
    renderFooter();

    // Column quick action links
    const aboutLinks = screen.getAllByRole('link', { name: /About/i });
    expect(aboutLinks.some((l) => l.getAttribute('href') === '/about')).toBe(true);

    const contactLinks = screen.getAllByRole('link', { name: /Contact/i });
    expect(contactLinks.some((l) => l.getAttribute('href') === '/contact')).toBe(true);

    const orderLinks = screen.getAllByRole('link', { name: /Track Orders/i });
    expect(orderLinks.some((l) => l.getAttribute('href') === '/orders')).toBe(true);

    const cartLinks = screen.getAllByRole('link', { name: /Cart/i });
    expect(cartLinks.some((l) => l.getAttribute('href') === '/cart')).toBe(true);
  });

  it('renders bottom bar quick navigation routes matching application pages', () => {
    renderFooter();

    const bottomLinks = [
      { text: 'Home', path: '/' },
      { text: 'Catalog', path: '/products' },
      { text: 'Training', path: '/training' },
      { text: 'Blog', path: '/blog' },
      { text: 'Cultivation Guide', path: '/mushroom-cultivation-guide' },
      { text: 'Spawn Guide', path: '/mushroom-spawn-guide' },
      { text: 'About', path: '/about' },
      { text: 'Contact', path: '/contact' },
    ];

    bottomLinks.forEach(({ text, path }) => {
      const match = screen.getAllByRole('link', { name: text }).find((el) => el.getAttribute('href') === path);
      expect(match).toBeDefined();
      expect(match.getAttribute('href')).toBe(path);
    });
  });

  it('renders enterprise details, quick action badges, newsletter, and PravaraMedia design credit', () => {
    renderFooter();

    // Enterprise details
    expect(screen.getByText(/Basapura village, Behind Taralabalu school, Davangere-577001, Karnataka/i)).toBeInTheDocument();
    expect(screen.getByText('+91 7204709870')).toBeInTheDocument();
    expect(screen.getByText('support@sporekart.in')).toBeInTheDocument();

    // Quick action badges
    const whatsappBadge = screen.getByRole('link', { name: /Chat on WhatsApp/i });
    expect(whatsappBadge.getAttribute('href')).toContain('wa.me/917204709870');

    const instaBadge = screen.getByRole('link', { name: /Instagram @sporekart/i });
    expect(instaBadge.getAttribute('href')).toContain('instagram.com/sporekart');

    // Newsletter input & submission
    const emailInput = screen.getByPlaceholderText('Your email address');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'farmer@example.com' } });
    const subscribeBtn = screen.getByLabelText('Subscribe to newsletter');
    fireEvent.click(subscribeBtn);
    expect(screen.getByText(/Subscribed successfully!/i)).toBeInTheDocument();

    // Exact bottom bar attribution
    expect(screen.getByText(/Design & Developed By PravaraMedia, Davangere, Karnataka/i)).toBeInTheDocument();
  });

  it('handles clicking PravaraMedia bottom credit and opens popup with actionable website, WhatsApp, and Instagram links', () => {
    renderFooter();

    // The attribution pill button is clickable
    const pravaraBtn = screen.getByRole('button', { name: /Design & Developed By PravaraMedia, Davangere, Karnataka/i });
    expect(pravaraBtn).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /PravaraMedia Agency Information/i })).not.toBeInTheDocument();

    // Click to open popup
    fireEvent.click(pravaraBtn);

    const dialog = screen.getByRole('dialog', { name: /PravaraMedia Agency Information/i });
    expect(dialog).toBeInTheDocument();

    // Website link
    const websiteLink = screen.getByRole('link', { name: /pravaramedia.framer.website/i });
    expect(websiteLink).toHaveAttribute('href', 'https://pravaramedia.framer.website');
    expect(websiteLink).toHaveAttribute('target', '_blank');

    // WhatsApp link
    const whatsappLink = screen.getByRole('link', { name: /\+91 8277559093/i });
    expect(whatsappLink.getAttribute('href')).toContain('wa.me/918277559093');
    expect(whatsappLink).toHaveAttribute('target', '_blank');

    // Instagram link
    const instaLink = screen.getByRole('link', { name: /@pravaramedia.marketing/i });
    expect(instaLink).toHaveAttribute('href', 'https://www.instagram.com/pravaramedia.marketing');
    expect(instaLink).toHaveAttribute('target', '_blank');

    // Close button dismisses popup
    const closeBtn = screen.getByRole('button', { name: /Close PravaraMedia popover/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog', { name: /PravaraMedia Agency Information/i })).not.toBeInTheDocument();
  });
});
