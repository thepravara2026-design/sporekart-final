import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => React.createElement(React.Fragment, null, children),
  HelmetProvider: ({ children }) => React.createElement(React.Fragment, null, children),
}));
