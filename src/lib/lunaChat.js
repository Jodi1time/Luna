import { supabase, supabaseEnabled } from './supabase'
import { todayKey } from './dateOnly'

// Wraps the luna-chat Edge Function. Two modes:
//   dailyThought(ctx)  → string  (cached in localStorage per user per day)
//   chat(messages, ctx) → string
//
// All calls require a signed-in user; the Edge Function rejects
// without a valid JWT. Gracefully returns null on failure so callers
// can fall back to static content (the local REFLECTION_PROMPTS list).

const FUNCTION_NAME = 'luna-chat'
const CACHE_PREFIX = 'luna-daily-thought:'

async function callFunction(payload) {
  if (!supabaseEnabled) return null
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.text || null
  } catch {
    return null
  }
}

// Returns today's reflection — cached client-side so the user sees the
// same thought all day even if Home re-renders. Cache key includes
// user id AND a hash of the pattern summary so a pattern shift mid-day
// produces a fresh reflection instead of serving yesterday's cached
// text against today's patterns.
//
// `patternSummary` is the natural-language string produced by
// buildPatternSummary() in src/hooks/useCycle.js — derived, qualitative,
// never raw logs / dates / identifiers.
export async function dailyThought({ userId, phaseId, phaseName, cycleDay, cycleLength, patternSummary }) {
  const todayISO = todayKey()
  const summaryHash = (() => {
    if (!patternSummary) return 'nopat'
    let h = 0
    for (let i = 0; i < patternSummary.length; i++) {
      h = ((h << 5) - h) + patternSummary.charCodeAt(i)
      h |= 0
    }
    return Math.abs(h).toString(36)
  })()
  const key = `${CACHE_PREFIX}${userId || 'anon'}:${todayISO}:${summaryHash}`
  try {
    const cached = localStorage.getItem(key)
    if (cached) return cached
  } catch {}
  const text = await callFunction({
    mode: 'daily-thought',
    context: {
      phase_id: phaseId,
      phase_name: phaseName,
      cycle_day: cycleDay,
      cycle_length: cycleLength,
      hour: new Date().getHours(),
      pattern_summary: patternSummary || null,
    },
  })
  if (text) {
    try { localStorage.setItem(key, text) } catch {}
  }
  return text
}

// Continue a chat. `messages` is an array of { role, content } in
// chronological order. `patternSummary` is the derived natural-
// language string from buildPatternSummary() in useCycle.js.
// Returns Luna's next reply text, or null on failure (caller decides
// how to present).
export async function chat({ messages, phaseId, phaseName, cycleDay, cycleLength, patternSummary }) {
  return callFunction({
    mode: 'chat',
    messages,
    context: {
      phase_id: phaseId,
      phase_name: phaseName,
      cycle_day: cycleDay,
      cycle_length: cycleLength,
      pattern_summary: patternSummary || null,
    },
  })
}
