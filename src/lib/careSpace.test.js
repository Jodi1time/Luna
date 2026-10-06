import { describe, it, expect } from 'vitest'
import { makeCareEntry, readCareSpace, followUpAvailable, selectedCareEntries } from './careSpace'
import { careRecap, careSummary } from './careRecap'

const concern = { id: 'skin-1', label: 'My skin', followUps: true }
const base = { id: 'entry-1', kind: 'update', date: '2026-10-06', today: '2026-10-06', concern }

describe('care space', () => {
  it('works with an existing account that has no care-space data', () => {
    expect(readCareSpace()).toEqual({ concern: null, entries: [], visitDraft: null })
  })
  it('allows a single feeling with no mandatory note', () => {
    expect(makeCareEntry({ ...base, feeling: 'Harder today' })).toMatchObject({ feeling: 'Harder today', note: '', impacts: [], concernId: 'skin-1' })
  })
  it('allows impact alone and removes duplicates and unsupported values', () => {
    expect(makeCareEntry({ ...base, impacts: ['Confidence', 'Confidence', 'unsupported'] }).impacts).toEqual(['Confidence'])
  })
  it('rejects empty updates, missing concern, impossible and future dates', () => {
    expect(() => makeCareEntry(base)).toThrow()
    expect(() => makeCareEntry({ ...base, concern: null, note: 'Note' })).toThrow()
    expect(() => makeCareEntry({ ...base, date: '2026-10-07', note: 'Note' })).toThrow()
    expect(() => makeCareEntry({ ...base, date: '2026-02-30', note: 'Note' })).toThrow()
  })
  it('keeps reflections separate from symptom/impact assertions', () => {
    const entry = makeCareEntry({ ...base, kind: 'reflection', note: '  Personal words  ', feeling: 'Harder today', impacts: ['Confidence'] })
    expect(entry).toMatchObject({ kind: 'reflection', concernId: null, concernLabel: null, feeling: '', impacts: [], note: 'Personal words' })
  })
  it('offers follow-ups only with permission and no update or dismissal today', () => {
    expect(followUpAvailable({ ...concern, followUps: false }, [], base.date)).toBe(false)
    expect(followUpAvailable(concern, [], base.date)).toBe(true)
    expect(followUpAvailable({ ...concern, dismissedOn: base.date }, [], base.date)).toBe(false)
    expect(followUpAvailable(concern, [makeCareEntry({ ...base, feeling: 'Just noting it' })], base.date)).toBe(false)
    expect(followUpAvailable(concern, [makeCareEntry({ ...base, kind: 'reflection', note: 'Personal' })], base.date)).toBe(true)
    expect(followUpAvailable({ ...concern, dismissedOn: '2026-10-05' }, [], base.date)).toBe(true)
  })
  it('excludes all moments by default, even reflections, and ignores stale selected IDs', () => {
    const entry = makeCareEntry({ ...base, kind: 'reflection', note: 'Private reflection' })
    expect(selectedCareEntries([entry])).toEqual([])
    expect(selectedCareEntries([entry], ['deleted-id'])).toEqual([])
    const text = careSummary({ recap: careRecap({}, base.date), careEntries: selectedCareEntries([entry]) })
    expect(text).not.toContain('Private reflection')
    expect(text).not.toContain('My skin')
  })
  it('includes only explicitly selected records, with dates and the user’s language', () => {
    const update = makeCareEntry({ ...base, feeling: 'Harder today', impacts: ['Work or study'], note: 'Tired after breakfast' })
    const reflection = makeCareEntry({ ...base, id: 'private', kind: 'reflection', note: 'Keep out' })
    const text = careSummary({ recap: careRecap({}, base.date), concern, careEntries: selectedCareEntries([update, reflection], [update.id]) })
    expect(text).toContain('2026-10-06 · My skin')
    expect(text).toContain('Affected: Work or study')
    expect(text).toContain('Tired after breakfast')
    expect(text).not.toContain('Keep out')
    expect(text).not.toContain('caused by')
    expect(text).toContain('0 of 7 days have entries') // care entries are not fabricated daily symptom logs
  })
})
