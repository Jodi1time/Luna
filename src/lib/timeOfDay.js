// Time-of-day vibe: a soft color wash over the phone-frame that
// changes the room the user is in based on the hour. Off in
// Settings → "Time of day vibe" if the user prefers a steady look.

export function getTimeOfDay(date = new Date()) {
  const h = date.getHours()
  if (h >= 5  && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

// Soft tint applied as a mix-blend-mode: multiply overlay so the
// existing cream paper / phase atmosphere reads through it. Picked
// for warmth, not saturation — these should feel like daylight
// shifting, not theming.
export const TIME_OF_DAY_TINTS = {
  morning:   { color: '#F4B95F', opacity: 0.07, label: 'Morning' },   // warm golden
  afternoon: { color: null,      opacity: 0,    label: 'Afternoon' }, // no tint — the default room
  evening:   { color: '#D86E2C', opacity: 0.09, label: 'Evening' },   // warm orange
  night:     { color: '#3D4A7A', opacity: 0.16, label: 'Night' },     // cool blue-violet
}

// Quiet phrase for the Settings row + the auto-detected hint.
export function timeOfDayLabel(t = getTimeOfDay()) {
  return TIME_OF_DAY_TINTS[t]?.label || 'Auto'
}
