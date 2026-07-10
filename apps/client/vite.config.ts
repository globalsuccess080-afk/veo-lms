import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      manifestFilename: 'site.webmanifest',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'favicon-96x96.png',
        'logo.png',
        'logo-192x192.png',
        'logo-512x512.png',
        'offline.html'
      ],
      devOptions: {
        enabled: false
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        sourcemap: false,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /\/admin(?:\/|$)/, /\/checkout(?:\/|$)/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'veolms-html',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'script',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'veolms-js',
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 7 * 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'veolms-css',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 7 * 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: ({ request, url }) => request.destination === 'font' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'veolms-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'veolms-images',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 30 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.webmanifest'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'veolms-manifest',
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: ({ url, request }) => {
              const isPublicApi = url.pathname.startsWith('/api/courses') || url.pathname.startsWith('/api/coupons/validate')
              const isSensitive = request.headers.has('authorization') || url.pathname.includes('/payments') || url.pathname.includes('/auth') || url.pathname.includes('/admin')
              return request.method === 'GET' && isPublicApi && !isSensitive
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'veolms-public-api',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 5 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        id: '/',
        name: 'VeoLMS',
        short_name: 'VeoLMS',
        description: 'Learn and manage courses with VeoLMS.',
        lang: 'en',
        dir: 'ltr',
        categories: ['education', 'productivity'],
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'browser'],
        orientation: 'portrait',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        icons: [
          { src: '/logo-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/logo-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/logo-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/logo-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'monochrome' }
        ],
        shortcuts: [
          {
            name: 'Browse Courses',
            short_name: 'Courses',
            description: 'Find available courses',
            url: '/search',
            icons: [{ src: '/logo-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'My Learning',
            short_name: 'Learning',
            description: 'Open your learning dashboard',
            url: '/dashboard',
            icons: [{ src: '/logo-192x192.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ],
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
