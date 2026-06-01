// GradualBlur — from React Bits, trimmed for Luna's use case.
//
// Stacks N divs with progressively stronger backdrop-filter blur,
// each masked by a linear-gradient so the blur fades in (transparent
// → opaque → transparent). The composite reads as "content gradually
// dissolves into atmosphere" at whichever edge it's positioned on.
//
// We only use this above the TabBar on the five tab screens, where
// content currently meets the bar hard. A few stacked layers + an
// exponential strength curve gives the bottom of every long-scroll
// screen (Calendar, Insights, Library, Settings) a soft fade-out.
//
// Dropped from the upstream React Bits version: presets, hover
// intensity, scroll-reveal, intersection observer, responsive
// breakpoints, mathjs dep (the upstream lists it but doesn't use it).
// Kept: position, strength, height, divCount, curve, exponential.

import { useMemo } from 'react'

const CURVE_FUNCTIONS = {
  linear:    (p) => p,
  bezier:    (p) => p * p * (3 - 2 * p),
  'ease-in': (p) => p * p,
  'ease-out':(p) => 1 - Math.pow(1 - p, 2),
}

const dirFor = (pos) => ({ top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right' }[pos] || 'to bottom')

export default function GradualBlur({
  position = 'bottom',
  strength = 2,
  height = '5rem',
  divCount = 6,
  exponential = true,
  curve = 'bezier',
  opacity = 1,
  zIndex = 40,
  pointerEventsThrough = true,
  style = {},
}) {
  const layers = useMemo(() => {
    const out = []
    const increment = 100 / divCount
    const curveFn = CURVE_FUNCTIONS[curve] || CURVE_FUNCTIONS.linear
    for (let i = 1; i <= divCount; i++) {
      const progress = curveFn(i / divCount)
      const blurValue = exponential
        ? Math.pow(2, progress * 4) * 0.0625 * strength
        : 0.0625 * (progress * divCount + 1) * strength
      const p1 = Math.round((increment * i - increment) * 10) / 10
      const p2 = Math.round(increment * i * 10) / 10
      const p3 = Math.round((increment * i + increment) * 10) / 10
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10
      let gradient = `transparent ${p1}%, black ${p2}%`
      if (p3 <= 100) gradient += `, black ${p3}%`
      if (p4 <= 100) gradient += `, transparent ${p4}%`
      const direction = dirFor(position)
      out.push(
        <div key={i} style={{
          position: 'absolute', inset: 0,
          maskImage:        `linear-gradient(${direction}, ${gradient})`,
          WebkitMaskImage:  `linear-gradient(${direction}, ${gradient})`,
          backdropFilter:        `blur(${blurValue.toFixed(3)}rem)`,
          WebkitBackdropFilter:  `blur(${blurValue.toFixed(3)}rem)`,
          opacity,
        }} />
      )
    }
    return out
  }, [position, strength, divCount, curve, exponential, opacity])

  const isVertical = position === 'top' || position === 'bottom'
  const containerStyle = {
    position: 'absolute',
    [position]: 0,
    pointerEvents: pointerEventsThrough ? 'none' : 'auto',
    zIndex,
    ...(isVertical
      ? { left: 0, right: 0, height }
      : { top: 0, bottom: 0, width: height }),
    ...style,
  }
  return (
    <div aria-hidden="true" style={containerStyle}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {layers}
      </div>
    </div>
  )
}
