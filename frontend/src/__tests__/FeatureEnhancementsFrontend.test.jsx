import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LocalImageUploader from '../components/LocalImageUploader';
import MediaImage from '../components/MediaImage';

// Mock API
vi.mock('../api', () => ({
  adminApi: {
    addMedia: vi.fn().mockResolvedValue({ data: { success: true } }),
    replenishStock: vi.fn().mockResolvedValue({ data: { success: true, data: { availableQuantity: 45 } } }),
  },
  catalogApi: {
    getProducts: vi.fn().mockResolvedValue({ data: { data: [] } }),
    getCategories: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
  trainingApi: {
    getCourses: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
  cartApi: {
    getCart: vi.fn().mockResolvedValue({ data: { data: null } }),
  }
}));

describe('Frontend Feature Enhancements Tests', () => {
  it('renders LocalImageUploader and handles file selection validation', async () => {
    const handleSuccess = vi.fn();
    render(<LocalImageUploader onUploadSuccess={handleSuccess} />);

    expect(screen.getByText(/Local Image Upload with Pre-Upload Preview/i)).toBeInTheDocument();

    // Invalid File selection
    const invalidFile = new File(['dummy'], 'document.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]');

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/File format 'document.pdf' is not supported/i)).toBeInTheDocument();
    });
  });

  it('renders MediaImage correctly', () => {
    render(<MediaImage src="https://images.unsplash.com/photo-1543362906-acfc16c67564" alt="Test Image" />);
    const img = screen.getByAltText(/Test Image/i);
    expect(img).toBeInTheDocument();
  });
});
