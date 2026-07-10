import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          vendor: ['@tanstack/react-query', '@tanstack/react-table', 'axios', 'date-fns', 'zod', 'zustand'],
          charts: ['recharts'],
          editor: ['react-quill-new'],
          documents: ['jspdf', 'jspdf-autotable', 'xlsx'],
          media: ['hls.js'],
          motion: ['framer-motion']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@veolms/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
