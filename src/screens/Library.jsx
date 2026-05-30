import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import { ARTICLES } from '../data/lunaData'
import useLuna from '../store/useLuna'

export default function Library() {
  const goArticle = useLuna((s) => s.goArticle)
  const cats = ['All', ...new Set(ARTICLES.map((a) => a.cat))]
  const [cat, setCat] = useState('All')
  const filtered = cat === 'All' ? ARTICLES : ARTICLES.filter((a) => a.cat === cat)

  return (
    <Screen>
      <div style={{ padding: '20px 22px 0', color: T.text }}>
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

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((a, i) => (
            <button key={a.id} onClick={() => goArticle(a.id)}
              style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '16px 0', cursor: 'pointer', width: '100%', color: T.text, fontFamily: 'inherit', borderBottom: i < filtered.length - 1 ? `1px solid ${T.hair}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 9.5, fontFamily: T.mono, color: T.accent, letterSpacing: 1 }}>{a.cat.toUpperCase()}</span>
                <span style={{ fontSize: 10, color: T.muted, fontFamily: T.sans }}>{a.read}</span>
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, lineHeight: 1.2, marginBottom: 6 }}>{a.title}</div>
              <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>{a.summary}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {a.tag && (
                  <div style={{ display: 'inline-block', fontSize: 9, fontFamily: T.mono, color: T.accent, padding: '3px 6px', border: `1px solid ${T.accent}` }}>
                    {a.tag.toUpperCase()}
                  </div>
                )}
                {a.sources?.length > 0 && (
                  <div style={{ fontSize: 10, fontFamily: T.sans, color: T.muted, letterSpacing: 0.3 }}>
                    {a.sources.length} reference{a.sources.length === 1 ? '' : 's'}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
