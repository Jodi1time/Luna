import { T } from '../data/theme'
import { Screen } from '../components/shared'
import useLuna from '../store/useLuna'
import { useCycle } from '../hooks/useCycle'

const todayISO = () => new Date().toISOString().slice(0, 10)

function forecastLine(cycle) {
  const phase = cycle?.phase?.id
  const days = cycle?.cycleLength && cycle?.cycleDay != null
    ? Math.max(0, cycle.cycleLength - cycle.cycleDay + 1)
    : null

  if (phase === 'menstrual') {
    return {
      title: `Day ${cycle.cycleDay || 1} of your period`,
      sub: 'Log what changed today. Luna will keep the pattern quiet and useful.',
      confidence: 'Logged flow',
    }
  }

  if (phase === 'ovulation') {
    return {
      title: 'Ovulation may be close',
      sub: 'A few daily details can help Luna read this window with more care.',
      confidence: cycle?.ovulation?.signals?.length >= 2 ? 'Triangulated' : 'Learning',
    }
  }

  if (days != null) {
    const when = days <= 1 ? 'tomorrow' : `in ${days} days`
    return {
      title: `Period expected ${when}`,
      sub: days <= 5 ? 'Your body may be entering a lower-energy stretch soon.' : 'Luna will keep watching for changes as your cycle moves.',
      confidence: cycle?.variance?.conf === 'high' ? 'High confidence' : cycle?.variance?.conf === 'medium' ? 'Medium confidence' : 'Still learning',
    }
  }

  return {
    title: 'Luna is ready to learn your rhythm',
    sub: 'Add your last period and a few logs. The prediction will get more useful with time.',
    confidence: 'Private by design',
  }
}

function MoonOrbit({ cycle, accent }) {
  const day = cycle?.cycleDay || 10
  const len = cycle?.cycleLength || 28
  const progress = Math.min(0.98, Math.max(0.02, day / len))
  const angle = -110 + progress * 300
  const rad = angle * Math.PI / 180
  const x = 113 + Math.cos(rad) * 82
  const y = 113 + Math.sin(rad) * 82
  const dash = 520 * progress

  return (
    <div aria-hidden="true" style={{ height: 226, display: 'grid', placeItems: 'center', margin: '4px 0 8px' }}>
      <svg width="226" height="226" viewBox="0 0 226 226" style={{ overflow: 'visible' }}>
        <circle cx="113" cy="113" r="82" fill="none" stroke="rgba(26,19,16,0.13)" strokeWidth="1.25" strokeDasharray="3 10" />
        <circle cx="113" cy="113" r="82" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeDasharray={`${dash} 520`} transform="rotate(-110 113 113)" />
        <circle cx={x + 11} cy={y + 11} r="15" fill={`${accent}18`} />
        <circle cx={x} cy={y} r="9" fill="#FDF7EE" stroke={accent} strokeWidth="2" />
        <text x={Math.min(180, x + 22)} y={y + 5} fontFamily={T.mono} fontSize="9" letterSpacing="1.1" fill={T.text}>TODAY</text>
        {[[47,104,'•'],[74,50,'◐'],[151,43,'◑'],[185,120,'○'],[134,189,'◒'],[65,168,'◓']].map(([mx, my, t], i) => (
          <text key={i} x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fontFamily={T.serif} fontSize="20" fill="rgba(26,19,16,0.46)">{t}</text>
        ))}
        <path d="M126 72c-22 8-36 28-36 51 0 21 11 39 29 49-32-2-58-28-58-61 0-32 25-59 57-61-4 6 4 18 8 22z" fill="rgba(200,78,46,0.13)" />
      </svg>
    </div>
  )
}

function PremiumCard({ children, onClick, style = {} }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} style={{
      width: '100%', textAlign: 'left', border: '1px solid rgba(26,19,16,0.075)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.80), rgba(253,250,245,0.58))',
      borderRadius: 22, padding: 18, color: T.text, fontFamily: 'inherit', boxShadow: T.shadow.md,
      position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default', ...style,
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)' }} />
      <div style={{ position: 'relative' }}>{children}</div>
    </Tag>
  )
}

function IconBubble({ children, tone = T.accent }) {
  return <div style={{ width: 48, height: 48, borderRadius: 999, background: `${tone}18`, color: tone, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{children}</div>
}

export default function PremiumHome() {
  const store = useLuna()
  const { go, setActiveLogDate } = store
  const cycle = useCycle(store)
  const accent = cycle?.phase?.color || T.accent
  const forecast = forecastLine(cycle)
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', weekday: 'long' })
  const parts = date.split(',')
  const emphasis = forecast.title.match(/(\d+ days|tomorrow)/)?.[0]
  const lead = emphasis ? forecast.title.replace(emphasis, '').trim() : forecast.title

  const openLog = () => {
    setActiveLogDate(todayISO())
    go('log')
  }

  return (
    <Screen padBottom={104}>
      <div style={{ padding: '22px 22px 0', color: T.text }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: T.serif, fontSize: 46, lineHeight: 0.92, letterSpacing: -1.7 }}>Luna.</div>
            <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, marginTop: 3 }}>by Gloria</div>
          </div>
          <button onClick={() => go('privacyDashboard')} style={{ border: '1px solid rgba(26,19,16,0.08)', background: 'rgba(255,255,255,0.46)', borderRadius: 999, padding: '8px 11px', color: T.text, fontFamily: T.sans, fontSize: 11, lineHeight: 1.15, display: 'flex', alignItems: 'center', gap: 7, boxShadow: T.shadow.sm }}>
            <span>⌕</span><span>Private on<br />this device</span>
          </button>
        </header>

        <div style={{ fontFamily: T.serif, color: T.text, marginBottom: 2, fontSize: 15 }}>{parts[0]}, {parts[1]}</div>
        <div style={{ fontFamily: T.serif, color: T.muted, fontStyle: 'italic', fontSize: 14 }}>{parts[2]?.trim()}</div>

        <MoonOrbit cycle={cycle} accent={accent} />

        <section style={{ textAlign: 'center', margin: '0 auto 18px', maxWidth: 330 }}>
          <h1 style={{ fontFamily: T.serif, fontSize: 35, lineHeight: 0.98, letterSpacing: -1.05, fontWeight: 500, margin: 0 }}>
            {lead}{emphasis && <><br /><span style={{ color: T.accent }}>{emphasis}</span></>}
          </h1>
          <p style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.45, color: T.muted, margin: '13px auto 10px', maxWidth: 278 }}>{forecast.sub}</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: T.mono, fontSize: 10, letterSpacing: 0.8, color: T.muted }}>
            {forecast.confidence}<span style={{ color: accent }}>● ● ●</span><span style={{ color: 'rgba(26,19,16,0.18)' }}>● ●</span>
          </div>
        </section>

        <button onClick={openLog} style={{ width: '100%', border: 'none', borderRadius: 14, padding: '16px 18px', background: `linear-gradient(180deg, ${T.accent}, #AF3E24)`, color: '#fff', fontFamily: T.sans, fontSize: 15, fontWeight: 700, boxShadow: `0 16px 30px -18px ${T.accent}`, marginBottom: 14 }}>
          Log today&nbsp;&nbsp;✎
        </button>

        <div style={{ display: 'grid', gap: 12 }}>
          <PremiumCard onClick={() => go('insights')}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <IconBubble tone={accent}>☼</IconBubble>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.3, color: T.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Insight for you</div>
                <div style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.18, letterSpacing: -0.2 }}>Headaches often appear 2 days before bleeding.</div>
              </div>
              <div style={{ color: T.muted, fontSize: 22 }}>›</div>
            </div>
          </PremiumCard>

          <PremiumCard onClick={() => go('watch')}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <IconBubble tone={T.accent}>♁</IconBubble>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.3, color: T.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Health Watch</div>
                <div style={{ fontFamily: T.serif, fontSize: 18, lineHeight: 1.12, letterSpacing: -0.25 }}>Something feels off?</div>
                <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, lineHeight: 1.35, marginTop: 4 }}>Track patterns and get ready for answers.</div>
              </div>
              <div style={{ color: T.accent, fontFamily: T.sans, fontSize: 12, fontWeight: 700, lineHeight: 1.2, textAlign: 'right' }}>Prepare for a<br />doctor visit ›</div>
            </div>
          </PremiumCard>
        </div>
      </div>
    </Screen>
  )
}
