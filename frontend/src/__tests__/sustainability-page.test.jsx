import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import SustainabilityPage from '../pages/SustainabilityPage';

describe('Sustainability Page & Pillar Verification Tests', () => {
  const renderSustainabilityPage = () => {
    return render(
      <HelmetProvider>
        <BrowserRouter>
          <SustainabilityPage />
        </BrowserRouter>
      </HelmetProvider>
    );
  };

  it('renders primary hero headline and mission statement', () => {
    renderSustainabilityPage();

    expect(screen.getByRole('heading', { level: 1, name: /Farming That Gives Back to the Earth/i })).toBeInTheDocument();
    expect(screen.getByText(/CIRCULAR AGRITECH & ZERO-WASTE COMMITMENT/i)).toBeInTheDocument();
  });

  it('renders all four comprehensive sustainability pillars', () => {
    renderSustainabilityPage();

    expect(screen.getByRole('heading', { level: 3, name: /Agricultural Substrate Upcycling/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Closed-Loop Micro-Misting & Water Recovery/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Solar-Powered Cold-Chain & Incubation/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Zero Chemical Residues & HEPA Cleanrooms/i })).toBeInTheDocument();
  });

  it('displays verified sustainability metrics strip', () => {
    renderSustainabilityPage();

    expect(screen.getAllByText('100%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('90%+').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('65%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('0 ppm').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the 5 circular lifecycle steps', () => {
    renderSustainabilityPage();

    expect(screen.getByText('Stubble Procurement')).toBeInTheDocument();
    expect(screen.getByText('Clean Pasteurization')).toBeInTheDocument();
    expect(screen.getByText('Pure Spawn Inoculation')).toBeInTheDocument();
    expect(screen.getByText('Vertical Indoor Fruiting')).toBeInTheDocument();
    expect(screen.getByText('Spent Substrate Return')).toBeInTheDocument();
  });

  it('renders direct navigation call-to-actions to products and training', () => {
    renderSustainabilityPage();

    const productCta = screen.getByRole('link', { name: /Shop Sustainable Produce/i });
    expect(productCta.getAttribute('href')).toBe('/products');

    const trainingCta = screen.getByRole('link', { name: /Learn Eco-Cultivation/i });
    expect(trainingCta.getAttribute('href')).toBe('/training');
  });
});
