import { useEffect, useRef, useState } from 'react'

// Smoothly animates a numeric value from the previous value toward
// `target`. Used for cycle day / cycle length / period length / cycles
// logged — anywhere a number changing should feel like an inhabitant
// of the page, not a swap. Easing is quartic-out so the number lands
// firmly rather than drifting.
export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(target ?? 0)
  const prevRef = useRef(target ?? 0)
  useEffect(() => {
    if (target == null) { setValue(0); prevRef.current = 0; return }
    const from = prevRef.current
    prevRef.current = target
    if (from === target) { setValue(target); return }
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4)
      setValue(Math.round(from + (target - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}
