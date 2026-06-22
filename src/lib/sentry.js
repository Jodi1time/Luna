import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

export const sentryEnabled = Boolean(dsn)

if (sentryEnabled) {
  Sentry.init({
    dsn,
    // Only capture errors in production — avoid noise from local dev
    enabled: import.meta.env.PROD,
    // Sample rates conservative — bump up as needed
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
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
