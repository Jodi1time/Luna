import { useState, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen, Rule } from '../components/shared'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import useLuna from '../store/useLuna'
import {
  PCOS_MEDICATIONS,
  getMedication,
  medicationsByKind,
  MEDICATION_KIND_LABEL,
} from '../data/pcosClinical'

// PCOS Medications + supplements tracker.
//
// Lives at /pcosMedications. Stores active items in
// settings.pcos.medications[] as:
//   { id: 'med_<n>', medId, name, dose?, startedAt, dailyLog: { 'YYYY-MM-DD': 'taken'|'skipped' } }
//
// Per-med daily check-ins (today + last 7 days at a glance). Tap a
// med to see its evidence summary + side effects + your full
// compliance history.
//
// Voice rule: never prescribe. Evidence and timeline are presented
// as information ("Many people find inositol helpful. Talk to your
// doctor."). Side effects framed as "what to watch," not warnings.

const todayISO = () => new Date().toISOString().slice(0, 10)
const daysAgoISO = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)

// ─── Med picker (when she taps + add) ────────────────────────
function MedPicker({ accent, alreadyTracked, onPick, onCancel, onCustom }) {
  const groups = medicationsByKind()
  return (
    <div className="frost-card insight-stagger" style={{
      padding: 16,
      background: `linear-gradient(160deg, ${accent}0d, rgba(253,250,245,0.55))`,
      border: `1px solid ${accent}30`,
      borderRadius: 18,
      marginTop: 10,
      animation: 'fadeUp 0.3s ease-out both',
    }}>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginBottom: 12 }}>
        Pick what you’re taking — or add something not listed.
      </div>
      {['supplement', 'rx', 'bc'].map((kind) => {
        const list = (groups[kind] || []).filter((m) => !alreadyTracked.has(m.id))
        if (list.length === 0) return null
        return (
          <div key={kind} style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1.2, color: T.muted, fontWeight: 600, marginBottom: 6 }}>
              {MEDICATION_KIND_LABEL[kind]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {list.map((m) => (
                <button key={m.id} onClick={() => onPick(m)}
                  className="alive-card"
                  style={{
                    background: 'rgba(253,250,245,0.6)',
                    border: '1px solid rgba(26,19,16,0.06)',
                    padding: '10px 14px',
                    borderRadius: 14,
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: T.text, fontFamily: 'inherit',
                  }}>
                  <div style={{ fontFamily: T.serif, fontSize: 14.5, fontWeight: 500, letterSpacing: -0.1 }}>
                    {m.name}
                  </div>
                  <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>
                    {m.purpose}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      })}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, background: 'transparent', color: T.text, border: '1px solid rgba(26,19,16,0.08)', padding: '10px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3 }}>
          Cancel
        </button>
        <button onClick={onCustom} style={{ flex: 1, background: 'transparent', color: accent, border: `1px dashed ${accent}55`, padding: '10px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3 }}>
          + custom
        </button>
      </div>
    </div>
  )
}

// ─── Custom-medication entry ─────────────────────────────────
function CustomMedEditor({ accent, onSave, onCancel }) {
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  return (
    <div className="frost-card insight-stagger" style={{
      padding: 16,
      background: `linear-gradient(160deg, ${accent}0d, rgba(253,250,245,0.55))`,
      border: `1px solid ${accent}30`,
      borderRadius: 18,
      marginTop: 10,
      animation: 'fadeUp 0.3s ease-out both',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginBottom: 6 }}>name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="What it’s called"
            autoFocus
            style={{ width: '100%', background: 'rgba(253,250,245,0.6)', border: '1px solid rgba(26,19,16,0.08)', borderRadius: 14, padding: '12px 14px', fontSize: 16, fontFamily: T.sans, color: T.text, outline: 'none' }}
            onFocus={(e) => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accent}18` }}
            onBlur={(e)  => { e.target.style.borderColor = 'rgba(26,19,16,0.08)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginBottom: 6 }}>what it’s for (optional)</div>
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="A short note for yourself"
            style={{ width: '100%', background: 'rgba(253,250,245,0.6)', border: '1px solid rgba(26,19,16,0.08)', borderRadius: 14, padding: '12px 14px', fontSize: 16, fontFamily: T.sans, color: T.text, outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, background: 'transparent', color: T.text, border: '1px solid rgba(26,19,16,0.08)', padding: '11px 16px', borderRadius: 999, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.3 }}>
            Cancel
          </button>
          <button onClick={() => name.trim() && onSave({ name: name.trim(), purpose: purpose.trim() || null })} disabled={!name.trim()}
            style={{ flex: 2, background: name.trim() ? accent : 'rgba(26,19,16,0.12)', color: name.trim() ? '#fff' : T.muted, border: 'none', padding: '11px 16px', borderRadius: 999, cursor: name.trim() ? 'pointer' : 'default', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.4 }}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Single med card with daily check-ins + history ──────────
function MedCard({ med, accent, onCheck, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const ref = med.medId ? getMedication(med.medId) : null  // null for custom meds
  const purpose = ref?.purpose || med.purpose || null

  // Render today + 6 prior days as a strip. State per day:
  // 'taken' (filled), 'skipped' (dot), undefined (empty circle).
  const days = useMemo(() => {
    const out = []
    for (let i = 0; i < 7; i++) {
      const iso = daysAgoISO(i)
      const state = med.dailyLog?.[iso]
      out.push({ iso, state, label: new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1) })
    }
    return out
  }, [med.dailyLog])

  const todayState = med.dailyLog?.[todayISO()]

  return (
    <div className="alive-card" style={{
      padding: 18,
      background: sectionPaper('plan'),
      border: `1px solid ${accent}22`,
      borderRadius: 20,
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: purpose ? 4 : 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.serif, fontSize: 16.5, fontWeight: 500, letterSpacing: -0.2, color: T.text, marginBottom: 2 }}>
            {med.name}
          </div>
          {med.dose && (
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 0.5, color: T.muted, fontWeight: 500 }}>
              {med.dose}
            </div>
          )}
        </div>
        <button onClick={() => onDelete(med.id)} aria-label="Stop tracking"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 18, opacity: 0.45, fontFamily: T.serif, padding: '0 4px' }}>
          ×
        </button>
      </div>
      {purpose && (
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 10 }}>
          {purpose}
        </div>
      )}

      {/* 7-day check-in strip */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {days.slice().reverse().map((d, i) => {
          const isToday = i === days.length - 1
          const isTaken = d.state === 'taken'
          const isSkipped = d.state === 'skipped'
          return (
            <button key={d.iso}
              onClick={() => isToday ? onCheck(med.id, todayState === 'taken' ? null : 'taken') : null}
              disabled={!isToday}
              aria-label={`${d.iso} — ${d.state || 'not logged'}`}
              style={{
                flex: 1,
                height: 36,
                background: isTaken ? accent : isSkipped ? `${T.muted}26` : 'rgba(253,250,245,0.5)',
                border: `1px solid ${isToday ? accent + '55' : 'rgba(26,19,16,0.06)'}`,
                borderRadius: 12,
                cursor: isToday ? 'pointer' : 'default',
                color: isTaken ? '#fff' : T.muted,
                fontFamily: T.serif, fontStyle: 'italic', fontSize: 11,
                fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s var(--ease-out)',
              }}>
              {isTaken ? '✓' : d.label.toLowerCase()}
            </button>
          )
        })}
      </div>

      {/* Tap-row for today's status with explicit text — easier than
          parsing the strip for screen-reader users + clearer affordance */}
      <div style={{ display: 'flex', gap: 8, marginBottom: ref ? 12 : 0 }}>
        <button onClick={() => onCheck(med.id, todayState === 'taken' ? null : 'taken')}
          className="alive-card"
          style={{
            flex: 1,
            background: todayState === 'taken' ? accent : 'rgba(253,250,245,0.5)',
            color: todayState === 'taken' ? '#fff' : T.text,
            border: `1px solid ${todayState === 'taken' ? accent + '55' : 'rgba(26,19,16,0.06)'}`,
            padding: '10px 12px', borderRadius: 14, cursor: 'pointer',
            fontFamily: T.serif, fontStyle: 'italic', fontSize: 13,
            transition: 'all 0.2s var(--ease-out)',
          }}>
          {todayState === 'taken' ? 'taken today ✓' : 'mark taken today'}
        </button>
        <button onClick={() => onCheck(med.id, todayState === 'skipped' ? null : 'skipped')}
          style={{
            background: todayState === 'skipped' ? `${T.muted}30` : 'transparent',
            color: T.muted,
            border: '1px solid rgba(26,19,16,0.06)',
            padding: '10px 14px', borderRadius: 14, cursor: 'pointer',
            fontFamily: T.serif, fontStyle: 'italic', fontSize: 12,
          }}>
          skipped
        </button>
      </div>

      {/* Expand to show evidence + side effects + timeline (for known
          meds only — custom meds are user-named and don't carry data). */}
      {ref && (
        <>
          <button onClick={() => setExpanded(!expanded)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.3, fontFamily: T.sans, padding: 0 }}>
            {expanded ? 'hide details' : 'about this — evidence + what to watch'}
          </button>
          {expanded && (
            <div className="insight-stagger" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(26,19,16,0.06)', animation: 'fadeUp 0.3s ease-out both' }}>
              {ref.timeline && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1, color: T.muted, fontWeight: 600, marginBottom: 4 }}>TIMELINE</div>
                  <div style={{ fontFamily: T.serif, fontSize: 13, color: T.text, lineHeight: 1.5, fontStyle: 'italic' }}>
                    {ref.timeline}
                  </div>
                </div>
              )}
              {ref.evidence && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1, color: T.muted, fontWeight: 600, marginBottom: 4 }}>EVIDENCE</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {ref.evidence.map((e, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ width: 4, height: 4, borderRadius: 999, background: accent, marginTop: 8, flexShrink: 0, opacity: 0.85 }} />
                        <div style={{ fontFamily: T.serif, fontSize: 13, color: T.text, lineHeight: 1.55, flex: 1 }}>{e}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ref.sideEffects && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1, color: T.muted, fontWeight: 600, marginBottom: 4 }}>WHAT TO WATCH</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {ref.sideEffects.map((e, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ width: 4, height: 4, borderRadius: 999, background: T.muted, marginTop: 8, flexShrink: 0, opacity: 0.5 }} />
                        <div style={{ fontFamily: T.serif, fontSize: 13, color: T.text, lineHeight: 1.55, flex: 1 }}>{e}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ref.notes && (
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.55, padding: '10px 12px', background: `${accent}0a`, border: `1px solid ${accent}22`, borderRadius: 12, marginBottom: 8 }}>
                  {ref.notes}
                </div>
              )}
              <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: T.muted, fontWeight: 500 }}>
                source · {ref.source}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function PcosMedications() {
  const { back, settings, updateSetting } = useLuna()
  const accent = sectionColors('plan').accent
  const meds = settings?.pcos?.medications || []

  const [picking, setPicking] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const alreadyTracked = useMemo(() => new Set(meds.map((m) => m.medId).filter(Boolean)), [meds])

  const writeMeds = (next) => {
    const pcos = settings?.pcos || {}
    updateSetting('pcos', { ...pcos, medications: next })
  }
  const addMed = ({ medId, name, dose, purpose }) => {
    const next = [...meds, {
      id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      medId: medId || null,
      name,
      dose: dose || null,
      purpose: purpose || null,
      startedAt: todayISO(),
      dailyLog: {},
    }]
    writeMeds(next)
  }
  const deleteMed = (id) => {
    if (!window.confirm('Stop tracking this? Your check-in history will be removed.')) return
    writeMeds(meds.filter((m) => m.id !== id))
  }
  const checkMed = (id, state) => {
    const t = todayISO()
    const next = meds.map((m) => {
      if (m.id !== id) return m
      const dailyLog = { ...(m.dailyLog || {}) }
      if (state == null) delete dailyLog[t]
      else dailyLog[t] = state
      return { ...m, dailyLog }
    })
    writeMeds(next)
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="treatments" onBack={back} />
        <Eyebrow color={accent}>what you’re tracking</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 10 }}>
          Day by day, <em>quietly.</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 22, fontStyle: 'italic' }}>
          Tap a med to mark today taken. Tap the name to expand — evidence, timeline, what to watch. Luna stores compliance privately and uses it on your dashboard, never to nag you.
        </div>

        {meds.length === 0 && !picking && !customizing && (
          <div className="frost-card" style={{
            padding: 22,
            background: `linear-gradient(160deg, ${accent}0e, rgba(253,250,245,0.55))`,
            border: `1px dashed ${accent}40`,
            borderRadius: 18,
            marginBottom: 14,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
              Nothing here yet. Add what you’re taking — inositol, metformin, spironolactone, vitamin D, or anything else.
            </div>
          </div>
        )}

        {meds.map((m) => (
          <MedCard key={m.id} med={m} accent={accent} onCheck={checkMed} onDelete={deleteMed} />
        ))}

        {picking && (
          <MedPicker
            accent={accent}
            alreadyTracked={alreadyTracked}
            onPick={(m) => { addMed({ medId: m.id, name: m.name, dose: m.defaultDose, purpose: m.purpose }); setPicking(false) }}
            onCancel={() => setPicking(false)}
            onCustom={() => { setPicking(false); setCustomizing(true) }}
          />
        )}

        {customizing && (
          <CustomMedEditor
            accent={accent}
            onCancel={() => setCustomizing(false)}
            onSave={({ name, purpose }) => { addMed({ name, purpose }); setCustomizing(false) }}
          />
        )}

        {!picking && !customizing && (
          <button onClick={() => setPicking(true)}
            style={{
              marginTop: 8,
              background: accent,
              color: '#fff',
              border: 'none',
              padding: '14px 18px',
              borderRadius: 999,
              cursor: 'pointer',
              fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4,
              width: '100%',
            }}>
            + add a treatment
          </button>
        )}

        <Rule />
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.55, padding: '8px 0', textAlign: 'center' }}>
          Nothing here prescribes anything. Talk to your doctor about what’s right for you.
        </div>
      </div>
    </Screen>
  )
}
