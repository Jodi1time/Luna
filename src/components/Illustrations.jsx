// Editorial illustration system — the "celestial botanical" set.
//
// Luna had motion (animated icons, the blob, the wheel) but almost no
// *illustration*. These are hand-built SVG scenes for the app's barest
// moments — empty states, the onboarding reward, section headers —
// where Flo-style graphics make an app feel authored instead of
// assembled. They extend the phaseFlourishes hand: stroke-led line
// work, round caps, soft low-opacity accent washes, one quiet motif
// spine (the moon, and what grows under it).
//
// Every scene:
//   • takes `accent` (defaults to currentColor) so it wears the
//     section/phase palette,
//   • takes `size` (width in px; height follows the viewBox),
//   • animates gently and is aria-hidden (decorative),
//   • uses only translate/scale/opacity/rotate-about-center so it's
//     safe in iOS WKWebView (this is a native app first).
//
// Animation classes + keyframes live in index.css (illus-*).

const STROKE = {
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

// Small 4-point star used across scenes. cx,cy center; r outer reach.
function Sparkle({ cx, cy, r = 4, c, delay = 0, twinkle = true }) {
  return (
    <g className={twinkle ? 'illus-twinkle' : undefined}
       style={twinkle ? { animationDelay: `${delay}ms`, transformOrigin: `${cx}px ${cy}px`, transformBox: 'fill-box' } : undefined}>
      <path d={`M${cx} ${cy - r} Q ${cx} ${cy}, ${cx + r} ${cy} Q ${cx} ${cy}, ${cx} ${cy + r} Q ${cx} ${cy}, ${cx - r} ${cy} Q ${cx} ${cy}, ${cx} ${cy - r} Z`}
        fill={c} stroke="none" />
    </g>
  )
}

// ── Crescent cradle ─────────────────────────────────────────────
// The hero motif: a crescent moon with a seed nestled in its hollow,
// a soft orbit, and a scatter of stars. For the onboarding payoff —
// "Luna will hold this for you."
export function CrescentCradle({ size = 132, accent }) {
  const c = accent || 'currentColor'
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true"
      className="illus-float" stroke={c} {...STROKE} strokeWidth={1.6}>
      {/* soft orbit the seed rides */}
      <ellipse cx="60" cy="62" rx="42" ry="30" opacity={0.18} strokeDasharray="1 5" />
      {/* crescent — outer disc minus an offset disc, filled faintly */}
      <path d="M78 26 A 38 38 0 1 0 78 98 A 30 30 0 1 1 78 26 Z"
        fill={c} fillOpacity={0.12} strokeWidth={1.6} />
      {/* the seed in the crescent's hollow */}
      <g className="illus-breathe" style={{ transformOrigin: '70px 62px', transformBox: 'fill-box' }}>
        <circle cx="70" cy="62" r="5" fill={c} fillOpacity={0.5} stroke="none" />
        <circle cx="70" cy="62" r="8.5" opacity={0.5} />
      </g>
      <Sparkle cx={30} cy={30} r={4.5} c={c} delay={0} />
      <Sparkle cx={98} cy={44} r={3} c={c} delay={700} />
      <Sparkle cx={26} cy={84} r={3.5} c={c} delay={1400} />
    </svg>
  )
}

// ── Moon journey ────────────────────────────────────────────────
// Five moon phases rising along a gentle arc — a cycle's shape, drawn
// as the moon's own. For the Calendar empty state ("your rhythm
// starts here").
export function MoonJourney({ size = 168, accent }) {
  const c = accent || 'currentColor'
  // Positions along an arc, with the lit fraction growing new→full.
  const arc = (t) => {
    const x = 16 + t * 124
    const y = 56 - Math.sin(t * Math.PI) * 30
    return { x, y }
  }
  const r = 11
  // Per-phase "lit" path: a half-disc whose terminator is an ellipse
  // of x-radius `rx`; sweep flips the bulge for waxing gibbous.
  const moon = (i, t, rx, sweep, full) => {
    const { x, y } = arc(t)
    return (
      <g key={i}>
        <circle cx={x} cy={y} r={r} opacity={0.55} />
        {full
          ? <circle cx={x} cy={y} r={r} fill={c} fillOpacity={0.22} stroke="none" />
          : rx != null && (
            <path d={`M ${x} ${y - r} A ${r} ${r} 0 0 1 ${x} ${y + r} A ${rx} ${r} 0 0 ${sweep} ${x} ${y - r} Z`}
              fill={c} fillOpacity={0.22} stroke="none" />
          )}
      </g>
    )
  }
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 156 78" aria-hidden="true"
      className="illus-float" stroke={c} {...STROKE} strokeWidth={1.4}>
      {/* the arc the moons travel */}
      <path d={`M ${arc(0).x} ${arc(0).y} Q 78 4 ${arc(1).x} ${arc(1).y}`} opacity={0.16} strokeDasharray="1 5" />
      {moon(0, 0, 3, 0, false)      /* waxing crescent */}
      {moon(1, 0.25, 0, 0, false)   /* first quarter   */}
      {moon(2, 0.5, 5, 1, false)    /* waxing gibbous  */}
      {moon(3, 0.75, null, 0, true) /* full            */}
      {moon(4, 1, null, 0, true)    /* full, settling  */}
      <Sparkle cx={78} cy={12} r={3} c={c} delay={400} />
    </svg>
  )
}

// ── Constellation ───────────────────────────────────────────────
// Stars connecting into a soft shape — "patterns become visible with
// more points." For the Insights empty state. Lines draw in; stars
// twinkle in sequence.
export function Constellation({ size = 140, accent }) {
  const c = accent || 'currentColor'
  const pts = [
    { x: 18, y: 62, r: 4 },
    { x: 44, y: 40, r: 5 },
    { x: 70, y: 54, r: 3.5 },
    { x: 96, y: 26, r: 5 },
    { x: 116, y: 56, r: 4 },
  ]
  const line = `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y} L ${pts[2].x} ${pts[2].y} L ${pts[3].x} ${pts[3].y} M ${pts[2].x} ${pts[2].y} L ${pts[4].x} ${pts[4].y}`
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 134 84" aria-hidden="true"
      className="illus-float" stroke={c} {...STROKE} strokeWidth={1.2}>
      <path d={line} opacity={0.32}
        className="illus-trace" style={{ ['--trace-len']: 320 }} />
      {pts.map((p, i) => <Sparkle key={i} cx={p.x} cy={p.y} r={p.r} c={c} delay={i * 320} />)}
    </svg>
  )
}

// ── Open diary ──────────────────────────────────────────────────
// An open book with a sprig rising from the spine and a petal letting
// go — diary-coded, growth-coded. For the Journal empty state.
export function OpenDiary({ size = 150, accent }) {
  const c = accent || 'currentColor'
  return (
    <svg width={size} height={size * 0.74} viewBox="0 0 150 112" aria-hidden="true"
      className="illus-float" stroke={c} {...STROKE} strokeWidth={1.5}>
      {/* two open pages meeting at the spine */}
      <path d="M75 96 C 56 86, 30 84, 14 88 L 14 44 C 30 40, 56 42, 75 52 Z" fill={c} fillOpacity={0.05} />
      <path d="M75 96 C 94 86, 120 84, 136 88 L 136 44 C 120 40, 94 42, 75 52 Z" fill={c} fillOpacity={0.05} />
      <path d="M75 52 L 75 96" opacity={0.5} />
      {/* faint ruled lines */}
      <path d="M26 56 Q 50 52, 68 60 M26 66 Q 50 62, 68 70 M82 60 Q 100 52, 124 56 M82 70 Q 100 62, 124 66"
        strokeWidth={0.9} opacity={0.3} />
      {/* a sprig growing from the gutter */}
      <g className="illus-sway" style={{ transformOrigin: '75px 52px', transformBox: 'fill-box' }}>
        <path d="M75 52 Q 73 34, 78 18" strokeWidth={1.4} />
        <path d="M75 40 Q 67 37, 63 40" strokeWidth={1} opacity={0.75} />
        <path d="M76 30 Q 83 27, 87 30" strokeWidth={1} opacity={0.75} />
        <circle cx="78" cy="18" r="3" fill={c} fillOpacity={0.35} />
      </g>
      <Sparkle cx={120} cy={26} r={3} c={c} delay={600} />
    </svg>
  )
}

// ── Moon mark ───────────────────────────────────────────────────
// The Luna signature — a small crescent + star. A quiet brand
// ornament for populated section headers (where the moon is never
// arbitrary: it's the app's name). Sits beside a big serif title the
// way the phase flourishes sit on Reflect/Care.
export function MoonMark({ size = 30, accent }) {
  const c = accent || 'currentColor'
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"
      stroke={c} {...STROKE} strokeWidth={1.5}>
      <path d="M21 6 A 11 11 0 1 0 21 26 A 8.5 8.5 0 1 1 21 6 Z"
        fill={c} fillOpacity={0.14} />
      <Sparkle cx={25} cy={9} r={3} c={c} delay={300} />
    </svg>
  )
}

// ── Two moons meeting ───────────────────────────────────────────
// Two crescents curving toward each other with a shared star in the
// space between — "someone is letting you in." For the share-accept
// screen, a recipient's first impression of Luna.
export function MoonsMeeting({ size = 132, accent }) {
  const c = accent || 'currentColor'
  const R = 17, cy = 36
  // concave-right crescent (opens toward center) at left; mirror at right
  const right = (cx) => `M ${cx} ${cy - R} A ${R} ${R} 0 1 0 ${cx} ${cy + R} A 10 ${R} 0 1 1 ${cx} ${cy - R} Z`
  const left = (cx) => `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx} ${cy + R} A 10 ${R} 0 1 0 ${cx} ${cy - R} Z`
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 132 78" aria-hidden="true"
      className="illus-float" stroke={c} {...STROKE} strokeWidth={1.5}>
      <ellipse cx="66" cy={cy} rx="52" ry="22" opacity={0.14} strokeDasharray="1 5" />
      <path d={right(40)} fill={c} fillOpacity={0.12} />
      <path d={left(92)} fill={c} fillOpacity={0.12} />
      {/* the shared light between them */}
      <g className="illus-breathe" style={{ transformOrigin: '66px 36px', transformBox: 'fill-box' }}>
        <Sparkle cx={66} cy={36} r={6} c={c} twinkle={false} />
      </g>
      <Sparkle cx={22} cy={16} r={3} c={c} delay={500} />
      <Sparkle cx={110} cy={20} r={3.5} c={c} delay={1100} />
    </svg>
  )
}

// ── Bloom ───────────────────────────────────────────────────────
// Concentric opening petals — calm, meditative. A small companion for
// the Reflect header.
export function Bloom({ size = 56, accent }) {
  const c = accent || 'currentColor'
  const petals = (r, op) =>
    [0, 60, 120, 180, 240, 300].map((deg) => {
      const rad = (deg * Math.PI) / 180
      const x = 40 + Math.cos(rad) * r
      const y = 40 + Math.sin(rad) * r
      const x2 = 40 + Math.cos(rad) * (r + 11)
      const y2 = 40 + Math.sin(rad) * (r + 11)
      const px = Math.cos(rad + 0.5) * 5
      const py = Math.sin(rad + 0.5) * 5
      return <path key={`${r}-${deg}`} d={`M${x} ${y} Q ${x2 + px} ${y2 + py}, ${x2} ${y2} Q ${x2 - px} ${y2 - py}, ${x} ${y} Z`} opacity={op} />
    })
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true"
      className="illus-breathe" style={{ transformOrigin: '40px 40px', transformBox: 'fill-box' }}
      stroke={c} {...STROKE} strokeWidth={1.3}>
      {petals(16, 0.4)}
      {petals(7, 0.7)}
      <circle cx="40" cy="40" r="4" fill={c} fillOpacity={0.3} stroke="none" />
    </svg>
  )
}
