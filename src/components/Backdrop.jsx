import { lazy, Suspense, useEffect, useRef } from 'react'
import useLuna from '../store/useLuna'
import { T } from '../data/theme'
import { generateShades } from '../lib/colorShades'

// Silk is the only backdrop that pulls in three.js + @react-three/fiber
// (~200KB gzipped). Lazy-load so the cost only lands on users who
// actually pick this atmosphere.
const Silk = lazy(() => import('./Silk'))

// Galaxy uses ogl (~40KB gzipped) — much lighter than three.js but
// still a real dep, so it's lazy-loaded the same way.
const Galaxy = lazy(() => import('./Galaxy'))

// ColorBends — multi-colour shader (three.js, shares the chunk with
// Silk). Lazy-loaded.
const ColorBends = lazy(() => import('./ColorBends'))

// ── Backdrop registry ─────────────────────────────────────────
// Each kind is a self-contained atmosphere that fills the stage.
// All are animated, all honor prefers-reduced-motion via the CSS
// `.backdrop-` classes (kept in sync with src/index.css keyframes).
// `accent` is the phase / theme color the backdrop tints itself by;
// `subtle` shrinks + lowers opacity for inner-tab use (Home goes
// without `subtle` so the atmosphere reads strongest where the user
// lives most).

export const BACKDROPS = [
  { id: 'blob',    label: 'Blob' },
  { id: 'moons',   label: 'Moons' },
  { id: 'aurora',  label: 'Aurora' },
  { id: 'silk',    label: 'Silk' },
  { id: 'petals',  label: 'Petals' },
  { id: 'galaxy',  label: 'Galaxy' },
  { id: 'bends',   label: 'Bends' },
]

// Hex (#RRGGBB) → hue degrees (0-360). Used to tint Galaxy's stars
// in the user's current phase color via uHueShift. Naive HSL via
// max/min channel math is plenty here — galaxy's hue is a vibe knob,
// not a precise palette match.
function hexToHue(hex) {
  const h = (hex || '#C84E2E').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d === 0) return 0
  let hue
  if (max === r)      hue = ((g - b) / d) % 6
  else if (max === g) hue = (b - r) / d + 2
  else                hue = (r - g) / d + 4
  hue = Math.round(hue * 60)
  return hue < 0 ? hue + 360 : hue
}

// ── Blob (default) ───────────────────────────────────────────
// Preserves the existing breathing-blob behavior — same CSS class,
// same morph animation. Just wrapped in a Backdrop for consistency.
function BlobBackdrop({ accent, subtle, children }) {
  return (
    <div className={`blob-stage${subtle ? ' subtle' : ''}`} aria-hidden="true">
      <div className="breathing-blob" style={{ '--phase-color': accent }} />
      {children}
    </div>
  )
}

// ── Moons (Luna brand-aligned) ───────────────────────────────
// A small lunar sky: 8 moons at fixed scattered positions across
// the full phone frame, each at its own phase (new → waxing → full →
// waning → new). Phase is encoded by the position of the radial-
// gradient's light source: at 50% the moon is fully lit (full moon);
// pushed off to one side it becomes gibbous, then quarter, then a
// thin crescent. Each moon also has a soft halo behind it so it
// reads as luminous, not flat. Motion is a slow vertical drift
// only — moons don't visibly rotate in real life.
//
// `phase` here is the unit-circle position 0..1:
//   0    = new (almost dark)
//   0.25 = first quarter (right half lit)
//   0.5  = full (uniformly lit)
//   0.75 = last quarter (left half lit)
//   1    = back to new
function phaseToLightCx(phase) {
  // Symmetric around 0.5 (full). Goes outside [0,100] for crescents
  // so the gradient's bright spot is *off the disc* and only the
  // moon's edge catches light.
  if (phase < 0.5) return 50 + 70 * (0.5 - phase) * 2  // waxing: light moves right
  return 50 - 70 * (phase - 0.5) * 2                    // waning: light moves left
}
function phaseToLitness(phase) {
  // 1 at full, ~0.25 at new (smooth sine curve). Keeps new moons
  // visible enough to register as quiet circles, never invisible.
  return Math.max(0.25, Math.sin(Math.PI * phase))
}

function Moon({ size, top, left, phase: initialPhase, glow, dur, accent, subtle, index }) {
  // Phase-morph animation. Each moon slowly cycles through every
  // phase (new → waxing crescent → first quarter → gibbous → full →
  // gibbous → last quarter → waning crescent → new), 130 seconds per
  // full cycle. Each moon starts at its own `initialPhase`, so the
  // sky always shows varied phases at once. The actual updates run
  // via rAF on DOM refs (no React re-renders) — cheap even with 8
  // moons animating in parallel.
  const gradientRef = useRef(null)
  const bodyRef     = useRef(null)
  const haloRef     = useRef(null)
  useEffect(() => {
    let raf
    const cycleMs = 130000  // 130s ≈ a slow, almost-monthly feel
    const start = performance.now()
    const loop = (now) => {
      const t = ((now - start) / cycleMs) % 1
      const currentPhase = (initialPhase + t) % 1
      const lightCx = phaseToLightCx(currentPhase)
      const litness = phaseToLitness(currentPhase)
      if (gradientRef.current) gradientRef.current.setAttribute('cx', `${lightCx}%`)
      if (bodyRef.current)     bodyRef.current.style.opacity = String(litness * (subtle ? 0.78 : 0.95))
      if (haloRef.current) {
        const halo = litness * (subtle ? 0.32 : 0.5) * glow
        haloRef.current.style.opacity = String(halo)
        haloRef.current.style.setProperty('--moon-glow-base', String(halo))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [initialPhase, subtle, glow])

  // Initial paint values (frame 0). The rAF loop overrides these on
  // the next frame.
  const lightCx     = phaseToLightCx(initialPhase)
  const litness     = phaseToLitness(initialPhase)
  const haloOpacity = litness * (subtle ? 0.32 : 0.5) * glow
  const bodyOpacity = litness * (subtle ? 0.78 : 0.95)
  return (
    <div style={{
      position: 'absolute',
      top, left,
      width: size, height: size,
      transform: 'translate(-50%, -50%)',
    }}>
      <div style={{
        position: 'relative',
        width: '100%', height: '100%',
        animation: `moonDrift ${dur}s ease-in-out infinite`,
        animationDelay: `${index * -7}s`,
      }}>
        <div ref={haloRef} style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: `${100 + glow * 80}%`,
          height: `${100 + glow * 80}%`,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${accent} 0%, transparent 60%)`,
          filter: 'blur(6px)',
          ['--moon-glow-base']: haloOpacity,
          opacity: haloOpacity,
          animation: `moonGlow ${dur * 0.35}s ease-in-out infinite`,
          animationDelay: `${index * -3}s`,
        }} />
        <svg viewBox="0 0 64 64" width="100%" height="100%"
          ref={bodyRef}
          style={{ position: 'relative', opacity: bodyOpacity, display: 'block' }}>
          <defs>
            <radialGradient ref={gradientRef} id={`m-${index}`} cx={`${lightCx}%`} cy="44%" r="0.62">
              <stop offset="0%"   stopColor={accent} stopOpacity="1"   />
              <stop offset="55%"  stopColor={accent} stopOpacity="0.55" />
              <stop offset="100%" stopColor={accent} stopOpacity="0"   />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill={`url(#m-${index})`} />
        </svg>
      </div>
    </div>
  )
}

function MoonsBackdrop({ accent, subtle }) {
  // 8 moons scattered across the whole phone frame. Sizes vary from
  // tiny accent specks (22px) to a big full moon (96px). Each has
  // its own lunar phase so the sky reads as a tiny month at once.
  // `glow` is a 0..1.5 multiplier on the halo size; full moons get
  // bigger halos than new moons.
  const k = subtle ? 0.78 : 1.0
  const moons = [
    // Big near-full moon — top-right anchor
    { size: 96 * k, top: '20%', left: '74%', phase: 0.5,  glow: 1.4, dur: 72 },
    // Medium waxing gibbous — middle-left
    { size: 64 * k, top: '46%', left: '18%', phase: 0.35, glow: 1.1, dur: 58 },
    // Small waxing crescent — top-left
    { size: 38 * k, top: '14%', left: '22%', phase: 0.15, glow: 0.8, dur: 46 },
    // Small first quarter — bottom-middle
    { size: 48 * k, top: '76%', left: '48%', phase: 0.25, glow: 1.0, dur: 52 },
    // Tiny new-ish — right edge, mid-screen
    { size: 26 * k, top: '36%', left: '92%', phase: 0.08, glow: 0.7, dur: 40 },
    // Small waning gibbous — bottom-right
    { size: 44 * k, top: '70%', left: '84%', phase: 0.68, glow: 1.0, dur: 50 },
    // Tiny full speck — top-middle, like a faraway moon
    { size: 22 * k, top: '8%',  left: '52%', phase: 0.5,  glow: 0.6, dur: 38 },
    // Medium waning crescent — bottom-left
    { size: 56 * k, top: '86%', left: '14%', phase: 0.85, glow: 1.1, dur: 62 },
  ]
  return (
    <div className={`blob-stage${subtle ? ' subtle' : ''}`} aria-hidden="true"
      style={{
        // Override blob-stage's centered 440px box: moons need the
        // whole phone frame to feel scattered, not crowded into a
        // central halo.
        width: '100%', height: '100%', top: 0, left: 0,
        transform: 'none',
        overflow: 'hidden',
      }}>
      {moons.map((m, i) => (
        <Moon key={i} {...m} accent={accent} subtle={subtle} index={i} />
      ))}
    </div>
  )
}

// ── Aurora (gradient wash) ───────────────────────────────────
// Three large radial gradients drifting independently. Heavy blur so
// it reads as a single mesh, not three separate circles. Color shifts
// slowly through the phase accent and softer complements.
function AuroraBackdrop({ accent, subtle }) {
  const radii = [
    { color: accent,           top: '20%', left: '30%', dur: 28, delay: 0 },
    { color: accent + 'AA',    top: '60%', left: '70%', dur: 34, delay: -8 },
    { color: accent + '88',    top: '50%', left: '20%', dur: 40, delay: -16 },
  ]
  return (
    <div className={`blob-stage${subtle ? ' subtle' : ''}`} aria-hidden="true"
      style={{
        // override blob-stage size for aurora — it fills the whole stage,
        // not just a center circle.
        width: '100%', height: '100%', top: 0, left: 0,
        transform: 'none',
      }}>
      {radii.map((r, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: r.top, left: r.left,
          width: subtle ? 280 : 380,
          height: subtle ? 280 : 380,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${r.color} 0%, ${r.color}00 70%)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(60px) saturate(1.1)',
          animation: `auroraDrift ${r.dur}s ease-in-out infinite`,
          animationDelay: `${r.delay}s`,
          opacity: subtle ? 0.45 : 0.65,
          mixBlendMode: 'multiply',
        }} />
      ))}
    </div>
  )
}

// ── Petals (falling petals) ──────────────────────────────────
// Soft petals drift down + sideways from above the visible area,
// continuously. Each petal has its own duration + horizontal drift
// so the motion never repeats predictably.
function PetalsBackdrop({ accent, subtle }) {
  // 14 petals, scattered across the horizontal span with varied
  // sizes (9-17px), durations (14-26s), and lateral drifts (-26 to
  // +26px). Negative animation delays stagger them so the stream
  // is full from the first frame instead of arriving in waves.
  const petals = [
    { left: '8%',  size: 14, dur: 14, drift: 24,  delay: 0 },
    { left: '18%', size: 12, dur: 17, drift: -14, delay: -2 },
    { left: '24%', size: 10, dur: 22, drift: 18,  delay: -8 },
    { left: '32%', size: 13, dur: 18, drift: -20, delay: -3 },
    { left: '40%', size: 16, dur: 22, drift: 14,  delay: -7 },
    { left: '46%', size: 11, dur: 25, drift: -10, delay: -13 },
    { left: '52%', size: 13, dur: 19, drift: 18,  delay: -14 },
    { left: '58%', size: 12, dur: 16, drift: -22, delay: -11 },
    { left: '64%', size: 15, dur: 23, drift: 16,  delay: -6 },
    { left: '70%', size: 9,  size2: 14, dur: 20, drift: -12, delay: -1 },
    { left: '76%', size: 15, dur: 20, drift: 20,  delay: -5 },
    { left: '82%', size: 11, dur: 26, drift: 26,  delay: -10 },
    { left: '88%', size: 13, dur: 21, drift: -18, delay: -4 },
    { left: '94%', size: 10, dur: 24, drift: -16, delay: -9 },
  ]
  return (
    <div className={`blob-stage${subtle ? ' subtle' : ''}`} aria-hidden="true"
      style={{
        width: '100%', height: '100%', top: 0, left: 0,
        transform: 'none',
        overflow: 'hidden',
      }}>
      {petals.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: '-30px',
          left: p.left,
          width: p.size, height: p.size * 1.4,
          animation: `petalDrift ${p.dur}s linear infinite`,
          animationDelay: `${p.delay}s`,
          opacity: subtle ? 0.35 : 0.5,
          ['--petal-drift']: `${p.drift}px`,
        }}>
          <svg viewBox="0 0 14 20" width="100%" height="100%">
            <ellipse cx="7" cy="10" rx="4" ry="9" fill={accent} opacity="0.7" />
            <ellipse cx="7" cy="10" rx="2" ry="9" fill={accent} opacity="0.4" />
          </svg>
        </div>
      ))}
    </div>
  )
}

// ── ColorBends (multi-colour shader from React Bits) ────────
// Three.js fragment shader blending a palette of soft colours into
// flowing bands. Palette is derived from the user's chosen paper —
// we generate a small set of shades + the page accent so the bends
// always read in the same colour family as the rest of the app.
function ColorBendsBackdrop({ accent, subtle }) {
  // 5 shades of the accent + accent itself → 6 colour palette in
  // the same hue family. Caps at 8 (shader limit).
  const palette = [accent, ...generateShades(accent, 5)]
  return (
    <div className={`blob-stage${subtle ? ' subtle' : ''}`} aria-hidden="true"
      style={{
        width: '100%', height: '100%', top: 0, left: 0,
        transform: 'none',
        overflow: 'hidden',
        opacity: subtle ? 0.22 : 0.34,
      }}>
      <Suspense fallback={null}>
        <ColorBends
          colors={palette}
          rotation={90}
          autoRotate={2}
          speed={0.18}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={0}
          parallax={0}
          noise={0.12}
          iterations={1}
          intensity={1.3}
          bandWidth={7}
          transparent
        />
      </Suspense>
    </div>
  )
}

// ── Silk (WebGL shader from React Bits) ─────────────────────
// Stock Silk from React Bits: a WebGL plane running a fragment
// shader that combines sine-warped UVs with a noise term to produce
// the flowing silk pattern. Wrapped in a positioned div with the
// blob-stage's full-screen sizing override, plus a Suspense
// fallback so the page isn't blank while three.js loads.
//
// Props tuned for Luna's editorial register:
//   speed 1.6           — meditative, not vibrating
//   scale 1             — stock
//   color = phase accent — silk shimmers in today's hue
//   noiseIntensity 1.2  — slightly softer than the React Bits demo
//   rotation 0
//
// The Canvas reduces to a 0.6× opacity overlay so it blends with
// the cream paper / theme background instead of replacing it.
function SilkBackdrop({ accent, subtle }) {
  return (
    <div className={`blob-stage${subtle ? ' subtle' : ''}`} aria-hidden="true"
      style={{
        width: '100%', height: '100%', top: 0, left: 0,
        transform: 'none',
        overflow: 'hidden',
        opacity: subtle ? 0.10 : 0.16,
      }}>
      <Suspense fallback={null}>
        <Silk
          speed={10}
          scale={1}
          color={accent}
          noiseIntensity={1.0}
          rotation={0}
        />
      </Suspense>
    </div>
  )
}

// ── Galaxy (WebGL star field from React Bits) ────────────────
// Dialed dramatically down from the React Bits demo for Luna. The
// demo's defaults read as sci-fi star field — too loud for a cream
// female-coded interface. Tuning targets a soft "dust in light"
// atmosphere instead: very low density, tiny flares, gentle twinkle,
// minimal saturation, wrapper at low opacity. Pair with phase color
// (or backdrop.accent override) via hexToHue.
function GalaxyBackdrop({ accent, subtle }) {
  return (
    <div className={`blob-stage${subtle ? ' subtle' : ''}`} aria-hidden="true"
      style={{
        width: '100%', height: '100%', top: 0, left: 0,
        transform: 'none',
        overflow: 'hidden',
        opacity: subtle ? 0.08 : 0.14,
      }}>
      <Suspense fallback={null}>
        <Galaxy
          transparent
          mouseInteraction={false}
          mouseRepulsion={false}
          density={subtle ? 0.35 : 0.5}
          starSpeed={0.22}
          rotationSpeed={0.025}
          /* glowIntensity stays low so flares don't punch through.
             saturation raised significantly — the previous 0.18 left
             stars effectively grayscale, reading as a "whitish dark"
             dust over the cream paper. At 0.7 stars properly inherit
             the accent / phase hue. */
          glowIntensity={0.10}
          saturation={0.70}
          twinkleIntensity={0.25}
          hueShift={hexToHue(accent)}
        />
      </Suspense>
    </div>
  )
}

// ── Resolver ─────────────────────────────────────────────────
// Reads the user's chosen backdrop from settings (default 'blob')
// and renders the matching atmosphere. Drop-in replacement for the
// existing `.blob-stage > .breathing-blob` divs across screens.
export default function Backdrop({ accent, subtle = false, children }) {
  const settings = useLuna((s) => s.settings)
  let kind = settings?.journalTheme?.backdropKind || 'blob'
  // Legacy: 'constellation' was the hand-rolled star backdrop before
  // we swapped to the React Bits Galaxy. Anyone who already picked
  // Stars maps cleanly to Galaxy.
  if (kind === 'constellation') kind = 'galaxy'
  // Honor the user's backdrop colour override when set. null → fall
  // back to the screen's accent (which itself is the phase color
  // for cycle screens, or theme accent for custom paper).
  const customAccent = settings?.journalTheme?.backdrop?.accent
  const a = customAccent || accent || T.accent
  if (kind === 'moons')  return <MoonsBackdrop  accent={a} subtle={subtle} />
  if (kind === 'aurora') return <AuroraBackdrop accent={a} subtle={subtle} />
  if (kind === 'silk')   return <SilkBackdrop   accent={a} subtle={subtle} />
  if (kind === 'petals') return <PetalsBackdrop accent={a} subtle={subtle} />
  if (kind === 'galaxy') return <GalaxyBackdrop accent={a} subtle={subtle} />
  if (kind === 'bends')  return <ColorBendsBackdrop accent={a} subtle={subtle} />
  // default — blob (preserves Home's effects via the children slot)
  return <BlobBackdrop accent={a} subtle={subtle}>{children}</BlobBackdrop>
}

// Hook returning the current backdrop kind so screens can branch
// effect rendering without reading settings.journalTheme directly.
export function useBackdropKind() {
  const settings = useLuna((s) => s.settings)
  return settings?.journalTheme?.backdropKind || 'blob'
}
