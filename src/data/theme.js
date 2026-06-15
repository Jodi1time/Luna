// ── Luna design tokens ───────────────────────────────────────────
// The single source of truth for the app's visual language. See
// docs/BRAND.md for the why behind every value. The rule: surfaces,
// elevation, radius, and type all come from HERE, never ad-hoc — that
// consistency is most of what separates "crafted" from "assembled".

export const T = {
  // Surfaces — warm editorial creams, espresso ink.
  bg:     '#F4EFE5',
  card:   '#FFFFFF',
  subtle: '#EBE3D5',
  accent: '#C84E2E',
  ink:    '#1A1310',
  text:   '#1A1310',
  muted:  '#756A60',
  hair:   'rgba(26,19,16,0.10)',
  faint:  'rgba(26,19,16,0.06)',

  // Type — a variable editorial serif against a precise mono. No
  // banned UI-default fonts; the serif does the emotional work.
  serif:  '"Newsreader", Georgia, serif',
  sans:   '"DM Sans", -apple-system, system-ui, sans-serif',
  mono:   '"DM Mono", ui-monospace, monospace',

  // Radius — a disciplined ramp instead of ad-hoc numbers. Crisp at
  // the small end (chips, inputs stay editorial-sharp), softening up
  // to hero cards. `r` is the legacy crisp value; keep using it for
  // buttons/inputs. Use `radius.*` for surfaces.
  r:      4,
  radius: {
    xs: 4,    // inputs, chips, pills-that-aren't-round
    sm: 10,   // small cards, inline tiles
    md: 14,   // standard content cards
    lg: 20,   // feature cards
    xl: 26,   // hero surfaces (the cover, the AI thought)
  },

  // Elevation — soft, warm, layered. Two stacked shadows (a tight
  // contact shadow + a wide diffuse ambient) read as a real object
  // resting on paper, where a single dark blur reads as a sticker.
  // Warm-tinted near-black, never grey, never harsh.
  shadow: {
    sm: '0 1px 2px rgba(26,19,16,0.05), 0 1px 1px rgba(26,19,16,0.03)',
    md: '0 1px 2px rgba(26,19,16,0.04), 0 8px 18px -10px rgba(26,19,16,0.10)',
    lg: '0 2px 4px rgba(26,19,16,0.04), 0 22px 48px -20px rgba(26,19,16,0.18)',
    // A diffuse ambient halo for floating hero elements — no contact
    // edge, just soft presence.
    ambient: '0 30px 60px -34px rgba(26,19,16,0.22)',
  },

  // Type ramp — editorial contrast. Display sizes are deliberately
  // large with tight tracking; body stays calm and readable. Use as
  // a reference even where sizes are inlined.
  type: {
    display: { size: 44, weight: 500, spacing: -1.4, family: '"Newsreader", Georgia, serif' },
    title:   { size: 30, weight: 500, spacing: -0.8 },
    heading: { size: 22, weight: 500, spacing: -0.4 },
    body:    { size: 15.5, weight: 400, spacing: 0 },
    eyebrow: { size: 11, weight: 600, spacing: 1.6 },  // mono, uppercase
  },

  // Spacing — an 8pt-ish rhythm. Reach for these instead of arbitrary
  // pixel gaps so vertical rhythm stays consistent across screens.
  space: { xs: 6, sm: 10, md: 16, lg: 24, xl: 36, xxl: 56 },
}

// Concentric radius — an inner element inside a padded shell should
// curve with `outer - pad` so the two arcs stay parallel (the
// "machined hardware" look). Floors at 4 so it never goes sharp.
export const concentric = (outer, pad) => Math.max(4, outer - pad)
