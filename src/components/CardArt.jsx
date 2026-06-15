// Card-art system — a distinct illustrated banner per card type.
//
// The problem this solves (Jodi, looking at Flo): every Luna card had
// the same skeleton — text + a small line-icon — so screens felt
// samey. Flo gives each insight card its own bespoke graphic. This is
// Luna's answer, with the twist that keeps it ours: not glossy 3D, not
// a mascot — editorial line-art scenes built from one shared celestial-
// botanical vocabulary (moons, sprigs, seeds, stars, waves, blooms),
// each composed differently so no two cards read alike, all unmistakably
// the same hand.
//
// Each scene is a wide banner (viewBox 0 0 120 58) meant to sit at the
// top of a card on its section tint. `accent` themes it; gentle,
// per-scene motion; aria-hidden; iOS-safe transforms only.

const S = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }

function Star({ cx, cy, r = 3.5, c, delay = 0 }) {
  return (
    <path d={`M${cx} ${cy - r} Q ${cx} ${cy}, ${cx + r} ${cy} Q ${cx} ${cy}, ${cx} ${cy + r} Q ${cx} ${cy}, ${cx - r} ${cy} Q ${cx} ${cy}, ${cx} ${cy - r} Z`}
      fill={c} stroke="none"
      className="illus-twinkle" style={{ animationDelay: `${delay}ms`, transformOrigin: `${cx}px ${cy}px`, transformBox: 'fill-box' }} />
  )
}

const crescentR = (cx, cy, R, r2) => `M ${cx} ${cy - R} A ${R} ${R} 0 1 0 ${cx} ${cy + R} A ${r2} ${R} 0 1 1 ${cx} ${cy - R} Z`
const crescentL = (cx, cy, R, r2) => `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx} ${cy + R} A ${r2} ${R} 0 1 0 ${cx} ${cy - R} Z`

// ── talk — a moon speaking: crescent + radiating arcs ───────────
function TalkArt({ c }) {
  return (
    <g className="illus-float">
      <path d={crescentR(30, 29, 15, 9)} fill={c} fillOpacity={0.16} stroke={c} strokeWidth={1.6} {...S} />
      {[50, 62, 74].map((x, i) => (
        <path key={x} d={`M ${x} ${21 - i} Q ${x + 7 + i * 2} 29 ${x} ${37 + i}`}
          stroke={c} strokeWidth={1.4} opacity={0.6 - i * 0.16} {...S} />
      ))}
      <Star cx={96} cy={16} r={3.5} c={c} delay={400} />
    </g>
  )
}

// ── share — two moons cradling a shared light ───────────────────
function ShareArt({ c }) {
  return (
    <g className="illus-float">
      <ellipse cx="60" cy="29" rx="40" ry="16" stroke={c} strokeWidth={1.2} opacity={0.16} strokeDasharray="1 5" fill="none" />
      <path d={crescentR(40, 29, 14, 8)} fill={c} fillOpacity={0.14} stroke={c} strokeWidth={1.6} {...S} />
      <path d={crescentL(80, 29, 14, 8)} fill={c} fillOpacity={0.14} stroke={c} strokeWidth={1.6} {...S} />
      <g className="illus-breathe" style={{ transformOrigin: '60px 29px', transformBox: 'fill-box' }}>
        <Star cx={60} cy={29} r={5} c={c} />
      </g>
    </g>
  )
}

// ── lookup — a lens over lines of text, a moon caught in the glass ─
function LookupArt({ c }) {
  return (
    <g className="illus-float">
      <circle cx="34" cy="25" r="14" stroke={c} strokeWidth={1.7} fill={c} fillOpacity={0.05} {...S} />
      <path d="M44 35 L 55 46" stroke={c} strokeWidth={2} {...S} />
      <path d={crescentR(34, 25, 6, 3.5)} fill={c} fillOpacity={0.3} stroke="none" />
      {[16, 26, 36].map((y, i) => (
        <path key={y} d={`M 64 ${y} Q 80 ${y - 3} ${104 - i * 12} ${y}`} stroke={c} strokeWidth={1.6} opacity={0.42} {...S} />
      ))}
    </g>
  )
}

// ── conditions — a botanical with two arcing stems + blooms ──────
// Reads as a plant first, with a quiet nod to reproductive anatomy
// (two ovary-like blooms on symmetric stems). Tasteful, never clinical.
function ConditionsArt({ c }) {
  const bloom = (cx, cy) => (
    <g className="illus-breathe" style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'fill-box' }}>
      <circle cx={cx} cy={cy} r={6} stroke={c} strokeWidth={1.5} fill={c} fillOpacity={0.16} />
      {[0, 72, 144, 216, 288].map((d) => {
        const r = (d * Math.PI) / 180
        return <line key={d} x1={cx + Math.cos(r) * 6} y1={cy + Math.sin(r) * 6} x2={cx + Math.cos(r) * 9} y2={cy + Math.sin(r) * 9} stroke={c} strokeWidth={1.2} opacity={0.55} {...S} />
      })}
    </g>
  )
  return (
    <g className="illus-sway" style={{ transformOrigin: '60px 50px', transformBox: 'fill-box' }}>
      <path d="M60 50 L 60 30" stroke={c} strokeWidth={1.6} {...S} />
      <path d="M60 38 Q 48 34 42 22" stroke={c} strokeWidth={1.5} {...S} />
      <path d="M60 38 Q 72 34 78 22" stroke={c} strokeWidth={1.5} {...S} />
      <path d="M60 44 Q 54 42 50 44" stroke={c} strokeWidth={1.1} opacity={0.6} {...S} />
      <path d="M60 44 Q 66 42 70 44" stroke={c} strokeWidth={1.1} opacity={0.6} {...S} />
      {bloom(42, 18)}
      {bloom(78, 18)}
    </g>
  )
}

// ── library — an open book, pages fanning, a star above ─────────
function LibraryArt({ c }) {
  return (
    <g className="illus-float">
      <path d="M60 46 C 50 40, 36 39, 26 41 L 26 18 C 36 16, 50 17, 60 23 Z" fill={c} fillOpacity={0.06} stroke={c} strokeWidth={1.6} {...S} />
      <path d="M60 46 C 70 40, 84 39, 94 41 L 94 18 C 84 16, 70 17, 60 23 Z" fill={c} fillOpacity={0.06} stroke={c} strokeWidth={1.6} {...S} />
      <path d="M60 23 L 60 46" stroke={c} strokeWidth={1.4} opacity={0.5} {...S} />
      <path d="M33 25 Q 45 23 54 28 M33 32 Q 45 30 54 35 M66 28 Q 75 23 87 25 M66 35 Q 75 30 87 32"
        stroke={c} strokeWidth={1} opacity={0.34} {...S} />
      <Star cx={60} cy={9} r={3.5} c={c} delay={300} />
    </g>
  )
}

// ── cheatsheet — a visit note: document, lines, a small heart ───
function CheatsheetArt({ c }) {
  return (
    <g className="illus-float">
      <path d="M44 12 H 70 L 78 20 V 46 H 44 Z" fill={c} fillOpacity={0.06} stroke={c} strokeWidth={1.6} {...S} />
      <path d="M70 12 V 20 H 78" stroke={c} strokeWidth={1.4} opacity={0.6} {...S} />
      <path d="M50 27 H 70 M50 33 H 70 M50 39 H 63" stroke={c} strokeWidth={1.3} opacity={0.5} {...S} />
      <path d="M88 30 q -3 -4 -6 -1 q -3 3 0 6 l 6 5 l 6 -5 q 3 -3 0 -6 q -3 -3 -6 1 Z"
        className="illus-breathe" style={{ transformOrigin: '88px 34px', transformBox: 'fill-box' }}
        fill={c} fillOpacity={0.2} stroke={c} strokeWidth={1.4} {...S} />
    </g>
  )
}

const SCENES = {
  talk: TalkArt,
  share: ShareArt,
  lookup: LookupArt,
  conditions: ConditionsArt,
  library: LibraryArt,
  cheatsheet: CheatsheetArt,
}

// Banner illustration for a card. `kind` selects the scene; `accent`
// themes it; `height` scales (width follows the 120:58 ratio, but the
// svg stretches to its container width by default).
export function CardArt({ kind, accent, height = 56, style }) {
  const Scene = SCENES[kind]
  if (!Scene) return null
  return (
    <svg viewBox="0 0 120 58" width="100%" height={height} preserveAspectRatio="xMidYMid meet"
      aria-hidden="true" style={{ display: 'block', overflow: 'visible', ...style }}>
      <Scene c={accent || 'currentColor'} />
    </svg>
  )
}

export const CARD_ART_KINDS = Object.keys(SCENES)
