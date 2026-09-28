import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.jsx'],
    include: ['src/__tests__/**/*.test.{js,jsx}'],
    pool: 'forks',
  },
});
