import { useState, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen, Rule } from '../components/shared'
import { sectionColors } from '../data/sectionPalette'
import useLuna from '../store/useLuna'
import { useCycle } from '../hooks/useCycle'
import { SYMPTOMS } from '../data/lunaData'
import { getPanel, getMedication, homaIR, homaIRReading, fmtReading } from '../data/pcosClinical'
import {
  pcosCycleRead,
  pcosSignalCounts,
} from '../data/pcos'

// PCOS Doctor-script generator.
//
// Takes everything she's logged — symptoms over the last 90 days,
// cycle pattern, bloodwork values, active treatments — and stitches
// it into a sourced, plain-English conversation she can hand to her
// doctor. Printable to PDF. Copyable as plain text for portal messages.
//
// Five purposes, each with its own opener + ask:
//   - first-conversation (pre-diagnosis)
//   - newly-diagnosed (next steps)
//   - treatment-review (current plan not working)
//   - ttc (planning conception)
//   - annual (routine review)
//
// Every numeric claim references her own data. Tests-to-ask language
// comes from the International PCOS Guideline 2023 and Endocrine
// Society Clinical Practice Guideline. The script never prescribes
// — it surfaces what's been happening + what she'd like to discuss.

// ─── HTML escape for the printable template ──────────────────
function htmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ─── Purpose definitions ─────────────────────────────────────
const PURPOSES = [
  {
    id: 'first-conversation',
    label: 'I think I might have PCOS — first conversation',
    opener: 'Over the last several months I’ve been noticing patterns that fit PCOS. I’d like to talk through what I’ve been tracking and decide together whether a full workup makes sense.',
    ask: [
      'Total + free testosterone',
      'DHEA-S',
      'SHBG',
      'Fasting glucose + insulin (for HOMA-IR)',
      'AMH',
      'TSH + free T4 (to rule out thyroid)',
      'Prolactin (to rule out other causes)',
      'Lipid panel (PCOS raises cardiovascular risk)',
      'Pelvic ultrasound — transvaginal preferred',
    ],
    note: 'Rotterdam criteria diagnose PCOS with 2 of 3: irregular ovulation, clinical or biochemical androgen excess, or polycystic ovaries on ultrasound. I’d like to evaluate all three.',
  },
  {
    id: 'newly-diagnosed',
    label: 'I’m newly diagnosed — what’s next',
    opener: 'I was recently diagnosed with PCOS. I’ve been tracking symptoms and would like to talk through what treatment path makes sense for me right now.',
    ask: [
      'Repeat fasting insulin + HbA1c (baseline for metabolic monitoring)',
      'Lipid panel (baseline)',
      'Discuss inositol (myo + d-chiro 40:1)',
      'Discuss metformin if insulin resistance is present',
      'Discuss spironolactone for androgen symptoms',
      'Discuss whether hormonal birth control fits my current priorities',
      'Discuss when to re-check androgens after starting treatment',
    ],
    note: 'I’d like to understand which treatments are evidence-supported for my specific symptom pattern, and the realistic timeline for seeing change.',
  },
  {
    id: 'treatment-review',
    label: 'My current treatment isn’t working — what now',
    opener: 'I’ve been on my current treatment plan for a while and I don’t feel like it’s addressing what I’m most concerned about. I’d like to talk about adjustments.',
    ask: [
      'Repeat full hormonal + metabolic panel to see what’s changed',
      'Discuss escalating to add or change medication',
      'Discuss GLP-1 agonists if metabolic markers haven’t improved',
      'Discuss higher-dose spironolactone or adding finasteride if androgen symptoms persist',
      'Discuss referral to a reproductive endocrinologist',
    ],
    note: 'I’d like to share what symptoms have changed and what hasn’t since starting this plan, and decide what to try next.',
  },
  {
    id: 'ttc',
    label: 'I’m thinking about trying to conceive',
    opener: 'I have PCOS and we’re thinking about trying to conceive. I’d like to talk about what to do before we start trying, and what to know about my fertility window.',
    ask: [
      'AMH (current reading)',
      'TSH + free T4 (pre-conception optimization)',
      'Lipid panel + HbA1c',
      'Discuss letrozole (first-line ovulation induction for PCOS — NEJM 2014)',
      'Discuss whether continuing metformin during conception is right',
      'Pre-conception folic acid recommendation',
      'Discuss timing — average time to conception with PCOS + the realistic horizon',
      'Discuss what would prompt a referral to a reproductive endocrinologist',
    ],
    note: 'I understand letrozole is first-line for PCOS-related ovulation induction now, not Clomid. I’d like to start with the most evidence-based approach.',
  },
  {
    id: 'annual',
    label: 'Annual / routine review',
    opener: 'I’m here for my annual PCOS check-in. I’ve been tracking symptoms and treatments and would like to talk about how things are going.',
    ask: [
      'Annual fasting glucose + HbA1c',
      'Lipid panel',
      'Blood pressure',
      'Repeat androgens if symptoms have changed',
      'Discuss any side effects from current treatments',
      'Discuss whether any treatment adjustments make sense',
    ],
    note: 'PCOS raises lifetime risk of type 2 diabetes (4×), endometrial cancer (3×), and cardiovascular disease — I’d like to stay on top of monitoring even when I feel okay.',
  },
]

// ─── Symptom history summary from logs ────────────────────────
function topSymptomsFromLogs(logs, days = 90) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const counts = {}
  for (const [date, log] of Object.entries(logs || {})) {
    if (date < cutoff) continue
    for (const s of (log.symptoms || [])) {
      counts[s] = (counts[s] || 0) + 1
    }
  }
  return Object.entries(counts)
    .map(([id, n]) => ({ id, label: SYMPTOMS[id]?.label || id, count: n }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
}

// ─── Latest reading per panel ─────────────────────────────────
function latestByPanel(bloodwork) {
  const m = {}
  for (const r of bloodwork || []) {
    if (!m[r.panelId] || r.dateISO > m[r.panelId].dateISO) m[r.panelId] = r
  }
  return m
}

// ─── Active meds with duration ────────────────────────────────
function medicationsSummary(meds) {
  const today = new Date()
  return (meds || []).map((m) => {
    const started = m.startedAt ? new Date(m.startedAt + 'T00:00:00') : null
    const monthsOn = started ? Math.floor((today - started) / (30 * 86400000)) : null
    return {
      name: m.name,
      dose: m.dose,
      monthsOn,
      ref: m.medId ? getMedication(m.medId) : null,
    }
  })
}

// ─── The script generator — pure function ─────────────────────
// Returns a structured object with paragraphs + sections so the same
// content can render in both JSX preview and the printable HTML.
function buildScript({ purposeId, sections, cycle, logs, bloodwork, meds, displayName }) {
  const purpose = PURPOSES.find((p) => p.id === purposeId) || PURPOSES[0]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const symptoms = sections.symptoms ? topSymptomsFromLogs(logs, 90).slice(0, 8) : []
  const cycleRead = sections.cycle ? pcosCycleRead(cycle?.periodHistory, cycle?.cycleLength) : null
  const latest = sections.bloodwork ? latestByPanel(bloodwork) : {}
  const orderedReadings = sections.bloodwork
    ? Object.values(latest).sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    : []
  const medList = sections.meds ? medicationsSummary(meds) : []
  const homaScore = (() => {
    const g = latest['fasting-glucose']
    const i = latest['fasting-insulin']
    if (!g || !i) return null
    return homaIR({ glucose: g.value, glucoseUnit: g.unit, insulin: i.value })
  })()
  const homaLabel = homaScore != null ? homaIRReading(homaScore) : null

  return { purpose, today, symptoms, cycleRead, orderedReadings, medList, homaScore, homaLabel, displayName }
}

// ─── Printable HTML template ──────────────────────────────────
function buildPrintableHTML(script) {
  const { purpose, today, symptoms, cycleRead, orderedReadings, medList, homaScore, homaLabel, displayName } = script
  const symptomsSection = symptoms.length === 0 ? '' : `
    <h2>Symptoms I’ve been tracking (last 90 days)</h2>
    <ul>${symptoms.map((s) => `<li>${htmlEscape(s.label)} — logged ${s.count} day${s.count === 1 ? '' : 's'}</li>`).join('')}</ul>`
  const cycleSection = !cycleRead ? '' : `
    <h2>My cycle pattern</h2>
    <p>${htmlEscape(cycleRead.summary)}</p>${cycleRead.source ? `<p class="src">Reference: ${htmlEscape(cycleRead.source)}</p>` : ''}`
  const bloodworkSection = orderedReadings.length === 0 ? '' : `
    <h2>My most recent bloodwork</h2>
    <ul>${orderedReadings.map((r) => {
      const p = getPanel(r.panelId)
      return `<li>${htmlEscape(p?.name || r.panelId)}: <strong>${htmlEscape(fmtReading(r.value, r.unit))}</strong> (${htmlEscape(new Date(r.dateISO + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))})</li>`
    }).join('')}${homaScore != null ? `<li><em>HOMA-IR (computed): <strong>${homaScore}</strong> — ${htmlEscape(homaLabel?.label || '')}</em></li>` : ''}</ul>`
  const medsSection = medList.length === 0 ? '' : `
    <h2>What I’m currently taking</h2>
    <ul>${medList.map((m) => `<li>${htmlEscape(m.name)}${m.dose ? ` — ${htmlEscape(m.dose)}` : ''}${m.monthsOn != null ? ` (${m.monthsOn === 0 ? 'just started' : `${m.monthsOn} month${m.monthsOn === 1 ? '' : 's'} in`})` : ''}</li>`).join('')}</ul>`
  const askSection = `
    <h2>What I’d like to discuss / ask for</h2>
    <ul>${purpose.ask.map((a) => `<li>${htmlEscape(a)}</li>`).join('')}</ul>
    ${purpose.note ? `<p><em>${htmlEscape(purpose.note)}</em></p>` : ''}`

  return `<!DOCTYPE html><html><head><title>PCOS — for my appointment</title>
<style>
  body{font-family:Georgia,serif;padding:40px;max-width:680px;margin:0 auto;color:#1a1310;line-height:1.5;}
  h1{font-size:24px;margin:0 0 4px;}
  .sub{font-size:12px;color:#888;margin-bottom:24px;}
  h2{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#888;margin:24px 0 8px;}
  p{font-size:14px;margin:10px 0;}
  ul{margin:8px 0 14px;padding-left:22px;}
  li{font-size:14px;margin:4px 0;}
  .src{font-size:11px;color:#999;}
  .opener{font-size:15px;font-style:italic;margin:14px 0;padding:14px 16px;background:#f6efe2;border-left:3px solid #7E5DA8;border-radius:4px;}
  .footer{margin-top:32px;padding-top:14px;border-top:1px solid #e8e3d8;font-size:11px;color:#999;}
</style></head><body>
<h1>PCOS — for my appointment</h1>
<div class="sub">${htmlEscape(displayName ? `${displayName} · ` : '')}${htmlEscape(today)}</div>

<h2>Why I’m here today</h2>
<div class="opener">${htmlEscape(purpose.opener)}</div>
${cycleSection}
${symptomsSection}
${bloodworkSection}
${medsSection}
${askSection}

<div class="footer">Generated by Luna — for discussion with a healthcare provider. Not a diagnosis. Information sourced from the International PCOS Guideline 2023, Endocrine Society Clinical Practice Guideline, and ACOG Practice Bulletin 194.</div>
</body></html>`
}

// ─── Plain-text version for clipboard / portal messages ──────
function buildPlainText(script) {
  const { purpose, today, symptoms, cycleRead, orderedReadings, medList, homaScore, homaLabel, displayName } = script
  const lines = []
  lines.push(`PCOS — for my appointment`)
  lines.push(`${displayName ? `${displayName} · ` : ''}${today}`)
  lines.push('')
  lines.push(`WHY I'M HERE TODAY`)
  lines.push(purpose.opener)
  lines.push('')
  if (cycleRead) {
    lines.push(`MY CYCLE PATTERN`)
    lines.push(cycleRead.summary)
    if (cycleRead.source) lines.push(`(Reference: ${cycleRead.source})`)
    lines.push('')
  }
  if (symptoms.length > 0) {
    lines.push(`SYMPTOMS I'VE BEEN TRACKING (last 90 days)`)
    for (const s of symptoms) lines.push(`• ${s.label} — logged ${s.count} day${s.count === 1 ? '' : 's'}`)
    lines.push('')
  }
  if (orderedReadings.length > 0) {
    lines.push(`MY MOST RECENT BLOODWORK`)
    for (const r of orderedReadings) {
      const p = getPanel(r.panelId)
      lines.push(`• ${p?.name || r.panelId}: ${fmtReading(r.value, r.unit)} (${new Date(r.dateISO + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`)
    }
    if (homaScore != null) lines.push(`• HOMA-IR (computed): ${homaScore} — ${homaLabel?.label || ''}`)
    lines.push('')
  }
  if (medList.length > 0) {
    lines.push(`WHAT I'M CURRENTLY TAKING`)
    for (const m of medList) {
      const dur = m.monthsOn != null ? ` (${m.monthsOn === 0 ? 'just started' : `${m.monthsOn} month${m.monthsOn === 1 ? '' : 's'} in`})` : ''
      lines.push(`• ${m.name}${m.dose ? ` — ${m.dose}` : ''}${dur}`)
    }
    lines.push('')
  }
  lines.push(`WHAT I'D LIKE TO DISCUSS / ASK FOR`)
  for (const a of purpose.ask) lines.push(`• ${a}`)
  if (purpose.note) {
    lines.push('')
    lines.push(purpose.note)
  }
  lines.push('')
  lines.push(`— Generated by Luna. Sources: International PCOS Guideline 2023, Endocrine Society Clinical Practice Guideline, ACOG Practice Bulletin 194.`)
  return lines.join('\n')
}

export default function PcosDoctorScript() {
  const store = useLuna()
  const { back, logs, settings, displayName } = store
  const cycle = useCycle(store)
  const accent = sectionColors('plan').accent
  const [purposeId, setPurposeId] = useState('first-conversation')
  // HAVEN-NOT-CLASSROOM: previously had 4 visible section toggles.
  // Killed them — every available block goes into the script by
  // default. The user picks her visit purpose; Luna composes the rest.
  // One decision instead of five.
  const sections = { cycle: true, symptoms: true, bloodwork: true, meds: true }
  const [copied, setCopied] = useState(false)

  const bloodwork = settings?.pcos?.bloodwork || []
  const meds = settings?.pcos?.medications || []

  const script = useMemo(
    () => buildScript({ purposeId, sections, cycle, logs, bloodwork, meds, displayName }),
    [purposeId, sections, cycle, logs, bloodwork, meds, displayName]
  )

  const exportPDF = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(buildPrintableHTML(script))
    w.document.close()
    w.print()
  }

  const copyText = async () => {
    const text = buildPlainText(script)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments where clipboard API is blocked
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
      document.body.removeChild(ta)
    }
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="for your appointment" onBack={back} />
        <Eyebrow color={accent}>plain English, sourced, ready</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 10 }}>
          The words to <em>bring with you.</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 22, fontStyle: 'italic' }}>
          Luna stitches what you’ve logged into a one-page summary your doctor can read in 30 seconds. Print it, or copy it into a portal message.
        </div>

        {/* Purpose picker — sets the opener + the ask */}
        <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '40ms' }}>
          <Eyebrow color={accent}>What’s this visit about</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {PURPOSES.map((p) => {
              const on = p.id === purposeId
              return (
                <button key={p.id} onClick={() => setPurposeId(p.id)}
                  className={`alive-card frost-card${on ? ' tap-bloom' : ''}`}
                  style={{
                    textAlign: 'left', cursor: 'pointer', width: '100%',
                    padding: '12px 14px',
                    background: on ? `${accent}14` : 'rgba(253,250,245,0.55)',
                    border: `1px solid ${on ? accent + '55' : 'rgba(26,19,16,0.06)'}`,
                    borderRadius: 14, color: T.text, fontFamily: 'inherit',
                  }}>
                  <div style={{ fontFamily: T.serif, fontStyle: on ? 'italic' : 'normal', fontSize: 14, fontWeight: 500, letterSpacing: -0.1, color: on ? accent : T.text }}>
                    {p.label}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Live preview — soft frost card showing what the script looks like */}
        <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '100ms' }}>
          <Eyebrow color={accent}>Preview</Eyebrow>
          <div className="frost-card" style={{
            padding: '18px 18px 14px',
            background: 'rgba(253,250,245,0.65)',
            border: `1px solid ${accent}22`,
            borderRadius: 18,
            marginTop: 6,
          }}>
            <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.text, marginBottom: 4 }}>
              PCOS — for my appointment
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: T.muted, fontWeight: 500, marginBottom: 14 }}>
              {(displayName ? `${displayName} · ` : '') + script.today}
            </div>

            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 6 }}>
              WHY I’M HERE TODAY
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.text, lineHeight: 1.55, marginBottom: 14, paddingLeft: 10, borderLeft: `2px solid ${accent}55` }}>
              {script.purpose.opener}
            </div>

            {script.cycleRead && (
              <>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 6 }}>
                  MY CYCLE PATTERN
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.text, lineHeight: 1.55, marginBottom: 14 }}>
                  {script.cycleRead.summary}
                </div>
              </>
            )}

            {script.symptoms.length > 0 && (
              <>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 6 }}>
                  SYMPTOMS I’VE BEEN TRACKING (LAST 90 DAYS)
                </div>
                <div style={{ marginBottom: 14 }}>
                  {script.symptoms.map((s) => (
                    <div key={s.id} style={{ fontFamily: T.serif, fontSize: 13, color: T.text, lineHeight: 1.55 }}>
                      • {s.label} — logged {s.count} day{s.count === 1 ? '' : 's'}
                    </div>
                  ))}
                </div>
              </>
            )}

            {script.orderedReadings.length > 0 && (
              <>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 6 }}>
                  MY MOST RECENT BLOODWORK
                </div>
                <div style={{ marginBottom: 14 }}>
                  {script.orderedReadings.map((r) => {
                    const p = getPanel(r.panelId)
                    return (
                      <div key={r.id} style={{ fontFamily: T.serif, fontSize: 13, color: T.text, lineHeight: 1.55 }}>
                        • {p?.name || r.panelId}: <strong>{fmtReading(r.value, r.unit)}</strong>
                      </div>
                    )
                  })}
                  {script.homaScore != null && (
                    <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.text, lineHeight: 1.55 }}>
                      • HOMA-IR (computed): <strong>{script.homaScore}</strong> — {script.homaLabel?.label}
                    </div>
                  )}
                </div>
              </>
            )}

            {script.medList.length > 0 && (
              <>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 6 }}>
                  WHAT I’M CURRENTLY TAKING
                </div>
                <div style={{ marginBottom: 14 }}>
                  {script.medList.map((m, i) => (
                    <div key={i} style={{ fontFamily: T.serif, fontSize: 13, color: T.text, lineHeight: 1.55 }}>
                      • {m.name}{m.dose ? ` — ${m.dose}` : ''}{m.monthsOn != null ? ` (${m.monthsOn === 0 ? 'just started' : `${m.monthsOn} month${m.monthsOn === 1 ? '' : 's'} in`})` : ''}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 6 }}>
              WHAT I’D LIKE TO DISCUSS / ASK FOR
            </div>
            <div style={{ marginBottom: 4 }}>
              {script.purpose.ask.map((a, i) => (
                <div key={i} style={{ fontFamily: T.serif, fontSize: 13, color: T.text, lineHeight: 1.55 }}>
                  • {a}
                </div>
              ))}
            </div>
            {script.purpose.note && (
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.55, marginTop: 8 }}>
                {script.purpose.note}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button onClick={copyText}
            className="alive-card frost-card"
            style={{
              flex: 1,
              padding: '14px 16px',
              background: 'rgba(253,250,245,0.65)',
              border: `1px solid ${accent}40`,
              borderRadius: 999,
              cursor: 'pointer',
              fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.4,
              color: accent,
            }}>
            {copied ? '✓ copied' : 'copy as text'}
          </button>
          <button onClick={exportPDF}
            className="alive-card"
            style={{
              flex: 1,
              padding: '14px 16px',
              background: accent,
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              cursor: 'pointer',
              fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.4,
              boxShadow: `0 10px 22px -10px ${accent}80`,
            }}>
            print or save PDF
          </button>
        </div>

        <Rule />
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.55, padding: '12px 0 8px', textAlign: 'center' }}>
          Nothing here diagnoses or prescribes. It’s your words, organized — so the conversation goes faster.
        </div>
      </div>
    </Screen>
  )
}
