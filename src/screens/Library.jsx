import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import { ARTICLES, PHASES } from '../data/lunaData'
import useLuna from '../store/useLuna'

// Map each article to the phase it most relates to. Drives the
// left-accent stripe + tag color on the Library list. Articles
// without a phase home use the default accent.
const ARTICLE_PHASE = {
  pmdd:                  'luteal',
  iron:                  'menstrual',
  endo:                  'menstrual',
  pcos:                  'follicular',
  cravings:              'luteal',
  exercise:              'ovulation',
  basics:                null,
  privacy:               null,
  'anatomy-cervix':      null,
  'anatomy-corpus-luteum': 'luteal',
  'anatomy-discharge':   'ovulation',
}
const accentFor = (id) => {
  const phaseId = ARTICLE_PHASE[id]
  return phaseId ? PHASES[phaseId].color : T.accent
}

export default function Library() {
  const goArticle = useLuna((s) => s.goArticle)
  const cats = ['All', ...new Set(ARTICLES.map((a) => a.cat))]
  const [cat, setCat] = useState('All')
  const filtered = cat === 'All' ? ARTICLES : ARTICLES.filter((a) => a.cat === cat)

  return (
    <div className="home-stage">
      <div className="blob-stage subtle" aria-hidden="true">
        <div className="breathing-blob" style={{ '--phase-color': T.accent }} />
      </div>
      <Screen>
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 22px 0', color: T.text }}>
        <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1, marginBottom: 6 }}>
          What to read.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginBottom: 14, fontStyle: 'italic' }}>
          Doctor-sourced, plain-English pieces on what your body is doing — and why.
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted, lineHeight: 1.55, padding: '10px 12px', background: 'rgba(200,78,46,0.07)', borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 4 }}>
          Every piece is grounded in peer-reviewed research, ACOG, Cleveland Clinic, or the equivalent. References are named at the top of each article, not buried.
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 6, marginTop: 18, flexWrap: 'wrap' }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              style={{ background: cat === c ? T.text : 'transparent', color: cat === c ? T.bg : T.text, border: `1px solid ${cat === c ? T.text : T.hair}`, padding: '6px 10px', cursor: 'pointer', fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, borderRadius: T.r }}>
              {c}
            </button>
          ))}
        </div>

        <Rule />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((a) => {
            const ac = accentFor(a.id)
            return (
              <button key={a.id} onClick={() => goArticle(a.id)} className="glass-card"
                style={{ borderLeft: `3px solid ${ac}`, textAlign: 'left', padding: '14px 16px', cursor: 'pointer', width: '100%', color: T.text, fontFamily: 'inherit', borderRadius: T.r }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 9.5, fontFamily: T.mono, color: ac, letterSpacing: 0.8 }}>{a.cat.toLowerCase()}</span>
                  <span style={{ fontSize: 10, color: T.muted, fontFamily: T.sans }}>{a.read}</span>
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.25, marginBottom: 6, letterSpacing: -0.3 }}>{a.title}</div>
                <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.muted, lineHeight: 1.55 }}>{a.summary}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {a.tag && (
                    <div style={{ display: 'inline-block', fontSize: 9, fontFamily: T.mono, color: ac, padding: '2px 6px', border: `1px solid ${ac}66`, borderRadius: 2, letterSpacing: 0.4 }}>
                      {a.tag.toLowerCase()}
                    </div>
                  )}
                  {a.sources?.length > 0 && (
                    <div style={{ fontSize: 10, fontFamily: T.sans, color: T.muted, letterSpacing: 0.3 }}>
                      {a.sources.length} reference{a.sources.length === 1 ? '' : 's'}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        <div style={{ height: 16 }} />
      </div>
      </Screen>
    </div>
  )
}
