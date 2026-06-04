// Single source of truth for reading moods off a log entry, since the
// data shape evolved from `mood: string|null` (legacy, single mood) to
// `moods: string[]` (current, multi-select). New writes always include
// both: `moods` is canonical and `mood` mirrors `moods[0]` so legacy
// readers that haven't been upgraded keep working with the dominant
// mood. Old cloud rows that pre-date the multi-select rollout only
// have `mood` — `moodIdsOf` reads either shape.

export function moodIdsOf(log) {
  if (!log) return []
  if (Array.isArray(log.moods)) return log.moods
  if (log.mood) return [log.mood]
  return []
}

export function hasMood(log) {
  return moodIdsOf(log).length > 0
}

export function hasAnyMood(log, ids) {
  const set = new Set(moodIdsOf(log))
  return ids.some((id) => set.has(id))
}
