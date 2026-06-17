import { useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen, Rule } from '../components/shared'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import { PhaseFlourish } from '../components/phaseFlourishes'
import useLuna from '../store/useLuna'
import { useCycle } from '../hooks/useCycle'
import { SYMPTOMS } from '../data/lunaData'
import { SymptomIcon } from '../components/symptomIcons'
import {
  pcosCycleRead,
  pcosSignalCounts,
  todaysPcosLiteracy,
  pcosNextThing,
  INSULIN_PATTERN_SIGNALS,
  ANDROGEN_PATTERN_SIGNALS,
} from '../data/pcos'
import { homaIR, homaIRReading } from '../data/pcosClinical'

// PCOS Deep Mode — dashboard.
//
// Lives at the 'pcos' route. Entered from Home's PinnedConditionCard
// when the user said in onboarding she's managing PCOS, or from
// Settings → Your Luna for anyone who'd like to see what's here.
//
// This is the first surface of the PCOS deep mode v1 — the foundation
// piece. Sections shipped now:
//   - Cycle pattern read (Rotterdam-aware)
//   - What you're noticing this month (PCOS-axis signal summary)
//   - Today's next thing (one quiet suggestion)
//   - A small thing to know (rotating literacy)
//   - Linked tracking surfaces for bloodwork, treatments, and
//     doctor-ready summaries.
//
// Voice rules from src/data/pcos.js apply throughout — never "diet",
// never "weight loss", never "obese", never "infertility", and the
// "PCOS isn't really about cysts" line shows up in the literacy
// rotation as load-bearing reframe.

function StatCard({ label, value, hint, accent }) {
  return (
    <div className="frost-card" style={{
      padding: '14px 16px',
      background: 'rgba(253,250,245,0.55)',
      border: `1px solid ${accent}22`,
      borderRadius: 18,
      flex: 1, minWidth: 0,
    }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 500, fontStyle: 'italic', letterSpacing: -0.4, color: accent, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>
          {hint}
        </div>
      )}
    </div>
  )
}

function TrackingRow({ label, body, meta, onTap, last = false }) {
  return (
    <button onClick={onTap}
      className="alive-card"
      style={{
        width: '100%',
        padding: '15px 0',
        background: 'transparent',
        border: 'none',
        borderBottom: last ? 'none' : '1px solid rgba(26,19,16,0.06)',
        textAlign: 'left',
        cursor: 'pointer',
        color: T.text,
        fontFamily: 'inherit',
      }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
        <div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, letterSpacing: -0.2, color: T.text }}>
          {label}
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted }}>
          {meta}
        </div>
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
        {body}
      </div>
    </button>
  )
}

export default function Pcos() {
  const store = useLuna()
  const { back, go, logs, settings } = store
  const cycle = useCycle(store)
  const accent = sectionColors('plan').accent
  const phase = cycle?.phase

  // Cycle pattern read — Rotterdam-aware. Reads her history and
  // names the pattern in PCOS-fluent language.
  const cycleRead = useMemo(
    () => pcosCycleRead(cycle?.periodHistory, cycle?.cycleLength),
    [cycle?.periodHistory, cycle?.cycleLength]
  )

  // Signal counts across her last 30 days — drives axis summary +
  // the "next thing" suggestion.
  const signalCounts = useMemo(
    () => pcosSignalCounts(logs, 30),
    [logs]
  )
  // Bloodwork + medications summaries — drive both the next-thing
  // recommender and the new live tracker cards on the dashboard.
  const bloodwork = settings?.pcos?.bloodwork || []
  const hasBloodwork = bloodwork.length > 0
  const meds = settings?.pcos?.medications || []
  const todayISO = new Date().toISOString().slice(0, 10)
  const takenTodayCount = meds.filter((m) => m.dailyLog?.[todayISO] === 'taken').length

  // Latest HOMA-IR for the bloodwork summary card.
  const homaSummary = useMemo(() => {
    const byPanel = {}
    for (const r of bloodwork) {
      if (!byPanel[r.panelId]) byPanel[r.panelId] = []
      byPanel[r.panelId].push(r)
    }
    const g = (byPanel['fasting-glucose'] || []).slice().sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0]
    const i = (byPanel['fasting-insulin'] || []).slice().sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0]
    if (!g || !i) return null
    const score = homaIR({ glucose: g.value, glucoseUnit: g.unit, insulin: i.value })
    return { score, interp: homaIRReading(score) }
  }, [bloodwork])

  const nextThing = useMemo(
    () => pcosNextThing({
      cycleDay: cycle?.cycleDay,
      cycleLength: cycle?.cycleLength,
      signalCounts,
      hasBloodwork,
    }),
    [cycle?.cycleDay, cycle?.cycleLength, signalCounts, hasBloodwork]
  )

  const literacy = todaysPcosLiteracy()
  const topSignals = useMemo(() => {
    const allIds = [...ANDROGEN_PATTERN_SIGNALS, ...INSULIN_PATTERN_SIGNALS]
    return allIds
      .map((id) => ({ id, label: SYMPTOMS[id]?.label || id, count: signalCounts[id] || 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
  }, [signalCounts])

  // Handler for the next-thing CTA when it routes somewhere.
  const handleNextThingCta = () => {
    if (nextThing.disabled) return
    if (nextThing.activeConditionId) {
      useLuna.setState({ activeConditionId: nextThing.activeConditionId })
    }
    if (nextThing.route) go(nextThing.route)
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="PCOS" onBack={back} />

        {/* Hero — phase-flourished header that names the mode. */}
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, animationDelay: '0ms' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow color={accent}>your ongoing read</Eyebrow>
            <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginTop: 4 }}>
              Your <em>PCOS</em>, this month.
            </div>
          </div>
          {phase && (
            <div aria-hidden="true" style={{ color: accent, opacity: 0.55, paddingTop: 8 }}>
              <PhaseFlourish phaseId={phase.id} size={28} />
            </div>
          )}
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, lineHeight: 1.6, fontStyle: 'italic', marginTop: 10, marginBottom: 26, animationDelay: '40ms' }}>
          PCOS reads itself slowly. Each day you log adds to the picture — and to what Luna can hand to your doctor.
        </div>

        {/* Cycle pattern read — the most Luna-distinctive section.
            Names her timing in PCOS-fluent language with sources. */}
        <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '80ms' }}>
          <Eyebrow color={accent}>Your cycle pattern</Eyebrow>
          <div className="alive-card" style={{
            padding: 18,
            background: sectionPaper('plan'),
            border: `1px solid ${accent}28`,
            borderRadius: 20,
            boxShadow: `0 14px 30px -22px ${accent}50`,
            marginTop: 4,
          }}>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6, color: T.text, marginBottom: cycleRead.source ? 10 : 0 }}>
              {cycleRead.summary}
            </div>
            {cycleRead.source && (
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.muted, fontWeight: 500 }}>
                source · {cycleRead.source}
              </div>
            )}
            {cycleRead.kind !== 'not-enough-data' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <StatCard label="AVG" value={`${cycleRead.avg}d`} hint="last cycles" accent={accent} />
                <StatCard label="RANGE" value={`${cycleRead.min}–${cycleRead.max}`} hint="shortest → longest" accent={accent} />
              </div>
            )}
          </div>
        </div>

        {/* What she's been noticing — single quiet summary instead of
            two separate axis cards. The androgen/insulin grouping is
            still computed for the next-thing recommender, but the
            dashboard just shows her the top few signals as a calm
            "this is what's been showing up" list. HAVEN, not classroom. */}
        <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '140ms' }}>
          <Eyebrow color={accent}>What you’ve been noticing</Eyebrow>
          {topSignals.length > 0 ? (
            <div style={{ padding: '14px 16px', background: 'rgba(253,250,245,0.55)', border: `1px solid ${accent}22`, borderRadius: 18, marginTop: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topSignals.map((x) => (
                  <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 999,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: `${accent}14`, color: accent, flexShrink: 0,
                    }}>
                      <SymptomIcon id={x.id} size={14} />
                    </span>
                    <div style={{ fontFamily: T.serif, fontSize: 14, color: T.text, flex: 1 }}>{x.label}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.muted, fontWeight: 600 }}>
                      {x.count}d
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginTop: 10, lineHeight: 1.5 }}>
                Last 30 days. Tap “For your appointment” below to send these with you.
              </div>
            </div>
          ) : (
            <div className="frost-card" style={{
              padding: '16px 18px',
              background: 'rgba(253,250,245,0.55)',
              border: `1px solid ${accent}18`,
              borderRadius: 18,
              marginTop: 4,
            }}>
              <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.6, color: T.text, marginBottom: 8 }}>
                Nothing loud has repeated yet.
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.55 }}>
                PCOS often reads in accumulation. A few more weeks of cycle, symptom, or bloodwork detail will make this section more personal.
              </div>
            </div>
          )}
        </div>

        {/* Today's next thing — one quiet recommendation. */}
        <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '200ms' }}>
          <Eyebrow color={accent}>{nextThing.eyebrow}</Eyebrow>
          <div className="alive-card" style={{
            padding: 18,
            background: sectionPaper('plan'),
            border: `1px solid ${accent}28`,
            borderRadius: 20,
            marginTop: 4,
          }}>
            <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.35, letterSpacing: -0.2, marginBottom: 8 }}>
              {nextThing.title}
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.55, color: T.text, marginBottom: nextThing.cta ? 12 : 0 }}>
              {nextThing.body}
            </div>
            {nextThing.cta && (
              <button onClick={handleNextThingCta} disabled={nextThing.disabled}
                style={{
                  background: nextThing.disabled ? 'transparent' : accent,
                  color: nextThing.disabled ? T.muted : '#fff',
                  border: nextThing.disabled ? `1px solid ${T.hair}` : 'none',
                  padding: '10px 18px', borderRadius: 999,
                  cursor: nextThing.disabled ? 'default' : 'pointer',
                  fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.5,
                }}>
                {nextThing.cta}
              </button>
            )}
          </div>
        </div>

        {/* A small thing to know — rotating PCOS literacy */}
        <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '260ms' }}>
          <Eyebrow color={accent}>A small thing to know</Eyebrow>
          <div className="frost-card" style={{
            padding: '18px 18px 14px',
            background: `linear-gradient(160deg, ${accent}0d, rgba(253,250,245,0.55))`,
            border: `1px solid ${accent}22`,
            borderRadius: 20,
            marginTop: 4,
          }}>
            <div style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', lineHeight: 1.6, color: T.text, letterSpacing: -0.1, marginBottom: 10 }}>
              {literacy.body}
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.muted, fontWeight: 500 }}>
              source · {literacy.source}
            </div>
          </div>
        </div>

        <Rule />

        {/* Bloodwork + medications — real tappable cards now that the
            two trackers exist. Each shows a one-line live summary so
            she sees at a glance whether she's been logging. */}
        <div className="insight-stagger" style={{ marginTop: 8, marginBottom: 18, animationDelay: '320ms' }}>
          <Eyebrow color={accent}>Your tracking</Eyebrow>
          <div className="frost-card" style={{
            padding: '0 16px',
            background: sectionPaper('plan'),
            border: `1px solid ${accent}22`,
            borderRadius: 18,
            marginTop: 4,
          }}>
            <TrackingRow
              label="Bloodwork"
              meta="open →"
              body={hasBloodwork
                ? (homaSummary
                    ? `${bloodwork.length} reading${bloodwork.length === 1 ? '' : 's'} logged · HOMA-IR ${homaSummary.score} (${homaSummary.interp?.label})`
                    : `${bloodwork.length} reading${bloodwork.length === 1 ? '' : 's'} logged — log fasting glucose + insulin for HOMA-IR`)
                : 'Log testosterone, AMH, fasting insulin, SHBG, DHEA-S, TSH — Luna pairs each with what it means in PCOS.'}
              onTap={() => go('pcosBloodwork')}
            />
            <TrackingRow
              label="Treatments"
              meta="open →"
              body={meds.length === 0
                ? 'Inositol, metformin, spironolactone, GLP-1s, BC — track what you’re taking, day by day.'
                : `${meds.length} tracking · ${takenTodayCount}/${meds.length} taken today`}
              onTap={() => go('pcosMedications')}
            />
            <TrackingRow
              label="For your next appointment"
              meta="open →"
              body="Stitch your symptoms, cycle, bloodwork, and treatments into a one-page doctor-ready summary. Print, or copy into a portal message."
              onTap={() => go('pcosDoctorScript')}
            />
            <TrackingRow
              label="The full PCOS read"
              meta="open →"
              body="Plain-English signs, tests to ask for, and the different treatment paths — all in one place."
              onTap={() => { useLuna.setState({ activeConditionId: 'pcos' }); go('conditions') }}
              last
            />
          </div>
        </div>
      </div>
    </Screen>
  )
}
