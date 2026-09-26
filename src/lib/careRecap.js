import { addCalendarDays, toDateKey, todayKey } from './dateOnly'

export function careRecap(logs = {}, end = todayKey()) {
  const start = toDateKey(addCalendarDays(end, -6))
  const rows = Object.entries(logs).filter(([date, entry]) => date >= start && date <= end && entry && (
    entry.symptoms?.length || entry.flow || entry.note?.trim() || entry.mood || entry.moods?.length || entry.sleep || entry.bbt || entry.mucus || entry.sex || entry.intimate || entry.symptom_details?.noSymptoms
  ))
  const counts = {}
  for (const [, entry] of rows) {
    for (const id of new Set(entry.symptoms || [])) counts[id] = (counts[id] || 0) + 1
  }
  return { start, end, recorded: rows.length, missing: 7 - rows.length, symptoms: Object.entries(counts).sort((a, b) => b[1] - a[1]) }
}

export function careSummary({ recap, labels = {}, questions = [], medications = [] }) {
  return [
    'MY PCOS CONVERSATION NOTES', `${recap.start} to ${recap.end}`, '',
    `${recap.recorded} of 7 days have entries. Unrecorded days are unknown, not symptom-free.`,
    ...recap.symptoms.map(([id, count]) => `${labels[id]?.label || id}: recorded on ${count} day${count === 1 ? '' : 's'}.`),
    '', 'TREATMENTS I HAVE RECORDED',
    ...medications.map(m => `${m.name || 'Unnamed treatment'}${m.dose ? ` · ${m.dose}` : ''}${m.startedAt ? ` · started ${m.startedAt}` : ''}`),
    ...(medications.length ? [] : ['None included.']),
    '', 'QUESTIONS I WANT TO ASK',
    ...questions.filter(q => q.text?.trim()).map(q => `• ${q.text.trim()}`),
    ...(questions.length ? [] : ['No questions added.']),
    '', 'Self-reported records for discussion, not a diagnosis or treatment recommendation.',
  ].join('\n')
}
