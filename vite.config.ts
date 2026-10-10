import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Static, self-contained build: relative asset URLs so `dist/` can be opened
// straight from disk or dropped on any static host / subdirectory.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    cssTarget: 'chrome111',
    assetsInlineLimit: 2048,
    sourcemap: false
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  }
});
