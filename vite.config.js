import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Base path is '/' for both web and native builds.
// - Web: custom domain lunadiary.app serves Luna at the root, so we
//   want absolute paths like /assets/index-XXX.js. The legacy
//   github.io/Luna/ URL auto-redirects to lunadiary.app.
// - Native (Capacitor): assets load from the local filesystem at root.
// VITE_NATIVE is kept as an env var in case other build-time switches
// need it later, but base path no longer depends on it.

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'splash/*.png'],
      manifest: {
        name: 'Luna — Cycle Tracker',
        short_name: 'Luna',
        description: 'A cycle tracker that interprets, not just logs.',
        theme_color: '#F4EFE5',
        background_color: '#F4EFE5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
})
