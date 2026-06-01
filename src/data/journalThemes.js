// Preset color palettes for the Journal. Each one is a complete
// "mood" for the page: paper color, accent (margin line + headings),
// text color, and a soft sub-paper for cards/wells inside the page.
//
// 'cream' keeps Luna's default register and uses the user's phase
// color for accent at render time (passed in dynamically). The
// others are fixed palettes — "decorate the diary how you want."
export const JOURNAL_THEMES = {
  cream: {
    label: 'Cream',
    paper: '#FAF4DC',
    sub:   '#F5EED0',
    text:  '#1A1310',
    accent: null, // null → use the day's phase color
    swatch: '#FAF4DC',
  },
  pink: {
    label: 'Pink',
    paper: '#FBE7EE',
    sub:   '#F5D8E1',
    text:  '#3A1A24',
    accent: '#D85F87',
    swatch: '#F5D8E1',
  },
  lavender: {
    label: 'Lavender',
    paper: '#EEE7F3',
    sub:   '#E4D8EA',
    text:  '#241934',
    accent: '#9F7BB8',
    swatch: '#E4D8EA',
  },
  sage: {
    label: 'Sage',
    paper: '#E8EDDD',
    sub:   '#D9E1CB',
    text:  '#1F2A1F',
    accent: '#7A9070',
    swatch: '#D9E1CB',
  },
  peach: {
    label: 'Peach',
    paper: '#FCEBDB',
    sub:   '#F7DCC4',
    text:  '#3A2415',
    accent: '#E0A179',
    swatch: '#F7DCC4',
  },
  sky: {
    label: 'Sky',
    paper: '#E0EDF1',
    sub:   '#CFE0E7',
    text:  '#1F2A33',
    accent: '#7BA0B5',
    swatch: '#CFE0E7',
  },
  moonlight: {
    label: 'Moonlight',
    paper: '#E8E1F0',
    sub:   '#DDD3E8',
    text:  '#221A2D',
    accent: '#7E5DA8',
    swatch: '#DDD3E8',
  },
}

export const THEME_IDS = Object.keys(JOURNAL_THEMES)

// Decoration options. Each renders a scattered set of small shapes
// over the journal page (or the whole app when applyToApp is on).
// User can toggle any combination on/off — it's their book.
export const DECORATIONS = [
  { id: 'hearts',     label: 'Hearts',     emoji: '♡' },
  { id: 'stars',      label: 'Stars',      emoji: '✦' },
  { id: 'flowers',    label: 'Flowers',    emoji: '✿' },
  { id: 'butterflies',label: 'Butterflies',emoji: '⌖' },
  { id: 'moons',      label: 'Moons',      emoji: '☾' },
  { id: 'sparkles',   label: 'Sparkles',   emoji: '✧' },
]

// Default theme state stored on settings.journalTheme.
export const DEFAULT_JOURNAL_THEME = {
  themeId: 'cream',
  decorations: [],
  applyToApp: false,
  // 'blob' | 'moons' | 'aurora' | 'silk' | 'petals' | 'galaxy' —
  // the animated atmosphere behind every screen. Default is the
  // signature breathing blob.
  backdropKind: 'blob',
  // When themeId === 'custom', these drive the paper. Either a solid
  // colour (custom.color) or a two-colour gradient (custom.color +
  // custom.color2 + custom.angle, gradient=true).
  custom: {
    color:    '#F5E6D3',   // warm pastel start — neutral default
    color2:   '#E8C8B5',   // gentle end colour for gradients
    angle:    150,         // gradient direction in degrees
    gradient: false,       // false → solid color; true → linear-gradient
  },
  // Override for the backdrop accent. null → tie to today's phase
  // (the default — Luna's signature look). Any hex string → use
  // that color for the backdrop instead, regardless of phase. Lets
  // users break the phase tie when it clashes with their paper.
  backdrop: {
    accent: null,
  },
}

// Add 'custom' as a virtual theme entry the picker can show as a
// separate "build your own" tile. resolveTheme() handles it below.
JOURNAL_THEMES.custom = {
  label: 'Custom',
  paper: '#F5E6D3',
  sub:   '#E8DAC8',
  text:  '#2A1F18',
  accent: null,
  swatch: '#F5E6D3',
  isCustom: true,
}

// Resolve a theme into its color values. Passing a phaseColor uses
// it as the accent for the 'cream' default theme (Luna's signature
// phase-aware look) — all other themes have a fixed accent.
//
// When themeId === 'custom', the optional `custom` config drives
// the paper background — either a solid color or a linear-gradient.
// The resolved object adds a `paperBg` field that callers should
// USE in place of `paper` if they want to honour gradients (the
// `paper` field stays a single color for places that need one).
export function resolveTheme(themeId, phaseColor, custom) {
  const t = JOURNAL_THEMES[themeId] || JOURNAL_THEMES.cream
  let paper = t.paper
  let paperBg = t.paper
  let accent = t.accent || phaseColor || '#C84E2E'
  let text = t.text
  if (themeId === 'custom' && custom) {
    paper = custom.color || t.paper
    paperBg = custom.gradient
      ? `linear-gradient(${custom.angle ?? 150}deg, ${custom.color || t.paper}, ${custom.color2 || t.paper})`
      : (custom.color || t.paper)
    // Pick text color by paper lightness — light papers get dark
    // text, dark papers get light text. Naive luma calc, plenty here.
    const lum = paperLuminance(custom.color || t.paper)
    text = lum > 0.6 ? '#2A1F18' : '#F5EDE0'
  }
  return {
    ...t,
    paper,
    paperBg,
    text,
    accent,
  }
}

// Relative luminance (0..1) from a hex color, naive sRGB.
function paperLuminance(hex) {
  const h = (hex || '#FFFFFF').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}
