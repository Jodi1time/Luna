import { describe, it, expect } from 'vitest'
import { getBcCycleModel, packDayForDate, addDaysToISO } from './bcCycle'

const TODAY = '2026-06-10'
const model = (birthControl) => getBcCycleModel(birthControl, { todayISO: TODAY })

describe('natural-cycle methods', () => {
  it('none and copper-iud keep the natural cycle untouched', () => {
    for (const method of ['none', 'copper-iud']) {
      const m = model({ method })
      expect(m.kind).toBe('natural')
      expect(m.showNaturalPhases).toBe(true)
      expect(m.suppressPeriodPredictions).toBe(false)
      expect(m.cover).toBeNull()
    }
  })

  it('unknown methods fall back to natural (never crash, never mislead)', () => {
    expect(model({ method: 'something-new' }).kind).toBe('natural')
    expect(model(null).kind).toBe('natural')
  })
})

describe('combined pill / patch / ring (pack model)', () => {
  it('computes pack day, week, and placebo from the pack start date', () => {
    const m = model({ method: 'combined-pill', startDate: '2026-06-01' })
    expect(m.kind).toBe('pillPack')
    expect(m.cover.bigNumber).toBe(10)          // June 1 → June 10 = pack day 10
    expect(m.cover.headline).toBe('Pack week 2')
    expect(m.showNaturalPhases).toBe(false)
    expect(m.suppressPeriodPredictions).toBe(true)
  })

  it('flags placebo week on pack days 22–28 and predicts the next pack start', () => {
    const m = model({ method: 'patch', startDate: '2026-05-18' })  // day 24
    expect(m.cover.bigNumber).toBe(24)
    expect(m.cover.headline).toBe('Placebo week')
    expect(m.nextThing.kind).toBe('pack-start')
  })

  it('predicts the next withdrawal bleed during active weeks', () => {
    const m = model({ method: 'ring', startDate: '2026-06-01' })   // day 10 → placebo in 12
    expect(m.nextThing.kind).toBe('next-placebo-week')
    expect(m.nextThing.title).toContain('12 days')
  })

  it('asks for the pack start date when missing', () => {
    const m = model({ method: 'combined-pill' })
    expect(m.missingStartDate).toBe(true)
    expect(m.nextThing).toBeNull()
  })
})

describe('shot (Depo) — the urgency tiers', () => {
  const shotModel = (weeksAgo) => {
    const d = new Date(TODAY + 'T00:00:00')
    d.setDate(d.getDate() - weeksAgo * 7)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return model({ method: 'shot', startDate: iso })
  }

  it('counts weeks since the last shot on the cover', () => {
    const m = shotModel(6)
    expect(m.kind).toBe('injection')
    expect(m.cover.bigNumber).toBe(6)
    expect(m.nextThing.urgent).toBe(false)
  })

  it('nudges (non-urgent) within 14 days of the 12-week mark', () => {
    const m = shotModel(11)
    expect(m.nextThing.kind).toBe('next-shot')
    expect(m.nextThing.urgent).toBe(false)
    expect(m.nextThing.eyebrow).toBe('a small heads-up')
  })

  it('turns urgent past 13 weeks (late window)', () => {
    const m = shotModel(14)
    expect(m.nextThing.urgent).toBe(true)
    expect(m.nextThing.eyebrow).toBe('a little late')
  })

  it('flags overdue past 15 weeks and mentions the pregnancy test', () => {
    const m = shotModel(16)
    expect(m.nextThing.urgent).toBe(true)
    expect(m.nextThing.eyebrow).toBe('overdue')
    expect(m.nextThing.body).toContain('pregnancy test')
  })
})

describe('hormonal IUD / implant / mini-pill', () => {
  it('IUD: settling copy in the first 6 months, lighter-periods copy after', () => {
    const early = model({ method: 'hormonal-iud', startDate: '2026-04-01' })
    expect(early.cover.presence).toContain('settling')
    const later = model({ method: 'hormonal-iud', startDate: '2025-06-01' })
    expect(later.cover.presence).toContain('light')
  })

  it('implant: replacement nudge inside 90 days of the 3-year mark, urgent when expired', () => {
    const fresh = model({ method: 'implant', startDate: '2026-01-01' })
    expect(fresh.nextThing).toBeNull()
    const expiring = model({ method: 'implant', startDate: '2023-07-15' })  // ~35 months in
    expect(expiring.nextThing).not.toBeNull()
    const expired = model({ method: 'implant', startDate: '2023-01-01' })
    expect(expired.nextThing.urgent).toBe(true)
    expect(expired.nextThing.eyebrow).toBe('overdue')
  })

  it('mini-pill: no number, no schedule — her bleeding is her own', () => {
    const m = model({ method: 'mini-pill' })
    expect(m.cover.bigNumber).toBeNull()
    expect(m.nextThing.kind).toBe('pattern-discovery')
    expect(m.suppressPeriodPredictions).toBe(true)
  })
})

describe('calendar helpers', () => {
  it('packDayForDate cycles 1..28 and projects backwards', () => {
    expect(packDayForDate('2026-06-01', '2026-06-01')).toBe(1)
    expect(packDayForDate('2026-06-01', '2026-06-22')).toBe(22)   // placebo begins
    expect(packDayForDate('2026-06-01', '2026-06-28')).toBe(28)
    expect(packDayForDate('2026-06-01', '2026-06-29')).toBe(1)    // next pack
    expect(packDayForDate('2026-06-01', '2026-05-31')).toBe(28)   // backwards projection
    expect(packDayForDate(null, '2026-06-01')).toBeNull()
  })

  it('addDaysToISO crosses month and year boundaries in local time', () => {
    expect(addDaysToISO('2026-03-18', 84)).toBe('2026-06-10')     // the 12-week shot window
    expect(addDaysToISO('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysToISO(null, 5)).toBeNull()
  })
})
