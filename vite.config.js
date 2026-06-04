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

// Capacitor packages are dynamic-imported at runtime in main.jsx and
// lib/haptics.js with try/catch wrappers. On web they intentionally
// fail and the code falls back to no-ops; on native they resolve
// through the Capacitor runtime. Marking them external keeps the
// build from trying to statically resolve them, so the web bundle
// stays buildable even if the packages aren't physically installed
// (e.g. during pre-npm-install fresh clones).
const CAPACITOR_EXTERNALS = [
  '@capacitor/core',
  '@capacitor/status-bar',
  '@capacitor/splash-screen',
  '@capacitor/haptics',
]

export default defineConfig({
  base: '/',
  build: {
    rolldownOptions: {
      external: CAPACITOR_EXTERNALS,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'splash/*.png'],
      manifest: {
        name: 'Luna by Gloria — Cycle Companion',
        short_name: 'Luna',
        description: 'A companion for the body you live in. Doctor-sourced cycle tracking with privacy at the floor. Luna by Gloria.',
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
