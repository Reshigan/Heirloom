import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: { drop: ['console', 'debugger'] },
  server: {
    // 5173 is Vite's default and the canonical port used by Playwright tests
    // (playwright.config.ts webServer). When running npm run dev manually,
    // this is the port you connect to. The old port 3000 is no longer used.
    port: 5173,
    proxy: {
      '/api': {
        // VITE_PROXY_TARGET lets a local edge worker (wrangler dev, :8787)
        // stand in for the Express backend (:3001) without CORS in dev tests.
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3001',
        changeOrigin: true,
      },
      // Proxy gift-voucher pricing to the live edge API so the /gift page
      // receives real prices in dev (avoids CORS and the em-dash '—/ year' splash).
      '/api/gift-vouchers': {
        target: 'https://api.heirloom.blue',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
