import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TrainingReviewFormModal from '../components/TrainingReviewFormModal';
import TrainingReviewsSection from '../components/TrainingReviewsSection';
import MyReviewsTab from '../components/MyReviewsTab';
import { trainingApi, reviewApi } from '../api';

vi.mock('../components/SeoHead', () => ({ default: () => null }));

vi.mock('../api', () => ({
  trainingApi: {
    getCourseReviews: vi.fn(),
    getCourseReviewSummary: vi.fn(),
    createReview: vi.fn(),
    getMyReviews: vi.fn(),
    getPendingReviews: vi.fn(),
  },
  reviewApi: {
    getCustomerReviews: vi.fn(),
    getPendingReviews: vi.fn(),
  },
}));

describe('FE-TrainingReviews: Training & Workshop Review System Component Tests', () => {
  const mockCourseSummary = {
    averageRating: 4.9,
    averageInstructorRating: 5.0,
    totalReviews: 8,
    fiveStarCount: 7,
    fourStarCount: 1,
    threeStarCount: 0,
    twoStarCount: 0,
    oneStarCount: 0,
  };

  const mockTrainingReviews = [
    {
      id: 'tr-rev-1',
      courseId: 'course-101',
      courseTitle: 'Commercial Oyster Mushroom Cultivation Masterclass',
      batchId: 'batch-2026-01',
      batchCode: 'BATCH-2026-01',
      enrollmentId: 'enr-101',
      userId: 'user-101',
      reviewerName: 'Ramesh K.',
      rating: 5,
      instructorRating: 5,
      reviewTitle: 'Exceeded Expectations! Extremely Practical',
      reviewText: 'The live substrate sterilization demo and cleanroom protocols were top-notch. Already starting my farm!',
      status: 'PUBLISHED',
      isVerifiedTrainee: true,
      createdAt: '2026-10-04T10:00:00Z',
    },
  ];

  const mockPendingTraining = [
    {
      enrollmentId: 'enr-102',
      courseId: 'course-101',
      courseTitle: 'Commercial Oyster Mushroom Cultivation Masterclass',
      batchId: 'batch-2026-01',
      batchCode: 'BATCH-2026-01',
      enrolledAt: '2026-10-01T10:00:00Z',
      status: 'CONFIRMED',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    trainingApi.getCourseReviewSummary.mockResolvedValue({
      data: { success: true, data: mockCourseSummary },
    });
    trainingApi.getCourseReviews.mockResolvedValue({
      data: { success: true, data: mockTrainingReviews },
    });
    trainingApi.getMyReviews.mockResolvedValue({
      data: { success: true, data: mockTrainingReviews },
    });
    trainingApi.getPendingReviews.mockResolvedValue({
      data: { success: true, data: mockPendingTraining },
    });
    reviewApi.getCustomerReviews.mockResolvedValue({
      data: { success: true, data: { content: [] } },
    });
    reviewApi.getPendingReviews.mockResolvedValue({
      data: { success: true, data: [] },
    });
  });

  it('renders TrainingReviewFormModal with course details and submits review', async () => {
    trainingApi.createReview.mockResolvedValue({
      data: { success: true, data: mockTrainingReviews[0] },
    });

    const mockItem = {
      enrollmentId: 'enr-102',
      courseTitle: 'Commercial Oyster Mushroom Cultivation Masterclass',
      batchCode: 'BATCH-2026-01',
    };

    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <TrainingReviewFormModal
        item={mockItem}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByText('Commercial Oyster Mushroom Cultivation Masterclass')).toBeInTheDocument();
    expect(screen.getByText('BATCH-2026-01')).toBeInTheDocument();

    // Fill Title and Text
    const titleInput = screen.getByPlaceholderText(/Incredible practical insights/i);
    fireEvent.change(titleInput, { target: { value: 'Outstanding live training!' } });

    const textarea = screen.getByPlaceholderText(/Share what you learned/i);
    fireEvent.change(textarea, { target: { value: 'Hands-on practical session was incredible and informative.' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Masterclass Feedback/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(trainingApi.createReview).toHaveBeenCalledWith({
        enrollmentId: 'enr-102',
        rating: 5,
        instructorRating: 5,
        reviewTitle: 'Outstanding live training!',
        reviewText: 'Hands-on practical session was incredible and informative.',
      });
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('renders TrainingReviewsSection with rating summary, instructor score, and verified trainee cards', async () => {
    render(
      <BrowserRouter>
        <TrainingReviewsSection courseId="course-101" />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Trainee Reviews & Workshop Ratings')).toBeInTheDocument();
      expect(screen.getByText('4.9')).toBeInTheDocument();
      expect(screen.getByText('Instructor Score: 5.0/5')).toBeInTheDocument();
      expect(screen.getByText('Exceeded Expectations! Extremely Practical')).toBeInTheDocument();
      expect(screen.getByText('Ramesh K.')).toBeInTheDocument();
      expect(screen.getByText('Verified Trainee')).toBeInTheDocument();
    });
  });

  it('renders MyReviewsTab with primary switch for Product vs Workshop & Training reviews', async () => {
    render(
      <BrowserRouter>
        <MyReviewsTab />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ratings & Reviews')).toBeInTheDocument();
      expect(screen.getByText('Product Reviews')).toBeInTheDocument();
      expect(screen.getByText('Workshop & Training')).toBeInTheDocument();
    });

    // Switch to Workshop & Training tab
    const trainingTabBtn = screen.getByRole('button', { name: /Workshop & Training/i });
    fireEvent.click(trainingTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Commercial Oyster Mushroom Cultivation Masterclass')).toBeInTheDocument();
      expect(screen.getByText('Batch: BATCH-2026-01')).toBeInTheDocument();
      expect(screen.getByText('Verified Trainee')).toBeInTheDocument();
    });
  });
});
