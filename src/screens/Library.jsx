import { useMemo, useState } from 'react'
import { T } from '../data/theme'
import { Screen } from '../components/shared'
import { ARTICLES } from '../data/lunaData'
import { useCycle } from '../hooks/useCycle'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { ARTICLE_PHASE, articleAccent as accentFor } from '../lib/articlePhase'
import Backdrop from '../components/Backdrop'
import useLuna from '../store/useLuna'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import { MoonMark } from '../components/Illustrations'

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

// Pick a hero article for the current phase, preferring pieces she
// hasn't opened yet so the slot always offers something new. Falls
// back: unread phase match → any phase match → unread anything →
// basics → first article. Always returns something.
function pickHeroArticle(phaseId, readSet) {
  if (phaseId) {
    const phaseMatches = ARTICLES.filter((a) => ARTICLE_PHASE[a.id] === phaseId)
    const unreadMatch = phaseMatches.find((a) => !readSet.has(a.id))
    if (unreadMatch) return unreadMatch
    if (phaseMatches.length) return phaseMatches[0]
  }
  const unread = ARTICLES.find((a) => !readSet.has(a.id))
  if (unread) return unread
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
  const settings = useLuna((s) => s.settings)
  const phaseId = cycle?.phase?.id || null
  const readSet = useMemo(
    () => new Set(Array.isArray(settings?.articlesRead) ? settings.articlesRead : []),
    [settings?.articlesRead]
  )
  const savedArticles = useMemo(
    () => (Array.isArray(settings?.savedArticles) ? settings.savedArticles : [])
      .map((id) => ARTICLES.find((a) => a.id === id))
      .filter(Boolean),
    [settings?.savedArticles]
  )
  const heroArticle = useMemo(() => pickHeroArticle(phaseId, readSet), [phaseId, readSet])
  const heroAccent = accentFor(heroArticle.id)
  const heroPhaseId = ARTICLE_PHASE[heroArticle.id] || phaseId || 'follicular'
  const conditionsAccent = sectionColors('urgent').accent

  // The body of the Library — every article except the hero, grouped
  // into sections so the page reads as an editorial table of contents.
  const restArticles = useMemo(() => ARTICLES.filter((a) => a.id !== heroArticle.id), [heroArticle.id])
  const sections = useMemo(() => groupByCategory(restArticles), [restArticles])

  return (
    <div className="home-stage">
      <Backdrop accent={heroAccent} subtle />
      <Screen>
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 22px 0', color: T.text }}>

        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6, animationDelay: '0ms' }}>
          <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1, flex: 1 }}>
            What to read.
          </div>
          <div aria-hidden="true" style={{ color: sectionColors('read').accent, opacity: 0.6, paddingTop: 4 }}>
            <MoonMark size={28} />
          </div>
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginBottom: 16, fontStyle: 'italic', animationDelay: '50ms' }}>
          Doctor-sourced, plain-English pieces on what your body is doing — and why.
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
            marginBottom: 22,
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
          <span aria-hidden="true" style={{ fontFamily: T.mono, fontSize: 11, color: sectionColors('read').accent, letterSpacing: 1, fontWeight: 600 }}>
            SEARCH
          </span>
        </button>

        {/* Saved shelf — the payoff for the heart button on articles.
            Only mounts once she's saved something; a quiet horizontal
            row, newest save last so it reads like a growing stack. */}
        {savedArticles.length > 0 && (
          <div className="insight-stagger" style={{ marginBottom: 24, animationDelay: '160ms' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span aria-hidden="true" style={{ color: sectionColors('reflect').accent, display: 'inline-flex', transform: 'translateY(1px)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9C0.5 8 3 4 6.5 4c2 0 3.4 1 5.5 3 2.1-2 3.5-3 5.5-3 3.5 0 6 4 4 8-2.5 4.5-9.5 9-9.5 9z"/></svg>
              </span>
              <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, letterSpacing: -0.3, fontStyle: 'italic' }}>
                Saved for later.
              </div>
            </div>
            <div className="h-scroller" style={{ display: 'flex', gap: 10, overflowX: 'auto', margin: '0 -22px', padding: '0 22px 4px' }}>
              {savedArticles.map((a) => (
                <button key={a.id} onClick={() => goArticle(a.id)}
                  className="alive-card"
                  style={{
                    flexShrink: 0, width: 200, textAlign: 'left',
                    background: sectionPaper(articleSection(a.cat)),
                    border: `1px solid ${sectionColors(articleSection(a.cat)).accent}22`,
                    borderRadius: 16, padding: '12px 14px',
                    cursor: 'pointer', color: T.text, fontFamily: 'inherit',
                  }}>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: 0.4, marginBottom: 6 }}>
                    {a.read}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, lineHeight: 1.25, letterSpacing: -0.2 }}>
                    {a.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conditions Atlas entry — the named-things-you-can-ask-for
            surface. Pulls from the conditions data. */}
        <button onClick={() => go('conditions')}
          className="insight-stagger alive-card"
          style={{
            width: '100%',
            background: sectionPaper('urgent'),
            border: `1px solid ${conditionsAccent}22`,
            borderRadius: 22,
            padding: '16px 18px',
            cursor: 'pointer',
            marginBottom: 28,
            textAlign: 'left',
            color: T.text, fontFamily: 'inherit',
            animationDelay: '180ms',
          }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.4, color: conditionsAccent, fontWeight: 600, marginBottom: 4 }}>
            The Conditions Atlas
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1.3, marginBottom: 4 }}>
            Six conditions, named.
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.muted, lineHeight: 1.55 }}>
            PCOS · Endo · PMDD · Thyroid · Fibroids · HA — what they are, what to ask for, what works.
          </div>
        </button>

        {/* Hero — phase-matched feature with editorial treatment.
            Background now uses the article's subject-category tint
            from the section palette, so the card has real chromatic
            identity. Phase flourish + eyebrow + left edge still take
            the phase accent. */}
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
            <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.4, fontWeight: 600, color: heroAccent }}>
              {phaseId ? `For your ${phaseId} phase` : 'Start here'}
            </span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: 0.5 }}>
              {heroArticle.read.toUpperCase()}
            </span>
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, lineHeight: 1.18, letterSpacing: -0.5, marginBottom: 10, paddingRight: 30 }}>
            {heroArticle.title}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15.5, fontStyle: 'italic', lineHeight: 1.55, color: T.text, opacity: 0.8 }}>
            {heroArticle.summary}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.hair}`, fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: 0.5 }}>
            open piece →
          </div>
        </button>

        {/* Sectioned table of contents — by category, in the order
            categories first appear in the data. Reads like a magazine
            TOC rather than a database list. */}
        {sections.map((section, sIdx) => {
          const sectionDelay = 260 + sIdx * 100
          const secKey = articleSection(section.cat)
          const secCol = sectionColors(secKey)
          return (
            <div key={section.cat} style={{ marginBottom: 22 }}>
              <div className="insight-stagger" style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12, animationDelay: `${sectionDelay}ms` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: secCol.accent, opacity: 0.7, transform: 'translateY(-2px)', display: 'inline-block' }} />
                <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, letterSpacing: -0.3, fontStyle: 'italic' }}>
                  {section.cat}.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.items.map((a, iIdx) => {
                  const ac = accentFor(a.id)
                  const cardDelay = sectionDelay + 60 + iIdx * 60
                  const isRead = readSet.has(a.id)
                  return (
                    <button key={a.id} onClick={() => goArticle(a.id)}
                      className="insight-stagger alive-card"
                      style={{
                        background: sectionPaper(secKey),
                        border: `1px solid ${secCol.accent}22`,
                        textAlign: 'left',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        width: '100%',
                        color: T.text,
                        fontFamily: 'inherit',
                        borderRadius: T.r,
                        boxShadow: `0 1px 0 ${secCol.accent}10, 0 8px 18px -18px ${secCol.accent}30`,
                        animationDelay: `${cardDelay}ms`,
                        // Read pieces settle back — still there, just quieter,
                        // so the eye lands on what's new.
                        opacity: isRead ? 0.62 : 1,
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        {a.tag ? (
                          <span style={{ fontSize: 11, fontFamily: T.mono, color: ac, letterSpacing: 0.8, fontWeight: 600 }}>
                            {a.tag.toLowerCase()}
                          </span>
                        ) : <span />}
                        <span style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, letterSpacing: 0.4 }}>
                          {isRead ? 'read · ' : ''}{a.read}
                        </span>
                      </div>
                      <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.25, marginBottom: 6, letterSpacing: -0.3 }}>
                        {a.title}
                      </div>
                      <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, lineHeight: 1.55, fontStyle: 'italic' }}>
                        {a.summary}
                      </div>
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
