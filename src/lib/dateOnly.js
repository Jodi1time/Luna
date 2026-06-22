// Cycle and journal dates are calendar days, not timestamps. Keep them in
// local time so an evening entry never rolls into tomorrow's UTC date.
export function parseDateOnly(value) {
  if (value instanceof Date) {
    const copy = new Date(value)
    copy.setHours(0, 0, 0, 0)
    return copy
  }

  const match = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export function toDateKey(value = new Date()) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = parseDateOnly(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addCalendarDays(value, days) {
  const date = parseDateOnly(value)
  date.setDate(date.getDate() + days)
  return date
}

export const todayKey = () => toDateKey(new Date())
