// Shared data actions — export + delete — extracted so Settings and
// Privacy Dashboard can both surface them without duplication. The
// confirm dialogs and side-effect behaviour live here once.

import { signOut, supabase } from './supabase'
import { resetAnalytics } from './posthog'
import { moodIdsOf } from './moods'

// CSV-injection defuse: prepend a tab so cells beginning with
// =, +, -, @, tab, or CR aren't interpreted as a formula by Excel.
// Then quote-escape if the cell contains quotes, commas, or newlines.
function csvCell(value) {
  if (value == null || value === '') return ''
  const s = String(value)
  const defused = /^[=+\-@\t\r]/.test(s) ? `\t${s}` : s
  if (/[",\n\r]/.test(defused)) return `"${defused.replace(/"/g, '""')}"`
  return defused
}

export function exportLunaCSV(state) {
  const lines = ['Luna data export']
  lines.push(`Generated,${csvCell(new Date().toISOString())}`)
  if (state.displayName) lines.push(`Name,${csvCell(state.displayName)}`)
  lines.push(`Last period start,${csvCell(state.lastPeriodStart || '')}`)
  lines.push(`Cycle length (days),${csvCell(state.cycleLength)}`)
  lines.push(`Period length (days),${csvCell(state.periodLength)}`)
  lines.push('')
  lines.push('Date,Mood,Symptoms,Flow,BBT,BBT_Unit,Mucus,Sex,Note')
  const sortedLogs = Object.entries(state.logs || {}).sort(([a], [b]) => a.localeCompare(b))
  for (const [date, log] of sortedLogs) {
    const symptoms = (log.symptoms || []).join('; ')
    const note = (log.note || '').replace(/\n/g, ' ')
    const bbtVal = log.bbt?.value ?? ''
    const bbtUnit = log.bbt ? `°${log.bbt.unit}` : ''
    lines.push([
      csvCell(date),
      csvCell(moodIdsOf(log).join('; ')),
      csvCell(symptoms),
      csvCell(log.flow || ''),
      csvCell(bbtVal),
      csvCell(bbtUnit),
      csvCell(log.mucus || ''),
      csvCell(log.sex || ''),
      csvCell(note),
    ].join(','))
  }
  const csv = lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `luna-export-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Confirms, then deletes server-side via the Edge Function. On success
// clears the local cache and reloads the app. Idempotent on failure —
// shows an alert and leaves the user signed in.
export async function deleteLunaAccount({ session, clearLocalData }) {
  if (!window.confirm('This permanently deletes your Luna account and all your cycle data on our servers. Continue?')) return false

  if (session) {
    try {
      const { data: { session: s } } = await supabase.auth.getSession()
      if (s) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${s.access_token}`,
            'Content-Type': 'application/json',
          },
        })
        if (!res.ok) {
          const body = await res.text().catch(() => '')
          window.alert(`Account deletion failed (${res.status}). ${body}`)
          return false
        }
      }
    } catch (e) {
      window.alert(`Could not reach the server (${e?.message}). Try again in a moment.`)
      return false
    }
  }

  try { await signOut() } catch { /* signed out anyway */ }
  resetAnalytics()
  clearLocalData()
  window.location.reload()
  return true
}
