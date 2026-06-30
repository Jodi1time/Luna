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
    paper: '#FFF8EA',
    sub:   '#F3E9D7',
    text:  '#2B211C',
    accent: null, // null → use the day's phase color
    swatch: '#FFF8EA',
  },
  pink: {
    label: 'Rose',
    paper: '#F6E5E4',
    sub:   '#EDD3D2',
    text:  '#39201E',
    accent: '#B9828D',
    swatch: '#EDD3D2',
  },
  lavender: {
    label: 'Plum',
    paper: '#ECE5EA',
    sub:   '#DED4DE',
    text:  '#281E28',
    accent: '#74637D',
    swatch: '#DED4DE',
  },
  sage: {
    label: 'Sage',
    paper: '#E7ECDF',
    sub:   '#D8E0CE',
    text:  '#222A20',
    accent: '#7F9271',
    swatch: '#D8E0CE',
  },
  peach: {
    label: 'Clay',
    paper: '#F3E1D4',
    sub:   '#E8CDBB',
    text:  '#35231D',
    accent: '#B98370',
    swatch: '#E8CDBB',
  },
  sky: {
    label: 'Mist',
    paper: '#E9EEE9',
    sub:   '#D9E1DB',
    text:  '#202926',
    accent: '#7F9271',
    swatch: '#D9E1DB',
  },
  moonlight: {
    label: 'Taupe',
    paper: '#E8E0DA',
    sub:   '#DCD1CA',
    text:  '#2C211E',
    accent: '#7D6D65',
    swatch: '#DCD1CA',
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
  let accent = t.accent || phaseColor || '#6B4739'
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
