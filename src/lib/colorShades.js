// Generate a small set of harmonious shades from a base hex color.
// Used by the backdrop colour picker to constrain choices to shades
// of the user's chosen paper — locks hue + roughly preserves
// saturation, varies lightness across an editorial range. The result
// is a palette that ALWAYS reads as a family of the paper, so the
// backdrop never clashes with the page.

function hexToRgb(hex) {
  const h = (hex || '#FFFFFF').replace('#', '')
  const full = h.length === 3
    ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    : h.slice(0, 6)
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ]
}

function rgbToHex(r, g, b) {
  const to = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2
  if (max === min) { h = 0; s = 0 }
  else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }
  return [h, s, l]
}

function hslToRgb(h, s, l) {
  if (s === 0) return [l, l, l]
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    hue2rgb(p, q, h + 1 / 3),
    hue2rgb(p, q, h),
    hue2rgb(p, q, h - 1 / 3),
  ]
}

// Returns N hex shades, sorted darkest → lightest, of the input
// color's hue. Lightness sweeps from ~22% to ~80%. We bump up
// saturation a touch for very neutral inputs (cream, off-white)
// so the shades don't degenerate into a row of grays.
export function generateShades(hex, count = 6) {
  const [r, g, b] = hexToRgb(hex)
  const [h, sRaw] = rgbToHsl(r, g, b)
  const s = Math.max(sRaw, 0.16)
  const lMin = 0.22
  const lMax = 0.80
  const shades = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const l = lMin + (lMax - lMin) * t
    const [nr, ng, nb] = hslToRgb(h, s, l)
    shades.push(rgbToHex(nr, ng, nb))
  }
  return shades
}
