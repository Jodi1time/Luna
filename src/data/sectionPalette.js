// Section palette — soft chromatic identity per functional category.
//
// Why: research on female-coded wellness apps (Calm, Headspace, Flo,
// Daye) consistently shows that monochromatic UIs lose engagement on
// long-scroll feminine surfaces, even when typography is strong. Luna
// was suffering from this — every card cream-on-cream with only a
// phase-color border. The page felt empty.
//
// Fix: a small set of soft tints, each mapped to a functional category,
// applied as 10-18% washes (not solid blocks) over the cream paper. Each
// tile / row picks up the tint of what it actually does. Result: visual
// variety + cognitive color-coding by purpose, without breaking the
// editorial register.
//
// Categories chosen by app structure, not vibe — every Luna surface
// fits into one of these:
//   reflect   — writing, journaling, looking back (oat clay)
//   body      — check-ins, BBT, period (warm clay)
//   read      — library, articles, knowledge (muted sage)
//   intimate  — sexual/vaginal health (soft rose)
//   care      — checkups, nourish, routine (sand)
//   urgent    — helpers, when-something-feels-off (earth rose)
//   plan      — pregnancy, life-stage, TTC (taupe)

import { T } from './theme'

export const SECTION_PALETTE = {
  reflect:  { tint: '#EFE4DC', accent: '#9C7465', label: 'Reflect' },
  body:     { tint: '#F1DED2', accent: '#B98370', label: 'Body' },
  read:     { tint: '#E7ECDF', accent: '#7F9271', label: 'Learn' },
  intimate: { tint: '#F1DDE1', accent: '#B9828D', label: 'Intimate' },
  care:     { tint: '#F1E6D2', accent: '#A88A62', label: 'Care' },
  urgent:   { tint: '#EED4CC', accent: '#9B5A49', label: 'Support' },
  plan:     { tint: '#E8E0DA', accent: '#7D6D65', label: 'Plan' },
  // Fallback when nothing else applies — same warm cream we had.
  default:  { tint: T.card,    accent: T.accent,  label: '—' },
}

// Resolve a section's tint + accent. Unknown categories fall back to
// the default (warm cream + brand accent).
export function sectionColors(category) {
  return SECTION_PALETTE[category] || SECTION_PALETTE.default
}

// Build a soft tinted background — the tint color washed over the cream
// paper as a gentle gradient so each card reads as alive paper, not a
// flat block. Used as the glass-card background when a category is set.
//
// WASH is the single knob for how loud the section color is. The old
// value (cc/88 ≈ 80%/53%) read as saturated "candy" cards when seven
// of them stacked down a feed — the #1 tell that made the app feel
// generic. Softened so the cream paper + grain show through and color
// PUNCTUATES rather than floods; the category's real identity now comes
// from the accent border + accent details, not a colored box. Dial
// these two hex-alpha values together to taste (higher = louder).
const WASH = { top: 'a6', bottom: '5c' }  // ≈ 65% → 36%

export function sectionPaper(category) {
  const c = sectionColors(category)
  return `linear-gradient(165deg, ${c.tint}${WASH.top}, ${c.tint}${WASH.bottom})`
}
