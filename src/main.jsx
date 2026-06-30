import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/sentry'
import { initPostHog } from './lib/posthog'
import { importCapacitorModule } from './lib/capacitorImport'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary'

// Initialize PostHog. Capturing is ON by default now — event-category
// only, never user content. Users can turn it off in Settings via
// the 'Anonymous analytics' row (which calls setAnalyticsEnabled).
initPostHog()

// Native (iOS / Android via Capacitor) — set the status bar to match
// Luna's cream paper register and hide the native splash once React
// has mounted. Both calls are no-ops on web. Fully lazy-imported so a
// missing @capacitor/core in pure-web builds (or during initial
// development before plugins are npm-installed) doesn't break the
// build. Errors silently swallowed — a missing plugin or older OS
// version should never break the launch sequence.
;(async () => {
  let core
  try { core = await importCapacitorModule('@capacitor/core') } catch { return }
  if (!core?.Capacitor?.isNativePlatform?.()) return
  try {
    const { StatusBar, Style } = await importCapacitorModule('@capacitor/status-bar')
    // "Light" content style = dark glyphs over the cream background.
    StatusBar.setStyle({ style: Style.Light }).catch(() => {})
    StatusBar.setBackgroundColor({ color: '#F7F2EA' }).catch(() => {})
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})
  } catch {}
  try {
    const { SplashScreen } = await importCapacitorModule('@capacitor/splash-screen')
    // launchAutoHide is false in capacitor.config.json so we control
    // exactly when the splash leaves — once React has painted, fade
    // it out to match the in-app splash timing on web.
    SplashScreen.hide({ fadeOutDuration: 320 }).catch(() => {})
  } catch {}
})()

// Silent auto-update: as soon as a new service worker takes control,
// reload the page so the user is on the latest build without ever
// being asked. Combined with skipWaiting/clientsClaim in vite.config.js,
// this means updates land transparently on the next foreground.
if ('serviceWorker' in navigator) {
  // Manual SW registration — replaces vite-plugin-pwa's auto-injected
  // /registerSW.js, which fired an unhandled rejection into Sentry
  // when registration failed on iOS standalone / private browsing /
  // weird cache states. Failure is expected in those contexts and not
  // worth alerting on — we silently swallow, and the app still works
  // (just without offline support for that session).
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(() => { /* expected on iOS PWA / private browsing; not actionable */ })
  })

  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })
  // Proactively poll for new versions every time the tab becomes visible.
  // SW will quietly install and activate, then controllerchange fires above.
  const checkForUpdate = () => {
    navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {})
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate()
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Fade out the inline splash once React has painted AND a minimum
// brand-exposure time has elapsed. Two requestAnimationFrame calls
// ensure we wait through the React first paint, not just the initial
// HTML paint. The 1100ms minimum gives the title card real on-screen
// time — long enough that the eye actually registers it, short
// enough that the app still feels responsive.
const splashStart = window.__lunaSplashStart || performance.now()
// Target: app feels interactive within ~1 second of cold start.
// 600ms splash + ~200ms fade gives the title card a clear moment
// without making the user wait.
const MIN_SPLASH_MS = 600
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const elapsed = performance.now() - splashStart
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed)
    setTimeout(() => {
      const splash = document.getElementById('luna-splash')
      if (splash) {
        splash.classList.add('gone')
        setTimeout(() => splash.remove(), 500)
      }
    }, remaining)
  })
})
