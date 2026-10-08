/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so the built app can be hosted from any sub-path (e.g. GitHub Pages).
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
});
