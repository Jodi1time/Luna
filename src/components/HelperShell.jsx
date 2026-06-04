import { useEffect, useMemo, useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import useLuna from '../store/useLuna'
import { breathTone } from '../lib/sounds'
import { useScrollLock } from '../lib/useScrollLock'
import Portal from '../lib/Portal'
import { sectionColors, sectionPaper } from '../data/sectionPalette'

// Shared scaffold for all "what now" helper screens. Each helper
// provides its content via props; the shell handles the layout,
// the breathing overlay, the personal-playbook recall, the save
// flow, and the escalation card.
//
// Required props:
//   helperKey      string — id used to bucket episodes in settings.helperHistory
//   title          string — big heading ("Cramps today?")
//   subtitle       string — italic line below ("Sit with me. Let's start.")
//   actionLines    string[] — what helps right now, as plain paragraphs
//   helpedOptions  [{ id, label }] — what to tap as helping afterward
//
// Optional props:
//   eyebrow        string — small mono eyebrow at the top of the action card
//   breath         { label, cycleMs? } — show "Breathe with me" button
//   triage         [{ title, options: [{ id, label, sub? }] }] — soft triage rows
//   escalation     { showWhen: (state) => bool, lines: string[], cta: { label, onTap } }
//   resources      [{ label, sub, detail }] — soft resources block
//   bottomCopy     string — quiet closing note

const DEFAULT_BREATH_MS = 12000

// Compute a recall line from prior episodes for this helper.
function recallLine(history, helperKey, helpedOptions) {
  const own = (history || []).filter((e) => e.helperKey === helperKey)
  if (own.length < 2) return null
  const counts = {}
  for (const ep of own) for (const id of ep.helped || []) counts[id] = (counts[id] || 0) + 1
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  if (!top || top[1] < 2) return null
  const label = helpedOptions.find((o) => o.id === top[0])?.label?.toLowerCase() || top[0]
  return `Last time, ${label} made the biggest difference. Try that first today.`
}

// ── Breathing overlay (4-7-8 or 4-2-6 paced) ────────────────────
function BreathingOverlay({ onClose, soundsOn, pattern }) {
  useScrollLock(true)
  const [phase, setPhase] = useState('inhale')
  const [cyclesDone, setCyclesDone] = useState(0)
  const { inhale = 4000, hold = 2000, exhale = 6000 } = pattern || {}

  useEffect(() => {
    let timeouts = []
    let live = true
    const cycle = () => {
      if (!live) return
      breathTone(soundsOn)
      setPhase('inhale')
      timeouts.push(setTimeout(() => { if (live) setPhase('hold') }, inhale))
      timeouts.push(setTimeout(() => { if (live) setPhase('exhale') }, inhale + hold))
      timeouts.push(setTimeout(() => {
        if (!live) return
        setCyclesDone((c) => c + 1)
        cycle()
      }, inhale + hold + exhale))
    }
    cycle()
    return () => { live = false; timeouts.forEach(clearTimeout) }
  }, [soundsOn, inhale, hold, exhale])

  const label = phase === 'inhale' ? 'Breathe in…'
              : phase === 'hold'   ? 'Hold…'
              : 'Breathe out…'

  return (
    <Portal>
    <div
      data-luna-overlay="true"
      onClick={onClose}
      onTouchMove={(e) => e.preventDefault()}
      onWheel={(e) => e.preventDefault()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(26,19,16,0.7)',
        backdropFilter: 'blur(20px) saturate(1.15)', WebkitBackdropFilter: 'blur(20px) saturate(1.15)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.4s ease-out both',
        color: '#FAF4ED', padding: 24,
        touchAction: 'none', overscrollBehavior: 'contain',
      }}>
      <div className="breath-circle" data-phase={phase}
        style={{
          width: 220, height: 220, borderRadius: '50%',
          background: `radial-gradient(circle, ${T.accent}40 0%, ${T.accent}10 60%, transparent 100%)`,
          border: `1px solid rgba(250,244,237,0.18)`,
          transformOrigin: 'center', marginBottom: 36,
        }} />
      <div style={{ fontFamily: T.serif, fontSize: 26, fontStyle: 'italic', letterSpacing: -0.3, marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 14, color: 'rgba(250,244,237,0.65)', marginBottom: 28, fontStyle: 'italic' }}>
        {cyclesDone === 0 ? 'Stay with it.' : cyclesDone < 3 ? 'You\'re doing it.' : 'Keep going — or close when you\'re ready.'}
      </div>
      <button onClick={onClose}
        style={{ background: 'transparent', border: `1px solid rgba(250,244,237,0.32)`, color: '#FAF4ED', padding: '11px 22px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, letterSpacing: 0.5, fontWeight: 600 }}>
        I'm done
      </button>
    </div>
    </Portal>
  )
}

export default function HelperShell({
  helperKey,
  title,
  subtitle,
  eyebrow = 'What helps right now',
  actionLines,
  breath,
  triage,
  helpedOptions = [],
  escalation,
  resources,
  bottomCopy,
  // Section category for the action card's chromatic identity.
  // Defaults to 'urgent' (warm rose) since most helpers are physical-
  // acute moments; emotional helpers (Heavy, Insomnia) override with
  // 'reflect' or 'plan' from their screen.
  category = 'urgent',
}) {
  const store = useLuna()
  const { back, settings, updateSetting } = store
  const soundsOn = Boolean(settings?.sounds)
  const history = settings?.helperHistory || []

  const [triageState, setTriageState] = useState({})
  const [helped, setHelped] = useState([])
  const [breathOpen, setBreathOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const recall = useMemo(() => recallLine(history, helperKey, helpedOptions), [history, helperKey, helpedOptions])

  const setTriage = (rowKey, value) => {
    setTriageState((prev) => ({ ...prev, [rowKey]: value }))
  }

  const toggleHelped = (id) => {
    setHelped((curr) => curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id])
  }

  const recordEpisode = () => {
    const next = [
      ...history,
      {
        helperKey,
        dateISO: new Date().toISOString().slice(0, 10),
        triage: triageState,
        helped,
        recordedAt: new Date().toISOString(),
      },
    ].slice(-90)
    updateSetting('helperHistory', next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const showEscalation = escalation?.showWhen ? escalation.showWhen({ triage: triageState }) : false

  return (
    <Screen padBottom={40}>
      {breathOpen && (
        <BreathingOverlay
          onClose={() => setBreathOpen(false)}
          soundsOn={soundsOn}
          pattern={breath?.pattern}
        />
      )}

      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue={helperKey.replace(/([A-Z])/g, ' $1').toLowerCase()} onBack={back} />

        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.04 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', color: T.muted, marginTop: 8, lineHeight: 1.45, letterSpacing: -0.2 }}>
            {subtitle}
          </div>
        )}
        <Rule />

        {/* Action card — what helps right now. Background carries
            the helper's category tint so the moment reads instantly. */}
        {(() => {
          const c = sectionColors(category)
          return (
        <div className="alive-card" style={{
          padding: 18,
          background: sectionPaper(category),
          border: `1px solid ${c.accent}22`,
          boxShadow: `0 1px 0 ${c.accent}10, 0 12px 24px -18px ${c.accent}30`,
          borderRadius: T.r,
          marginBottom: 18,
        }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: c.accent, marginBottom: 10 }}>
            {eyebrow}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 16.5, lineHeight: 1.65, color: T.text, letterSpacing: -0.1 }}>
            {actionLines.map((line, i) => (
              <p key={i} style={{ margin: i === actionLines.length - 1 ? 0 : '0 0 12px 0', fontStyle: i === actionLines.length - 1 && actionLines.length > 1 ? 'italic' : 'normal', color: i === actionLines.length - 1 && actionLines.length > 1 ? 'color-mix(in srgb, ' + T.text + ', white 18%)' : T.text }}>
                {line}
              </p>
            ))}
          </div>
          {recall && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${c.accent}22`, fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', color: c.accent, lineHeight: 1.5 }}>
              {recall}
            </div>
          )}
        </div>
          )
        })()}

        {breath && (
          <button onClick={() => setBreathOpen(true)}
            style={{ width: '100%', background: T.accent, color: '#fff', border: 'none', padding: '14px 16px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 13, fontWeight: 600, letterSpacing: 0.4, marginBottom: 18 }}>
            {breath.label || 'Breathe with me — two minutes'}
          </button>
        )}

        {showEscalation && escalation && (
          <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 18, background: T.accent + '10' }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.accent, marginBottom: 6 }}>
              Worth a conversation
            </div>
            {escalation.lines.map((l, i) => (
              <div key={i} style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.55, color: T.text, marginBottom: i === escalation.lines.length - 1 ? 0 : 8 }}>
                {l}
              </div>
            ))}
            {escalation.cta && (
              <button onClick={escalation.cta.onTap}
                style={{ marginTop: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, fontFamily: T.sans, padding: 0 }}>
                {escalation.cta.label} →
              </button>
            )}
          </div>
        )}

        {triage && triage.length > 0 && (
          <>
            <Rule />
            <Eyebrow>If you want to tell me more</Eyebrow>
            {triage.map((row) => (
              <div key={row.key} style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', marginBottom: 8, color: T.text }}>{row.title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${row.options.length}, 1fr)`, gap: 6 }}>
                  {row.options.map((o) => {
                    const on = triageState[row.key] === o.id
                    return (
                      <button key={`${o.id}-${on ? 'on' : 'off'}`} onClick={() => setTriage(row.key, on ? null : o.id)}
                        className={`alive-card frost-card${on ? ' tap-bloom' : ''}`}
                        style={{
                          border: `1px solid ${on ? T.accent + '55' : 'rgba(26,19,16,0.06)'}`,
                          background: on ? T.accent + '14' : 'rgba(253,250,245,0.55)',
                          color: on ? T.accent : T.text,
                          padding: '12px 6px 10px', borderRadius: 16, cursor: 'pointer',
                          fontFamily: T.sans, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          boxShadow: on ? `0 12px 22px -16px ${T.accent}60` : '0 10px 22px -22px rgba(26,19,16,0.18)',
                          transition: 'all 0.2s var(--ease-out)',
                        }}>
                        <span style={{ fontFamily: T.serif, fontStyle: on ? 'italic' : 'normal', fontSize: 13, fontWeight: 500, letterSpacing: -0.1 }}>{o.label}</span>
                        {o.sub && <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 10.5, color: T.muted, lineHeight: 1.3, textAlign: 'center' }}>{o.sub}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {resources && resources.length > 0 && (
          <>
            <Rule />
            <Eyebrow>If you need a person tonight</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {resources.map((r) => (
                <div key={r.label} className="glass-card" style={{ padding: 14, borderRadius: T.r }}>
                  <div style={{ fontFamily: T.serif, fontSize: 14.5, fontWeight: 500, color: T.text, lineHeight: 1.3 }}>{r.label}</div>
                  {r.sub && <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>{r.sub}</div>}
                  {r.detail && <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.accent, marginTop: 5, letterSpacing: 0.2, fontWeight: 600 }}>{r.detail}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {helpedOptions && helpedOptions.length > 0 && (
          <>
            <Rule />
            <Eyebrow>Once you're through this</Eyebrow>
            <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, color: T.muted, marginBottom: 12 }}>
              Tap what helped. Luna will remember for next time.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
              {helpedOptions.map((o) => {
                const on = helped.includes(o.id)
                return (
                  <button key={`${o.id}-${on ? 'on' : 'off'}`} onClick={() => toggleHelped(o.id)}
                    className={`alive-card frost-card${on ? ' tap-bloom' : ''}`}
                    style={{
                      border: `1px solid ${on ? T.accent + '55' : 'rgba(26,19,16,0.06)'}`,
                      background: on ? T.accent + '14' : 'rgba(253,250,245,0.55)',
                      color: on ? T.accent : T.text,
                      padding: '13px 6px', borderRadius: 16, cursor: 'pointer',
                      fontFamily: T.serif, fontSize: 13, fontWeight: 500,
                      fontStyle: on ? 'italic' : 'normal', letterSpacing: -0.1,
                      boxShadow: on ? `0 12px 22px -16px ${T.accent}60` : '0 10px 22px -22px rgba(26,19,16,0.18)',
                      transition: 'all 0.2s var(--ease-out)',
                    }}>
                    {o.label}
                  </button>
                )
              })}
            </div>
            <button onClick={recordEpisode} disabled={helped.length === 0}
              className={`alive-card${saved ? ' success-pulse tap-bloom' : ''}`}
              style={{
                width: '100%',
                background: helped.length === 0 ? 'rgba(26,19,16,0.08)' : T.accent,
                color: helped.length === 0 ? T.muted : '#fff',
                border: 'none', padding: '14px 16px', borderRadius: 999,
                cursor: helped.length === 0 ? 'default' : 'pointer',
                fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4,
                boxShadow: helped.length === 0 ? 'none' : `0 14px 28px -14px ${T.accent}80`,
                transition: 'all 0.25s var(--ease-out)',
              }}>
              {saved ? '✓  Saved to your playbook' : 'Remember this for me'}
            </button>
          </>
        )}

        {bottomCopy && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.hair}`, fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.55 }}>
            {bottomCopy}
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
