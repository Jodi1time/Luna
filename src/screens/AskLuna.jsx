import { useEffect, useMemo, useRef, useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Screen, Eyebrow } from '../components/shared'
import { ARTICLES, SYMPTOMS, PHASES } from '../data/lunaData'
import { CONDITIONS } from '../data/conditions'
import ContextualTip from '../components/ContextualTip'
import { FLOW_LESSONS, MUCUS_LESSONS, SLEEP_LESSONS, BBT_LESSONS, DAILY_LESSON_POOL } from '../data/bodyLiteracy'
import { SourceTag } from '../components/Sourced'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import useLuna from '../store/useLuna'

// Build a searchable corpus across every piece of authored content
// in Luna. Each entry: { id, type, title, body[], source, route }.
// Search is plain-text token AND with light scoring (title hits > body
// hits). No third-party fuzzy library — keeps bundle small.
function buildCorpus() {
  const entries = []
  for (const a of ARTICLES) {
    entries.push({
      id: `article:${a.id}`,
      type: 'article',
      kind: 'Article',
      title: a.title,
      summary: a.summary,
      body: [a.summary, ...(a.body || [])],
      source: (a.sources || [])[0],
      route: { screen: 'article', activeArticleId: a.id },
    })
  }
  for (const [id, s] of Object.entries(SYMPTOMS)) {
    entries.push({
      id: `symptom:${id}`,
      type: 'symptom',
      kind: 'Symptom',
      title: s.label,
      summary: s.why,
      body: [s.why, ...(Array.isArray(s.evidence) ? s.evidence : []), s.redFlag].filter(Boolean),
      source: s.source,
      route: { screen: 'symptom', activeSymptomId: id },
    })
  }
  for (const [pid, p] of Object.entries(PHASES)) {
    entries.push({
      id: `phase:${pid}`,
      type: 'phase',
      kind: 'Phase',
      title: `${p.name} phase`,
      summary: p.whatsHappening,
      body: [p.whatsHappening, p.bodyMood, p.hormones, p.nutrition?.headline, p.exercise?.headline].filter(Boolean),
      source: p.sourceBody,
      route: { screen: 'phase', activePhaseId: pid },
    })
  }
  for (const c of CONDITIONS) {
    entries.push({
      id: `condition:${c.id}`,
      type: 'condition',
      kind: 'Condition',
      title: c.name,
      summary: c.summary,
      body: [c.summary, ...c.whatItIs, ...(c.commonSigns || [])],
      source: (c.sources || [])[0],
      route: { screen: 'conditions', activeConditionId: c.id },
    })
  }
  // Pull every body-literacy lesson too — flow, mucus, sleep, BBT, daily pool
  const addLessonList = (kind, map) => {
    for (const [k, v] of Object.entries(map)) {
      const lessons = v.any ? [v.any] : Object.values(v).filter(Boolean)
      for (const l of lessons) {
        if (!l?.title) continue
        entries.push({
          id: `${kind}:${k}:${l.title}`,
          type: 'literacy',
          kind: kind.charAt(0).toUpperCase() + kind.slice(1),
          title: l.title,
          summary: l.body,
          body: [l.body],
          source: l.source,
          route: null,
        })
      }
    }
  }
  addLessonList('flow', FLOW_LESSONS)
  addLessonList('mucus', MUCUS_LESSONS)
  addLessonList('sleep', SLEEP_LESSONS)
  addLessonList('bbt', BBT_LESSONS)
  // Daily pool
  for (const [phaseId, pool] of Object.entries(DAILY_LESSON_POOL)) {
    pool.forEach((lesson, i) => {
      entries.push({
        id: `daily:${phaseId}:${i}`,
        type: 'literacy',
        kind: 'Daily',
        title: lesson.title,
        summary: lesson.body,
        body: [lesson.body],
        source: lesson.source,
        route: { screen: 'phase', activePhaseId: phaseId },
      })
    })
  }
  return entries
}

function tokens(s) {
  return String(s || '').toLowerCase().match(/[a-z0-9]+/g) || []
}

function search(corpus, query) {
  const q = tokens(query).filter((t) => t.length >= 2)
  if (q.length === 0) return []
  const scored = []
  for (const e of corpus) {
    const titleToks = tokens(e.title)
    const bodyToks = tokens([e.summary, ...(e.body || [])].join(' '))
    let titleHits = 0
    let bodyHits = 0
    let anyMissing = false
    for (const t of q) {
      const inT = titleToks.some((x) => x === t || x.startsWith(t))
      const inB = bodyToks.some((x) => x === t || x.startsWith(t))
      if (inT) titleHits++
      else if (inB) bodyHits++
      else { anyMissing = true; break }
    }
    if (anyMissing) continue
    // Score: title hits weigh more than body hits.
    const score = titleHits * 4 + bodyHits
    scored.push({ entry: e, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 12).map((x) => x.entry)
}

// Each suggestion is tuned to surface at least one strong result —
// usually an article match — so the shortcut doesn't promise an answer
// the corpus can't deliver. Reviewed when new articles land.
const SUGGESTED = [
  'cramps endometriosis',
  'spotting between periods',
  'PMDD',
  'why am I tired',
  'egg white mucus',
  'painful sex',
  'iron heavy bleeding',
  'PCOS',
  'BBT charting',
  'late period',
  'perimenopause',
  'birth control side effects',
  'stress missed period',
  'mittelschmerz ovulation pain',
  'cervical screening Pap HPV',
  'jaw acne hormonal',
]

export default function AskLuna() {
  const store = useLuna()
  const { back, go } = store
  const accent = sectionColors('read').accent
  const corpus = useMemo(() => buildCorpus(), [])
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => search(corpus, query), [corpus, query])
  const topResult = query ? results[0] : null
  const moreResults = query ? results.slice(1) : []

  const openResult = (entry) => {
    if (!entry.route) return
    const { screen, ...params } = entry.route
    go(screen, params)
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="look it up" onBack={back} />
      </div>

      <div style={{ padding: '8px 22px 14px' }}>
        <div className="insight-stagger" style={{ animationDelay: '0ms' }}>
          <Eyebrow color={accent}>Sourced, plain English</Eyebrow>
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 33, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.08, marginBottom: 12, animationDelay: '40ms', textWrap: 'balance' }}>
          What do you want to understand?
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.65, color: T.muted, marginBottom: 14, fontStyle: 'italic', animationDelay: '65ms', maxWidth: 320 }}>
          Search the library in your own words. Luna will bring back the closest sourced page, symptom note, phase explanation, or condition guide.
        </div>

        <ContextualTip tipId="lookup-intro" accent={accent}>
          Plain words work best here. “Why am I tired?” usually works better than trying to search like a textbook.
        </ContextualTip>

        <div className="insight-stagger frost-card" style={{
          marginTop: 10, marginBottom: 14, padding: '4px 6px',
          background: 'rgba(253,250,245,0.55)',
          border: `1px solid ${accent}28`,
          borderRadius: 18,
          display: 'flex', alignItems: 'center', gap: 8,
          animationDelay: '90ms',
        }}>
          <span aria-hidden="true" style={{ color: accent, padding: '6px 4px 6px 10px', display: 'inline-flex' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="5.5" /><path d="M13 13l4 4" /></svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="cramps, PCOS, why am I tired…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: T.serif, fontSize: 17, padding: '12px 8px 12px 0',
              color: T.text, letterSpacing: -0.3, fontStyle: 'italic',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, padding: '6px 12px' }}>×</button>
          )}
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.5, marginBottom: 12, animationDelay: '140ms' }}>
          Results come from Luna's sourced writing inside the app. References stay attached to the page they came from.
        </div>

        {!query && (
          <div className="insight-stagger" style={{ animationDelay: '200ms' }}>
            <div style={{ fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', color: T.text, opacity: 0.62, marginBottom: 10 }}>
              You could start with:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTED.map((s) => (
                <button key={s} onClick={() => setQuery(s)}
                  className="frost-card"
                  style={{
                    background: 'rgba(253,250,245,0.55)',
                    border: '1px solid rgba(26,19,16,0.08)',
                    borderRadius: 999,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    fontFamily: T.serif, fontStyle: 'italic',
                    fontSize: 13, color: T.text, letterSpacing: -0.1,
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {query && results.length === 0 && (
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, fontStyle: 'italic', marginTop: 8, lineHeight: 1.55 }}>
            Nothing is surfacing for that phrase. Try the symptom, body part, or concern in simpler words.
          </div>
        )}

        {query && topResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <button key={topResult.id} onClick={() => openResult(topResult)}
              disabled={!topResult.route}
              className="alive-card"
              style={{
                padding: 18,
                background: sectionPaper('read'),
                border: `1px solid ${accent}22`,
                borderRadius: 20,
                textAlign: 'left', cursor: topResult.route ? 'pointer' : 'default',
                color: T.text, fontFamily: 'inherit',
                width: '100%', display: 'block',
                boxShadow: `0 1px 0 ${accent}10, 0 14px 30px -22px ${accent}32`,
              }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div style={{ fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', fontWeight: 500, color: accent, letterSpacing: -0.08 }}>
                  Best match
                </div>
                {topResult.route && (
                  <div style={{ fontFamily: T.sans, fontSize: 11, color: accent, fontWeight: 600, letterSpacing: 0.2 }}>
                    Open it →
                  </div>
                )}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: 1.1, fontWeight: 600, color: T.muted, marginBottom: 8 }}>
                {topResult.kind}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, lineHeight: 1.28, letterSpacing: -0.25, marginBottom: 8 }}>
                {topResult.title}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, lineHeight: 1.58, fontStyle: 'italic' }}>
                {String(topResult.summary || '').slice(0, 220)}{(topResult.summary || '').length > 220 ? '…' : ''}
              </div>
              {topResult.source && (
                <div style={{ marginTop: 12 }}>
                  <SourceTag color={accent} compact>{topResult.source}</SourceTag>
                </div>
              )}
            </button>

            {moreResults.length > 0 && (
              <div style={{ marginTop: 2 }}>
                <div style={{ fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', color: T.text, opacity: 0.62, marginBottom: 10 }}>
                  More nearby answers
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {moreResults.map((r) => (
                    <button key={r.id} onClick={() => openResult(r)}
                      disabled={!r.route}
                      className="alive-card"
                      style={{
                        padding: 14,
                        background: 'rgba(253,250,245,0.52)',
                        border: `1px solid ${accent}1c`,
                        borderRadius: 16,
                        textAlign: 'left', cursor: r.route ? 'pointer' : 'default',
                        color: T.text, fontFamily: 'inherit',
                        width: '100%', display: 'block',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: 1.1, fontWeight: 600, color: T.muted }}>
                          {r.kind}
                        </div>
                        {r.route && (
                          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: 0.2 }}>
                            open →
                          </div>
                        )}
                      </div>
                      <div style={{ fontFamily: T.serif, fontSize: 16.5, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2, marginBottom: 6 }}>
                        {r.title}
                      </div>
                      <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, lineHeight: 1.55, fontStyle: 'italic' }}>
                        {String(r.summary || '').slice(0, 140)}{(r.summary || '').length > 140 ? '…' : ''}
                      </div>
                      {r.source && (
                        <div style={{ marginTop: 10 }}>
                          <SourceTag color={accent} compact>{r.source}</SourceTag>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Screen>
  )
}
