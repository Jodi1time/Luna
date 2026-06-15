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
//   reflect   — writing, journaling, looking back (soft lavender)
//   body      — logging, tracking, BBT, period (warm peach)
//   read      — library, articles, knowledge (sage green)
//   intimate  — sexual/vaginal health (dusty mauve)
//   care      — checkups, nourish, routine (golden cream)
//   urgent    — helpers, when-something-feels-off (warm rose)
//   plan      — pregnancy, life-stage, TTC (moonlight purple)

import { T } from './theme'

export const SECTION_PALETTE = {
  reflect:  { tint: '#EFE7F3', accent: '#9F7BB8', label: 'Reflective' },
  body:     { tint: '#FBE9D9', accent: '#D88B5A', label: 'Body' },
  read:     { tint: '#E8EDDD', accent: '#7A9070', label: 'Read' },
  intimate: { tint: '#F5DCE0', accent: '#C68799', label: 'Intimate' },
  care:     { tint: '#F5E6CC', accent: '#C49B5A', label: 'Care' },
  urgent:   { tint: '#F7DAD2', accent: '#C84E2E', label: 'Urgent' },
  plan:     { tint: '#E8E1F0', accent: '#7E5DA8', label: 'Plan' },
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
