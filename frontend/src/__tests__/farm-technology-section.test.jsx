import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import FarmTechnologySection from '../components/FarmTechnologySection';

function renderSection(props = {}) {
  return render(
    <BrowserRouter>
      <FarmTechnologySection {...props} />
    </BrowserRouter>
  );
}

describe('FarmTechnologySection Component UI & Animations', () => {
  beforeEach(() => {
    vi.useFakeTimers();

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

    window.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn((element) => {
        callback([{ isIntersecting: true, target: element }]);
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders section title, pillars, and signature badge', () => {
    renderSection();

    expect(screen.getByLabelText('Our Farm and Technology')).toBeInTheDocument();
    expect(screen.getByText(/OUR FARM & TECHNOLOGY/i)).toBeInTheDocument();
    expect(screen.getByText(/Where Nature Meets/i)).toBeInTheDocument();
    expect(screen.getByText('Our Innovation Centre ~')).toBeInTheDocument();

    expect(screen.getByText('Controlled Environment')).toBeInTheDocument();
    expect(screen.getByText('Advanced Agritech')).toBeInTheDocument();
    expect(screen.getByText('Quality Assurance')).toBeInTheDocument();
  });

  it('renders "Learn More" CTA when showLearnMore is true', () => {
    renderSection({ showLearnMore: true });

    expect(screen.getByText('Learn More About Sporekart')).toBeInTheDocument();
  });

  it('renders dual CTAs when showLearnMore is false', () => {
    renderSection({ showLearnMore: false });

    expect(screen.getByText('Explore Mushroom Products')).toBeInTheDocument();
    expect(screen.getByText('Grower Masterclasses')).toBeInTheDocument();
  });

  it('cycles live farm telemetry sensor readings over time', () => {
    renderSection();

    expect(screen.getByText(/Chamber Temp/i)).toBeInTheDocument();

    // Advance timer by 3200ms for next sensor reading
    act(() => {
      vi.advanceTimersByTime(3200);
    });

    expect(screen.getByText(/Air Humidity/i)).toBeInTheDocument();

    // Advance timer by another 3200ms
    act(() => {
      vi.advanceTimersByTime(3200);
    });

    expect(screen.getByText(/CO₂ Circulation/i)).toBeInTheDocument();
  });

  it('handles mouse movements for interactive spotlight without error', () => {
    const { container } = renderSection();

    const card = container.querySelector('.group\\/farm');
    expect(card).toBeInTheDocument();

    fireEvent.mouseMove(card, { clientX: 200, clientY: 300 });
    fireEvent.mouseLeave(card);
  });
});

