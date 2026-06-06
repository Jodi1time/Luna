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
    // Performance / distributed tracing — enables span tracking on
    // navigation + fetch calls so we can spot regressions.
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    // Sample rates conservative — 10% transactions in prod is plenty
    // for catching real perf regressions without ballooning the bill.
    // Bump locally if investigating a specific perf issue.
    tracesSampleRate: 0.1,
    // Distributed tracing only to our own backends. Anything outside
    // this list gets no trace headers — avoids CORS issues with
    // third-party APIs (PostHog, Sentry itself, Stripe).
    tracePropagationTargets: [
      'localhost',
      'lunadiary.app',
      /^https:\/\/.*\.supabase\.co\//,
    ],
    // Replays — only on error, conservative sample.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
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
      return event
    },
  })
}

export function reportError(error, info) {
  if (!sentryEnabled) return
  Sentry.captureException(error, { extra: info })
}
