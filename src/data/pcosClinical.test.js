import { describe, it, expect } from 'vitest'
import { homaIR, homaIRReading } from './pcosClinical'

describe('HOMA-IR', () => {
  it('computes the mg/dL formula (glucose × insulin / 405)', () => {
    expect(homaIR({ glucose: 90, insulin: 9 })).toBe(2)
  })

  it('computes the mmol/L formula (glucose × insulin / 22.5)', () => {
    expect(homaIR({ glucose: 5, glucoseUnit: 'mmol/L', insulin: 9 })).toBe(2)
  })

  it('rejects junk input instead of producing a fake score', () => {
    expect(homaIR({ glucose: 0, insulin: 9 })).toBeNull()
    expect(homaIR({ glucose: 'abc', insulin: 9 })).toBeNull()
    expect(homaIR({ glucose: 90, insulin: -2 })).toBeNull()
  })

  it('maps scores to the documented interpretation bands', () => {
    expect(homaIRReading(1.5).kind).toBe('ok')
    expect(homaIRReading(2.2).kind).toBe('borderline')
    expect(homaIRReading(3.4).kind).toBe('flag')
    expect(homaIRReading(null)).toBeNull()
  })
})
