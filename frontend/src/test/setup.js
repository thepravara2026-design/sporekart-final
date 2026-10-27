import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => <>{children}</>,
  HelmetProvider: ({ children }) => <>{children}</>,
}));

// Suppress React Router v7 future-flag warnings in test runners to keep stderr clean
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && (
    args[0].includes('React Router Future Flag Warning') ||
    args[0].includes('v7_startTransition') ||
    args[0].includes('v7_relativeSplatPath')
  )) {
    return;
  }
  originalWarn(...args);
};

