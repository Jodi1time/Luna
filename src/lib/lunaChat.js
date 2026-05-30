import { supabase, supabaseEnabled } from './supabase'

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
// user id so different accounts on the same device don't collide.
export async function dailyThought({ userId, phaseId, phaseName, cycleDay, cycleLength }) {
  const todayISO = new Date().toISOString().slice(0, 10)
  const key = `${CACHE_PREFIX}${userId || 'anon'}:${todayISO}`
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
    },
  })
  if (text) {
    try { localStorage.setItem(key, text) } catch {}
  }
  return text
}

// Continue a chat. `messages` is an array of { role, content } in
// chronological order. Returns Luna's next reply text, or null on
// failure (caller decides how to present).
export async function chat({ messages, phaseId, phaseName, cycleDay, cycleLength }) {
  return callFunction({
    mode: 'chat',
    messages,
    context: {
      phase_id: phaseId,
      phase_name: phaseName,
      cycle_day: cycleDay,
      cycle_length: cycleLength,
    },
  })
}
