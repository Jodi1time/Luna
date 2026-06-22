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
      bbt: row.bbt != null
        ? { value: Number(row.bbt), unit: row.bbt_unit === 'C' ? 'C' : 'F' }
        : null,
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
  const bbtValue = log.bbt && typeof log.bbt === 'object'
    ? Number(log.bbt.value)
    : (log.bbt != null ? Number(log.bbt) : null)
  const bbtUnit = log.bbt && typeof log.bbt === 'object'
    ? (log.bbt.unit === 'C' ? 'C' : 'F')
    : null
  const base = {
    user_id: user.id,
    date,
    mood: log.mood ?? (Array.isArray(log.moods) && log.moods[0]) ?? null,
    symptoms: log.symptoms ?? [],
    flow: log.flow ?? null,
    bbt: Number.isFinite(bbtValue) ? bbtValue : null,
    mucus: log.mucus ?? null,
    sex: log.sex ?? null,
    note: log.note ?? null,
    updated_at: new Date().toISOString(),
  }
  // Optional columns were added over time. Start with the richest row and
  // only drop a field when Postgres explicitly reports that exact column
  // missing. Other failures still surface instead of silently losing data.
  const moodsArr = Array.isArray(log.moods) ? log.moods : (log.mood ? [log.mood] : [])
  const payload = {
    ...base,
    sleep: log.sleep ?? null,
    intimate: log.intimate ?? null,
    moods: moodsArr,
    bbt_unit: bbtUnit,
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await supabase
      .from('logs')
      .upsert(payload, { onConflict: 'user_id,date' })
    if (!error) return
    const message = String(error.message || '').toLowerCase()
    const missing = ['moods', 'intimate', 'sleep', 'bbt_unit'].find((column) => (
      Object.hasOwn(payload, column) && message.includes(column) &&
      (message.includes('column') || message.includes('not found'))
    ))
    if (!missing) throw error
    delete payload[missing]
  }
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

// ── Journal entries — their own table (migrated 2026-06-10) ──
// Diary pages used to live inside profiles.settings.journalEntries,
// which meant every settings write re-uploaded the entire journal
// (base64 photos included). Each entry is now its own row, synced
// individually. Photo payloads stay inside the row's `photos` jsonb
// for now (each photo object can later grow a `path` field when we
// offload binaries to Supabase Storage).
//
// All three are defensive about a missing table: if the migration
// in supabase-schema.sql hasn't run yet, the throw lands in Sentry
// via fireAndForget and local state keeps working untouched.

export async function loadJournalEntries() {
  const user = await currentUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((r) => ({
    id: r.id,
    body: r.body || '',
    photos: Array.isArray(r.photos) ? r.photos : [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

export async function upsertJournalEntry(entry) {
  const user = await currentUser()
  if (!user) return
  const { error } = await supabase
    .from('journal_entries')
    .upsert({
      id: entry.id,
      user_id: user.id,
      body: entry.body || '',
      photos: entry.photos || [],
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
    }, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteJournalEntryCloud(id) {
  const user = await currentUser()
  if (!user) return
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id)
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
