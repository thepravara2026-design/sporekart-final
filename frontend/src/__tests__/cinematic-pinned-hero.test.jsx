import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import HeroSection, { FALLBACK_ACTIVITIES, RECENT_OPERATIONS } from '../components/HeroSection';

describe('Cinematic Pinned Hero with Scroll Transformation Component Tests', () => {
  beforeEach(() => {
    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Mock scrollTo
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderHero = () => {
    return render(
      <BrowserRouter>
        <HeroSection />
      </BrowserRouter>
    );
  };

  it('preserves legacy exports FALLBACK_ACTIVITIES and RECENT_OPERATIONS', () => {
    expect(Array.isArray(FALLBACK_ACTIVITIES)).toBe(true);
    expect(FALLBACK_ACTIVITIES.length).toBeGreaterThan(0);
    expect(RECENT_OPERATIONS).toBe(FALLBACK_ACTIVITIES);
    expect(FALLBACK_ACTIVITIES[0]).toContain('Davangere');
  });

  it('renders primary SEO H1 heading hierarchy and Sporekart brand messaging', () => {
    renderHero();

    // Primary H1 heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Harvested Fresh at 5:00 AM/i);
    expect(heading).toHaveTextContent(/Pure Mother Spawn/i);
    expect(heading).toHaveTextContent(/Zero Chemicals/i);

    // Eyebrow kicker
    expect(screen.getByText(/CULTIVATED IN DAVANGERE, KARNATAKA/i)).toBeInTheDocument();
    expect(screen.getByText(/FSSAI LIC\. #10020011000123/i)).toBeInTheDocument();

    // Description text
    expect(screen.getByText(/steam-sterilized organic paddy straw with zero chemical sprays/i)).toBeInTheDocument();
  });

  it('renders all primary and secondary CTA links with correct destinations', () => {
    renderHero();

    // Primary CTA: Explore Fresh Mushrooms
    const freshMushroomsLinks = screen.getAllByRole('link', { name: /Explore Fresh Mushrooms|View Fresh Harvest/i });
    expect(freshMushroomsLinks.length).toBeGreaterThan(0);
    expect(freshMushroomsLinks[0]).toHaveAttribute('href', '/products/fresh-mushrooms');

    // Secondary CTA: Buy Commercial Spawn
    const spawnLinks = screen.getAllByRole('link', { name: /Buy Commercial Spawn|Order Pure Spawn/i });
    expect(spawnLinks.length).toBeGreaterThan(0);
    expect(spawnLinks[0]).toHaveAttribute('href', '/products/spawn-seeds');

    // WhatsApp Grower Support
    const whatsappLinks = screen.getAllByRole('link', { name: /Grower Support|Direct WhatsApp/i });
    expect(whatsappLinks.length).toBeGreaterThan(0);
    expect(whatsappLinks[0].getAttribute('href')).toContain('wa.me/918277559093');
  });

  it('renders storefront badges and trust indicators', () => {
    renderHero();

    // Storefront Badges
    expect(screen.getByText(/Farm Gate in Davangere, Karnataka/i)).toBeInTheDocument();
    expect(screen.getByText(/Same-Day Dispatch for Fresh Pickings/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Pesticide-Free & FSSAI Compliant/i)).toBeInTheDocument();

    // Trust Indicators (using getAllByText for phrases that appear in badge & strip)
    const pesticideFreeEls = screen.getAllByText(/100% Pesticide-Free/i);
    expect(pesticideFreeEls.length).toBeGreaterThan(0);

    expect(screen.getByText(/Daily Fresh Harvest/i)).toBeInTheDocument();
    expect(screen.getByText(/1st-Gen Pure Spawn/i)).toBeInTheDocument();
    expect(screen.getByText(/FSSAI Compliant & Lab Tested/i)).toBeInTheDocument();
  });

  it('renders high-resolution authentic mushroom visuals and decorative layers', () => {
    renderHero();

    // Background image
    const bgImg = screen.getByAltText(/Davangere mushroom farm cultivation facility/i);
    expect(bgImg).toBeInTheDocument();
    expect(bgImg).toHaveAttribute('src', '/sporekart-hero-bg.jpg');

    // Main product visual
    const productImg = screen.getByAltText(/daily morning fresh mushroom harvest in organic wooden crate/i);
    expect(productImg).toBeInTheDocument();
    expect(productImg).toHaveAttribute('src', '/sporekart-hero-crate.jpg');
  });

  it('renders secondary storytelling narrative and agronomy spec chips for scroll reveal', () => {
    renderHero();

    // Secondary heading H2
    const secondaryHeading = screen.getByRole('heading', { level: 2 });
    expect(secondaryHeading).toBeInTheDocument();
    expect(secondaryHeading).toHaveTextContent(/Engineered by Nature/i);
    expect(secondaryHeading).toHaveTextContent(/Perfected by Science/i);

    // Agronomy spec chips (using getAllByText where phrase appears in both narrative/body and chip)
    const paddyStrawEls = screen.getAllByText(/Organic Paddy Straw/i);
    expect(paddyStrawEls.length).toBeGreaterThan(0);

    const spawnEls = screen.getAllByText(/1st-Gen Pure Wheat Grain/i);
    expect(spawnEls.length).toBeGreaterThan(0);

    const chemicalSprayEls = screen.getAllByText(/Zero Chemical Sprays/i);
    expect(chemicalSprayEls.length).toBeGreaterThan(0);

    expect(screen.getByText(/Insulated Cold Chain/i)).toBeInTheDocument();
  });

  it('triggers smooth scroll to next section when clicking Explore Quality Standards', () => {
    renderHero();

    // Create a mock target element in DOM
    const trustStandards = document.createElement('div');
    trustStandards.id = 'trust-standards';
    document.body.appendChild(trustStandards);

    const scrollButton = screen.getByRole('button', { name: /Scroll to Quality Standards Section/i });
    expect(scrollButton).toBeInTheDocument();

    fireEvent.click(scrollButton);
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));

    document.body.removeChild(trustStandards);
  });

  it('honors prefers-reduced-motion by rendering static accessible content', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    renderHero();

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Harvested Fresh at 5:00 AM/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Explore Fresh Mushrooms/i).length).toBeGreaterThan(0);
  });
});
