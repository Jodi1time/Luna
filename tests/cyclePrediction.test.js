import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildBayesianCycleModel,
  buildPhaseDurationModel,
  cycleIntervals,
  predictionRangeForHorizon,
} from '../src/lib/cyclePrediction.js'

test('starts with the user-entered cycle as a broad prior', () => {
  const model = buildBayesianCycleModel(['2026-01-01'], 32)
  assert.equal(model.p50, 32)
  assert.equal(model.samples, 0)
  assert.equal(model.conf, 'low')
  assert.ok(model.p10 < model.p50)
  assert.ok(model.p90 > model.p50)
})

test('learns repeated personal timing without overfitting one cycle', () => {
  const oneCycle = buildBayesianCycleModel(['2026-01-01', '2026-02-05'], 28)
  assert.ok(oneCycle.p50 > 28 && oneCycle.p50 < 35)

  const steady = buildBayesianCycleModel([
    '2026-01-01', '2026-02-05', '2026-03-12', '2026-04-16', '2026-05-21',
  ], 28)
  assert.ok(steady.p50 >= 34)
  assert.ok(steady.halfWidth80 <= oneCycle.halfWidth80)
})

test('keeps long cycles as evidence instead of silently dropping them', () => {
  const starts = ['2026-01-01', '2026-03-12', '2026-05-21']
  assert.deepEqual(cycleIntervals(starts), [70, 70])
  const model = buildBayesianCycleModel(starts, 35)
  assert.ok(model.p50 > 50)
  assert.equal(model.samples, 2)
})

test('widens forecasts across missed cycles', () => {
  const model = buildBayesianCycleModel([
    '2026-01-01', '2026-01-29', '2026-02-26', '2026-03-26',
  ], 28)
  assert.ok(predictionRangeForHorizon(model, 3) > predictionRangeForHorizon(model, 1))
})

test('exposes explicit phase-duration assumptions', () => {
  const cycle = buildBayesianCycleModel(['2026-01-01'], 30)
  const phases = buildPhaseDurationModel(cycle, 5)
  assert.equal(phases.luteal.mean, 14)
  assert.equal(phases.menstrual.mean, 5)
  assert.ok(phases.follicular.mean > 0)
})

