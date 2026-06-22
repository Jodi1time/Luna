import { useMemo, useState } from 'react'
import { T } from '../data/theme'
import { Screen } from '../components/shared'
import { ARTICLES } from '../data/lunaData'
import { CONDITIONS } from '../data/conditions'
import { useCycle } from '../hooks/useCycle'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { ARTICLE_PHASE, articleAccent as accentFor } from '../lib/articlePhase'
import Backdrop from '../components/Backdrop'
import useLuna from '../store/useLuna'
import { sectionColors, sectionPaper } from '../data/sectionPalette'

// Map an article's subject category to a section palette category so
// each article card / section header can wear a soft chromatic tint
// that matches what the piece is about. Mental Health pieces wear
// lavender; Nutrition wears gold; Conditions (PMDD, endo, PCOS) wear
// rose because they demand attention; body-literacy pieces wear sage.
const ARTICLE_CAT_TO_SECTION = {
  'Mental Health': 'reflect',
  'Nutrition':     'care',
  'Conditions':    'urgent',
  'Know your body':'read',
}
const articleSection = (cat) => ARTICLE_CAT_TO_SECTION[cat] || 'default'

const LIBRARY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'cycle', label: 'Cycle', categories: ['Nutrition', 'Know your body', 'Movement', 'Mental Health'] },
  { id: 'conditions', label: 'Conditions', categories: ['Conditions', 'Vaginal health', 'Pregnancy loss'] },
  { id: 'intimate', label: 'Intimate', categories: ['Sexual health'] },
  { id: 'basics', label: 'Basics', categories: ['Basics', 'Your Data'] },
]

// Pick a hero article for the current phase. Looks for articles
// explicitly mapped to this phase first; falls back to the basics
// piece, then the first article. Always returns something so the
// hero slot stays alive even pre-onboarding.
function pickHeroArticle(phaseId) {
  if (phaseId) {
    const match = ARTICLES.find((a) => ARTICLE_PHASE[a.id] === phaseId)
    if (match) return match
  }
  return ARTICLES.find((a) => a.id === 'basics') || ARTICLES[0]
}

// Group articles by category, preserving the original ARTICLES order
// within each category. Returns [{ cat, items }] in first-appearance
// order so the page reads top-to-bottom like a magazine table of
// contents, not a sorted database.
function groupByCategory(articles) {
  const order = []
  const map = new Map()
  for (const a of articles) {
    if (!map.has(a.cat)) {
      map.set(a.cat, [])
      order.push(a.cat)
    }
    map.get(a.cat).push(a)
  }
  return order.map((cat) => ({ cat, items: map.get(cat) }))
}

export default function Library() {
  const store = useLuna()
  const cycle = useCycle(store)
  const goArticle = useLuna((s) => s.goArticle)
  const go = useLuna((s) => s.go)
  const phaseId = cycle?.phase?.id || null
  const heroArticle = useMemo(() => pickHeroArticle(phaseId), [phaseId])
  const heroAccent = accentFor(heroArticle.id)
  const heroPhaseId = ARTICLE_PHASE[heroArticle.id] || phaseId || 'follicular'
  const conditionsAccent = sectionColors('urgent').accent
  const [activeFilter, setActiveFilter] = useState('all')

  // The body of the Library — every article except the hero, grouped
  // into sections so the page reads as an editorial table of contents.
  const visibleArticles = useMemo(() => {
    if (activeFilter === 'all') return ARTICLES.filter((a) => a.id !== heroArticle.id)
    const filter = LIBRARY_FILTERS.find((item) => item.id === activeFilter)
    return ARTICLES.filter((article) => filter?.categories?.includes(article.cat))
  }, [activeFilter, heroArticle.id])
  const sections = useMemo(() => groupByCategory(visibleArticles), [visibleArticles])

  return (
    <div className="home-stage">
      <Backdrop accent={heroAccent} subtle />
      <Screen>
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 22px 0', color: T.text }}>

        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1, marginBottom: 6, animationDelay: '0ms' }}>
          What to read.
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginBottom: 14, fontStyle: 'italic', animationDelay: '50ms' }}>
          Doctor-sourced, plain-English pieces on what your body is doing — and why.
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted, lineHeight: 1.55, padding: '10px 12px', background: 'rgba(200,78,46,0.07)', borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 16, animationDelay: '100ms' }}>
          Every piece is grounded in peer-reviewed research, ACOG, Cleveland Clinic, or the equivalent. References are named at the top of each article, not buried.
        </div>

        {/* Look it up — full-text search across every article,
            condition, phase, and body-literacy lesson. Distinct from
            the AI ("Talk to Luna") which lives on Home — this surface
            is the silent reference, no model, no chat. */}
        <button onClick={() => go('askLuna')}
          className="insight-stagger alive-card frost-card"
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(253,250,245,0.55)',
            border: `1px solid ${sectionColors('read').accent}28`,
            borderRadius: 18,
            padding: '12px 14px',
            cursor: 'pointer',
            marginBottom: 12,
            textAlign: 'left',
            color: T.text, fontFamily: 'inherit',
            animationDelay: '140ms',
          }}>
          <span aria-hidden="true" style={{ color: sectionColors('read').accent, display: 'inline-flex' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="5.5"/><path d="M13 13l4 4"/></svg>
          </span>
          <div style={{ flex: 1, fontFamily: T.serif, fontStyle: 'italic', fontSize: 14.5, color: T.muted, letterSpacing: -0.1 }}>
            Search the library — cramps, PCOS, why am I tired…
          </div>
          <span aria-hidden="true" style={{ fontFamily: T.mono, fontSize: 9.5, color: sectionColors('read').accent, letterSpacing: 1, fontWeight: 600 }}>
            SEARCH
          </span>
        </button>

        <div role="group" aria-label="Filter library by topic"
          className="insight-stagger"
          style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            margin: '0 -22px 22px', padding: '2px 22px 5px',
            animationDelay: '160ms',
          }}>
          {LIBRARY_FILTERS.map((filter) => {
            const selected = activeFilter === filter.id
            return (
              <button key={filter.id} type="button"
                onClick={() => setActiveFilter(filter.id)}
                aria-pressed={selected}
                className="alive-card"
                style={{
                  flex: '0 0 auto', padding: '9px 14px', borderRadius: 999,
                  border: `1px solid ${selected ? heroAccent + '55' : 'rgba(26,19,16,0.08)'}`,
                  background: selected ? `${heroAccent}16` : 'rgba(253,250,245,0.5)',
                  color: selected ? heroAccent : T.muted,
                  fontFamily: T.sans, fontSize: 11, fontWeight: 600,
                  letterSpacing: 0, cursor: 'pointer',
                }}>
                {filter.label}
              </button>
            )
          })}
        </div>

        {/* Conditions Atlas entry — the named-things-you-can-ask-for
            surface. Pulls from the conditions data. */}
        {(activeFilter === 'all' || activeFilter === 'conditions') && (
        <button onClick={() => go('conditions')}
          className="insight-stagger alive-card"
          style={{
            width: '100%',
            background: sectionPaper('urgent'),
            border: `1px solid ${conditionsAccent}22`,
            borderLeft: `3px solid ${conditionsAccent}`,
            borderRadius: 22,
            padding: '16px 18px',
            cursor: 'pointer',
            marginBottom: 28,
            textAlign: 'left',
            color: T.text, fontFamily: 'inherit',
            animationDelay: '180ms',
          }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: conditionsAccent, fontWeight: 600 }}>
              The Conditions Atlas
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted, letterSpacing: 0.5 }}>
              {CONDITIONS.length} CONDITIONS
            </div>
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1.3, marginBottom: 4 }}>
            Six conditions, named.
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.muted, lineHeight: 1.55 }}>
            PCOS · Endo · PMDD · Thyroid · Fibroids · HA — what they are, what to ask for, what works.
          </div>
        </button>
        )}

        {/* Hero — phase-matched feature with editorial treatment.
            Background now uses the article's subject-category tint
            from the section palette, so the card has real chromatic
            identity. Phase flourish + eyebrow + left edge still take
            the phase accent. */}
        {activeFilter === 'all' && (
        <button onClick={() => goArticle(heroArticle.id)}
          className="insight-stagger alive-card"
          style={{
            position: 'relative',
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '20px 20px 22px',
            background: sectionPaper(articleSection(heroArticle.cat)),
            border: `1px solid ${sectionColors(articleSection(heroArticle.cat)).accent}22`,
            borderLeft: `3px solid ${heroAccent}`,
            boxShadow: `0 1px 0 ${heroAccent}10, 0 12px 28px -20px ${heroAccent}30`,
            borderRadius: T.r,
            cursor: 'pointer',
            color: T.text,
            fontFamily: 'inherit',
            marginBottom: 32,
            animationDelay: '180ms',
            overflow: 'hidden',
          }}>
          {/* Phase flourish in the top-right corner, quietly */}
          <div aria-hidden="true" style={{ position: 'absolute', top: 16, right: 18, color: heroAccent, opacity: 0.55 }}>
            <PhaseFlourish phaseId={heroPhaseId} size={34} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14, paddingRight: 50 }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, fontWeight: 600, color: heroAccent }}>
              {phaseId ? `For your ${phaseId} phase` : 'Start here'}
            </span>
            <span style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted, letterSpacing: 0.5 }}>
              {heroArticle.read.toUpperCase()}
            </span>
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, lineHeight: 1.18, letterSpacing: -0.5, marginBottom: 10, paddingRight: 30 }}>
            {heroArticle.title}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15.5, fontStyle: 'italic', lineHeight: 1.55, color: T.text, opacity: 0.8 }}>
            {heroArticle.summary}
          </div>
          {heroArticle.sources?.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.hair}`, fontFamily: T.mono, fontSize: 10, color: T.muted, letterSpacing: 0.5 }}>
              {heroArticle.sources.length} reference{heroArticle.sources.length === 1 ? '' : 's'} · open piece →
            </div>
          )}
        </button>
        )}

        {/* Sectioned table of contents — by category, in the order
            categories first appear in the data. Reads like a magazine
            TOC rather than a database list. */}
        {sections.map((section, sIdx) => {
          const sectionDelay = 260 + sIdx * 100
          const secKey = articleSection(section.cat)
          const secCol = sectionColors(secKey)
          return (
            <div key={section.cat} style={{ marginBottom: 22 }}>
              <div className="insight-stagger" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, animationDelay: `${sectionDelay}ms` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: secCol.accent, opacity: 0.7, transform: 'translateY(-2px)', display: 'inline-block' }} />
                  <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, letterSpacing: -0.3, fontStyle: 'italic' }}>
                    {section.cat}.
                  </div>
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted, letterSpacing: 1, fontWeight: 600 }}>
                  {section.items.length} PIECE{section.items.length === 1 ? '' : 'S'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.items.map((a, iIdx) => {
                  const ac = accentFor(a.id)
                  const cardDelay = sectionDelay + 60 + iIdx * 60
                  return (
                    <button key={a.id} onClick={() => goArticle(a.id)}
                      className="insight-stagger alive-card"
                      style={{
                        background: sectionPaper(secKey),
                        border: `1px solid ${secCol.accent}22`,
                        borderLeft: `3px solid ${ac}`,
                        textAlign: 'left',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        width: '100%',
                        color: T.text,
                        fontFamily: 'inherit',
                        borderRadius: T.r,
                        boxShadow: `0 1px 0 ${secCol.accent}10, 0 8px 18px -18px ${secCol.accent}30`,
                        animationDelay: `${cardDelay}ms`,
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        {a.tag ? (
                          <span style={{ fontSize: 9.5, fontFamily: T.mono, color: ac, letterSpacing: 0.8, fontWeight: 600 }}>
                            {a.tag.toLowerCase()}
                          </span>
                        ) : <span />}
                        <span style={{ fontSize: 10, color: T.muted, fontFamily: T.mono, letterSpacing: 0.4 }}>{a.read}</span>
                      </div>
                      <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.25, marginBottom: 6, letterSpacing: -0.3 }}>
                        {a.title}
                      </div>
                      <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, lineHeight: 1.55, fontStyle: 'italic' }}>
                        {a.summary}
                      </div>
                      {a.sources?.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 9.5, fontFamily: T.mono, color: T.muted, letterSpacing: 0.4 }}>
                          {a.sources.length} reference{a.sources.length === 1 ? '' : 's'}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div style={{ height: 16 }} />
      </div>
      </Screen>
    </div>
  )
}
