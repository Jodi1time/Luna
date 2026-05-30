// PostHog product analytics wrapper.
//
// Privacy posture:
// - Defaults ON now (was opt-out). Users can switch it off in
//   Settings any time. Justification: only category-level events
//   leave the device; nothing user-identifying or content-bearing.
// - Anonymous IDs only — never sets user.id to email or anything PII.
// - Captures event names + category-level properties only. NEVER sends:
//     * cycle data (period dates, symptoms, mood, BBT, mucus, sex)
//     * notes / journal content
//     * names, emails, passwords, passcode
// - autocapture (PostHog's default click/pageview tracking) is DISABLED
//   so the only events sent are the ones we explicitly capture().
//
// Why we collect anything: to learn which features get used so we know
// what to deepen vs. cut. Without this, every v1.1 decision is a guess.

import posthog from 'posthog-js'

const apiKey = import.meta.env.VITE_POSTHOG_KEY
const host = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

let _initialized = false
let _enabled = false

export const posthogAvailable = Boolean(apiKey)

// Called once on app boot. Doesn't activate capturing until the user
// flips the Settings toggle ON via setAnalyticsEnabled(true).
export function initPostHog() {
  if (_initialized) return
  if (!apiKey) return
  posthog.init(apiKey, {
    api_host: host,
    autocapture: false,            // No silent click/pageview tracking
    capture_pageview: false,       // We control screen events manually
    capture_pageleave: false,
    disable_session_recording: true,
    disable_persistence: false,    // Anonymous distinct_id can persist
    persistence: 'localStorage',
    opt_out_capturing_by_default: false, // Default ON — users can switch off in Settings
    bootstrap: {},
    loaded: () => {
      _initialized = true
    },
  })
  _initialized = true
}

// Called from Settings when user toggles "Anonymous analytics" ON/OFF.
export function setAnalyticsEnabled(enabled) {
  _enabled = Boolean(enabled)
  if (!_initialized || !apiKey) return
  if (_enabled) {
    posthog.opt_in_capturing()
  } else {
    posthog.opt_out_capturing()
  }
}

// Restore the toggle state from the persisted store on app boot.
export function syncAnalyticsState(enabledFromStore) {
  setAnalyticsEnabled(enabledFromStore)
}

// Capture an event. Only fires when initialized + user opted in.
// Props are sanitized — only category-level data is allowed through.
//
// Example: capture('log_saved', { has_mood: true, symptom_count: 3 })
// NEVER: capture('log_saved', { mood: 'sad', symptoms: ['cramps'] })
export function capture(event, props = {}) {
  if (!_initialized || !_enabled || !apiKey) return
  // Defensive: strip any keys that look like they might contain
  // sensitive content. Belt-and-braces — call sites should already
  // be careful, this is just a second guardrail.
  const safe = {}
  const BLOCKED_KEYS = [
    'email', 'name', 'passcode', 'password', 'note', 'notes',
    'mood', 'symptoms', 'flow', 'bbt', 'mucus', 'sex',
    'displayName', 'account', 'lmp', 'lastPeriodStart',
  ]
  for (const [k, v] of Object.entries(props || {})) {
    if (BLOCKED_KEYS.includes(k)) continue
    if (typeof v === 'string' && v.length > 64) continue // suspiciously long string
    safe[k] = v
  }
  try {
    posthog.capture(event, safe)
  } catch {
    // never let analytics throw into the app
  }
}

// Identify the user anonymously. We use a stable random ID from
// localStorage — NEVER email or display name.
export function identifyAnonymous() {
  if (!_initialized || !_enabled || !apiKey) return
  try {
    // PostHog already generates a distinct_id on init. We don't
    // need to override it. This function exists so call sites can
    // express intent — but it's a no-op.
  } catch {}
}

// Reset analytics state — used on sign-out and account delete so
// the next user (or same user re-signing in) gets a fresh distinct_id.
export function resetAnalytics() {
  if (!_initialized) return
  try {
    posthog.reset()
  } catch {}
}
