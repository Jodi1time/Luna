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
// Three crescents at fixed positions, each slowly rotating + drifting.
// Sizes vary; tinted in phase color with soft blur. The slowest one
// is largest and lives behind the others.
function MoonsBackdrop({ accent, subtle }) {
  const moons = [
    { size: subtle ? 110 : 150, top: '18%', left: '60%', rot: 30,  dur: 60 },
    { size: subtle ? 70  : 92,  top: '64%', left: '22%', rot: -20, dur: 48 },
    { size: subtle ? 50  : 64,  top: '30%', left: '12%', rot: 12,  dur: 36 },
    { size: subtle ? 40  : 56,  top: '78%', left: '70%', rot: -45, dur: 42 },
  ]
  return (
    <div className={`blob-stage${subtle ? ' subtle' : ''}`} aria-hidden="true">
      {moons.map((m, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: m.top, left: m.left,
          width: m.size, height: m.size,
          transform: `translate(-50%, -50%) rotate(${m.rot}deg)`,
          animation: `moonDrift ${m.dur}s ease-in-out infinite`,
          animationDelay: `${i * -7}s`,
          opacity: subtle ? 0.32 : 0.42,
          filter: 'blur(0.4px)',
        }}>
          <svg viewBox="0 0 64 64" width="100%" height="100%">
            <defs>
              <radialGradient id={`m-grad-${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={accent} stopOpacity="0.7" />
                <stop offset="70%" stopColor={accent} stopOpacity="0.4" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </radialGradient>
            </defs>
            <path
              d="M44 8 A 28 28 0 1 0 44 56 A 22 22 0 1 1 44 8 Z"
              fill={`url(#m-grad-${i})`}
            />
          </svg>
        </div>
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
