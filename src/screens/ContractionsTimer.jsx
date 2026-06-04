import { useState, useEffect, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Screen, Eyebrow } from '../components/shared'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import useLuna from '../store/useLuna'

// Contractions timer — tracks start/end of each contraction and
// the gap between them. The "5-1-1 rule" most providers use for
// when-to-go-in: contractions every 5 minutes, lasting 1 minute
// each, for 1 hour. Some providers use 4-1-1 for second-time
// labor. Helper surfaces both when the pattern starts to match.
//
// Stored in settings.contractionsSessions: [{ startedAt, contractions:
// [{ startedAt, endedAt, durationMs, gapMs }], endedAt? }]. One
// session per labor episode; user can resume an active one.

const MAX_SESSIONS = 10
const FIVE_ONE_ONE_GAP_MS = 5 * 60 * 1000
const FIVE_ONE_ONE_DURATION_MS = 60 * 1000

function fmtTime(ms) {
  if (!ms || ms < 0) return '—'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtRelative(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// 5-1-1 detection: in the last hour, are contractions averaging
// 5 minutes apart and lasting at least 1 minute?
function detect511(contractions) {
  if (!contractions || contractions.length < 6) return null
  const recent = contractions.filter((c) => c.endedAt && c.gapMs).slice(-12)
  if (recent.length < 6) return null
  const avgGap = recent.reduce((a, c) => a + (c.gapMs || 0), 0) / recent.length
  const avgDuration = recent.reduce((a, c) => a + (c.durationMs || 0), 0) / recent.length
  const meets511 = avgGap <= FIVE_ONE_ONE_GAP_MS && avgDuration >= FIVE_ONE_ONE_DURATION_MS
  return { avgGap, avgDuration, meets511, count: recent.length }
}

export default function ContractionsTimer() {
  const store = useLuna()
  const { back, settings, updateSetting } = store
  const accent = sectionColors('urgent').accent
  const sessions = useMemo(() => settings?.contractionsSessions || [], [settings?.contractionsSessions])

  // Active session lives in component state. On any meaningful
  // change (new contraction completes) we persist.
  const [session, setSession] = useState(null)
  // Track the in-flight contraction's start time. When stopped,
  // we finalise it into the session's contractions array.
  const [contractionStart, setContractionStart] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!session && !contractionStart) return
    const id = setInterval(() => setTick((t) => t + 1), 250)
    return () => clearInterval(id)
  }, [session, contractionStart])

  const persist = (next) => {
    const history = sessions.slice()
    const existingIdx = history.findIndex((s) => s.startedAt === next.startedAt)
    if (existingIdx >= 0) history[existingIdx] = next
    else history.unshift(next)
    updateSetting('contractionsSessions', history.slice(0, MAX_SESSIONS))
  }

  const startSession = () => {
    const s = { startedAt: new Date().toISOString(), contractions: [] }
    setSession(s)
    persist(s)
  }

  const beginContraction = () => {
    setContractionStart(new Date().toISOString())
  }

  const endContraction = () => {
    if (!contractionStart || !session) {
      setContractionStart(null)
      return
    }
    const endedAt = new Date().toISOString()
    const durationMs = new Date(endedAt).getTime() - new Date(contractionStart).getTime()
    // Gap = from previous contraction's START to this one's start
    const prev = session.contractions[session.contractions.length - 1]
    const gapMs = prev?.startedAt
      ? new Date(contractionStart).getTime() - new Date(prev.startedAt).getTime()
      : null
    const c = { startedAt: contractionStart, endedAt, durationMs, gapMs }
    const next = { ...session, contractions: [...session.contractions, c] }
    setSession(next)
    setContractionStart(null)
    persist(next)
  }

  const endSession = () => {
    if (!session) return
    const ok = window.confirm('End this timing session? You can start a new one anytime.')
    if (!ok) return
    const next = { ...session, endedAt: new Date().toISOString() }
    persist(next)
    setSession(null)
    setContractionStart(null)
  }

  const contractionElapsed = contractionStart
    ? Date.now() - new Date(contractionStart).getTime()
    : 0

  const recent = session?.contractions?.slice(-5).reverse() || []
  const detection = session ? detect511(session.contractions) : null
  const past = sessions.filter((s) => s.endedAt).slice(0, 5)

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="contractions" onBack={back} />

        <Eyebrow color={accent}>timer for labor</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10 }}>
          Time them with you.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14.5, fontStyle: 'italic', color: T.muted, lineHeight: 1.55, marginBottom: 22 }}>
          Tap when a contraction starts, tap when it ends. Luna tracks the duration and the gap between them. Most providers use the 5-1-1 rule for when to go in.
        </div>

        {/* Active session — single huge button */}
        {!session && (
          <button onClick={startSession}
            className="alive-card"
            style={{
              width: '100%', background: accent, color: '#fff', border: 'none',
              padding: '18px 16px', borderRadius: 999, cursor: 'pointer',
              fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, fontWeight: 500,
              letterSpacing: -0.2, marginBottom: 18,
              boxShadow: `0 14px 28px -10px ${accent}80`,
            }}>
            Start timing
          </button>
        )}

        {session && (
          <>
            <div className="alive-card frost-card" style={{
              padding: 24,
              background: sectionPaper('urgent'),
              border: `1px solid ${accent}28`,
              borderRadius: 22,
              boxShadow: `0 14px 30px -22px ${accent}55`,
              marginBottom: 18,
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 14 }}>
                {contractionStart ? 'contraction in progress' : 'between contractions'}
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 56, fontWeight: 400, color: accent, lineHeight: 1, letterSpacing: -2, marginBottom: 8 }}>
                {contractionStart ? fmtTime(contractionElapsed) : (session.contractions.length === 0 ? '—' : fmtTime(Date.now() - new Date(session.contractions[session.contractions.length - 1].endedAt).getTime()))}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: 1, color: T.muted, fontWeight: 600, marginBottom: 20 }}>
                {contractionStart ? 'DURATION' : (session.contractions.length === 0 ? 'WAITING' : 'SINCE LAST')}
              </div>
              {!contractionStart ? (
                <button onClick={beginContraction}
                  className="alive-card"
                  style={{
                    width: '100%', background: accent, color: '#fff', border: 'none',
                    padding: '18px 16px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, fontWeight: 500,
                    letterSpacing: -0.2,
                    boxShadow: `0 14px 28px -10px ${accent}80`,
                  }}>
                  A contraction is starting
                </button>
              ) : (
                <button onClick={endContraction}
                  className="alive-card"
                  style={{
                    width: '100%', background: '#fff', color: accent, border: `2px solid ${accent}`,
                    padding: '16px 16px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, fontWeight: 500,
                    letterSpacing: -0.2,
                    boxShadow: `0 14px 28px -10px ${accent}50`,
                  }}>
                  It's eased
                </button>
              )}
            </div>

            {detection?.meets511 && (
              <div className="alive-card frost-card" style={{
                padding: 18,
                background: T.accent + '14',
                border: `1px solid ${T.accent}55`,
                borderRadius: 18,
                marginBottom: 18,
              }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 6 }}>
                  the 5-1-1 pattern is here
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.5, color: T.text, letterSpacing: -0.1 }}>
                  Your contractions are averaging {Math.round(detection.avgGap / 60000)} min apart, lasting {Math.round(detection.avgDuration / 1000)}s each. This is the threshold most providers use to come in. Call your provider or labor & delivery now.
                </div>
              </div>
            )}

            {recent.length > 0 && (
              <>
                <Eyebrow color={accent}>recent contractions</Eyebrow>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {recent.map((c, i) => (
                    <div key={i} className="frost-card" style={{
                      padding: 12,
                      background: 'rgba(253,250,245,0.55)',
                      border: '1px solid rgba(26,19,16,0.06)',
                      borderRadius: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}>
                      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, letterSpacing: -0.1 }}>
                        {fmtRelative(c.startedAt)}
                      </div>
                      <div style={{ display: 'flex', gap: 14 }}>
                        <div>
                          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 0.8, color: T.muted, fontWeight: 600 }}>LASTED</div>
                          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.text }}>{fmtTime(c.durationMs)}</div>
                        </div>
                        {c.gapMs != null && (
                          <div>
                            <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 0.8, color: T.muted, fontWeight: 600 }}>AFTER</div>
                            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.text }}>{fmtTime(c.gapMs)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button onClick={endSession}
              style={{
                width: '100%', background: 'transparent', color: T.muted,
                border: '1px solid rgba(26,19,16,0.08)',
                padding: '12px 14px', borderRadius: 999, cursor: 'pointer',
                fontFamily: T.serif, fontStyle: 'italic', fontSize: 13,
                marginBottom: 18,
              }}>
              end this session
            </button>
          </>
        )}

        {past.length > 0 && (
          <>
            <Eyebrow color={accent}>past sessions</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {past.map((s, i) => (
                <div key={i} className="frost-card" style={{
                  padding: 14, background: 'rgba(253,250,245,0.55)',
                  border: '1px solid rgba(26,19,16,0.06)',
                  borderRadius: 16,
                }}>
                  <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.text, letterSpacing: -0.1, marginBottom: 4 }}>
                    {new Date(s.startedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.muted, fontStyle: 'italic' }}>
                    {s.contractions?.length || 0} contraction{(s.contractions?.length || 0) === 1 ? '' : 's'} timed
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="frost-card" style={{
          padding: 16,
          background: 'rgba(253,250,245,0.55)',
          border: '1px solid rgba(26,19,16,0.06)',
          borderRadius: 18,
          fontFamily: T.serif, fontStyle: 'italic',
          fontSize: 13, color: T.text, lineHeight: 1.6,
          marginBottom: 12,
        }}>
          Call your provider before 5-1-1 if: water breaks (any time), bright red bleeding, contractions painful enough you can't talk through them, sudden severe headache, vision changes, decreased fetal movement, or anything that feels truly wrong. Trust your gut.
        </div>
        <div style={{
          fontFamily: T.mono, fontSize: 10, letterSpacing: 0.6, color: T.muted,
          textAlign: 'center', marginBottom: 8,
        }}>
          SOURCE · ACOG Labor & Delivery Patient Education · Mayo Clinic
        </div>

        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
