import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

export const sentryEnabled = Boolean(dsn)

if (sentryEnabled) {
  Sentry.init({
    dsn,
    // Only capture errors in production — avoid noise from local dev
    enabled: import.meta.env.PROD,
    // Sample rates conservative — bump up as needed
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    // Don't send PII automatically
    sendDefaultPii: false,
    // Strip likely-PII strings from messages
    beforeSend(event) {
      // Best-effort: scrub any email-like patterns from message + stacktrace
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
