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
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="The Library" />
        <Eyebrow>EVIDENCE-LED · PLAIN ENGLISH</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>The Library.</div>
        <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55, color: T.muted, marginTop: 10 }}>
          Every article cites peer-reviewed research or major medical bodies. Plain language, clearly sourced.
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
              {a.tag && (
                <div style={{ marginTop: 8, display: 'inline-block', fontSize: 9, fontFamily: T.mono, color: T.accent, padding: '3px 6px', border: `1px solid ${T.accent}` }}>
                  {a.tag.toUpperCase()}
                </div>
              )}
            </button>
          ))}
        </div>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
