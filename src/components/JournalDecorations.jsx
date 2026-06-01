// Decorative overlays for the journal (and optionally the whole app).
// Each decoration kind is a small SVG shape rendered at a fixed set
// of scattered positions inside the parent. Pointer-events are off
// so they never block taps. Soft opacity so they read as atmosphere,
// not foreground.

const Heart = ({ size = 14, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21s-7-4.5-9.5-9C0.5 8 3 4 6.5 4c2 0 3.4 1 5.5 3 2.1-2 3.5-3 5.5-3 3.5 0 6 4 4 8-2.5 4.5-9.5 9-9.5 9z"
      fill={color} stroke={color} strokeWidth={1} strokeLinejoin="round" />
  </svg>
)

const Star = ({ size = 14, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2 L13.8 9 L21 9.5 L15.5 14 L17.5 21 L12 17 L6.5 21 L8.5 14 L3 9.5 L10.2 9 Z"
      fill={color} stroke={color} strokeWidth={0.5} strokeLinejoin="round" />
  </svg>
)

const Flower = ({ size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    {[0, 72, 144, 216, 288].map((rot) => (
      <ellipse key={rot} cx="12" cy="6" rx="3" ry="5"
        fill={color}
        transform={`rotate(${rot} 12 12)`} />
    ))}
    <circle cx="12" cy="12" r="2.2" fill={color} opacity={0.7} />
  </svg>
)

const Butterfly = ({ size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 12 C 6 5, 2 8, 4 13 C 5 17, 9 17, 12 13 Z" fill={color} />
    <path d="M12 12 C 18 5, 22 8, 20 13 C 19 17, 15 17, 12 13 Z" fill={color} />
    <line x1="12" y1="6" x2="12" y2="18" stroke={color} strokeWidth={1} />
  </svg>
)

const Moon = ({ size = 14, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16 4 A 9 9 0 1 0 16 20 A 7 7 0 1 1 16 4 Z" fill={color} />
  </svg>
)

const Sparkle = ({ size = 12, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2 L13 11 L22 12 L13 13 L12 22 L11 13 L2 12 L11 11 Z"
      fill={color} />
  </svg>
)

const SHAPES = {
  hearts: Heart,
  stars: Star,
  flowers: Flower,
  butterflies: Butterfly,
  moons: Moon,
  sparkles: Sparkle,
}

// Seeded pseudo-random — deterministic so the same decoration always
// lands in the same spots (no re-shuffling on re-render).
function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// Build a stable scattered placement for a decoration kind. 18 spots
// per kind, distributed across the surface with some clustering at
// the corners (where books/diaries tend to be decorated most). Each
// spot has a randomised rotation + size so it doesn't look stamped.
function generateSpots(kind, count = 18) {
  const rand = seededRand(kind.charCodeAt(0) * 977 + kind.length * 31)
  const spots = []
  for (let i = 0; i < count; i++) {
    spots.push({
      top: `${(rand() * 96).toFixed(2)}%`,
      left: `${(rand() * 96).toFixed(2)}%`,
      rot: Math.floor(rand() * 60 - 30),
      scale: 0.7 + rand() * 0.7,
    })
  }
  return spots
}

const SPOTS_CACHE = new Map()
function getSpots(kind) {
  if (!SPOTS_CACHE.has(kind)) SPOTS_CACHE.set(kind, generateSpots(kind))
  return SPOTS_CACHE.get(kind)
}

// Render decorations across the parent. Parent must be position:
// relative for absolute children to anchor correctly. Opacity is
// kept low (8-14%) so decorations read as a soft wash, never a
// noisy foreground.
export default function JournalDecorations({ decorations = [], accent, opacity = 0.12 }) {
  if (!decorations || decorations.length === 0) return null
  return (
    <div aria-hidden="true" style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      borderRadius: 'inherit',
      zIndex: 0,
    }}>
      {decorations.map((kind) => {
        const Shape = SHAPES[kind]
        if (!Shape) return null
        const spots = getSpots(kind)
        return (
          <div key={kind}>
            {spots.map((s, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: s.top, left: s.left,
                transform: `rotate(${s.rot}deg) scale(${s.scale})`,
                transformOrigin: 'center',
                opacity,
              }}>
                <Shape color={accent} />
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
