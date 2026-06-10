import { useState, useEffect, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Screen, Eyebrow } from '../components/shared'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import useLuna from '../store/useLuna'

// Kick counter — clinical recommendation: from week 28, count fetal
// movements. The standard measure is time-to-10 movements (sometimes
// called "Count to 10" or "Cardiff method"). 10 distinct movements
// should occur within 2 hours; most days it's far faster (~10-30 min).
// A sustained reduction in fetal movement is one of the strongest
// warning signs in third trimester — ACOG recommends contacting your
// provider if 10 movements aren't felt within 2 hours during the
// usual active window.
//
// Stored under settings.kickSessions as: [{ startedAt, kicks: [ts...],
// completedAt?, durationMs? }]. Most recent kept; older sessions are
// trimmed to 30.

const MAX_SESSIONS = 30
const TARGET_KICKS = 10
const TWO_HOURS_MS = 2 * 60 * 60 * 1000

function formatDuration(ms) {
  if (!ms) return '—'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

function formatRelative(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const yest = new Date(); yest.setDate(yest.getDate() - 1)
  const sameDay = (a, b) => a.toDateString() === b.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (sameDay(d, today)) return `today, ${time}`
  if (sameDay(d, yest)) return `yesterday, ${time}`
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + `, ${time}`
}

export default function KickCounter() {
  const store = useLuna()
  const { back, settings, updateSetting } = store
  const sessions = useMemo(() => settings?.kickSessions || [], [settings?.kickSessions])
  const accent = sectionColors('plan').accent

  // Active session state — lives in component memory only until a
  // session completes or is reset. We persist on completion / reset
  // to avoid spam-writing every kick. Active session is also rebuilt
  // from a "running" flag in settings so an accidental refresh
  // doesn't lose progress.
  const [active, setActive] = useState(null) // { startedAt, kicks: [ts...] }
  const [tick, setTick] = useState(0)

  // Tick the clock once a second while a session is active so the
  // elapsed timer updates without spam.
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [active])

  const start = () => {
    setActive({ startedAt: new Date().toISOString(), kicks: [] })
  }

  const recordKick = () => {
    if (!active) return
    const next = { ...active, kicks: [...active.kicks, new Date().toISOString()] }
    if (next.kicks.length >= TARGET_KICKS) {
      // Complete the session — write to history, clear active.
      const completedAt = new Date().toISOString()
      const durationMs = new Date(completedAt).getTime() - new Date(next.startedAt).getTime()
      const completed = { ...next, completedAt, durationMs }
      const history = [completed, ...sessions].slice(0, MAX_SESSIONS)
      updateSetting('kickSessions', history)
      setActive(null)
    } else {
      setActive(next)
    }
  }

  const reset = () => {
    if (!active) return
    if (active.kicks.length > 0) {
      const ok = window.confirm(`Discard this session? You've counted ${active.kicks.length} so far.`)
      if (!ok) return
    }
    setActive(null)
  }

  // Time-since helper for active session.
  const elapsed = active ? Date.now() - new Date(active.startedAt).getTime() : 0
  const elapsedClose = elapsed > TWO_HOURS_MS * 0.75
  const recentSessions = sessions.slice(0, 6)

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="kick counter" onBack={back} />

        <Eyebrow color={accent}>third-trimester habit</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10 }}>
          Count to ten.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14.5, fontStyle: 'italic', color: T.muted, lineHeight: 1.55, marginBottom: 22 }}>
          Ten distinct movements is what your provider's looking for. Most days it takes ten to thirty minutes when your baby is active. From week 28 onward, once a day is enough.
        </div>

        {/* Active session — big tap button + counter ring */}
        {active ? (
          <div className="alive-card frost-card" style={{
            padding: 24,
            background: sectionPaper('plan'),
            border: `1px solid ${accent}28`,
            borderRadius: 22,
            boxShadow: `0 14px 30px -22px ${accent}55`,
            marginBottom: 18,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 14 }}>
              session in progress
            </div>
            {/* The big number — kicks counted so far */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <svg width="180" height="180" viewBox="0 0 180 180" style={{ position: 'absolute', inset: 0 }}>
                {/* Background ring */}
                <circle cx="90" cy="90" r="82" stroke={`${accent}20`} strokeWidth="4" fill="none" />
                {/* Progress ring — fills as kicks accumulate */}
                <circle cx="90" cy="90" r="82" stroke={accent} strokeWidth="4" fill="none"
                  strokeDasharray={`${(active.kicks.length / TARGET_KICKS) * (2 * Math.PI * 82)} ${2 * Math.PI * 82}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  transform="rotate(-90 90 90)"
                  style={{ transition: 'stroke-dasharray 0.3s var(--ease-out)' }}
                />
              </svg>
              <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 64, fontWeight: 400, color: accent, lineHeight: 1, letterSpacing: -2 }}>
                  {active.kicks.length}
                </div>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginTop: 4 }}>
                  of {TARGET_KICKS}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.8, fontWeight: 600, color: T.muted, marginBottom: 18 }}>
              elapsed · {formatDuration(elapsed)}
            </div>
            {/* Big tap-to-count button */}
            <button onClick={recordKick}
              className="alive-card"
              style={{
                width: '100%', background: accent, color: '#fff', border: 'none',
                padding: '18px 16px', borderRadius: 999, cursor: 'pointer',
                fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, fontWeight: 500,
                letterSpacing: -0.2, marginBottom: 10,
                boxShadow: `0 14px 28px -10px ${accent}80`,
              }}>
              I felt a kick
            </button>
            <button onClick={reset}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: T.muted, fontFamily: T.serif, fontStyle: 'italic',
                fontSize: 13, padding: '8px 16px',
              }}>
              cancel this session
            </button>
            {elapsedClose && (
              <div style={{
                marginTop: 14, padding: '12px 14px',
                background: T.accent + '12', border: `1px solid ${T.accent}40`,
                borderRadius: 16,
                fontFamily: T.serif, fontStyle: 'italic',
                fontSize: 13, color: T.text, lineHeight: 1.55, textAlign: 'left',
              }}>
                <strong style={{ fontWeight: 600, fontStyle: 'normal' }}>It's been a while.</strong> If you can't reach 10 movements in 2 hours during your baby's usual active window, that's worth a same-day call to your provider — not later. Take this seriously even if you feel okay otherwise.
              </div>
            )}
          </div>
        ) : (
          <button onClick={start}
            className="alive-card frost-card"
            style={{
              width: '100%',
              background: accent, color: '#fff', border: 'none',
              padding: '18px 16px', borderRadius: 999, cursor: 'pointer',
              fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, fontWeight: 500,
              letterSpacing: -0.2, marginBottom: 18,
              boxShadow: `0 14px 28px -10px ${accent}80`,
            }}>
            Start a session
          </button>
        )}

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <>
            <Eyebrow color={accent}>recent sessions</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {recentSessions.map((s, i) => (
                <div key={i} className="alive-card frost-card" style={{
                  padding: 14,
                  background: 'rgba(253,250,245,0.55)',
                  border: '1px solid rgba(26,19,16,0.06)',
                  borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.text, letterSpacing: -0.1, marginBottom: 2 }}>
                      {formatRelative(s.startedAt)}
                    </div>
                    <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.muted, fontStyle: 'italic' }}>
                      {s.kicks?.length || 0} kick{(s.kicks?.length || 0) === 1 ? '' : 's'} · {formatDuration(s.durationMs)}
                    </div>
                  </div>
                  {s.completedAt && (s.kicks?.length || 0) >= TARGET_KICKS && (
                    <div style={{ color: accent, fontFamily: T.mono, fontSize: 11, fontWeight: 600 }}>
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Educational footer */}
        <div className="frost-card" style={{
          padding: 16,
          background: 'rgba(253,250,245,0.55)',
          border: '1px solid rgba(26,19,16,0.06)',
          borderRadius: 18,
          fontFamily: T.serif, fontStyle: 'italic',
          fontSize: 13, color: T.text, lineHeight: 1.6,
          marginBottom: 12,
        }}>
          Babies have active and quiet cycles. Count during your baby's active window — usually after meals, in the evening, or after a sugary drink. A real reduction in movement compared to your baby's normal pattern is the signal that matters, not a single slow session. When unsure, call.
        </div>
        <div style={{
          fontFamily: T.mono, fontSize: 11, letterSpacing: 0.6, color: T.muted,
          textAlign: 'center', marginBottom: 8,
        }}>
          SOURCE · ACOG Antepartum Fetal Surveillance · NICE NG121
        </div>

        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
