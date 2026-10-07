import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Development: the Vite dev server runs on :5173.
// API requests go to /api -> proxied to the Express server on :5000,
// so the frontend never needs to know the backend address.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
