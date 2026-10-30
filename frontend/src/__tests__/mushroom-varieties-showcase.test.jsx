import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MushroomVarietiesSection, {
  CATEGORIES,
  SHUFFLE_INTERVAL_MS,
  TRANSITION_DURATION_MS,
} from '../components/MushroomVarietiesSection';

function renderShowcase(props = {}) {
  return render(
    <BrowserRouter>
      <MushroomVarietiesSection autoStart={true} {...props} />
    </BrowserRouter>
  );
}

describe('Section C: Mushroom Varieties Showcase Animation & Stacking Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    // Mock IntersectionObserver to auto-trigger intersection in test environment
    window.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn((element) => {
        callback([{ isIntersecting: true, target: element }]);
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock matchMedia for default (no reduced motion)
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
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders Section C with accessible headings and categories dataset', () => {
    renderShowcase();

    // Section landmark
    const section = screen.getByLabelText('Product Categories Showcase');
    expect(section).toBeInTheDocument();

    // Headings
    expect(screen.getAllByText(/OUR CATEGORIES & VARIETIES/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Explore Nature’s/i)).toBeInTheDocument();

    // Initial Stack Deck shows count
    expect(screen.getByText(/Stack Deck/i)).toBeInTheDocument();
    expect(screen.getByText(`${CATEGORIES.length} left`)).toBeInTheDocument();
  });

  it('renders all categories with valid links and images', () => {
    renderShowcase();

    expect(CATEGORIES.length).toBe(6);
    expect(CATEGORIES.map((c) => c.name)).toEqual([
      'Fresh Mushrooms',
      'Dry Mushrooms',
      'Grain Spawn',
      'Growing Kits',
      'Equipment & Supplies',
      'Agritech Training',
    ]);
  });

  it('deals cards sequentially at the fixed interval of 2000ms into revealed queue', () => {
    renderShowcase({ shuffleInterval: 2000 });

    // Initially 0 revealed in queue
    expect(screen.getByText(/Revealed Queue \(0 \/ 6\)/i)).toBeInTheDocument();

    // Advance by interval (2000ms) + transition duration (500ms)
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      vi.advanceTimersByTime(TRANSITION_DURATION_MS);
    });

    // 1 card should now be in the revealed queue
    expect(screen.getByText(/Revealed Queue \(1 \/ 6\)/i)).toBeInTheDocument();

    // Advance 5 more cycles so all 6 cards are revealed
    for (let i = 0; i < 5; i++) {
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      act(() => {
        vi.advanceTimersByTime(TRANSITION_DURATION_MS);
      });
    }

    // Now all 6 cards are revealed and completed state is displayed
    expect(screen.getByText(/All 6 Varieties Revealed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Replay Shuffle/i })).toBeInTheDocument();
  });

  it('does not pause the animation when hovering over the section or cards', () => {
    renderShowcase({ shuffleInterval: 2000 });

    const section = screen.getByLabelText('Product Categories Showcase');

    // Hover should NOT pause
    act(() => {
      fireEvent.mouseEnter(section);
    });
    expect(screen.queryByText(/Shuffle Paused/i)).not.toBeInTheDocument();

    // Advance 1 cycle while hovering: cards should continue shuffling normally without interruption
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      vi.advanceTimersByTime(TRANSITION_DURATION_MS);
    });
    expect(screen.getByText(/Revealed Queue \(1 \/ 6\)/i)).toBeInTheDocument();
  });

  it('supports manual play/pause and skip to all', () => {
    renderShowcase({ shuffleInterval: 2000 });

    // Find Pause button and click it
    const pauseButton = screen.getByRole('button', { name: /Pause card shuffle/i });
    act(() => {
      fireEvent.click(pauseButton);
    });

    expect(screen.getByRole('button', { name: /Resume card shuffle/i })).toBeInTheDocument();

    // Find "Show All" skip button and click it
    const showAllBtn = screen.getByRole('button', { name: /Show All/i });
    act(() => {
      fireEvent.click(showAllBtn);
    });

    // Should immediately complete and show all 6 varieties
     expect(screen.getByText(/All 6 Varieties Revealed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Replay Shuffle/i })).toBeInTheDocument();
  });

  it('allows replaying the shuffle from the completed state', () => {
    renderShowcase({ shuffleInterval: 2000 });

    // Skip to all
    const showAllBtn = screen.getByRole('button', { name: /Show All/i });
    act(() => {
      fireEvent.click(showAllBtn);
    });

    expect(screen.getByText(/All 6 Varieties Revealed/i)).toBeInTheDocument();

    // Click Replay
    const replayBtn = screen.getByRole('button', { name: /Replay Shuffle/i });
    act(() => {
      fireEvent.click(replayBtn);
    });

    // Should reset back to 0 revealed cards in queue
    expect(screen.getByText(/Revealed Queue \(0 \/ 6\)/i)).toBeInTheDocument();
    expect(screen.getByText(/6 left/i)).toBeInTheDocument();
  });

  it('immediately displays the complete static grid when prefers-reduced-motion is active', () => {
    // Mock reduced motion to true
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

    renderShowcase();

    // Should render all 6 cards immediately without needing timers
    expect(screen.getByText(/All 6 Varieties Revealed/i)).toBeInTheDocument();
    expect(screen.queryByText(/Stack Deck/i)).not.toBeInTheDocument();
  });
});
