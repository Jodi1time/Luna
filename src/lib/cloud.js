import { supabase, supabaseEnabled } from './supabase'
import { reportError } from './sentry'

// Returns the current signed-in user, or null. Cheap getter — caches
// internally in the supabase client so this isn't a network call.
async function currentUser() {
  if (!supabaseEnabled) return null
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user || null
  } catch (e) {
    reportError(wrapSupabaseError(e, 'currentUser'), { where: 'cloud.currentUser' })
    return null
  }
}

// Load the user's profile row. Returns null if not signed in.
// The handle_new_user trigger creates a row on signup, so a row should
// exist for any authenticated user — but maybeSingle() is defensive.
export async function loadProfile() {
  const user = await currentUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw error
  return data
}

// Partial update of profile fields. Pass only the keys you want to change.
export async function saveProfile(patch) {
  const user = await currentUser()
  if (!user) return
  const { error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) throw error
}

// Load all logs for the signed-in user as a date-keyed map matching
// the shape Zustand expects: { 'YYYY-MM-DD': { date, mood, ... } }.
export async function loadLogs() {
  const user = await currentUser()
  if (!user) return {}
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
  if (error) throw error
  const map = {}
  for (const row of data || []) {
    map[row.date] = {
      date: row.date,
      mood: row.mood,
      moods: Array.isArray(row.moods) ? row.moods : (row.mood ? [row.mood] : []),
      symptoms: row.symptoms || [],
      flow: row.flow,
      bbt: row.bbt != null ? Number(row.bbt) : null,
      mucus: row.mucus,
      sex: row.sex,
      sleep: row.sleep,
      intimate: row.intimate || null,
      note: row.note,
      updated_at: row.updated_at,   // needed by useLuna merge logic
    }
  }
  return map
}

// Upsert a log row for a date. Matches the saveLog action shape.
// Defensive: if the sleep column hasn't been added to the live
// Supabase schema yet, retry without it. (The alter for `sleep` lives
// in supabase-schema.sql — but if someone hasn't run the migration,
// log saves would otherwise fail entirely and silently revert phase
// state on the next hydrate.)
export async function upsertLog(date, log) {
  const user = await currentUser()
  if (!user) return
  const base = {
    user_id: user.id,
    date,
    mood: log.mood ?? (Array.isArray(log.moods) && log.moods[0]) ?? null,
    symptoms: log.symptoms ?? [],
    flow: log.flow ?? null,
    bbt: log.bbt ?? null,
    mucus: log.mucus ?? null,
    sex: log.sex ?? null,
    note: log.note ?? null,
    updated_at: new Date().toISOString(),
  }
  // Try the richest payload first, then defensively drop newer optional
  // columns one tier at a time if Supabase reports them missing. Tiers,
  // newest → oldest: moods, intimate, sleep. Each retry catches up an
  // older Supabase instance that hasn't run the latest migration yet.
  const isMissingColumn = (msg, col) => msg.includes(col) && (msg.includes('column') || msg.includes('not found'))
  const tryUpsert = async (payload) => {
    const { error } = await supabase.from('logs').upsert(payload, { onConflict: 'user_id,date' })
    return error
  }
  const moodsArr = Array.isArray(log.moods) ? log.moods : (log.mood ? [log.mood] : [])
  const full = { ...base, sleep: log.sleep ?? null, intimate: log.intimate ?? null, moods: moodsArr }
  const err1 = await tryUpsert(full)
  if (!err1) return
  const msg1 = String(err1.message || '').toLowerCase()
  if (isMissingColumn(msg1, 'moods')) {
    // eslint-disable-next-line no-console
    console.warn('[cloud] moods column missing on logs table — saving without it. Run the supabase-schema.sql migration to enable multi-mood logging server-side.')
    const noMoods = { ...base, sleep: log.sleep ?? null, intimate: log.intimate ?? null }
    const err2 = await tryUpsert(noMoods)
    if (!err2) return
    const msg2 = String(err2.message || '').toLowerCase()
    if (!isMissingColumn(msg2, 'intimate') && !isMissingColumn(msg2, 'sleep')) throw err2
    if (isMissingColumn(msg2, 'intimate')) {
      // eslint-disable-next-line no-console
      console.warn('[cloud] intimate column missing on logs table — saving without it.')
      const noIntimate = { ...base, sleep: log.sleep ?? null }
      const err3 = await tryUpsert(noIntimate)
      if (!err3) return
      const msg3 = String(err3.message || '').toLowerCase()
      if (!isMissingColumn(msg3, 'sleep')) throw err3
    }
    // eslint-disable-next-line no-console
    console.warn('[cloud] sleep column missing on logs table — saving without it.')
    const err4 = await tryUpsert(base)
    if (err4) throw err4
    return
  }
  if (!isMissingColumn(msg1, 'intimate') && !isMissingColumn(msg1, 'sleep')) throw err1
  if (isMissingColumn(msg1, 'intimate')) {
    // eslint-disable-next-line no-console
    console.warn('[cloud] intimate column missing on logs table — saving without it.')
    const noIntimate = { ...base, sleep: log.sleep ?? null }
    const err5 = await tryUpsert(noIntimate)
    if (!err5) return
    const msg5 = String(err5.message || '').toLowerCase()
    if (!isMissingColumn(msg5, 'sleep')) throw err5
  }
  // eslint-disable-next-line no-console
  console.warn('[cloud] sleep column missing on logs table — saving without it.')
  const err6 = await tryUpsert(base)
  if (err6) throw err6
}

export async function deleteLog(date) {
  const user = await currentUser()
  if (!user) return
  const { error } = await supabase
    .from('logs')
    .delete()
    .eq('user_id', user.id)
    .eq('date', date)
  if (error) throw error
}

// Fire-and-forget wrapper for mutations called from the store. We
// don't want UI to wait on cloud round-trips, but we DO want failures
// to land in Sentry so we know about silent drift.
// Wrap a Supabase PostgrestError ({code, details, hint, message}) into
// a real Error instance so Sentry titles the issue with a useful string
// instead of "Object captured as exception with keys: code, details,
// hint, message." Also preserves the original Supabase fields as
// properties on the wrapped Error so they're still readable in the
// Sentry detail view.
function wrapSupabaseError(e, where) {
  if (e instanceof Error) return e
  const msg = e?.message || e?.code || 'unknown error'
  const wrapped = new Error(`cloud.${where}: ${msg}`)
  wrapped.supabaseCode = e?.code ?? null
  wrapped.supabaseDetails = e?.details ?? null
  wrapped.supabaseHint = e?.hint ?? null
  wrapped.original = e
  return wrapped
}

export function fireAndForget(promise, where) {
  promise.catch((e) => {
    // eslint-disable-next-line no-console
    console.error(`[cloud] ${where} failed:`, e)
    reportError(wrapSupabaseError(e, where), {
      where: `cloud.${where}`,
      // Carry the structured Supabase fields into Sentry's `extra` so
      // they show on the issue page even if someone reads only the title.
      supabase_code: e?.code ?? null,
      supabase_details: e?.details ?? null,
      supabase_hint: e?.hint ?? null,
    })
  })
}
