import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      manifest: false,
      workbox: {
        importScripts: ['sw-push.js'],
        globPatterns: ['**/*.{js,mjs,css,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/assets\//, /\.(js|css|map)$/],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Network-first or StaleWhileRevalidate for JS/CSS files
            urlPattern: /\.(?:js|mjs|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
            },
          },
          {
            // Cache-first for PDF worker — must be first entry
            urlPattern: /pdf\.worker(\.min)?\.mjs$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdf-worker',
              expiration: {
                maxEntries: 2,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
              },
            },
          },
          {
            // Cache-first for static assets (images, fonts, etc.)
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            // Network-only for API calls — never cache; let failures propagate cleanly
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Network-first for navigation requests with offline fallback
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', '@phosphor-icons/react']
  },
  optimizeDeps: {
    include: ['@phosphor-icons/react']
  },
  build: {
    target: 'es2015',
    sourcemap: true, // DIAGNOSTIC ONLY — revert after capturing stack trace
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    // In development, API calls go directly to VITE_API_BASE_URL (http://127.0.0.1:8000)
    // No proxy needed — the env var handles routing.
    // In production, Vercel rewrites handle /api/* routing (see vercel.json).
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version)
  }
})
