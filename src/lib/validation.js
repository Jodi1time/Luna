// Centralized input validators for Luna. Each returns `null` if valid,
// or a user-facing error string if not. Keep messages calm and concrete —
// the UI surfaces these inline in the same accent-tinted block used in
// Onboarding.

// Length-bounded text fields
export function validateName(name) {
  const t = (name ?? '').trim()
  if (!t) return 'Please enter your name.'
  if (t.length > 60) return 'Name is too long (max 60 characters).'
  return null
}

export function validateNote(note) {
  if ((note ?? '').length > 2000) return 'Note is too long (max 2000 characters).'
  return null
}

// Passcode (vault) — minimum strength but allow long passphrases
export function validatePasscode(pc) {
  if (!pc || pc.length < 6) return 'Passcode must be at least 6 characters.'
  if (pc.length > 256) return 'Passcode is too long.'
  return null
}

// Account password (Supabase) — Supabase enforces server-side too
export function validateAccountPassword(pw) {
  if (!pw || pw.length < 8) return 'Account password needs at least 8 characters.'
  if (pw.length > 256) return 'Password is too long.'
  return null
}

export function validateEmail(email) {
  const t = (email ?? '').trim()
  if (!t) return 'Please enter your email.'
  // Pragmatic email pattern — not RFC perfect but rejects clear garbage
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return "That doesn't look like a valid email."
  if (t.length > 254) return 'Email is too long.'
  return null
}

// BBT — clamp to medically reasonable ranges before storing
export function validateBBT(value, unit) {
  if (value === '' || value == null) return null // empty is OK, not provided
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (!Number.isFinite(n)) return 'Temperature must be a number.'
  if (unit === 'C') {
    if (n < 32 || n > 42) return 'Temperature should be between 32°C and 42°C.'
  } else {
    if (n < 90 || n > 108) return 'Temperature should be between 90°F and 108°F.'
  }
  return null
}
