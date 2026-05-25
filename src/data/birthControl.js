// Birth-control method definitions shared between Settings / Home labels
// and the full BirthControl screen. Lives in /data so importing labels
// from a tab screen doesn't force the lazy BirthControl screen into the
// main bundle.

export const BC_METHODS = [
  { id: 'none',          name: 'Not on birth control',       blurb: 'Tracking your natural cycle.' },
  { id: 'combined-pill', name: 'Combined pill',              blurb: '21 active + 7 placebo. The bleed during placebo days is a withdrawal bleed, not a true period.' },
  { id: 'mini-pill',     name: 'Mini-pill (progestin-only)', blurb: 'Taken daily at the same time. Bleeding patterns can be unpredictable.' },
  { id: 'hormonal-iud',  name: 'Hormonal IUD',               blurb: 'Mirena, Kyleena, Liletta, Skyla. Many users have lighter or absent periods over time.' },
  { id: 'copper-iud',    name: 'Copper IUD',                 blurb: 'Non-hormonal. Your natural cycle continues; periods may be heavier or longer.' },
  { id: 'implant',       name: 'Implant',                    blurb: 'Nexplanon. Bleeding patterns vary widely — some have none, some have spotting.' },
  { id: 'shot',          name: 'Injection',                  blurb: 'Depo-Provera, every 12–13 weeks. Bleeding usually becomes lighter or absent.' },
  { id: 'patch',         name: 'Patch',                      blurb: 'Worn weekly. Hormone pattern similar to the combined pill.' },
  { id: 'ring',          name: 'Vaginal ring',               blurb: 'NuvaRing, Annovera. Hormone pattern similar to the combined pill.' },
]

export const BC_LABELS = BC_METHODS.reduce((acc, m) => {
  acc[m.id] = m.id === 'none' ? 'None' : m.name
  return acc
}, {})
