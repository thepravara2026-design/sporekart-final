import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TrainingPage from '../pages/TrainingPage';
import { trainingApi } from '../api';

vi.mock('../components/SeoHead', () => ({ default: () => null }));

vi.mock('../api', () => ({
  trainingApi: {
    getCourses: vi.fn(),
    bookSlot: vi.fn(),
  },
}));

describe('FE-8: Training Page & Batch Selection Component Tests', () => {
  const mockCourses = [
    {
      id: 'course-1',
      title: 'Commercial Button Mushroom Masterclass',
      slug: 'commercial-button-mushroom',
      category: 'Mushroom Cultivation',
      description: 'Comprehensive 3-day hands-on training on substrate preparation and climate control.',
      priceInr: 4999,
      durationHours: 24,
      slots: [
        {
          id: 'slot-101',
          startDate: '2026-10-15',
          endDate: '2026-10-18',
          availableSeats: 5,
          totalSeats: 20,
          location: 'Pune Training Center',
        },
        {
          id: 'slot-102',
          startDate: '2026-11-01',
          endDate: '2026-11-04',
          availableSeats: 12,
          totalSeats: 20,
          location: 'Online Live',
        },
      ],
    },
  ];

  const mockUser = {
    id: 'usr-1',
    fullName: 'John Farmer',
    phone: '9876543210',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    trainingApi.getCourses.mockResolvedValue({
      data: { success: true, data: mockCourses },
    });
  });

  it('renders training courses list with fee and slot details', async () => {
    render(
      <BrowserRouter>
        <TrainingPage user={mockUser} setUser={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Commercial Button Mushroom Masterclass')).toBeInTheDocument();
    });

    expect(screen.getByText(/4,999/i)).toBeInTheDocument();
    expect(screen.getByText('Mushroom Cultivation')).toBeInTheDocument();
  });

  it('triggers slot reservation when authenticated user clicks book seat', async () => {
    trainingApi.bookSlot.mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 'enr-999',
          courseTitle: 'Commercial Button Mushroom Masterclass',
          slotId: 'slot-101',
          status: 'PENDING_PAYMENT',
        },
      },
    });

    render(
      <BrowserRouter>
        <TrainingPage user={mockUser} setUser={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Commercial Button Mushroom Masterclass')).toBeInTheDocument();
    }, { timeout: 3000 });

    const enrollButtons = screen.getAllByRole('button', { name: /enroll now/i });
    expect(enrollButtons.length).toBeGreaterThan(0);
    fireEvent.click(enrollButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Enrollment Preview')).toBeInTheDocument();
    }, { timeout: 3000 });

    const confirmButton = screen.getByRole('button', { name: /confirm seat & proceed to payment/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(trainingApi.bookSlot).toHaveBeenCalledWith('slot-101', null);
    });
  });
});
