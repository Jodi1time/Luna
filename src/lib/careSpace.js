import { todayKey } from './dateOnly'

export const CARE_CONCERNS = ['Skin & acne', 'Hair changes', 'Energy & tiredness', 'Bleeding & cycles', 'Treatment questions', 'Something else']
export const CARE_IMPACTS = ['Everyday tasks', 'Work or study', 'Sleep', 'Confidence', 'Relationships']
export const CARE_FEELINGS = ['A little easier', 'About the same', 'Harder today', 'Just noting it']

export function readCareSpace(value) {
  return {
    concern: value?.concern || null,
    entries: Array.isArray(value?.entries) ? value.entries : [],
    visitDraft: typeof value?.visitDraft === 'string' ? value.visitDraft : null,
  }
}

export function makeCareEntry({ kind, concern, date, feeling = '', impacts = [], note = '', id, now = new Date().toISOString(), today = todayKey() }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || date > today || Number.isNaN(Date.parse(`${date}T12:00:00`)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) throw new Error('Choose today or an earlier date.')
  if (!['update', 'reflection'].includes(kind)) throw new Error('Choose an entry type.')
  if (kind === 'update' && !concern?.id) throw new Error('Choose a concern first.')
  const text = note.trim().slice(0, 1000)
  const impact = [...new Set(impacts)].filter(x => CARE_IMPACTS.includes(x))
  const status = CARE_FEELINGS.includes(feeling) ? feeling : ''
  if (kind === 'reflection' ? !text : !text && !impact.length && !status) throw new Error('Add a feeling, an impact, or a note. Any one is enough.')
  return {
    id, kind, date, createdAt: now,
    concernId: kind === 'update' ? concern.id : null,
    concernLabel: kind === 'update' ? concern.label : null,
    feeling: kind === 'update' ? status : '',
    impacts: kind === 'update' ? impact : [],
    note: text,
  }
}

export function followUpAvailable(concern, entries, today = todayKey()) {
  return Boolean(concern?.followUps && concern.dismissedOn !== today && !entries.some(e => e.kind === 'update' && e.concernId === concern.id && e.date === today))
}

export function selectedCareEntries(entries = [], selectedIds = []) {
  const ids = new Set(selectedIds)
  return entries.filter(e => ids.has(e.id)).sort((a, b) => a.date.localeCompare(b.date))
}

export function careEntryLines(entries = []) {
  return entries.flatMap(e => [
    `${e.date} · ${e.kind === 'reflection' ? 'Personal reflection (selected by me)' : e.concernLabel || 'Concern update'}`,
    ...(e.feeling ? [`How it felt: ${e.feeling}`] : []),
    ...(e.impacts?.length ? [`Affected: ${e.impacts.join(', ')}`] : []),
    ...(e.note ? [e.note] : []),
    '',
  ])
}
