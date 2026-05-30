import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import { ARTICLES } from '../data/lunaData'
import useLuna from '../store/useLuna'

export default function Article() {
  const { back, activeArticleId } = useLuna()
  const a = ARTICLES.find((x) => x.id === activeArticleId) || ARTICLES[0]
  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue={a.cat} onBack={back} />
        <Eyebrow color={T.accent}>{a.cat.toUpperCase()} · {a.read}</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05 }}>{a.title}</div>
        <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.55, color: T.muted, marginTop: 12, fontStyle: 'italic' }}>{a.summary}</div>

        {/* Upfront sourcing — users say they trust period-tracker content
            when they can see who vetted it. Putting this at the TOP makes
            that obvious without them having to scroll to find sources. */}
        {a.sources?.length > 0 && (
          <div style={{ marginTop: 16, padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 8, background: T.accent + '14', border: `1px solid ${T.accent}55`, borderRadius: T.r }}>
            <span style={{ fontFamily: T.sans, fontSize: 9.5, fontWeight: 700, letterSpacing: 1.4, color: T.accent }}>
              DOCTOR-SOURCED
            </span>
            <span style={{ fontFamily: T.sans, fontSize: 11, color: T.muted }}>
              {a.sources.length} reference{a.sources.length === 1 ? '' : 's'} · {a.cat}
            </span>
          </div>
        )}

        <Rule />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {a.body.map((p, i) => (
            <p key={i} style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>
              {i === 0 && (
                <span style={{ float: 'left', fontSize: 54, lineHeight: 0.85, fontWeight: 400, marginRight: 6, marginTop: 4, color: T.accent, fontFamily: T.serif }}>
                  {p[0]}
                </span>
              )}
              {i === 0 ? p.slice(1) : p}
            </p>
          ))}
        </div>
        <div style={{ marginTop: 24, padding: 16, background: T.subtle, borderRadius: T.r }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: T.muted, fontFamily: T.sans, marginBottom: 8 }}>SOURCES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {a.sources.map((s, i) => (
              <div key={i} style={{ fontSize: 11.5, fontFamily: T.mono, lineHeight: 1.4, color: T.text }}>{String(i + 1).padStart(2, '0')} — {s}</div>
            ))}
          </div>
        </div>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
