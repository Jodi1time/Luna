// Generates Apple touch startup images for Luna — the launch screen
// shown on iOS PWAs between home-screen tap and HTML parse. Without
// these, iOS shows a generic black/white flash on cold start.
//
// Run with: node scripts/gen-splash.mjs
// Output: public/splash/iphone-{w}x{h}.png (one per common device size)

import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'public', 'splash')

mkdirSync(OUT_DIR, { recursive: true })

// Device dimensions covering current and recent iPhones (portrait).
const SIZES = [
  // iPhone 16 Pro Max
  { w: 1320, h: 2868, label: 'iphone-16-pro-max' },
  // iPhone 15/14 Pro Max + 15/14 Plus + 16/16 Plus
  { w: 1290, h: 2796, label: 'iphone-15-pro-max' },
  // iPhone 13 Pro Max / 12 Pro Max
  { w: 1284, h: 2778, label: 'iphone-13-pro-max' },
  // iPhone 16 Pro
  { w: 1206, h: 2622, label: 'iphone-16-pro' },
  // iPhone 15/14 Pro
  { w: 1179, h: 2556, label: 'iphone-15-pro' },
  // iPhone 14/13/12 (and Pro non-Max)
  { w: 1170, h: 2532, label: 'iphone-14' },
  // iPhone 13/12 mini / 11 Pro / X / XS
  { w: 1125, h: 2436, label: 'iphone-13-mini' },
  // iPhone 11 Pro Max / XS Max
  { w: 1242, h: 2688, label: 'iphone-11-pro-max' },
  // iPhone 11 / XR
  { w: 828,  h: 1792, label: 'iphone-11' },
  // iPhone 8 Plus
  { w: 1242, h: 2208, label: 'iphone-8-plus' },
  // iPhone SE 2nd/3rd gen / 8 / 7 / 6s
  { w: 750,  h: 1334, label: 'iphone-se' },
]

const BG = '#F4EFE5'
const ACCENT = '#C84E2E'
const MUTED = 'rgba(26,19,16,0.55)'

function svg(w, h) {
  // Scale type sizes to match the on-screen splash regardless of device size.
  // Reference width: 1170px → 64px "Luna." → ratio 0.0547. Subhead ratio: 0.01453.
  const markFontSize = Math.round(w * 0.0547)
  const subFontSize  = Math.round(w * 0.01453)
  const subMargin    = Math.round(w * 0.013)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="${BG}"/>
  <g text-anchor="middle">
    <text x="${w/2}" y="${h/2}"
          font-family="Newsreader, Georgia, serif" font-style="italic" font-weight="300"
          font-size="${markFontSize}" letter-spacing="-2.5"
          fill="${ACCENT}">Luna.</text>
    <text x="${w/2}" y="${h/2 + markFontSize/2 + subMargin + subFontSize}"
          font-family="Newsreader, Georgia, serif" font-style="italic" font-weight="400"
          font-size="${subFontSize}"
          fill="${MUTED}">with you, always.</text>
  </g>
</svg>`
}

for (const { w, h, label } of SIZES) {
  const svgBuffer = Buffer.from(svg(w, h))
  const filename = `iphone-${w}x${h}.png`
  await sharp(svgBuffer).png().toFile(resolve(OUT_DIR, filename))
  console.log(`✓ ${filename}  (${label})`)
}
console.log(`Wrote ${SIZES.length} splash images to public/splash/`)
