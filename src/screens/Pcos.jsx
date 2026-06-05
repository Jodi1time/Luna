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
  pcosAxisSummary,
  todaysPcosLiteracy,
  pcosNextThing,
  INSULIN_PATTERN_SIGNALS,
  ANDROGEN_PATTERN_SIGNALS,
} from '../data/pcos'

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
//   - Coming-soon stubs for the v2 surfaces (bloodwork, medications,
//     doctor scripts) so she knows where this is going.
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
      <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
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

function AxisRow({ label, total, ids, signalCounts, accent }) {
  // Show only signals with non-zero counts. If everything's zero,
  // render a quiet "nothing notable this month" line.
  const named = ids
    .map((id) => ({ id, count: signalCounts[id] || 0, label: SYMPTOMS[id]?.label || id }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
  return (
    <div style={{ padding: '14px 16px', background: 'rgba(253,250,245,0.55)', border: `1px solid ${accent}22`, borderRadius: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: accent, fontWeight: 500, letterSpacing: -0.1 }}>
          {label}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 600 }}>
          {total} day{total === 1 ? '' : 's'} this month
        </div>
      </div>
      {named.length === 0 ? (
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.55 }}>
          Nothing notable in the last 30 days. Luna will surface these as you log them.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {named.map((x) => (
            <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 22, height: 22, borderRadius: 999,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: `${accent}14`, color: accent, flexShrink: 0,
              }}>
                <SymptomIcon id={x.id} size={14} />
              </span>
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.text, flex: 1 }}>
                {x.label}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.muted, fontWeight: 600 }}>
                ×{x.count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ComingSoonCard({ title, body, accent }) {
  return (
    <div className="frost-card" style={{
      padding: '14px 16px',
      background: 'rgba(253,250,245,0.4)',
      border: `1px dashed ${accent}40`,
      borderRadius: 16,
      opacity: 0.85,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: -0.2, color: T.text }}>
          {title}
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 11.5, color: T.muted }}>
          coming next
        </div>
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
        {body}
      </div>
    </div>
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
  const { androgenTotal, insulinTotal } = useMemo(
    () => pcosAxisSummary(signalCounts),
    [signalCounts]
  )

  // Has she logged any bloodwork? Drives the next-thing suggestion.
  const hasBloodwork = Array.isArray(settings?.pcos?.bloodwork) && settings.pcos.bloodwork.length > 0

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
              <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: T.muted, fontWeight: 500 }}>
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

        {/* What you're noticing — axis summary across last 30 days */}
        <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '140ms' }}>
          <Eyebrow color={accent}>What you’ve been noticing</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <AxisRow
              label="Androgen-pattern signals"
              total={androgenTotal}
              ids={ANDROGEN_PATTERN_SIGNALS}
              signalCounts={signalCounts}
              accent={accent}
            />
            <AxisRow
              label="Insulin-pattern signals"
              total={insulinTotal}
              ids={INSULIN_PATTERN_SIGNALS}
              signalCounts={signalCounts}
              accent={accent}
            />
          </div>
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
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: T.muted, fontWeight: 500 }}>
              source · {literacy.source}
            </div>
          </div>
        </div>

        <Rule />

        {/* Coming-soon — the v2 surfaces. Visible stubs so she knows
            where this is going. None tappable yet. */}
        <div className="insight-stagger" style={{ marginTop: 8, marginBottom: 8, animationDelay: '320ms' }}>
          <Eyebrow color={accent}>What’s landing here next</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <ComingSoonCard
              accent={accent}
              title="Bloodwork tracker"
              body="Testosterone, AMH, fasting insulin, SHBG, DHEA-S, TSH — log values, see trends, export for your doctor."
            />
            <ComingSoonCard
              accent={accent}
              title="Treatments you’re tracking"
              body="Daily check-ins for inositol, metformin, spironolactone, GLP-1s, and BC — with side effects and how-it’s-going notes."
            />
            <ComingSoonCard
              accent={accent}
              title="Doctor-script generator"
              body="A formatted, sourced summary of your symptoms + the tests to ask for by name — printable, ready for your next visit."
            />
          </div>
        </div>

        {/* Quiet handoff — the Conditions Atlas is still where the
            full plain-English explainer lives. */}
        <button onClick={() => { useLuna.setState({ activeConditionId: 'pcos' }); go('conditions') }}
          className="alive-card frost-card"
          style={{
            marginTop: 18, padding: '14px 16px', width: '100%',
            background: 'rgba(253,250,245,0.55)',
            border: '1px solid rgba(26,19,16,0.06)',
            borderRadius: 18, cursor: 'pointer', textAlign: 'left',
            color: T.text, fontFamily: 'inherit',
          }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginBottom: 4 }}>
            the full read
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, letterSpacing: -0.2 }}>
            What PCOS is, signs, tests to ask for, treatments →
          </div>
        </button>
      </div>
    </Screen>
  )
}
