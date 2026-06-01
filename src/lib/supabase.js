import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseEnabled = Boolean(url && anon)

let _client = null
function getClient() {
  if (!supabaseEnabled) return null
  if (!_client) {
    _client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'luna-auth',
      },
    })
  }
  return _client
}

// Public API stays the same; all callers go through getClient() now.
// The Proxy defers the (non-trivial) createClient call until the first
// time anything actually touches `supabase.*` — keeps the SDK out of
// the eager-eval path so the splash + first paint land faster.
export const supabase = new Proxy({}, {
  get(_, prop) {
    const c = getClient()
    return c ? c[prop] : undefined
  },
})

export async function signUp(email, password) {
  if (!supabaseEnabled) throw new Error('Auth not configured')
  // emailRedirectTo: if Supabase has 'Confirm email' enabled, the user
  // gets an email with a link that brings them back here. Once they
  // click it, Supabase establishes the session and our auth state
  // listener picks it up automatically.
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : undefined
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  if (!supabaseEnabled) throw new Error('Auth not configured')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabaseEnabled) return
  await supabase.auth.signOut()
}

export async function requestPasswordReset(email) {
  if (!supabaseEnabled) throw new Error('Auth not configured')
  // Supabase appends its own URL fragment (access_token, refresh_token,
  // type=recovery, etc) to the redirectTo. We send users back to the
  // app root and let App.jsx route to the reset screen when it sees
  // either a PASSWORD_RECOVERY auth event OR type=recovery in the
  // hash on cold start.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${import.meta.env.BASE_URL || '/'}`,
  })
  if (error) throw error
}

// Update the password for the currently-authenticated user. After a
// reset-link click Supabase gives the user a temporary recovery
// session — this call sets the new password on that session.
export async function updateUserPassword(newPassword) {
  if (!supabaseEnabled) throw new Error('Auth not configured')
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function getSession() {
  if (!supabaseEnabled) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Handler is invoked with (session, event) so callers can branch on
// PASSWORD_RECOVERY / SIGNED_IN / SIGNED_OUT etc.
export function onAuthStateChange(handler) {
  if (!supabaseEnabled) return () => {}
  const { data } = supabase.auth.onAuthStateChange((event, session) => handler(session, event))
  return () => data.subscription.unsubscribe()
}
