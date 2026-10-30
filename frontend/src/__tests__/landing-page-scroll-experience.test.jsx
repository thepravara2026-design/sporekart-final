import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import LandingPageScrollExperience from '../components/LandingPageScrollExperience';

describe('LandingPageScrollExperience Component & Scoped Animations', () => {
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

    // Mock IntersectionObserver
    window.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn((element) => {
        callback([{ isIntersecting: true, target: element }]);
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock scrollTo
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enables scoped smooth scrolling on mount and removes it on unmount', () => {
    const { unmount } = render(<LandingPageScrollExperience />);

    expect(document.documentElement.classList.contains('landing-page-scroll-active')).toBe(true);
    expect(document.documentElement.style.scrollBehavior).toBe('smooth');

    unmount();

    expect(document.documentElement.classList.contains('landing-page-scroll-active')).toBe(false);
  });

  it('does NOT render any floating navigation bar or side dots at the extreme right', () => {
    render(<LandingPageScrollExperience />);

    expect(screen.queryByLabelText('Landing page section navigator')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Scroll to/i)).not.toBeInTheDocument();
  });

  it('reveals .landing-scroll-reveal elements via IntersectionObserver', () => {
    const section1 = document.createElement('div');
    section1.className = 'landing-scroll-reveal';
    document.body.appendChild(section1);

    render(<LandingPageScrollExperience />);

    expect(section1.classList.contains('is-revealed')).toBe(true);

    document.body.removeChild(section1);
  });
});
