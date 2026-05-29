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
    reportError(e, { where: 'cloud.currentUser' })
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
      symptoms: row.symptoms || [],
      flow: row.flow,
      bbt: row.bbt != null ? Number(row.bbt) : null,
      mucus: row.mucus,
      sex: row.sex,
      note: row.note,
    }
  }
  return map
}

// Upsert a log row for a date. Matches the saveLog action shape.
export async function upsertLog(date, log) {
  const user = await currentUser()
  if (!user) return
  const { error } = await supabase
    .from('logs')
    .upsert({
      user_id: user.id,
      date,
      mood: log.mood ?? null,
      symptoms: log.symptoms ?? [],
      flow: log.flow ?? null,
      bbt: log.bbt ?? null,
      mucus: log.mucus ?? null,
      sex: log.sex ?? null,
      note: log.note ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' })
  if (error) throw error
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
export function fireAndForget(promise, where) {
  promise.catch((e) => {
    // eslint-disable-next-line no-console
    console.error(`[cloud] ${where} failed:`, e)
    reportError(e, { where: `cloud.${where}` })
  })
}
