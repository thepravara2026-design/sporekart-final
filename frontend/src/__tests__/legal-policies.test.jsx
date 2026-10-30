import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LegalPolicyPage from '../pages/LegalPolicyPage';
import CookieConsentBanner from '../components/CookieConsentBanner';
import Footer from '../components/Footer';
import { LEGAL_POLICIES } from '../data/legalPolicies';

describe('Legal & Regulatory Compliance Documentation Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('validates all statutory policies exist with required legal metadata', () => {
    const requiredKeys = [
      'privacy-policy',
      'terms',
      'refund-policy',
      'shipping-policy',
      'cookie-policy',
      'grievance'
    ];

    requiredKeys.forEach((key) => {
      const policy = LEGAL_POLICIES[key];
      expect(policy).toBeDefined();
      expect(policy.slug).toBe(key);
      expect(policy.title).toBeTruthy();
      expect(policy.sections.length).toBeGreaterThan(0);
      expect(policy.lastUpdated).toBeTruthy();
      expect(policy.summary).toBeTruthy();
    });
  });

  it('verifies Privacy Policy includes DPDP Act 2023, Zero Card Storage & Shriyap Enterprise', () => {
    const privacy = LEGAL_POLICIES['privacy-policy'];
    const fullText = privacy.sections.map((s) => `${s.title} ${s.content}`).join(' ');

    expect(fullText).toContain('Shriyap Enterprise');
    expect(fullText).toContain('Davangere');
    expect(fullText).toContain('Digital Personal Data Protection Act, 2023');
    expect(fullText).toContain('Zero Financial Storage Policy');
    expect(fullText).toContain('Razorpay');
    expect(fullText).toContain('PCI-DSS Level 1');
  });

  it('verifies Refund & Return Policy covers 24-hr spawn transit guarantee & 7-day equipment return', () => {
    const refund = LEGAL_POLICIES['refund-policy'];
    const fullText = refund.sections.map((s) => `${s.title} ${s.content}`).join(' ');

    expect(fullText).toContain('24 hours of delivery');
    expect(fullText).toContain('7 calendar days');
    expect(fullText).toContain('unopened bag');
    expect(fullText).toContain('100% Full Refund');
    expect(fullText).toContain('Sporekart Store Wallet');
  });

  it('verifies Cookie & Cache Policy details local storage keys and zero ad tracking', () => {
    const cookies = LEGAL_POLICIES['cookie-policy'];
    const fullText = cookies.sections.map((s) => `${s.title} ${s.content}`).join(' ');

    expect(fullText).toContain('sporekart_cart');
    expect(fullText).toContain('sporekart_token');
    expect(fullText).toContain('Cache-Control');
    expect(fullText).toContain('Zero Third-Party Advertising Trackers');
  });

  it('verifies Statutory Grievance Redressal details under Rule 5(9)', () => {
    const grievance = LEGAL_POLICIES['grievance'];
    const fullText = grievance.sections.map((s) => `${s.title} ${s.content}`).join(' ');

    expect(fullText).toContain('Consumer Protection (E-Commerce) Rules, 2020');
    expect(fullText).toContain('grievance@sporekart.in');
    expect(fullText).toContain('+91 7204709870');
    expect(fullText).toContain('48 hours');
    expect(fullText).toContain('30 calendar days');
  });

  it('renders LegalPolicyPage with navigation tabs and active document content', () => {
    render(
      <MemoryRouter initialEntries={['/privacy-policy']}>
        <Routes>
          <Route path="/:policySlug" element={<LegalPolicyPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Active document title
    expect(screen.getByRole('heading', { level: 1, name: /Privacy Policy & Data Protection/i })).toBeInTheDocument();

    // Verify presence of directory navigation items
    expect(screen.getByRole('button', { name: /Terms of Service/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refund & Returns/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Shipping Policy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cookie & Cache Policy/i })).toBeInTheDocument();

    // Document controls
    expect(screen.getByPlaceholderText(/Search in Privacy Policy/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy direct policy link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Print or save document as PDF/i })).toBeInTheDocument();
  });

  it('filters sections dynamically when searching in LegalPolicyPage', () => {
    render(
      <MemoryRouter initialEntries={['/refund-policy']}>
        <Routes>
          <Route path="/:policySlug" element={<LegalPolicyPage />} />
        </Routes>
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search in Refund & Returns/i);
    fireEvent.change(searchInput, { target: { value: 'spawn' } });

    expect(screen.getByText(/Showing sections matching/i)).toBeInTheDocument();
  });

  it('renders CookieConsentBanner and handles acceptance', () => {
    render(
      <MemoryRouter>
        <CookieConsentBanner />
      </MemoryRouter>
    );

    const banner = screen.getByRole('complementary', { name: /Cookie and storage preferences notice/i });
    expect(banner).toBeInTheDocument();
    expect(screen.getByText(/Cache & Cookie Transparency/i)).toBeInTheDocument();

    const acceptBtn = screen.getByRole('button', { name: /Accept All/i });
    fireEvent.click(acceptBtn);

    expect(localStorage.getItem('sporekart_cookie_consent')).toBe('accepted');
    expect(screen.queryByRole('complementary', { name: /Cookie and storage preferences notice/i })).not.toBeInTheDocument();
  });

  it('renders all statutory policy links in Footer', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy-policy');
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Refund & Return Policy' })).toHaveAttribute('href', '/refund-policy');
    expect(screen.getByRole('link', { name: 'Shipping & Cold-Chain Policy' })).toHaveAttribute('href', '/shipping-policy');
    expect(screen.getByRole('link', { name: 'Cookie & Cache Policy' })).toHaveAttribute('href', '/cookie-policy');
    expect(screen.getByRole('link', { name: 'Grievance Redressal' })).toHaveAttribute('href', '/policies/grievance');
  });
});
