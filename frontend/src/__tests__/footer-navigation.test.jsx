import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../components/Footer';

describe('Footer Navigation & Legal Routing Validation Tests', () => {
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

  it('renders enterprise details, contact links, and business address', () => {
    renderFooter();

    expect(screen.getAllByText(/Shriyap Enterprise/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Basapura village, Behind Taralabalu school, Davangere-577001, Karnataka/i)).toBeInTheDocument();
    expect(screen.getByText('+91 7204709870')).toBeInTheDocument();
    expect(screen.getByText('support@sporekart.in')).toBeInTheDocument();
  });

  it('renders quick action badges for WhatsApp and Instagram', () => {
    renderFooter();

    const whatsappBadge = screen.getByRole('link', { name: /Chat on WhatsApp/i });
    expect(whatsappBadge.getAttribute('href')).toContain('wa.me/917204709870');

    const instaBadge = screen.getByRole('link', { name: /Instagram @sporekart/i });
    expect(instaBadge.getAttribute('href')).toContain('instagram.com/sporekart');
  });

  it('handles newsletter subscription form interaction and validation', () => {
    renderFooter();

    const emailInput = screen.getByPlaceholderText('Your email address');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'farmer@example.com' } });
    const subscribeBtn = screen.getByLabelText('Subscribe to newsletter');
    fireEvent.click(subscribeBtn);
    expect(screen.getByText(/Subscribed successfully!/i)).toBeInTheDocument();
  });

  it('renders statutory legal compliance links with correct routes', () => {
    renderFooter();

    const legalLinks = [
      { text: 'Privacy Policy', path: '/privacy-policy' },
      { text: 'Terms of Service', path: '/terms' },
      { text: 'Refund & Return Policy', path: '/refund-policy' },
      { text: 'Shipping & Cold-Chain Policy', path: '/shipping-policy' },
      { text: 'Cookie & Cache Policy', path: '/cookie-policy' },
      { text: 'Grievance Redressal', path: '/policies/grievance' },
    ];

    legalLinks.forEach(({ text, path }) => {
      const match = screen.getByRole('link', { name: text });
      expect(match).toBeInTheDocument();
      expect(match.getAttribute('href')).toBe(path);
    });
  });

  it('renders copyright and Shriyap Enterprise registration info', () => {
    renderFooter();

    expect(screen.getByText(/Sporekart —/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Shriyap Enterprise/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
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
