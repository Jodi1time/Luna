// Privacy-preserving cycle-duration model. All inference happens on-device
// from period-start dates the app already has; no logs leave the device.

const MIN_CYCLE_DAYS = 18
const MAX_CYCLE_DAYS = 120
const P80_Z = 1.281551565545

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function weightedMean(values, weights) {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (!total) return 0
  return values.reduce((sum, value, index) => sum + value * weights[index], 0) / total
}

export function cycleIntervals(starts = []) {
  const sorted = [...new Set(starts.filter(Boolean))].sort()
  const intervals = []
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = new Date(`${sorted[index - 1]}T12:00:00`)
    const current = new Date(`${sorted[index]}T12:00:00`)
    const days = Math.round((current - previous) / 86400000)
    if (days >= MIN_CYCLE_DAYS && days <= MAX_CYCLE_DAYS) intervals.push(days)
  }
  return intervals
}

// Empirical-Bayes shrinkage for the next cycle duration.
//
// The onboarding value is the user's prior, not a universal 28-day rule.
// Early observations are blended with it so one unusual cycle cannot swing
// the calendar wildly. Its influence fades as repeat cycles accumulate.
// The returned interval is predictive (how much the next cycle may vary),
// rather than a confidence interval around the estimated mean.
export function buildBayesianCycleModel(starts = [], priorCycleLength = 28) {
  const priorMean = clamp(Number(priorCycleLength) || 28, MIN_CYCLE_DAYS, MAX_CYCLE_DAYS)
  const intervals = cycleIntervals(starts).slice(-8)
  const samples = intervals.length
  const recencyWeights = intervals.map((_, index) => {
    if (samples <= 1) return 1
    return 0.35 + (0.65 * index) / (samples - 1)
  })
  const observedMean = samples ? weightedMean(intervals, recencyWeights) : priorMean
  const observedWeight = recencyWeights.reduce((sum, weight) => sum + weight, 0)

  // Starts near two cycles of influence and decays toward a light anchor.
  const priorWeight = samples === 0 ? 2.5 : Math.max(0.35, 2.5 / (1 + samples))
  const mean = (priorMean * priorWeight + observedMean * observedWeight) / (priorWeight + observedWeight)

  const priorSd = Math.max(3.5, priorMean * 0.15)
  const priorVariance = priorSd ** 2
  const observedVariance = samples > 1
    ? intervals.reduce((sum, value, index) => sum + recencyWeights[index] * ((value - observedMean) ** 2), 0) / observedWeight
    : priorVariance
  const predictiveVariance = (
    priorWeight * priorVariance + observedWeight * observedVariance
  ) / (priorWeight + observedWeight)
  // Even a perfectly regular short history cannot justify a zero-width
  // biological forecast. Two days is the minimum predictive SD.
  const predictiveSd = Math.max(2, Math.sqrt(predictiveVariance))
  const halfWidth80 = Math.max(2, Math.ceil(P80_Z * predictiveSd))
  const p10 = clamp(Math.round(mean - P80_Z * predictiveSd), MIN_CYCLE_DAYS, MAX_CYCLE_DAYS)
  const p50 = clamp(Math.round(mean), MIN_CYCLE_DAYS, MAX_CYCLE_DAYS)
  const p90 = clamp(Math.round(mean + P80_Z * predictiveSd), MIN_CYCLE_DAYS, MAX_CYCLE_DAYS)

  let conf = 'low'
  let label = 'Still learning'
  if (samples >= 4 && halfWidth80 <= 3) {
    conf = 'high'
    label = 'Well established'
  } else if (samples >= 2 && halfWidth80 <= 6) {
    conf = 'medium'
    label = 'Getting steadier'
  } else if (samples >= 2) {
    label = 'Finding your range'
  }

  const why = samples === 0
    ? 'Starting with the cycle length you entered. The range will become more personal as you log periods.'
    : samples === 1
      ? 'Blending the cycle length you entered with one completed cycle, without treating one month as a permanent pattern.'
      : conf === 'high'
        ? `Based on your last ${samples} cycles. Their timing has been steady.`
        : `Based on your last ${samples} cycles. The range leaves room for the variation your history shows.`

  return {
    mean,
    p10,
    p50,
    p90,
    predictiveSd,
    halfWidth80,
    samples,
    intervals,
    priorMean,
    conf,
    label,
    why,
  }
}

export function predictionRangeForHorizon(model, cyclesAhead = 1) {
  if (!model) return 4
  const horizon = Math.max(1, Number(cyclesAhead) || 1)
  // Uncertainty compounds when Luna is projecting through cycles the user
  // did not log. sqrt(h) is conservative without exploding linearly.
  return Math.min(21, Math.max(2, Math.ceil(model.halfWidth80 * Math.sqrt(horizon))))
}

export function buildPhaseDurationModel(cycleModel, periodLength = 5) {
  const menstrual = clamp(Math.round(Number(periodLength) || 5), 1, 10)
  const luteal = 14
  const ovulatory = 3
  const follicular = Math.max(2, cycleModel.p50 - menstrual - luteal - ovulatory)
  return {
    menstrual: { mean: menstrual, source: 'personal bleeding history' },
    follicular: { mean: follicular, source: 'cycle-duration posterior' },
    ovulatory: { mean: ovulatory, source: 'physiological prior' },
    luteal: { mean: luteal, range: [12, 16], source: 'physiological prior' },
  }
}
