import { describe, expect, it } from 'vitest'
import {
  buildBayesianCycleModel,
  buildPhaseDurationModel,
  cycleIntervals,
  predictionRangeForHorizon,
} from '../src/lib/cyclePrediction.js'

describe('Bayesian cycle prediction', () => {
  it('starts with the user-entered cycle as a broad prior', () => {
    const model = buildBayesianCycleModel(['2026-01-01'], 32)
    expect(model.p50).toBe(32)
    expect(model.samples).toBe(0)
    expect(model.conf).toBe('low')
    expect(model.p10).toBeLessThan(model.p50)
    expect(model.p90).toBeGreaterThan(model.p50)
  })

  it('learns repeated personal timing without overfitting one cycle', () => {
    const oneCycle = buildBayesianCycleModel(['2026-01-01', '2026-02-05'], 28)
    expect(oneCycle.p50).toBeGreaterThan(28)
    expect(oneCycle.p50).toBeLessThan(35)

    const steady = buildBayesianCycleModel([
      '2026-01-01', '2026-02-05', '2026-03-12', '2026-04-16', '2026-05-21',
    ], 28)
    expect(steady.p50).toBeGreaterThanOrEqual(34)
    expect(steady.halfWidth80).toBeLessThanOrEqual(oneCycle.halfWidth80)
  })

  it('keeps long cycles as evidence instead of silently dropping them', () => {
    const starts = ['2026-01-01', '2026-03-12', '2026-05-21']
    expect(cycleIntervals(starts)).toEqual([70, 70])
    const model = buildBayesianCycleModel(starts, 35)
    expect(model.p50).toBeGreaterThan(50)
    expect(model.samples).toBe(2)
  })

  it('widens forecasts across missed cycles', () => {
    const model = buildBayesianCycleModel([
      '2026-01-01', '2026-01-29', '2026-02-26', '2026-03-26',
    ], 28)
    expect(predictionRangeForHorizon(model, 3)).toBeGreaterThan(predictionRangeForHorizon(model, 1))
  })

  it('exposes explicit phase-duration assumptions', () => {
    const cycle = buildBayesianCycleModel(['2026-01-01'], 30)
    const phases = buildPhaseDurationModel(cycle, 5)
    expect(phases.luteal.mean).toBe(14)
    expect(phases.menstrual.mean).toBe(5)
    expect(phases.follicular.mean).toBeGreaterThan(0)
  })
})
