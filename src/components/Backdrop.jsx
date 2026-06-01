import useLuna from '../store/useLuna'
import { T } from '../data/theme'

// ── Backdrop registry ─────────────────────────────────────────
// Each kind is a self-contained atmosphere that fills the stage.
// All are animated, all honor prefers-reduced-motion via the CSS
// `.backdrop-` classes (kept in sync with src/index.css keyframes).
// `accent` is the phase / theme color the backdrop tints itself by;
// `subtle` shrinks + lowers opacity for inner-tab use (Home goes
// without `subtle` so the atmosphere reads strongest where the user
// lives most).

export const BACKDROPS = [
  { id: 'blob',          label: 'Blob' },
  { id: 'moons',         label: 'Moons' },
  { id: 'aurora',        label: 'Aurora' },
  { id: 'silk',          label: 'Silk' },
  { id: 'petals',        label: 'Petals' },
  { id: 'constellation', label: 'Stars' },
]

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

function Moon({ size, top, left, phase, glow, dur, accent, subtle, index }) {
  const lightCx = phaseToLightCx(phase)
  const litness = phaseToLitness(phase)
  const haloOpacity = litness * (subtle ? 0.32 : 0.5) * glow
  const bodyOpacity = litness * (subtle ? 0.78 : 0.95)
  return (
    <div style={{
      position: 'absolute',
      top, left,
      width: size, height: size,
      transform: 'translate(-50%, -50%)',
      // Outer drift wrapper — applies the slow vertical breathe
      // without conflicting with the parent's positioning transform.
    }}>
      <div style={{
        position: 'relative',
        width: '100%', height: '100%',
        animation: `moonDrift ${dur}s ease-in-out infinite`,
        animationDelay: `${index * -7}s`,
      }}>
        {/* Halo — soft radial blur behind the moon, sized larger
            than the moon body so it reads as luminescence. Scales
            with the moon's lit-ness so new moons don't have huge
            glows. The base opacity is passed through a CSS var so
            the moonGlow keyframe pulses ABOUT haloOpacity rather
            than overriding it. */}
        <div style={{
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
        {/* Moon body — a circle filled with a radial gradient whose
            light source sits at (lightCx%, 45%). Moving lightCx
            outside [0,100] creates crescent shapes naturally — only
            the edge of the disc that's close to the gradient center
            catches light, the rest fades to transparent. */}
        <svg viewBox="0 0 64 64" width="100%" height="100%"
          style={{ position: 'relative', opacity: bodyOpacity, display: 'block' }}>
          <defs>
            <radialGradient id={`m-${index}`} cx={`${lightCx}%`} cy="44%" r="0.62">
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
  const petals = [
    { left: '12%', size: 14, dur: 14, drift: 24,  delay: 0 },
    { left: '28%', size: 11, dur: 18, drift: -18, delay: -3 },
    { left: '42%', size: 16, dur: 22, drift: 14,  delay: -7 },
    { left: '58%', size: 12, dur: 16, drift: -22, delay: -11 },
    { left: '72%', size: 15, dur: 20, drift: 20,  delay: -5 },
    { left: '86%', size: 10, dur: 24, drift: -16, delay: -9 },
    { left: '52%', size: 13, dur: 19, drift: 18,  delay: -14 },
    { left: '20%', size: 12, dur: 17, drift: -14, delay: -2 },
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

// ── Silk (flowing gradient sheets) ───────────────────────────
// Three layered gradient sheets drifting at different speeds, with a
// fine noise overlay for that silk-grain feel. The conic gradient
// underneath gives the "fold" highlights; two large radial sheets
// drifting in opposite directions on top read as light catching
// fabric. Adapted to phase color so silk shimmers in the same hue
// as today's atmosphere.
function SilkBackdrop({ accent, subtle }) {
  // Unique id so multiple Silk instances don't share the same SVG
  // filter (e.g. if the customiser preview ever switches to live).
  const noiseId = `silk-noise-${accent.replace(/[^a-z0-9]/gi, '') || 'x'}`
  return (
    <div className={`blob-stage${subtle ? ' subtle' : ''}`} aria-hidden="true"
      style={{
        width: '100%', height: '100%', top: 0, left: 0,
        transform: 'none',
        overflow: 'hidden',
      }}>
      {/* Base sheet — slow conic rotation creates the fold highlights */}
      <div style={{
        position: 'absolute', inset: '-25%',
        background: `conic-gradient(from 0deg at 50% 50%, ${accent}11, ${accent}88, ${accent}22, ${accent}99, ${accent}33, ${accent}88, ${accent}11)`,
        animation: 'silkRotate 60s linear infinite',
        filter: 'blur(48px)',
        opacity: subtle ? 0.42 : 0.62,
      }} />
      {/* Drifting sheet A — large soft glow, screens over base */}
      <div style={{
        position: 'absolute', inset: '-30%',
        background: `radial-gradient(ellipse 60% 70% at 38% 52%, ${accent}aa 0%, ${accent}00 65%)`,
        animation: 'silkDrift 22s ease-in-out infinite',
        filter: 'blur(56px) saturate(1.1)',
        opacity: subtle ? 0.34 : 0.55,
        mixBlendMode: 'screen',
      }} />
      {/* Drifting sheet B — counter-direction, multiplies for shadow */}
      <div style={{
        position: 'absolute', inset: '-30%',
        background: `radial-gradient(ellipse 55% 65% at 62% 48%, ${accent}99 0%, ${accent}00 65%)`,
        animation: 'silkDrift 28s ease-in-out infinite reverse',
        animationDelay: '-10s',
        filter: 'blur(56px)',
        opacity: subtle ? 0.34 : 0.52,
        mixBlendMode: 'multiply',
      }} />
      {/* Noise overlay — SVG fractal turbulence gives the silk its
          grain. Set very low opacity so it's texture, not noise.
          mixBlendMode: overlay so it modulates the underlying hues
          instead of greying them out. */}
      <svg style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        opacity: subtle ? 0.08 : 0.14,
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
      }}>
        <filter id={noiseId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${noiseId})`} />
      </svg>
    </div>
  )
}

// ── Constellation (twinkling stars) ──────────────────────────
// Scattered stars at fixed positions, each twinkling on its own
// rhythm (different durations + delays). Two faint connecting lines
// suggest a constellation without committing to a specific one.
function ConstellationBackdrop({ accent, subtle }) {
  const stars = [
    { top: '12%', left: '20%', size: 5, dur: 4.0, delay: 0 },
    { top: '8%',  left: '60%', size: 7, dur: 5.5, delay: -1 },
    { top: '24%', left: '78%', size: 4, dur: 3.6, delay: -2 },
    { top: '32%', left: '38%', size: 6, dur: 4.8, delay: -0.5 },
    { top: '46%', left: '14%', size: 3, dur: 6.0, delay: -3 },
    { top: '52%', left: '64%', size: 5, dur: 4.2, delay: -1.5 },
    { top: '60%', left: '82%', size: 4, dur: 5.0, delay: -2.5 },
    { top: '68%', left: '32%', size: 7, dur: 5.2, delay: -0.2 },
    { top: '78%', left: '54%', size: 4, dur: 3.8, delay: -1.8 },
    { top: '84%', left: '18%', size: 5, dur: 4.6, delay: -2.7 },
    { top: '88%', left: '72%', size: 3, dur: 5.8, delay: -0.8 },
    { top: '20%', left: '46%', size: 4, dur: 4.4, delay: -3.4 },
  ]
  return (
    <div className={`blob-stage${subtle ? ' subtle' : ''}`} aria-hidden="true"
      style={{
        width: '100%', height: '100%', top: 0, left: 0,
        transform: 'none',
        overflow: 'hidden',
      }}>
      {/* Two faint connecting lines — a hint of constellation */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }} preserveAspectRatio="none">
        <line x1="20%" y1="12%" x2="60%" y2="8%"  stroke={accent} strokeWidth={0.6} />
        <line x1="60%" y1="8%"  x2="78%" y2="24%" stroke={accent} strokeWidth={0.6} />
        <line x1="38%" y1="32%" x2="64%" y2="52%" stroke={accent} strokeWidth={0.6} />
        <line x1="32%" y1="68%" x2="54%" y2="78%" stroke={accent} strokeWidth={0.6} />
        <line x1="54%" y1="78%" x2="72%" y2="88%" stroke={accent} strokeWidth={0.6} />
      </svg>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: s.top, left: s.left,
          width: s.size, height: s.size,
          background: accent,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 ${s.size * 2}px ${accent}88`,
          animation: `starTwinkle ${s.dur}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
          opacity: subtle ? 0.45 : 0.65,
        }} />
      ))}
    </div>
  )
}

// ── Resolver ─────────────────────────────────────────────────
// Reads the user's chosen backdrop from settings (default 'blob')
// and renders the matching atmosphere. Drop-in replacement for the
// existing `.blob-stage > .breathing-blob` divs across screens.
export default function Backdrop({ accent, subtle = false, children }) {
  const settings = useLuna((s) => s.settings)
  const kind = settings?.journalTheme?.backdropKind || 'blob'
  const a = accent || T.accent
  if (kind === 'moons')         return <MoonsBackdrop         accent={a} subtle={subtle} />
  if (kind === 'aurora')        return <AuroraBackdrop        accent={a} subtle={subtle} />
  if (kind === 'silk')          return <SilkBackdrop          accent={a} subtle={subtle} />
  if (kind === 'petals')        return <PetalsBackdrop        accent={a} subtle={subtle} />
  if (kind === 'constellation') return <ConstellationBackdrop accent={a} subtle={subtle} />
  // default — blob (preserves Home's effects via the children slot)
  return <BlobBackdrop accent={a} subtle={subtle}>{children}</BlobBackdrop>
}

// Hook returning the current backdrop kind so screens can branch
// effect rendering without reading settings.journalTheme directly.
export function useBackdropKind() {
  const settings = useLuna((s) => s.settings)
  return settings?.journalTheme?.backdropKind || 'blob'
}
