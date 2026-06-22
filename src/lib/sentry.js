import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

export const sentryEnabled = Boolean(dsn)

// Known browser / environmental noise we can't fix from code and don't
// want polluting the issue list. Matched against the exception value
// (the error message). Anything matching is dropped before being sent.
//
// "Rejected" — bare Service Worker registration rejection on iOS PWA,
//   private browsing, or weird cache states. Not actionable.
// "ResizeObserver loop limit exceeded" — benign browser warning fired
//   when a ResizeObserver callback triggers a layout change. No effect.
// "ResizeObserver loop completed with undelivered notifications" — same
//   class of warning, just rephrased between browser versions.
// "Non-Error promise rejection captured" — a wrapped non-Error thrown
//   somewhere in third-party code, usually network/analytics.
// "Failed to fetch" / "Load failed" / "NetworkError" — offline state
//   or aborted requests. The app handles these gracefully already.
// "ChunkLoadError" — old client trying to load a chunk hash that no
//   longer exists after a deploy. Auto-update reload handles this.
const KNOWN_NOISE_PATTERNS = [
  /^Rejected$/,
  /ResizeObserver loop/,
  /Non-Error promise rejection captured/,
  /Failed to fetch/,
  /^Load failed$/,
  /NetworkError when attempting to fetch resource/,
  /ChunkLoadError/,
]

if (sentryEnabled) {
  Sentry.init({
    dsn,
    // Only capture errors in production — avoid noise from local dev
    enabled: import.meta.env.PROD,
    // Health data can leak through high-volume telemetry context. Keep
    // tracing and replay disabled; explicit scrubbed errors are enough.
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Don't send PII automatically
    sendDefaultPii: false,
    // beforeSend: scrub PII + drop known browser noise.
    beforeSend(event) {
      // Drop matches against KNOWN_NOISE_PATTERNS. The match runs
      // against both message and exception value so we catch both
      // captureException calls and unhandled-rejection events.
      const messages = []
      if (event.message) messages.push(event.message)
      if (event.exception?.values) {
        for (const v of event.exception.values) {
          if (v.value) messages.push(v.value)
        }
      }
      for (const msg of messages) {
        for (const pattern of KNOWN_NOISE_PATTERNS) {
          if (pattern.test(msg)) return null  // drop silently
        }
      }
      // Best-effort PII scrub: redact email-like patterns from message
      // + stacktrace values.
      const scrub = (s) => typeof s === 'string'
        ? s.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email-redacted]')
        : s
      if (event.message) event.message = scrub(event.message)
      if (event.exception?.values) {
        event.exception.values.forEach((v) => {
          if (v.value) v.value = scrub(v.value)
        })
      }
      // Password recovery and email-confirmation tokens can live in URL
      // fragments. Error telemetry never needs query strings or hashes.
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url)
          event.request.url = `${url.origin}${url.pathname}`
        } catch {
          event.request.url = String(event.request.url).split(/[?#]/)[0]
        }
      }
      if (Array.isArray(event.breadcrumbs)) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (!breadcrumb?.data?.url) return breadcrumb
          return {
            ...breadcrumb,
            data: { ...breadcrumb.data, url: String(breadcrumb.data.url).split(/[?#]/)[0] },
          }
        })
      }
      return event
    },
  })
}

export function reportError(error, info) {
  if (!sentryEnabled) return
  const extra = {}
  if (typeof info?.where === 'string') extra.where = info.where.slice(0, 120)
  if (typeof info?.componentStack === 'string') extra.componentStack = info.componentStack.slice(0, 2000)
  Sentry.captureException(error, { extra })
}
