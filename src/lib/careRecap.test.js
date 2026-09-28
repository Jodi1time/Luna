import { describe, it, expect } from 'vitest'
import { careRecap, careSummary } from './careRecap'

describe('care recap', () => {
  it('includes timeline notes only when explicitly supplied and distinguishes archiving from stopping', () => {
    const recap = careRecap({}, '2026-09-27')
    expect(careSummary({ recap })).toContain('No timeline notes included.')
    const text = careSummary({ recap, events: [{ date: '2026-09-26', kind: 'Possible side effect', note: 'Question to discuss' }], medications: [{ name: 'My treatment', archivedAt: '2026-09-27' }] })
    expect(text).toContain('2026-09-26 · Possible side effect: Question to discuss')
    expect(text).toContain('not a confirmed stop date')
  })
  it('uses seven inclusive calendar days, excluding empty and future records', () => {
    const recap = careRecap({
      '2026-09-19': { symptoms: ['cramps'] },
      '2026-09-20': { symptoms: ['cramps', 'cramps'] },
      '2026-09-21': {},
      '2026-09-22': { symptom_details: { noSymptoms: true } },
      '2026-09-26': { note: 'Private note' },
      '2026-09-27': { symptoms: ['headache'] },
    }, '2026-09-26')
    expect(recap.recorded).toBe(3)
    expect(recap.missing).toBe(4)
    expect(recap.symptoms).toEqual([['cramps', 1]])
  })
  it('does not put personal notes or unselected treatments into summaries', () => {
    const recap = careRecap({ '2026-09-26': { note: 'Private note' } }, '2026-09-26')
    const text = careSummary({ recap, questions: [{ text: 'What should I record?' }] })
    expect(text).not.toContain('Private note')
    expect(text).toContain('What should I record?')
    expect(text).toContain('unknown, not symptom-free')
    expect(text).toContain('None included.')
  })
  it('includes explicitly supplied treatment dates without interpreting effectiveness', () => {
    const text = careSummary({ recap: careRecap({}, '2026-09-26'), medications: [{ name: 'Recorded treatment', dose: 'As prescribed', startedAt: '2026-08-01' }] })
    expect(text).toContain('Recorded treatment · As prescribed · started 2026-08-01')
  })
})
