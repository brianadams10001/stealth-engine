import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths for assets in the build
  build: {
    outDir: 'dist',
    target: 'esnext',
  },
  server: {
    port: 3000
  }
});