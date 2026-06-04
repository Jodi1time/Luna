import { useEffect, useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Screen, Eyebrow } from '../components/shared'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import { PHASES } from '../data/lunaData'
import { PhaseFlourish } from '../components/phaseFlourishes'
import {
  listIncomingShares,
  getSharedProfile,
  getSharedLogs,
  revokeIncomingShare,
  scopeLabel,
} from '../lib/shares'
import {
  weightedCycleLength,
  cycleVariance,
  getPredictions,
  getCycleDay,
  getPhaseForDay,
  detectPeriodStarts,
  dynamicPeriodLength,
} from '../hooks/useCycle'
import useLuna from '../store/useLuna'
import { moodIdsOf } from '../lib/moods'

// SharedWithYou — read-only surface where the recipient sees a data
// owner's selected cycle picture. Clear visual markers that this is
// SOMEONE ELSE'S cycle, never confused for the user's own data.
//
// Multiple shares can be active at once (e.g., partner is sharing
// with you AND your sister is too). A selector lets you switch
// between them. If only one share is active, no selector — direct
// view.

function NoSharesYet() {
  const accent = sectionColors('plan').accent
  return (
    <div className="alive-card frost-card" style={{
      padding: 22,
      background: sectionPaper('plan'),
      border: `1px solid ${accent}22`,
      borderRadius: 22,
      boxShadow: `0 14px 30px -22px ${accent}40`,
    }}>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 8 }}>
        nothing here yet
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1.25, marginBottom: 8 }}>
        No one's sharing their cycle with you right now.
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
        When someone you support shares their cycle with you, this is where it'll live. Their invite link opens straight here.
      </div>
    </div>
  )
}

function CycleCard({ profile, logs }) {
  if (!profile) return null
  const name = profile.display_name || 'they'
  const firstName = name.split(' ')[0]

  // Compute their cycle state. We use the same engine the user's own
  // app uses, but seeded only with the shared profile data.
  const starts = detectPeriodStarts(
    (logs || []).reduce((acc, l) => { acc[l.date] = l; return acc }, {})
  )
  const allStarts = starts.length > 0 ? starts : (profile.last_period_start ? [profile.last_period_start] : [])
  const { length: cycleLength } = weightedCycleLength(allStarts, profile.cycle_length || 28)
  const periodLength = dynamicPeriodLength(
    (logs || []).reduce((acc, l) => { acc[l.date] = l; return acc }, {}),
    profile.period_length || 5
  )
  const lastPeriodStart = allStarts.length > 0 ? allStarts[allStarts.length - 1] : profile.last_period_start
  const cycleDay = lastPeriodStart ? getCycleDay(lastPeriodStart, cycleLength) : null
  const phase = cycleDay ? getPhaseForDay(cycleDay, cycleLength, periodLength) : null
  const variance = cycleVariance(allStarts)
  const predictions = getPredictions(lastPeriodStart, cycleLength, periodLength, variance, null)

  const accent = phase?.color || T.accent

  return (
    <>
      {/* Cycle hero — phase, day number, predictions */}
      <div className="alive-card frost-card" style={{
        padding: 24,
        background: `linear-gradient(160deg, ${accent}14, rgba(253,250,245,0.55))`,
        border: `1px solid ${accent}28`,
        borderRadius: 22,
        boxShadow: `0 14px 30px -22px ${accent}50`,
        marginBottom: 18,
        textAlign: 'center',
      }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 10 }}>
          {phase ? `${firstName} is on day ${cycleDay} · ${phase.name.toLowerCase()} phase` : `${firstName}'s cycle`}
        </div>
        {phase && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <span style={{ color: accent, opacity: 0.7 }}>
              <PhaseFlourish phaseId={phase.id} size={32} />
            </span>
          </div>
        )}
        {cycleDay != null && (
          <>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 80, fontWeight: 400, color: accent, lineHeight: 1, letterSpacing: -3, marginBottom: 4 }}>
              {cycleDay}
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.muted, marginBottom: 14 }}>
              of {cycleLength}
            </div>
          </>
        )}
        {phase && (
          <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, letterSpacing: -0.2, lineHeight: 1.3, marginBottom: 4 }}>
            <em style={{ color: accent }}>{phase.name}.</em>
          </div>
        )}
        {phase?.bodyMood && (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.muted, lineHeight: 1.55, maxWidth: 280, margin: '8px auto 0' }}>
            {phase.bodyMood}
          </div>
        )}
      </div>

      {/* Predictions card */}
      {predictions && (
        <>
          <Eyebrow color={accent}>what's coming up for {firstName}</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            {predictions.map((p, i) => {
              const c = p.label === 'Next period' ? PHASES.menstrual.color
                      : p.label === 'Fertile window' ? PHASES.ovulation.color
                      : PHASES.luteal.color
              return (
                <div key={i} className="frost-card" style={{
                  padding: 14,
                  background: 'rgba(253,250,245,0.55)',
                  border: `1px solid ${c}22`,
                  borderRadius: 16,
                }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: c, marginBottom: 4 }}>
                    {p.label === 'Next period' ? 'NEXT PERIOD'
                     : p.label === 'Fertile window' ? 'FERTILE WINDOW'
                     : 'PMS WINDOW'}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.1 }}>
                    {p.date}
                    {p.range && (
                      <span style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, fontWeight: 400 }}>
                        {' '}({p.range.replace('±', 'give or take').replace(/(\d+) days?/, (_, n) => `${n} day${n === '1' ? '' : 's'}`)})
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Recent logs — only when scope includes full picture */}
      {logs && logs.length > 0 && (
        <>
          <Eyebrow color={accent}>what {firstName} has been logging</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {logs.slice(0, 7).map((l, i) => {
              const symptoms = Array.isArray(l.symptoms) ? l.symptoms : []
              const bits = [
                moodIdsOf(l).join(', ') || null,
                l.flow && `flow: ${l.flow.toLowerCase()}`,
                symptoms.length > 0 && symptoms.slice(0, 3).join(', '),
                l.sleep && `sleep: ${l.sleep.toLowerCase()}`,
              ].filter(Boolean)
              if (bits.length === 0 && !l.note) return null
              return (
                <div key={i} className="frost-card" style={{
                  padding: 12,
                  background: 'rgba(253,250,245,0.55)',
                  border: '1px solid rgba(26,19,16,0.06)',
                  borderRadius: 14,
                }}>
                  <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginBottom: 4 }}>
                    {new Date(l.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toLowerCase()}
                  </div>
                  {bits.length > 0 && (
                    <div style={{ fontFamily: T.serif, fontSize: 14, color: T.text, lineHeight: 1.55, letterSpacing: -0.1 }}>
                      {bits.join(' · ')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}

export default function SharedWithYou() {
  const { back } = useLuna()
  const accent = sectionColors('plan').accent

  const [shares, setShares] = useState([])
  const [activeShareId, setActiveShareId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load incoming shares
  useEffect(() => {
    let cancelled = false
    listIncomingShares()
      .then((list) => {
        if (cancelled) return
        setShares(list)
        if (list.length > 0) setActiveShareId(list[0].id)
        else setLoading(false)
      })
      .catch((e) => { if (!cancelled) { setError(e?.message || 'Could not load shares'); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  // Load data for active share
  useEffect(() => {
    if (!activeShareId) return
    const share = shares.find((s) => s.id === activeShareId)
    if (!share) return
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([
      getSharedProfile(share.from_user_id),
      share.scope?.fullLog ? getSharedLogs(share.from_user_id) : Promise.resolve([]),
    ])
      .then(([p, l]) => {
        if (cancelled) return
        setProfile(p)
        setLogs(l || [])
      })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Could not load shared data') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeShareId, shares])

  const handleRevoke = async (shareId) => {
    const ok = window.confirm('Stop seeing this share? You can be re-invited any time.')
    if (!ok) return
    try {
      await revokeIncomingShare(shareId)
      const next = shares.filter((s) => s.id !== shareId)
      setShares(next)
      setActiveShareId(next[0]?.id || null)
      if (next.length === 0) {
        setProfile(null)
        setLogs([])
      }
    } catch (e) {
      setError(e?.message || 'Could not stop the share')
    }
  }

  const activeShare = shares.find((s) => s.id === activeShareId)

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="shared with you" onBack={back} />

        <Eyebrow color={accent}>read only — someone you support</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.1, marginBottom: 14 }}>
          In their corner.
        </div>

        {/* Multiple shares — selector */}
        {shares.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {shares.map((s) => {
              const on = s.id === activeShareId
              return (
                <button key={s.id} onClick={() => setActiveShareId(s.id)}
                  className={`alive-card${on ? ' tap-bloom' : ''}`}
                  style={{
                    padding: '8px 14px',
                    background: on ? accent : 'rgba(253,250,245,0.55)',
                    border: `1px solid ${on ? accent : 'rgba(26,19,16,0.08)'}`,
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontFamily: T.serif, fontStyle: on ? 'italic' : 'normal',
                    fontSize: 13, fontWeight: 500,
                    color: on ? '#fff' : T.text,
                    letterSpacing: -0.1,
                  }}>
                  {s.id === activeShareId && profile ? (profile.display_name?.split(' ')[0] || 'them') : 'someone'}
                </button>
              )
            })}
          </div>
        )}

        {loading && (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.muted, marginTop: 12 }}>
            Loading…
          </div>
        )}

        {error && (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.accent, lineHeight: 1.5, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {!loading && !error && shares.length === 0 && <NoSharesYet />}

        {!loading && !error && profile && <CycleCard profile={profile} logs={logs} />}

        {/* Manage the active share */}
        {activeShare && profile && (
          <div className="frost-card" style={{
            padding: 14,
            background: 'rgba(253,250,245,0.55)',
            border: '1px solid rgba(26,19,16,0.06)',
            borderRadius: 16,
            marginTop: 18, marginBottom: 18,
          }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginBottom: 8, lineHeight: 1.5 }}>
              {profile.display_name?.split(' ')[0] || 'They'} are sharing <strong style={{ fontStyle: 'normal', fontWeight: 600 }}>{scopeLabel(activeShare.scope).toLowerCase()}</strong> with you.
            </div>
            <button onClick={() => handleRevoke(activeShareId)}
              style={{
                background: 'transparent',
                border: `1px solid ${T.accent}40`,
                color: T.accent,
                padding: '9px 14px', borderRadius: 999, cursor: 'pointer',
                fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3,
              }}>
              Stop seeing this share
            </button>
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
