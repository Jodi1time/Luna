import { T } from '../data/theme'
import { Masthead, Eyebrow, SourceLine, BrickList, Screen } from '../components/shared'
import { PHASES } from '../data/lunaData'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { sectionPaper, sectionColors } from '../data/sectionPalette'
import useLuna from '../store/useLuna'

// Section icon paths — small line drawings used in the round tint
// chip beside each section heading. The mockup pattern: tiny circle
// in the section's accent color, soft icon inside. Keeps headings
// readable even as you scan fast.
function SectionIcon({ name }) {
  const c = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (name === 'leaf') return <svg {...c}><path d="M4 20 C4 8 12 4 20 4 C20 12 16 20 4 20 Z" /><path d="M4 20 L14 10" /></svg>
  if (name === 'moon') return <svg {...c}><path d="M21 12.8 A8 8 0 1 1 11.2 3 A6.5 6.5 0 0 0 21 12.8 Z" /></svg>
  if (name === 'sparkle') return <svg {...c}><path d="M12 3 L13.5 10.5 L21 12 L13.5 13.5 L12 21 L10.5 13.5 L3 12 L10.5 10.5 Z" /></svg>
  if (name === 'flame') return <svg {...c}><path d="M12 3 C9 8 6 9 6 14 a6 6 0 0 0 12 0 C18 11 15 10 12 3 Z" /></svg>
  if (name === 'heart') return <svg {...c}><path d="M12 20 C5 15 3 11 3 8 A5 5 0 0 1 12 6 A5 5 0 0 1 21 8 C21 11 19 15 12 20 Z" /></svg>
  return <svg {...c}><circle cx="12" cy="12" r="6" /></svg>
}

// Section header — small tinted circle (mockup pattern) + serif heading.
// Replaces our standalone Eyebrow on PhaseDetail's content sections so
// each section block has its own visual anchor.
function SectionHead({ icon, category, title }) {
  const c = sectionColors(category)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: 999, background: c.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.accent, flexShrink: 0 }}>
        <SectionIcon name={icon} />
      </div>
      <h2 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.3, margin: 0, color: T.text }}>
        {title}
      </h2>
    </div>
  )
}

// Soft rounded content card — replaces the squared glass cards. Used
// for the hormones panel, the doctor red flag, and the nutrition/
// exercise notes. borderRadius 22 to match the mockup's softness.
function SoftCard({ children, accent, tint, category, style = {} }) {
  const c = category ? sectionColors(category) : null
  const bg = category ? sectionPaper(category) : (tint || T.card)
  const a  = accent || (c ? c.accent : T.accent)
  return (
    <div className="alive-card" style={{
      padding: 18,
      background: bg,
      border: `1px solid ${a}22`,
      borderRadius: 22,
      boxShadow: `0 1px 0 ${a}10, 0 14px 30px -20px ${a}40`,
      ...style,
    }}>
      {children}
    </div>
  )
}

export default function PhaseDetail() {
  const { back, activePhaseId } = useLuna()
  const p = PHASES[activePhaseId] || PHASES.ovulation
  const days = p.days
  const c = sectionColors('body')

  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue={p.name.toLowerCase()} onBack={back} />
      </div>

      {/* Hero — centered composition borrowed from the mockup:
          eyebrow → giant italic phase name → "Days X–Y" subtitle →
          bodyMood line. Soft phase-tint gradient washes behind.
          The number/title takes the center of the screen. */}
      <div style={{
        position: 'relative',
        padding: '8px 22px 36px',
        textAlign: 'center',
        background: `linear-gradient(180deg, ${p.color}10, transparent 70%)`,
      }}>
        <div style={{
          fontFamily: T.serif, fontStyle: 'italic', fontSize: 13,
          letterSpacing: 0.4, color: p.color, fontWeight: 500,
          marginBottom: 10, opacity: 0.85,
        }}>
          days {days} · your {p.name.toLowerCase()} phase
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ color: p.color, opacity: 0.7, display: 'inline-flex' }} aria-hidden="true">
            <PhaseFlourish phaseId={p.id} size={28} />
          </span>
        </div>
        <div style={{
          fontFamily: T.serif, fontSize: 62, fontWeight: 400, lineHeight: 0.95,
          letterSpacing: -2, fontStyle: 'italic', color: p.color,
          marginBottom: 14,
        }}>
          {p.name}.
        </div>
        <div style={{
          fontFamily: T.serif, fontSize: 16.5, lineHeight: 1.55,
          color: T.text, maxWidth: 320, margin: '0 auto',
        }}>
          {p.whatsHappening}
        </div>
        <div style={{
          fontFamily: T.serif, fontSize: 14.5, fontStyle: 'italic',
          color: T.muted, lineHeight: 1.55, marginTop: 12, maxWidth: 320, margin: '12px auto 0',
        }}>
          {p.bodyMood}
        </div>
      </div>

      {/* The Body — what's physiologically happening, with hormones
          panel rolled into the same section to reduce surface count. */}
      <div style={{ padding: '0 22px', marginBottom: 24 }}>
        <SectionHead icon="leaf" category="body" title="The body" />
        <SoftCard category="body">
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
            What your hormones are doing
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55, color: T.text }}>
            {p.hormones}
          </div>
          <SourceLine>{p.sourceBody}</SourceLine>
        </SoftCard>
      </div>

      {/* To nourish — kept the BrickList for actionable items, but
          wrapped the headline + note in the softer card aesthetic. */}
      <div style={{ padding: '0 22px', marginBottom: 24 }}>
        <SectionHead icon="sparkle" category="care" title="To nourish" />
        <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, lineHeight: 1.25, letterSpacing: -0.3, marginBottom: 14, color: T.text }}>
          {p.nutrition.headline}
        </div>
        <BrickList title="Lean in" items={p.nutrition.do} positive />
        {p.nutrition.avoid?.length > 0 && <BrickList title="Ease off" items={p.nutrition.avoid} />}
        {p.nutrition.note && (
          <SoftCard category="care" style={{ marginTop: 12, padding: 16 }}>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, fontStyle: 'italic', lineHeight: 1.5, color: T.text }}>
              {p.nutrition.note}
            </div>
          </SoftCard>
        )}
        <SourceLine>{p.nutrition.source}</SourceLine>
      </div>

      {/* To move */}
      <div style={{ padding: '0 22px', marginBottom: 24 }}>
        <SectionHead icon="flame" category="body" title="To move" />
        <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, lineHeight: 1.25, letterSpacing: -0.3, marginBottom: 14, color: T.text }}>
          {p.exercise.headline}
        </div>
        <BrickList title="Best fit now" items={p.exercise.do} positive />
        {p.exercise.avoid?.length > 0 && <BrickList title="Ease off" items={p.exercise.avoid} />}
        {p.exercise.note && (
          <SoftCard category="body" style={{ marginTop: 12, padding: 16 }}>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, fontStyle: 'italic', lineHeight: 1.5, color: T.text }}>
              {p.exercise.note}
            </div>
          </SoftCard>
        )}
        <SourceLine>{p.exercise.source}</SourceLine>
      </div>

      {/* Worth talking to a doctor — keeps urgent palette so it reads
          as an exception, not a default. Softer corners; same weight. */}
      <div style={{ padding: '0 22px 16px' }}>
        <SectionHead icon="heart" category="urgent" title="Worth a doctor" />
        <SoftCard category="urgent">
          <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55, color: T.text }}>
            {p.redFlag}
          </div>
        </SoftCard>
      </div>
    </Screen>
  )
}
