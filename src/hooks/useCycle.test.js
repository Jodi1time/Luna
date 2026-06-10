import { describe, it, expect } from 'vitest'
import {
  detectPeriodStarts,
  allPeriodStarts,
  dynamicCycleLength,
  weightedCycleLength,
  cycleVariance,
  dynamicPeriodLength,
  getCycleDay,
  getPhaseForDay,
  getPredictions,
  detectBBTShift,
  detectOvulation,
  isOnHormonalBC,
} from './useCycle'
import { PHASES } from '../data/lunaData'

// Build a logs object from a list of [iso, partial-log] pairs.
const logsOf = (entries) => Object.fromEntries(entries)
const flow = (iso, intensity = 'Medium') => [iso, { flow: intensity }]

describe('detectPeriodStarts', () => {
  it('returns the first day of each flow stretch', () => {
    const logs = logsOf([
      flow('2026-01-01'), flow('2026-01-02'), flow('2026-01-03'),
      flow('2026-01-29'), flow('2026-01-30'),
    ])
    expect(detectPeriodStarts(logs)).toEqual(['2026-01-01', '2026-01-29'])
  })

  it('counts a SINGLE flow day after a 7+ day gap as a new period start', () => {
    // Standing rule: a backfilled single day is an intentional record,
    // not breakthrough bleeding. Do NOT re-add a 2+ consecutive rule.
    const logs = logsOf([flow('2026-01-01'), flow('2026-01-30')])
    expect(detectPeriodStarts(logs)).toEqual(['2026-01-01', '2026-01-30'])
  })

  it('does NOT start a new period for flow within 7 days of the previous flow day', () => {
    const logs = logsOf([flow('2026-01-01'), flow('2026-01-05')])
    expect(detectPeriodStarts(logs)).toEqual(['2026-01-01'])
  })

  it('ignores spotting entirely', () => {
    const logs = logsOf([flow('2026-01-01'), ['2026-01-20', { flow: 'Spotting' }]])
    expect(detectPeriodStarts(logs)).toEqual(['2026-01-01'])
  })

  it('handles empty / missing logs', () => {
    expect(detectPeriodStarts({})).toEqual([])
    expect(detectPeriodStarts(null)).toEqual([])
  })
})

describe('allPeriodStarts', () => {
  it('keeps the onboarding date when no detected start is nearby', () => {
    const logs = logsOf([flow('2026-02-01')])
    expect(allPeriodStarts(logs, '2026-01-01')).toEqual(['2026-01-01', '2026-02-01'])
  })

  it('drops the onboarding date when a detected start is within 7 days', () => {
    const logs = logsOf([flow('2026-01-03')])
    expect(allPeriodStarts(logs, '2026-01-01')).toEqual(['2026-01-03'])
  })
})

describe('cycle length math', () => {
  const starts = ['2026-01-01', '2026-01-29', '2026-02-26', '2026-03-26']  // 28-day gaps

  it('dynamicCycleLength averages the gaps', () => {
    expect(dynamicCycleLength(starts, 28)).toBe(28)
  })

  it('dynamicCycleLength falls back with fewer than 2 starts', () => {
    expect(dynamicCycleLength(['2026-01-01'], 31)).toBe(31)
  })

  it('dynamicCycleLength drops medically-implausible gaps (<18 or >60 days)', () => {
    const weird = ['2026-01-01', '2026-01-05', '2026-02-02']  // 4-day gap ignored, 28-day kept
    expect(dynamicCycleLength(weird, 99)).toBe(28)
  })

  it('weightedCycleLength weights recent cycles more heavily', () => {
    // Older cycles 35d, most recent 28d → weighted result pulls below plain mean (~31.5)
    const drift = ['2026-01-01', '2026-02-05', '2026-03-12', '2026-04-09']  // 35, 35, 28
    const { length, samples } = weightedCycleLength(drift, 28)
    expect(samples).toBe(3)
    expect(length).toBeLessThan(33)
    expect(length).toBeGreaterThanOrEqual(28)
  })

  it('weightedCycleLength falls back when all gaps are implausible', () => {
    expect(weightedCycleLength(['2026-01-01', '2026-01-03'], 28)).toEqual({ length: 28, samples: 0 })
  })
})

describe('cycleVariance', () => {
  it('labels steady 4+ cycle users high confidence', () => {
    const starts = ['2026-01-01', '2026-01-29', '2026-02-26', '2026-03-26', '2026-04-23']
    const v = cycleVariance(starts)
    expect(v.conf).toBe('high')
    expect(v.stdDev).toBeLessThan(2)
  })

  it('labels variable cycles low confidence', () => {
    const starts = ['2026-01-01', '2026-01-22', '2026-02-26', '2026-03-20', '2026-04-28']
    expect(cycleVariance(starts).conf).toBe('low')
  })

  it('labels new users (0–1 cycles) low confidence with null stdDev', () => {
    const v = cycleVariance(['2026-01-01'])
    expect(v.conf).toBe('low')
    expect(v.stdDev).toBeNull()
  })
})

describe('dynamicPeriodLength', () => {
  it('averages completed bleed stretches', () => {
    const logs = logsOf([
      flow('2026-01-01'), flow('2026-01-02'), flow('2026-01-03'), flow('2026-01-04'),  // 4 days
      flow('2026-01-29'), flow('2026-01-30'),                                          // 2 days
    ])
    expect(dynamicPeriodLength(logs, 5)).toBe(3)
  })

  it('falls back with no flow logged', () => {
    expect(dynamicPeriodLength({}, 5)).toBe(5)
  })
})

describe('getCycleDay / getPhaseForDay', () => {
  it('wraps past the cycle length instead of growing forever', () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - 40)
    const fortyDaysAgo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    expect(getCycleDay(fortyDaysAgo, 28)).toBe(13)  // 40 % 28 = 12 → day 13
  })

  it('returns null without an anchor', () => {
    expect(getCycleDay(null, 28)).toBeNull()
  })

  it('maps the standard 28/5 cycle to the right phases at boundaries', () => {
    expect(getPhaseForDay(1, 28, 5)).toBe(PHASES.menstrual)
    expect(getPhaseForDay(5, 28, 5)).toBe(PHASES.menstrual)
    expect(getPhaseForDay(6, 28, 5)).toBe(PHASES.follicular)
    expect(getPhaseForDay(12, 28, 5)).toBe(PHASES.follicular)
    expect(getPhaseForDay(13, 28, 5)).toBe(PHASES.ovulation)
    expect(getPhaseForDay(15, 28, 5)).toBe(PHASES.ovulation)
    expect(getPhaseForDay(16, 28, 5)).toBe(PHASES.luteal)
    expect(getPhaseForDay(28, 28, 5)).toBe(PHASES.luteal)
  })
})

describe('getPredictions', () => {
  it('returns null without an anchor', () => {
    expect(getPredictions(null, 28, 5, null, null)).toBeNull()
  })

  it('returns the three prediction cards with the variance confidence', () => {
    const variance = { range: 2, conf: 'high', why: 'steady' }
    const preds = getPredictions('2026-01-01', 28, 5, variance, null)
    expect(preds.map((p) => p.label)).toEqual(['Next period', 'Fertile window', 'PMS window'])
    expect(preds[0].conf).toBe('high')
    expect(preds[0].range).toBe('± 2 days')
  })

  it('inherits fertile-window confidence from ovulation fusion', () => {
    const ovulation = { day: 14, confidence: 'very-high', signals: [], spread: 0, why: 'triangulated' }
    const preds = getPredictions('2026-01-01', 28, 5, { range: 2, conf: 'medium', why: '' }, ovulation)
    expect(preds[1].conf).toBe('high')   // very-high renders as high
    expect(preds[1].why).toBe('triangulated')
  })
})

describe('detectBBTShift / detectOvulation', () => {
  // Two 28-day cycles of BBT: low (~97.2°F) before day 14, high (~97.9°F) after.
  const biphasicLogs = (() => {
    const entries = []
    const starts = ['2026-01-01', '2026-01-29']
    for (const [c, start] of starts.entries()) {
      for (let d = 1; d <= 28; d += 2) {
        const date = new Date(start + 'T00:00:00')
        date.setDate(date.getDate() + d - 1)
        const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        entries.push([iso, { bbt: { value: d <= 14 ? 97.2 : 97.9, unit: 'F' } }])
      }
    }
    return Object.fromEntries(entries)
  })()

  it('detects a biphasic shift from synthetic two-cycle data', () => {
    const shift = detectBBTShift(biphasicLogs, ['2026-01-01', '2026-01-29'], 28)
    expect(shift).not.toBeNull()
    expect(shift.shiftDelta).toBeGreaterThanOrEqual(0.3)
    expect(shift.shiftDayMedian).toBeGreaterThan(12)
    expect(shift.shiftDayMedian).toBeLessThanOrEqual(18)
  })

  it('returns null with fewer than 6 readings', () => {
    const sparse = logsOf([['2026-01-05', { bbt: { value: 97.2, unit: 'F' } }]])
    expect(detectBBTShift(sparse, ['2026-01-01', '2026-01-29'], 28)).toBeNull()
  })

  it('fuses BBT into an ovulation call with medium confidence (single signal)', () => {
    const ov = detectOvulation(biphasicLogs, ['2026-01-01', '2026-01-29'], 28)
    expect(ov).not.toBeNull()
    expect(ov.signals.map((s) => s.type)).toEqual(['bbt'])
    expect(ov.confidence).toBe('medium')
  })

  it('returns null with no signals at all', () => {
    expect(detectOvulation({}, ['2026-01-01', '2026-01-29'], 28)).toBeNull()
  })
})

describe('isOnHormonalBC', () => {
  it('flags hormonal methods and not copper IUD / none', () => {
    expect(isOnHormonalBC({ method: 'combined-pill' })).toBe(true)
    expect(isOnHormonalBC({ method: 'shot' })).toBe(true)
    expect(isOnHormonalBC({ method: 'copper-iud' })).toBe(false)
    expect(isOnHormonalBC({ method: 'none' })).toBe(false)
    expect(isOnHormonalBC(null)).toBe(false)
  })
})
