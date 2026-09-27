import { describe, it, expect } from 'vitest'
import { SETUP_STAGES, STARTING_POINTS, validateSetupDetails, setupProfile } from './onboardingFlow'

describe('new onboarding', () => {
  const today = '2026-09-27'
  it('has four stages and unique starting points', () => {
    expect(SETUP_STAGES).toHaveLength(4)
    expect(new Set(STARTING_POINTS.map(s => s.id)).size).toBe(STARTING_POINTS.length)
  })
  it('allows all optional health details to remain blank', () => {
    expect(validateSetupDetails({ date: '', length: '', irregular: false }, today)).toBeNull()
    expect(setupProfile({ date: '', length: '', irregular: false, name: '', email: 'a@b.com' }).lastPeriodStart).toBeNull()
  })
  it.each(['2026-09-28', '2026-02-30', 'not a date'])('rejects invalid or future date %s', date => {
    expect(validateSetupDetails({ date, length: '', irregular: false }, today)).toBeTruthy()
  })
  it.each(['0', '14', '121', '28.5', 'abc'])('rejects invalid cycle input %s', length => {
    expect(validateSetupDetails({ date: '', length, irregular: false }, today)).toBeTruthy()
  })
  it('preserves a selected date, length and nickname', () => {
    expect(setupProfile({ date: today, length: '35', irregular: false, name: ' Jo ', email: 'a@b.com' })).toEqual({ lastPeriodStart: today, cycleLength: 35, displayName: 'Jo', account: { email: 'a@b.com' } })
  })
  it('ignores a disabled length when the user selects uncertainty', () => {
    expect(validateSetupDetails({ date: '', length: 'abc', irregular: true }, today)).toBeNull()
    expect(setupProfile({ date: '', length: 'abc', irregular: true, name: '', email: 'a@b.com' }).cycleLength).toBe(28)
  })
})
