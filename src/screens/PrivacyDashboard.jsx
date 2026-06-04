import { useMemo, useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen, Toggle } from '../components/shared'
import useLuna from '../store/useLuna'
import { useCycle } from '../hooks/useCycle'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { useCountUp } from '../hooks/useCountUp'
import { setAnalyticsEnabled, capture } from '../lib/posthog'
import { exportLunaCSV, deleteLunaAccount } from '../lib/dataActions'
import { hasMood } from '../lib/moods'

// Live counts derived from current store state so the dashboard
// reflects exactly what's on the server right now. These are
// computed-on-render — small enough to be cheap.
function dataStats(state, cycle) {
  const logs = state.logs || {}
  const entries = Object.entries(logs)
  const values = entries.map(([, l]) => l)
  const bbtCount = values.filter((l) => l?.bbt?.value != null).length
  const noteCount = values.filter((l) => (l?.note || '').trim().length > 0).length
  const moodCount = values.filter((l) => hasMood(l)).length
  const symptomCount = values.reduce((acc, l) => acc + (l?.symptoms?.length || 0), 0)
  const sortedDates = entries.map(([d]) => d).sort()
  const firstDate = sortedDates[0]
  const lastDate = sortedDates[sortedDates.length - 1]
  return {
    entries: entries.length,
    cycles: cycle?.cyclesLogged || 0,
    bbtCount,
    noteCount,
    moodCount,
    symptomCount,
    firstDate,
    lastDate,
  }
}

function Stat({ label, value, sub, accent }) {
  const animVal = useCountUp(typeof value === 'number' ? value : 0, 1200)
  const display = typeof value === 'number' ? animVal : value
  return (
    <div className="glass-card" style={{ padding: '14px 16px', borderRadius: T.r, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted, letterSpacing: 1.2, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: accent || T.text, letterSpacing: -0.4, lineHeight: 1.1, fontStyle: 'italic' }}>
        {display}
      </div>
      {sub && (
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, lineHeight: 1.4 }}>{sub}</div>
      )}
    </div>
  )
}

function Pill({ label, ok }) {
  const color = ok ? '#3F7E55' : T.accent
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: `1px solid ${T.hair}`, borderRadius: T.r, background: 'rgba(255,255,255,0.55)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: T.sans, fontSize: 12, color: T.text, fontWeight: 500 }}>{label}</span>
    </div>
  )
}

export default function PrivacyDashboard() {
  const store = useLuna()
  const { back, go, settings, updateSetting, session, displayName } = store
  const clearLocalData = useLuna((s) => s.clearLocalData)
  const cycle = useCycle(store)
  const phase = cycle?.phase
  const acc = phase?.color || T.accent
  const stats = useMemo(() => dataStats(store, cycle), [store, cycle])
  const [copied, setCopied] = useState(false)

  const exportCSV = () => exportLunaCSV(useLuna.getState())
  const deleteAccount = () => deleteLunaAccount({ session, clearLocalData })

  const span = (() => {
    if (!stats.firstDate || !stats.lastDate) return null
    const fmt = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    if (stats.firstDate === stats.lastDate) return fmt(stats.firstDate)
    return `${fmt(stats.firstDate)} → ${fmt(stats.lastDate)}`
  })()

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Your data, in the open" onBack={back} />
        <div className="insight-stagger" style={{ animationDelay: '0ms' }}>
          <Eyebrow color={acc}>What we hold, what we don't, what you can do</Eyebrow>
        </div>
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, animationDelay: '40ms' }}>
          <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.08, flex: 1 }}>
            Your privacy, made visible.
          </div>
          {phase && (
            <div aria-hidden="true" style={{ color: acc, opacity: 0.55, paddingTop: 2 }}>
              <PhaseFlourish phaseId={phase.id} size={22} />
            </div>
          )}
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.6, color: T.muted, marginTop: 10, fontStyle: 'italic', animationDelay: '90ms' }}>
          Most period apps treat your data like inventory. Here's what Luna actually has on you — and what we deliberately don't.
        </div>
        <Rule />

        <div className="insight-stagger" style={{ animationDelay: '140ms' }}>
          <Eyebrow color={acc}>What's stored</Eyebrow>
        </div>
        <div className="insight-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14, animationDelay: '180ms' }}>
          <Stat label="LOG ENTRIES" value={stats.entries} sub={stats.entries === 1 ? 'day logged' : 'days logged'} accent={acc} />
          <Stat label="CYCLES TRACKED" value={stats.cycles} sub={stats.cycles === 1 ? 'period anchored' : 'periods anchored'} accent={acc} />
          <Stat label="BBT READINGS" value={stats.bbtCount} sub="basal temps" accent={acc} />
          <Stat label="NOTES WRITTEN" value={stats.noteCount} sub="free-text" accent={acc} />
          <Stat label="MOODS" value={stats.moodCount} sub="check-ins" accent={acc} />
          <Stat label="SYMPTOMS" value={stats.symptomCount} sub="ticks logged" accent={acc} />
        </div>
        {span && (
          <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 22 }}>
            Covering {span}.
          </div>
        )}

        <Eyebrow color={acc}>Where it lives</Eyebrow>
        <div className="glass-card" style={{ padding: 16, borderRadius: T.r, marginBottom: 22 }}>
          <div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, lineHeight: 1.4, marginBottom: 8, letterSpacing: -0.1 }}>
            On Luna's servers (Supabase), encrypted at rest.
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.muted, lineHeight: 1.55 }}>
            Access is gated by row-level security — only your signed-in account can read or write your data. Transfers between your device and the server use TLS. We use Sentry for crash reporting (PII-stripped) and PostHog for anonymous analytics (toggle below).
          </div>
        </div>

        <Eyebrow color={acc}>What we deliberately don't collect</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          <Pill label="Location" ok />
          <Pill label="Contacts" ok />
          <Pill label="Browsing history" ok />
          <Pill label="Advertising IDs" ok />
          <Pill label="Apple Health reads" ok />
          <Pill label="Social login data" ok />
          <Pill label="Device sensors" ok />
          <Pill label="Anything you haven't typed in" ok />
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 22 }}>
          No ad pixels. No selling. No "anonymous mode" hidden behind a paywall — privacy is the same for everyone here.
        </div>

        <Eyebrow color={acc}>Your controls</Eyebrow>
        <div className="glass-card" style={{ borderRadius: T.r, overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.hair}` }}>
            <div>
              <div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.text, fontWeight: 500 }}>Anonymous analytics</div>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, marginTop: 3, lineHeight: 1.4 }}>Event categories only — never the content of what you logged.</div>
            </div>
            <Toggle on={Boolean(settings?.analytics)} onChange={(v) => {
              updateSetting('analytics', v)
              setAnalyticsEnabled(v)
              if (v) capture('analytics_opted_in')
            }} />
          </div>
          <button onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.origin)
              setCopied(true); setTimeout(() => setCopied(false), 1600)
            } catch {
              // clipboard unavailable — silently skip
            }
          }} style={{ width: '100%', textAlign: 'left', padding: '14px 16px', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.hair}`, cursor: 'pointer', fontFamily: T.sans, fontSize: 13.5, color: T.text, fontWeight: 500 }}>
            {copied ? 'Copied — share with care' : 'Copy app link'}
          </button>
          <button onClick={() => go('privacy')} style={{ width: '100%', textAlign: 'left', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.sans, fontSize: 13.5, color: T.text, fontWeight: 500 }}>
            Read the full Privacy Policy →
          </button>
        </div>

        <Eyebrow color={acc}>Take it with you, or take it down</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          <button onClick={exportCSV}
            style={{ width: '100%', padding: '13px 14px', background: acc, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4, borderRadius: T.r }}>
            Export everything as CSV
          </button>
          <button onClick={deleteAccount}
            style={{ width: '100%', padding: '13px 14px', background: 'transparent', color: T.accent, border: `1px solid ${T.accent}`, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4, borderRadius: T.r }}>
            Delete my account & all data
          </button>
        </div>

        <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.muted, fontStyle: 'italic', lineHeight: 1.6, paddingTop: 16, borderTop: `1px solid ${T.hair}` }}>
          {displayName ? `${displayName.split(' ')[0]} — your` : 'Your'} cycle data is yours. Luna doesn't sell it, doesn't share it, and doesn't surface it back to advertisers. If a subpoena comes, we will object to overbroad scope and notify you where law allows.
        </div>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
