// Once-per-session entrance choreography.
//
// The staggered reveals (insight-stagger, arc draws, count-ups) are
// the magazine moment on first visit — and a wait on every visit
// after. Each screen asks `choreoOnce('calendar')` on mount: true
// means "play the full entrance", false means "render settled".
// Backed by sessionStorage so it resets when the app is genuinely
// reopened, with an in-memory fallback for private-mode iOS where
// sessionStorage writes can throw.

const played = new Set()

export function choreoOnce(key) {
  const k = `luna-choreo-${key}`
  try {
    if (sessionStorage.getItem(k)) return false
    sessionStorage.setItem(k, '1')
    return true
  } catch {
    if (played.has(k)) return false
    played.add(k)
    return true
  }
}
