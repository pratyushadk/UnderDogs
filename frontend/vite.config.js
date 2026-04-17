import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// restarted 3
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        // Only proxy API calls (axios/JSON) — let browser navigations fall through to React
        bypass(req) {
          const accept = req.headers['accept'] || '';
          if (accept.includes('text/html')) {
            return '/index.html'; // serve SPA for page navigation
          }
        },
      },
    },
  },
})
