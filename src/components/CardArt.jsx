// Card-art system v2 — filled, dimensional graphics with a Luna spin.
//
// v1 failed (thin hairline line-art = the exact "AI slop" look). The
// fix: lean into the one thing Luna already does beautifully — the
// breathing blob. Each card gets a soft glowing organic FILL (radial
// gradients, layered translucent forms) with one bold motif from the
// celestial-botanical vocabulary. Weight and glow, not outlines. One
// distinct scene per card so no two read alike; all unmistakably Luna.
//
// Banner: viewBox 0 0 120 72, stretches to container width. `accent`
// themes every gradient. Gentle motion; aria-hidden; iOS-safe.

// Per-card gradient defs (ids namespaced by `id` so multiple cards on
// one screen don't collide). glow = soft halo, fill = the motif body,
// sheen = a white-to-accent highlight for dimensionality.
function Defs({ id, accent }) {
  return (
    <defs>
      <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="55%">
        <stop offset="0%" stopColor={accent} stopOpacity="0.34" />
        <stop offset="70%" stopColor={accent} stopOpacity="0.10" />
        <stop offset="100%" stopColor={accent} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-fill`} x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#FFF6EE" stopOpacity="0.85" />
        <stop offset="55%" stopColor={accent} stopOpacity="0.62" />
        <stop offset="100%" stopColor={accent} stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id={`${id}-soft`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
        <stop offset="100%" stopColor={accent} stopOpacity="0.34" />
      </linearGradient>
    </defs>
  )
}

const Frame = ({ id, accent, children }) => (
  <svg viewBox="0 0 120 72" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
    aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
    <Defs id={id} accent={accent} />
    {children}
  </svg>
)

// crescent path (concave-right) for filled moons
const crescent = (cx, cy, R, r2) =>
  `M ${cx} ${cy - R} A ${R} ${R} 0 1 0 ${cx} ${cy + R} A ${r2} ${R} 0 1 1 ${cx} ${cy - R} Z`

// ── talk — a glowing moon, mid-thought ──────────────────────────
function TalkArt({ accent }) {
  const id = 'ca-talk'
  return (
    <Frame id={id} accent={accent}>
      <ellipse cx="46" cy="36" rx="50" ry="34" fill={`url(#${id}-glow)`} className="illus-breathe" style={{ transformOrigin: '46px 36px', transformBox: 'fill-box' }} />
      <path d={crescent(44, 36, 22, 12)} fill={`url(#${id}-fill)`} />
      <path d="M30 24 A 22 22 0 0 0 30 48" fill="none" stroke="#fff" strokeWidth="1.6" strokeOpacity="0.55" strokeLinecap="round" />
      {/* thought dots trailing toward the light */}
      <circle cx="74" cy="30" r="4" fill={accent} fillOpacity="0.7" />
      <circle cx="86" cy="26" r="2.8" fill={accent} fillOpacity="0.45" />
      <circle cx="95" cy="23" r="1.8" fill={accent} fillOpacity="0.28" />
    </Frame>
  )
}

// ── share — two moons overlapping, a shared light between ───────
function ShareArt({ accent }) {
  const id = 'ca-share'
  return (
    <Frame id={id} accent={accent}>
      <ellipse cx="60" cy="36" rx="52" ry="30" fill={`url(#${id}-glow)`} />
      <circle cx="46" cy="36" r="20" fill={accent} fillOpacity="0.4" />
      <circle cx="74" cy="36" r="20" fill={accent} fillOpacity="0.4" />
      <circle cx="46" cy="36" r="20" fill="none" stroke="#fff" strokeWidth="1.4" strokeOpacity="0.4" />
      <circle cx="74" cy="36" r="20" fill="none" stroke="#fff" strokeWidth="1.4" strokeOpacity="0.4" />
      {/* the shared light */}
      <circle cx="60" cy="36" r="9" fill={`url(#${id}-soft)`} className="illus-breathe" style={{ transformOrigin: '60px 36px', transformBox: 'fill-box' }} />
      <circle cx="60" cy="36" r="9" fill="none" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.6" />
    </Frame>
  )
}

// ── lookup — a glowing lens over lines of text ──────────────────
function LookupArt({ accent }) {
  const id = 'ca-look'
  return (
    <Frame id={id} accent={accent}>
      <ellipse cx="60" cy="36" rx="52" ry="30" fill={`url(#${id}-glow)`} />
      {/* lines, behind the lens */}
      <g opacity="0.7">
        <rect x="64" y="22" width="34" height="5" rx="2.5" fill={accent} fillOpacity="0.32" />
        <rect x="64" y="34" width="30" height="5" rx="2.5" fill={accent} fillOpacity="0.32" />
        <rect x="64" y="46" width="22" height="5" rx="2.5" fill={accent} fillOpacity="0.32" />
      </g>
      <circle cx="40" cy="34" r="20" fill={`url(#${id}-fill)`} />
      <circle cx="40" cy="34" r="20" fill="#FFF6EE" fillOpacity="0.18" />
      <path d="M32 26 A 11 11 0 0 0 30 38" fill="none" stroke="#fff" strokeWidth="1.8" strokeOpacity="0.6" strokeLinecap="round" />
      <rect x="52" y="46" width="16" height="6" rx="3" transform="rotate(42 52 46)" fill={accent} fillOpacity="0.85" />
    </Frame>
  )
}

// ── conditions — a bloom opening (organic, soft-filled petals) ──
function ConditionsArt({ accent }) {
  const id = 'ca-cond'
  const petal = (deg) => {
    const r = (deg * Math.PI) / 180
    const cx = 60 + Math.cos(r) * 17
    const cy = 36 + Math.sin(r) * 17
    return <ellipse key={deg} cx={cx} cy={cy} rx="11" ry="7" transform={`rotate(${deg} ${cx} ${cy})`} fill={`url(#${id}-soft)`} stroke="#fff" strokeOpacity="0.35" strokeWidth="1" />
  }
  return (
    <Frame id={id} accent={accent}>
      <ellipse cx="60" cy="36" rx="50" ry="32" fill={`url(#${id}-glow)`} />
      <g className="illus-breathe" style={{ transformOrigin: '60px 36px', transformBox: 'fill-box' }}>
        {[0, 60, 120, 180, 240, 300].map(petal)}
        <circle cx="60" cy="36" r="8" fill={`url(#${id}-fill)`} />
        <circle cx="57" cy="33" r="2.4" fill="#fff" fillOpacity="0.6" />
      </g>
    </Frame>
  )
}

// ── library — a stack of pages, a moon rising over it ───────────
function LibraryArt({ accent }) {
  const id = 'ca-lib'
  return (
    <Frame id={id} accent={accent}>
      <ellipse cx="58" cy="38" rx="52" ry="30" fill={`url(#${id}-glow)`} />
      {/* stacked cards, offset for depth */}
      <rect x="34" y="40" width="56" height="20" rx="6" fill={accent} fillOpacity="0.34" />
      <rect x="38" y="32" width="52" height="20" rx="6" fill={accent} fillOpacity="0.5" />
      <rect x="42" y="24" width="48" height="20" rx="6" fill={`url(#${id}-fill)`} />
      <rect x="48" y="30" width="22" height="3.4" rx="1.7" fill="#fff" fillOpacity="0.7" />
      {/* small moon over the stack */}
      <circle cx="84" cy="20" r="8" fill={`url(#${id}-soft)`} className="illus-breathe" style={{ transformOrigin: '84px 20px', transformBox: 'fill-box' }} />
      <path d={crescent(86, 20, 8, 4.5)} fill={accent} fillOpacity="0.5" />
    </Frame>
  )
}

// ── cheatsheet — a note for the visit, with a soft heart ────────
function CheatsheetArt({ accent }) {
  const id = 'ca-cheat'
  return (
    <Frame id={id} accent={accent}>
      <ellipse cx="58" cy="36" rx="50" ry="30" fill={`url(#${id}-glow)`} />
      <path d="M40 14 H 66 L 78 26 V 58 H 40 Z" fill={`url(#${id}-fill)`} />
      <path d="M66 14 V 26 H 78" fill="#FFF6EE" fillOpacity="0.4" />
      <rect x="46" y="32" width="26" height="3.4" rx="1.7" fill="#fff" fillOpacity="0.7" />
      <rect x="46" y="40" width="26" height="3.4" rx="1.7" fill="#fff" fillOpacity="0.55" />
      <rect x="46" y="48" width="16" height="3.4" rx="1.7" fill="#fff" fillOpacity="0.55" />
      <path d="M92 30 q -4 -5 -8 -1 q -4 4 0 8 l 8 7 l 8 -7 q 4 -4 0 -8 q -4 -4 -8 1 Z"
        fill={`url(#${id}-soft)`} stroke="#fff" strokeOpacity="0.4" strokeWidth="1"
        className="illus-breathe" style={{ transformOrigin: '92px 36px', transformBox: 'fill-box' }} />
    </Frame>
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

export function CardArt({ kind, accent }) {
  const Scene = SCENES[kind]
  if (!Scene) return null
  return <Scene accent={accent || '#6B4739'} />
}

export const CARD_ART_KINDS = Object.keys(SCENES)
