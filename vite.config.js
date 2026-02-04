import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Router
          if (id.includes('/react-router/') || id.includes('/react-router-dom/') || id.includes('/@remix-run/router/')) {
            return 'vendor-router';
          }

          // Large / distinct deps
          if (id.includes('/@supabase/')) return 'vendor-supabase';
          if (id.includes('/framer-motion/')) return 'vendor-motion';
          if (id.includes('/@radix-ui/')) return 'vendor-radix';
          if (id.includes('/lucide-react/')) return 'vendor-icons';

          // Let Rollup decide for everything else to avoid circular chunk graphs.
          return;
        }
      }
    }
  }
})
