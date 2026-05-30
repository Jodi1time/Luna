import { useState, useRef, useEffect } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import { ARTICLES } from '../data/lunaData'
import useLuna from '../store/useLuna'

// A small heart that fills + blooms on tap. Saved state stored on
// the user's profile via settings.savedArticles[].
function BookmarkHeart({ articleId }) {
  const settings = useLuna((s) => s.settings)
  const updateSetting = useLuna((s) => s.updateSetting)
  const saved = Array.isArray(settings?.savedArticles) && settings.savedArticles.includes(articleId)
  const [justToggled, setJustToggled] = useState(false)
  const toggle = () => {
    const cur = Array.isArray(settings?.savedArticles) ? settings.savedArticles : []
    const next = saved ? cur.filter((id) => id !== articleId) : [...cur, articleId]
    updateSetting('savedArticles', next)
    setJustToggled(true)
    setTimeout(() => setJustToggled(false), 500)
  }
  return (
    <button onClick={toggle}
      aria-label={saved ? 'Remove from saved' : 'Save for later'}
      className={justToggled ? 'tap-bloom' : ''}
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        padding: 6, display: 'inline-flex', alignItems: 'center',
        color: saved ? T.accent : T.muted,
        transition: 'color 0.25s ease-out',
      }}>
      <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 21s-7-4.5-9.5-9C0.5 8 3 4 6.5 4c2 0 3.4 1 5.5 3 2.1-2 3.5-3 5.5-3 3.5 0 6 4 4 8-2.5 4.5-9.5 9-9.5 9z"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

// Reading progress line at the top of the article — grows as the
// user scrolls. Scoped to the article's scroll container.
function ReadingProgress({ scrollRef }) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0
      setPct(p)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    return () => el.removeEventListener('scroll', update)
  }, [scrollRef])
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
      background: 'rgba(26,19,16,0.08)',
      zIndex: 5,
      pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%', width: `${pct * 100}%`,
        background: T.accent,
        transition: 'width 0.12s ease-out',
      }} />
    </div>
  )
}

export default function Article() {
  const { back, activeArticleId } = useLuna()
  const a = ARTICLES.find((x) => x.id === activeArticleId) || ARTICLES[0]
  const scrollRef = useRef(null)
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ReadingProgress scrollRef={scrollRef} />
      <Screen padBottom={30} ref={scrollRef}>
        <div style={{ padding: '12px 22px 0', color: T.text }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Masthead issue={a.cat} onBack={back} />
            </div>
            <div style={{ paddingTop: 6 }}>
              <BookmarkHeart articleId={a.id} />
            </div>
          </div>
          <Eyebrow color={T.accent}>{a.cat.toLowerCase()} · {a.read}</Eyebrow>
          <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05 }}>{a.title}</div>
          <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.55, color: T.muted, marginTop: 12, fontStyle: 'italic' }}>{a.summary}</div>

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
            <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: T.muted, fontFamily: T.sans, marginBottom: 8 }}>Sources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {a.sources.map((s, i) => (
                <div key={i} style={{ fontSize: 11.5, fontFamily: T.mono, lineHeight: 1.4, color: T.text }}>{String(i + 1).padStart(2, '0')} — {s}</div>
              ))}
            </div>
          </div>
          <div style={{ height: 16 }} />
        </div>
      </Screen>
    </div>
  )
}
