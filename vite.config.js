import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  build: {
    emptyOutDir: true,
    outDir: '../dist',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
});
