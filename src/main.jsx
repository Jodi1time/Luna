import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary'

// Silent auto-update: as soon as a new service worker takes control,
// reload the page so the user is on the latest build without ever
// being asked. Combined with skipWaiting/clientsClaim in vite.config.js,
// this means updates land transparently on the next foreground.
if ('serviceWorker' in navigator) {
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
const MIN_SPLASH_MS = 1100
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
