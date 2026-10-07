/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Served from the GitHub Pages project sub-path: https://<user>.github.io/shaded/
export default defineConfig({
  base: '/shaded/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
