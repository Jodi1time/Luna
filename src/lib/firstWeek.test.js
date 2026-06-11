import { describe, it, expect } from 'vitest'
import { getFirstWeekMoment } from './firstWeek'

const base = {
  joinedAt: '2026-06-01',
  cycleDay: 11,
  cycleLength: 28,
  logs: {},
  seen: {},
}
const moment = (over) => getFirstWeekMoment({ ...base, ...over })
const moodLog = { moods: ['calm'] }

describe('getFirstWeekMoment', () => {
  it('never fires for users without a joinedAt (everyone pre-arc)', () => {
    expect(moment({ joinedAt: null, todayISO: '2026-06-02' })).toBeNull()
  })

  it('stays quiet on day 1 and after day 9', () => {
    expect(moment({ todayISO: '2026-06-01', logs: { '2026-06-01': moodLog } })).toBeNull()
    expect(moment({ todayISO: '2026-06-10', logs: { '2026-06-01': moodLog } })).toBeNull()
  })

  it('day 2: observation — but only once she has logged something', () => {
    expect(moment({ todayISO: '2026-06-02' })).toBeNull()
    const m = moment({ todayISO: '2026-06-02', logs: { '2026-06-01': moodLog } })
    expect(m.id).toBe('observation')
    expect(m.eyebrow).toBe('two days in')
    expect(m.cta).toBe('talk')
  })

  it('observation counts only days since joining', () => {
    const m = moment({
      todayISO: '2026-06-03',
      logs: { '2026-05-20': moodLog, '2026-06-01': moodLog, '2026-06-02': { flow: 'Light' } },
    })
    expect(m.text).toContain('2 days')
    expect(m.eyebrow).toBe('three days in')
  })

  it('days 4-5: the wheel, with her real cycle position', () => {
    const m = moment({ todayISO: '2026-06-04' })
    expect(m.id).toBe('wheel')
    expect(m.cta).toBe('wheel')
    expect(m.text).toContain('day 11 of about 28')
  })

  it('wheel copes without a cycle day', () => {
    const m = moment({ todayISO: '2026-06-05', cycleDay: null })
    expect(m.id).toBe('wheel')
    expect(m.text).not.toContain('null')
  })

  it('day 6 is a quiet gap — no moment', () => {
    expect(moment({ todayISO: '2026-06-06', logs: { '2026-06-01': moodLog } })).toBeNull()
  })

  it('days 7-9: the letter, summarising the week truthfully', () => {
    const m = moment({
      todayISO: '2026-06-07',
      logs: { '2026-06-02': moodLog, '2026-06-04': { symptoms: ['cramps'] } },
    })
    expect(m.id).toBe('letter')
    expect(m.eyebrow).toBe('a week in')
    expect(m.text).toContain('2 days')
    expect(m.text).toContain('how you felt')
    expect(m.text).toContain('what your body said')
  })

  it('letter still lands with zero logs — no fake stats', () => {
    const m = moment({ todayISO: '2026-06-08' })
    expect(m.id).toBe('letter')
    expect(m.text).not.toContain('0 days')
  })

  it('a moment shows all day, then never again', () => {
    const seenToday = moment({ todayISO: '2026-06-04', seen: { wheel: '2026-06-04' } })
    expect(seenToday?.id).toBe('wheel')
    const seenYesterday = moment({ todayISO: '2026-06-05', seen: { wheel: '2026-06-04' } })
    expect(seenYesterday).toBeNull()
  })

  it('skipped moments are never caught up on', () => {
    // She opens on day 5 having missed days 2-3: she gets the wheel,
    // not the observation.
    const m = moment({ todayISO: '2026-06-05', logs: { '2026-06-01': moodLog } })
    expect(m.id).toBe('wheel')
  })
})
