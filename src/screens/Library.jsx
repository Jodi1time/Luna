import { useMemo, useState } from 'react'
import { T } from '../data/theme'
import { Eyebrow, Rule, Screen } from '../components/shared'
import { ARTICLES, PHASES } from '../data/lunaData'
import { useCycle } from '../hooks/useCycle'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { ARTICLE_PHASE, articleAccent as accentFor } from '../lib/articlePhase'
import useLuna from '../store/useLuna'

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
  const phaseId = cycle?.phase?.id || null
  const heroArticle = useMemo(() => pickHeroArticle(phaseId), [phaseId])
  const heroAccent = accentFor(heroArticle.id)
  const heroPhaseId = ARTICLE_PHASE[heroArticle.id] || phaseId || 'follicular'

  // The body of the Library — every article except the hero, grouped
  // into sections so the page reads as an editorial table of contents.
  const restArticles = useMemo(() => ARTICLES.filter((a) => a.id !== heroArticle.id), [heroArticle.id])
  const sections = useMemo(() => groupByCategory(restArticles), [restArticles])

  return (
    <div className="home-stage">
      <div className="blob-stage subtle" aria-hidden="true">
        <div className="breathing-blob" style={{ '--phase-color': heroAccent }} />
      </div>
      <Screen>
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 22px 0', color: T.text }}>

        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1, marginBottom: 6, animationDelay: '0ms' }}>
          What to read.
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginBottom: 14, fontStyle: 'italic', animationDelay: '50ms' }}>
          Doctor-sourced, plain-English pieces on what your body is doing — and why.
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted, lineHeight: 1.55, padding: '10px 12px', background: 'rgba(200,78,46,0.07)', borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 26, animationDelay: '100ms' }}>
          Every piece is grounded in peer-reviewed research, ACOG, Cleveland Clinic, or the equivalent. References are named at the top of each article, not buried.
        </div>

        {/* Hero — phase-matched feature with editorial treatment.
            Bigger headline, larger summary, phase flourish in corner,
            soft phase-color wash on the left side. */}
        <button onClick={() => goArticle(heroArticle.id)}
          className="insight-stagger"
          style={{
            position: 'relative',
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '20px 20px 22px',
            background: `linear-gradient(to right, ${heroAccent}14, rgba(255,255,255,0.5) 70%)`,
            borderLeft: `3px solid ${heroAccent}`,
            borderRadius: T.r,
            cursor: 'pointer',
            color: T.text,
            fontFamily: 'inherit',
            border: 'none',
            marginBottom: 32,
            animationDelay: '180ms',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
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

        {/* Sectioned table of contents — by category, in the order
            categories first appear in the data. Reads like a magazine
            TOC rather than a database list. */}
        {sections.map((section, sIdx) => {
          const sectionDelay = 260 + sIdx * 100
          return (
            <div key={section.cat} style={{ marginBottom: 22 }}>
              <div className="insight-stagger" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, animationDelay: `${sectionDelay}ms` }}>
                <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, letterSpacing: -0.3, fontStyle: 'italic' }}>
                  {section.cat}.
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
                      className="glass-card insight-stagger"
                      style={{
                        borderLeft: `3px solid ${ac}`,
                        textAlign: 'left',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        width: '100%',
                        color: T.text,
                        fontFamily: 'inherit',
                        borderRadius: T.r,
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
