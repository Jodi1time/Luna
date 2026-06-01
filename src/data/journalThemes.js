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
  // 'blob' | 'moons' | 'aurora' | 'petals' | 'constellation' —
  // the animated atmosphere behind every screen. Default is the
  // signature breathing blob.
  backdropKind: 'blob',
}

// Resolve a theme into its color values. Passing a phaseColor uses
// it as the accent for the 'cream' default theme (Luna's signature
// phase-aware look) — all other themes have a fixed accent.
export function resolveTheme(themeId, phaseColor) {
  const t = JOURNAL_THEMES[themeId] || JOURNAL_THEMES.cream
  return {
    ...t,
    accent: t.accent || phaseColor || '#C84E2E',
  }
}
