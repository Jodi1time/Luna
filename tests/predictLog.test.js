import { describe, expect, it } from 'vitest'
import { predictLogForCycleDay } from '../src/hooks/useCycle.js'

// Three period starts, 28 days apart — the last one anchors the
// current cycle, so days 24 of the two earlier cycles are the history.
const STARTS = ['2026-04-26', '2026-05-24', '2026-06-21']

describe('predictLogForCycleDay', () => {
  it('returns null without at least two completed cycles', () => {
    expect(predictLogForCycleDay({}, ['2026-06-21'], 24)).toBeNull()
    expect(predictLogForCycleDay({}, ['2026-05-24', '2026-06-21'], 24)).toBeNull()
  })

  it('returns null when past cycles have no logs near that day', () => {
    expect(predictLogForCycleDay({}, STARTS, 24)).toBeNull()
  })

  it('keeps only signals that repeated across cycles', () => {
    const logs = {
      // day 24 of each completed cycle
      '2026-05-19': { moods: ['tired', 'low'], symptoms: ['cramps'], sleep: 'Poor' },
      '2026-06-16': { moods: ['tired'], symptoms: ['cramps', 'fatigue'], sleep: 'Poor' },
    }
    const p = predictLogForCycleDay(logs, STARTS, 24)
    expect(p.moods).toEqual(['tired'])       // 'low' appeared once — dropped
    expect(p.symptoms).toEqual(['cramps'])   // 'fatigue' appeared once — dropped
    expect(p.sleep).toBe('Poor')
    expect(p.flow).toBeNull()
    expect(p.cyclesSampled).toBe(2)
  })

  it('falls back to a ±1 day neighbour when the exact day is empty', () => {
    const logs = {
      '2026-05-18': { symptoms: ['cramps'] }, // day 23 of cycle one
      '2026-06-16': { symptoms: ['cramps'] }, // day 24 of cycle two
    }
    const p = predictLogForCycleDay(logs, STARTS, 24)
    expect(p.symptoms).toEqual(['cramps'])
  })

  it('never lets one loud day become "your usual"', () => {
    const logs = {
      '2026-05-19': { moods: ['frustrated'], symptoms: ['headache'] },
      '2026-06-16': { moods: ['calm'], symptoms: ['bloat'] },
    }
    expect(predictLogForCycleDay(logs, STARTS, 24)).toBeNull()
  })
})
