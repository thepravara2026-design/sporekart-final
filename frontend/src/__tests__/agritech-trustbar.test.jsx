import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AgriTechTrustBar from '../components/AgriTechTrustBar';

describe('AgriTechTrustBar Component Tests', () => {
  it('renders the trust bar container with transparent styling', () => {
    const { container } = render(<AgriTechTrustBar />);
    
    // Check for the section container
    const section = screen.getByLabelText('Sporekart Agritech Verification & Trust Standards');
    expect(section).toBeInTheDocument();

    // Check that the outer shell container uses completely transparent background
    const transparentCard = container.querySelector('.bg-transparent');
    expect(transparentCard).toBeInTheDocument();
  });

  it('renders all key agritech trust metrics and compliance badges', () => {
    render(<AgriTechTrustBar />);

    expect(screen.getByText(/AGRITECH TRUST BENCHMARK/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Deliveries:/i)).toBeInTheDocument();
    expect(screen.getByText('Pan-India Delivery')).toBeInTheDocument();
    expect(screen.getByText('Pure Mother Spawn')).toBeInTheDocument();
    expect(screen.getByText('Commercial Buyback')).toBeInTheDocument();
    expect(screen.getByText('Certified Growers')).toBeInTheDocument();
    expect(screen.getByText('Mycologist Advisory')).toBeInTheDocument();
  });

  it('allows clicking a metric card to expand protocol verification details', () => {
    render(<AgriTechTrustBar />);

    const buybackCard = screen.getByText('Commercial Buyback').closest('div');
    expect(buybackCard).toBeInTheDocument();

    fireEvent.click(buybackCard);

    // Should reveal verification details
    expect(screen.getByText(/Protocol Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Ask Agronomist/i)).toBeInTheDocument();
  });
});
