import { useState, useRef, useEffect } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import { ARTICLES } from '../data/lunaData'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { articleAccent, articlePhaseId } from '../lib/articlePhase'
import useLuna from '../store/useLuna'

// A small heart that fills + blooms on tap. Saved state stored on
// the user's profile via settings.savedArticles[].
function BookmarkHeart({ articleId, accent }) {
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
        color: saved ? (accent || T.accent) : T.muted,
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
// user scrolls. Scoped to the article's scroll container, tinted to
// the article's phase color so the progress feels like part of the
// piece's atmosphere rather than a generic UI strip.
function ReadingProgress({ scrollRef, accent }) {
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
        background: accent || T.accent,
        transition: 'width 0.12s ease-out',
      }} />
    </div>
  )
}

export default function Article() {
  const { back, activeArticleId } = useLuna()
  const a = ARTICLES.find((x) => x.id === activeArticleId) || ARTICLES[0]
  const accent = articleAccent(a.id)
  const phaseId = articlePhaseId(a.id)
  const scrollRef = useRef(null)
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ReadingProgress scrollRef={scrollRef} accent={accent} />
      <Screen padBottom={30} ref={scrollRef}>
        <div style={{ padding: '12px 22px 0', color: T.text }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Masthead issue={a.cat} onBack={back} />
            </div>
            <div style={{ paddingTop: 6 }}>
              <BookmarkHeart articleId={a.id} accent={accent} />
            </div>
          </div>
          <div className="insight-stagger" style={{ animationDelay: '0ms' }}>
            <Eyebrow color={accent}>{a.cat.toLowerCase()} · {a.read}</Eyebrow>
          </div>
          {/* Title row + small phase flourish in the corner */}
          <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, animationDelay: '40ms' }}>
            <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05, flex: 1, minWidth: 0 }}>
              {a.title}
            </div>
            {phaseId && (
              <div aria-hidden="true" style={{ color: accent, opacity: 0.6, paddingTop: 4 }}>
                <PhaseFlourish phaseId={phaseId} size={28} />
              </div>
            )}
          </div>
          <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.55, color: T.muted, marginTop: 12, fontStyle: 'italic', animationDelay: '90ms' }}>
            {a.summary}
          </div>

          {a.sources?.length > 0 && (
            <div className="insight-stagger frost-card" style={{ marginTop: 16, padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 8, background: accent + '12', border: `1px solid ${accent}40`, borderRadius: 999, animationDelay: '140ms' }}>
              <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: 999, background: accent, opacity: 0.85 }} />
              <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, fontWeight: 500, color: accent, letterSpacing: -0.1 }}>
                doctor-sourced
              </span>
              <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 11.5, color: T.muted, letterSpacing: -0.1, opacity: 0.85 }}>
                · {a.sources.length} reference{a.sources.length === 1 ? '' : 's'}
              </span>
            </div>
          )}

          <Rule />
          {/* Body paragraphs stage in with a gentle stagger — reads as
              the piece composing itself for you, not arriving as a
              wall of text. Drop cap on the first paragraph uses the
              article's phase color so it sets the visual key. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {a.body.map((p, i) => (
              <p key={i} className="insight-stagger"
                 style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.65, margin: 0, animationDelay: `${200 + i * 80}ms` }}>
                {i === 0 && (
                  <span style={{ float: 'left', fontSize: 58, lineHeight: 0.82, fontWeight: 400, marginRight: 8, marginTop: 6, color: accent, fontFamily: T.serif, fontStyle: 'italic' }}>
                    {p[0]}
                  </span>
                )}
                {i === 0 ? p.slice(1) : p}
              </p>
            ))}
          </div>
          {/* End-of-article ornament + sources block */}
          <div className="insight-stagger" style={{ marginTop: 28, display: 'flex', justifyContent: 'center', animationDelay: `${200 + a.body.length * 80 + 60}ms` }}>
            <div aria-hidden="true" style={{ color: accent, opacity: 0.45, display: 'inline-flex' }}>
              <PhaseFlourish phaseId={phaseId || 'follicular'} size={28} />
            </div>
          </div>
          <div className="insight-stagger" style={{ marginTop: 18, padding: 18, background: 'rgba(253,250,245,0.55)', borderRadius: 18, border: '1px solid rgba(26,19,16,0.06)', boxShadow: `0 14px 30px -22px ${accent}40`, animationDelay: `${200 + a.body.length * 80 + 120}ms` }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, fontWeight: 500, color: accent, letterSpacing: -0.1, marginBottom: 10 }}>sources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {a.sources.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: T.serif, fontSize: 13, lineHeight: 1.45, color: T.text }}>
                  <span style={{ fontFamily: T.mono, fontSize: 9.5, color: accent, fontWeight: 600, letterSpacing: 0.5, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 16 }} />
        </div>
      </Screen>
    </div>
  )
}
