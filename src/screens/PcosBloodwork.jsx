import { useState, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen, Rule } from '../components/shared'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import useLuna from '../store/useLuna'
import {
  BLOODWORK_PANELS,
  bloodworkByCategory,
  getPanel,
  homaIR,
  homaIRReading,
  readingPosition,
  fmtReading,
} from '../data/pcosClinical'

// PCOS Bloodwork tracker.
//
// Lives at /pcosBloodwork. Lets her log readings for the 11 panels
// PCOS care actually wants — hormones, metabolic, thyroid, ovarian.
// Stored in settings.pcos.bloodwork[] as { id, panelId, value, unit,
// dateISO, lab?, note? }.
//
// Voice rule: never "abnormal" or "out of range" — we say "above the
// typical female range" or "in the upper end" and pair every value
// with PCOS-specific context. A 70 ng/dL testosterone is the answer
// she's been looking for, not a thing to be afraid of.

// ─── A single reading row ─────────────────────────────────────
function ReadingRow({ reading, panel, accent, onDelete }) {
  const pos = readingPosition(panel, reading.value, reading.unit)
  const cueColor = pos === 'above' ? '#C84E2E' : pos === 'below' ? '#9F7BB8' : T.muted
  const cueLabel = pos === 'above' ? 'above typical' : pos === 'below' ? 'below typical' : 'within typical'
  const dateLabel = new Date(reading.dateISO + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase()
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderBottom: '1px solid rgba(26,19,16,0.05)' }}>
      <div style={{ width: 6, height: 6, borderRadius: 999, background: cueColor, marginTop: 8, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, letterSpacing: -0.2, color: T.text }}>
            {fmtReading(reading.value, reading.unit)}
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted }}>
            {dateLabel}
          </div>
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: cueColor, marginBottom: reading.note ? 4 : 0 }}>
          {cueLabel}{reading.lab ? ` · ${reading.lab.toLowerCase()}` : ''}
        </div>
        {reading.note && (
          <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.5 }}>
            {reading.note}
          </div>
        )}
      </div>
      <button onClick={() => onDelete(reading.id)} aria-label="Remove reading"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 18, opacity: 0.45, fontFamily: T.serif, padding: '4px 6px' }}>
        ×
      </button>
    </div>
  )
}

// ─── Add-reading sheet ────────────────────────────────────────
// Inline editor — no modal/sheet wrapper because Luna avoids modals
// where possible. Shows once the user taps "+ add reading" on a
// panel; collapses on save or cancel.
function AddReadingEditor({ panel, accent, onSave, onCancel }) {
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState(panel.defaultUnit)
  const [dateISO, setDateISO] = useState(new Date().toISOString().slice(0, 10))
  const [lab, setLab] = useState('')
  const [note, setNote] = useState('')
  const canSave = value && !Number.isNaN(Number(value))
  const allUnits = [panel.defaultUnit, ...(panel.altUnits || [])]
  return (
    <div className="frost-card insight-stagger" style={{
      padding: 16,
      background: `linear-gradient(160deg, ${accent}0d, rgba(253,250,245,0.55))`,
      border: `1px solid ${accent}30`,
      borderRadius: 16,
      marginTop: 10,
      animation: 'fadeUp 0.3s ease-out both',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginBottom: 6 }}>value</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={panel.range ? `e.g. ${panel.range.high}` : ''}
              autoFocus
              style={{ flex: 1, background: 'rgba(253,250,245,0.6)', border: '1px solid rgba(26,19,16,0.08)', borderRadius: 14, padding: '12px 14px', fontSize: 16, fontFamily: T.sans, color: T.text, outline: 'none' }}
              onFocus={(e) => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accent}18` }}
              onBlur={(e)  => { e.target.style.borderColor = 'rgba(26,19,16,0.08)'; e.target.style.boxShadow = 'none' }}
            />
            {allUnits.length > 1 ? (
              <div className="frost-card" style={{ display: 'flex', background: 'rgba(253,250,245,0.55)', border: '1px solid rgba(26,19,16,0.06)', borderRadius: 999, padding: 3 }}>
                {allUnits.map((u) => (
                  <button key={u} onClick={() => setUnit(u)}
                    style={{ background: unit === u ? T.text : 'transparent', color: unit === u ? T.bg : T.text, border: 'none', padding: '8px 12px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 0.3, borderRadius: 999 }}>
                    {u}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', fontFamily: T.sans, fontSize: 12, color: T.muted }}>
                {unit}
              </div>
            )}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginBottom: 6 }}>date</div>
          <input
            type="date"
            value={dateISO}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDateISO(e.target.value)}
            style={{ width: '100%', background: 'rgba(253,250,245,0.6)', border: '1px solid rgba(26,19,16,0.08)', borderRadius: 14, padding: '12px 14px', fontSize: 16, fontFamily: T.sans, color: T.text, outline: 'none' }}
          />
        </div>
        <div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginBottom: 6 }}>lab (optional)</div>
          <input
            type="text"
            value={lab}
            onChange={(e) => setLab(e.target.value)}
            placeholder="LabCorp, Quest, your GP's lab…"
            style={{ width: '100%', background: 'rgba(253,250,245,0.6)', border: '1px solid rgba(26,19,16,0.08)', borderRadius: 14, padding: '12px 14px', fontSize: 16, fontFamily: T.sans, color: T.text, outline: 'none' }}
          />
        </div>
        <div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginBottom: 6 }}>note (optional)</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything to remember — fasted, time of day, medication taken…"
            rows={2}
            style={{ width: '100%', background: 'rgba(253,250,245,0.6)', border: '1px solid rgba(26,19,16,0.08)', borderRadius: 14, padding: '12px 14px', fontSize: 16, fontFamily: T.serif, fontStyle: 'italic', color: T.text, outline: 'none', resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={onCancel} style={{ flex: 1, background: 'transparent', color: T.text, border: '1px solid rgba(26,19,16,0.08)', padding: '11px 16px', borderRadius: 999, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.3 }}>
            Cancel
          </button>
          <button onClick={() => canSave && onSave({ value: Number(value), unit, dateISO, lab: lab.trim() || null, note: note.trim() || null })} disabled={!canSave}
            style={{ flex: 2, background: canSave ? accent : 'rgba(26,19,16,0.12)', color: canSave ? '#fff' : T.muted, border: 'none', padding: '11px 16px', borderRadius: 999, cursor: canSave ? 'pointer' : 'default', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.4 }}>
            Save reading
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Single panel card ─────────────────────────────────────────
function PanelCard({ panel, readings, accent, onAdd, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const sorted = useMemo(() => [...readings].sort((a, b) => b.dateISO.localeCompare(a.dateISO)), [readings])
  const visible = showAll ? sorted : sorted.slice(0, 3)
  const latest = sorted[0]
  const latestPos = latest ? readingPosition(panel, latest.value, latest.unit) : null
  const latestCue = latestPos === 'above' ? '#C84E2E' : latestPos === 'below' ? '#9F7BB8' : T.muted
  return (
    <div className="alive-card" style={{
      padding: 18,
      background: sectionPaper('plan'),
      border: `1px solid ${accent}22`,
      borderRadius: 20,
      marginBottom: 12,
    }}>
      {/* Header — name + latest reading at a glance */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, letterSpacing: -0.2, color: T.text, marginBottom: 2 }}>
            {panel.name}
          </div>
          {panel.range && (
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: T.muted, fontWeight: 500 }}>
              typical {panel.range.low}–{panel.range.high} {panel.range.unit}
            </div>
          )}
        </div>
        {latest && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, color: latestCue, fontWeight: 500, letterSpacing: -0.3 }}>
              {fmtReading(latest.value, latest.unit)}
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 11, color: T.muted }}>
              {new Date(latest.dateISO + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase()}
            </div>
          </div>
        )}
      </div>

      {/* PCOS-specific context — always shown, with source */}
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.text, lineHeight: 1.55, padding: '10px 0 8px', borderTop: '1px solid rgba(26,19,16,0.06)', marginTop: 8 }}>
        {panel.pcosNote}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: T.muted, fontWeight: 500, marginBottom: 4 }}>
        source · {panel.source}
      </div>

      {/* Reading list */}
      {sorted.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {visible.map((r) => (
            <ReadingRow key={r.id} reading={r} panel={panel} accent={accent} onDelete={onDelete} />
          ))}
          {sorted.length > 3 && (
            <button onClick={() => setShowAll(!showAll)}
              style={{ marginTop: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.3, fontFamily: T.sans, padding: 0 }}>
              {showAll ? `Show last 3` : `Show all ${sorted.length} readings →`}
            </button>
          )}
        </div>
      )}

      {/* Add reading affordance — inline editor opens when tapped */}
      {editing ? (
        <AddReadingEditor
          panel={panel}
          accent={accent}
          onCancel={() => setEditing(false)}
          onSave={(reading) => { onAdd(reading); setEditing(false) }}
        />
      ) : (
        <button onClick={() => setEditing(true)}
          style={{
            marginTop: sorted.length > 0 ? 12 : 8,
            background: 'transparent',
            border: `1px dashed ${accent}55`,
            color: accent,
            padding: '10px 14px',
            borderRadius: 999,
            cursor: 'pointer',
            fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.4,
            width: '100%',
          }}>
          + add reading
        </button>
      )}
    </div>
  )
}

const CATEGORY_LABEL = {
  hormones:  'Hormones',
  metabolic: 'Metabolic',
  thyroid:   'Thyroid',
  ovarian:   'Ovarian',
}

export default function PcosBloodwork() {
  const { back, settings, updateSetting } = useLuna()
  const accent = sectionColors('plan').accent
  const allReadings = settings?.pcos?.bloodwork || []

  // Group readings by panelId for fast lookup.
  const readingsByPanel = useMemo(() => {
    const m = {}
    for (const r of allReadings) {
      if (!m[r.panelId]) m[r.panelId] = []
      m[r.panelId].push(r)
    }
    return m
  }, [allReadings])

  const writeReadings = (next) => {
    const pcos = settings?.pcos || {}
    updateSetting('pcos', { ...pcos, bloodwork: next })
  }
  const addReading = (panelId, reading) => {
    const next = [...allReadings, { id: `bw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, panelId, ...reading }]
    writeReadings(next)
  }
  const deleteReading = (id) => {
    writeReadings(allReadings.filter((r) => r.id !== id))
  }

  // HOMA-IR auto-compute from latest glucose + insulin readings.
  const homaScore = useMemo(() => {
    const g = (readingsByPanel['fasting-glucose'] || []).slice().sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0]
    const i = (readingsByPanel['fasting-insulin'] || []).slice().sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0]
    if (!g || !i) return null
    return homaIR({ glucose: g.value, glucoseUnit: g.unit, insulin: i.value })
  }, [readingsByPanel])
  const homaInterp = homaIRReading(homaScore)

  const groups = bloodworkByCategory()

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="bloodwork" onBack={back} />
        <Eyebrow color={accent}>your readings, over time</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 10 }}>
          The numbers that <em>tell your PCOS story.</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 22, fontStyle: 'italic' }}>
          Log readings as you get them. Luna tracks trends and pairs every value with what it actually means in PCOS — never just "abnormal."
        </div>

        {/* HOMA-IR — only shown when both inputs exist */}
        {homaScore != null && (
          <div className="alive-card insight-stagger" style={{
            marginBottom: 22,
            padding: 18,
            background: `linear-gradient(160deg, ${accent}0e, rgba(253,250,245,0.55))`,
            border: `1px solid ${accent}30`,
            borderRadius: 20,
            animationDelay: '40ms',
          }}>
            <Eyebrow color={accent}>HOMA-IR · computed for you</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6, marginBottom: 8 }}>
              <div style={{ fontFamily: T.serif, fontSize: 40, fontStyle: 'italic', fontWeight: 500, color: accent, letterSpacing: -0.8, lineHeight: 1 }}>
                {homaScore}
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: homaInterp?.kind === 'flag' ? '#C84E2E' : homaInterp?.kind === 'borderline' ? '#C49B5A' : T.muted }}>
                {homaInterp?.label}
              </div>
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 13, color: T.text, lineHeight: 1.55, fontStyle: 'italic' }}>
              HOMA-IR is (fasting insulin × fasting glucose) / 405. In PCOS care, &lt; 1.9 is favorable; 1.9–2.5 is borderline; &gt; 2.5 typically points at insulin resistance worth treating.
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: T.muted, fontWeight: 500, marginTop: 6 }}>
              source · Endocrine Society; JCEM PCOS reviews
            </div>
          </div>
        )}

        {/* Panels, grouped by category */}
        {['hormones', 'metabolic', 'thyroid', 'ovarian'].map((cat) => {
          const list = groups[cat] || []
          if (list.length === 0) return null
          return (
            <div key={cat} className="insight-stagger" style={{ marginBottom: 22, animationDelay: '80ms' }}>
              <Eyebrow color={accent}>{CATEGORY_LABEL[cat]}</Eyebrow>
              <div style={{ marginTop: 6 }}>
                {list.map((p) => (
                  <PanelCard
                    key={p.id}
                    panel={p}
                    readings={readingsByPanel[p.id] || []}
                    accent={accent}
                    onAdd={(r) => addReading(p.id, r)}
                    onDelete={deleteReading}
                  />
                ))}
              </div>
            </div>
          )
        })}

        <Rule />
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.55, padding: '8px 0', textAlign: 'center' }}>
          Readings stay on your device + your encrypted Luna profile. Never shared without your explicit invitation.
        </div>
      </div>
    </Screen>
  )
}
