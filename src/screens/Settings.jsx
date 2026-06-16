import { useMemo } from 'react'
import { T } from '../data/theme'
import { Toggle, Screen } from '../components/shared'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { useCycle } from '../hooks/useCycle'
import { useCountUp } from '../hooks/useCountUp'
import Backdrop from '../components/Backdrop'
import useLuna from '../store/useLuna'
import { BC_LABELS } from '../data/birthControl'
import { signOut } from '../lib/supabase'
import { setAnalyticsEnabled, capture, resetAnalytics } from '../lib/posthog'
import { exportLunaCSV, deleteLunaAccount } from '../lib/dataActions'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import { hasMood } from '../lib/moods'

// Short readback of the onboarding answers — appears as the sub-label
// on the "Your setup" Settings row. Keeps it scannable: intent first,
// "irregular" if she flagged it. Falls back to "tap to set" so the row
// stays useful for users who pre-date this feature.
const INTENT_SHORT = {
  'understanding':       'Understanding her body',
  'managing-condition':  'Managing a condition',
  'ttc':                 'Trying to conceive',
  'avoiding':            'Avoiding pregnancy',
  'pregnant':            'Pregnant or postpartum',
  'menopause':           'Menopause',
  'just-tracking':       'Just tracking',
}
function setupSummary(settings) {
  if (!settings?.intent) return 'tap to set'
  const bits = [INTENT_SHORT[settings.intent] || 'set']
  if (settings.irregular) bits.push('irregular')
  return bits.join(' · ').toLowerCase()
}

// Section label — italic serif lowercase with a small accent dot.
// Soft + literary, not a config header. The dot picks up whichever
// section color is associated with the group below.
function SectionLabel({ children, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '22px 22px 8px' }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: color || T.muted, opacity: 0.75 }} />
      <div style={{ fontSize: 13.5, fontFamily: T.serif, fontStyle: 'italic', fontWeight: 500, color: T.muted, letterSpacing: -0.05, textTransform: 'lowercase' }}>
        {String(children).toLowerCase()}
      </div>
    </div>
  )
}

function Panel({ children, style }) {
  return (
    <div style={{
      margin: '0 16px',
      borderRadius: 20,
      overflow: 'hidden',
      background: 'rgba(253,250,245,0.62)',
      border: '1px solid rgba(26,19,16,0.07)',
      boxShadow: '0 12px 24px -24px rgba(26,19,16,0.32)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// Row — settings row. Softer hairline (5% alpha), pressable hover
// state when onTap is set. Label uses serif for warmer reading; the
// trailing value stays sans so it reads as data, not narrative.
function Row({ label, value, right, onTap, danger }) {
  return (
    <div onClick={onTap}
      className={onTap ? 'settings-row' : undefined}
      style={{
        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(26,19,16,0.06)',
        cursor: onTap ? 'pointer' : 'default',
        transition: 'background .2s ease',
        gap: 12,
      }}>
      <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, color: danger ? T.accent : T.text, fontFamily: T.serif, letterSpacing: -0.1 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: T.muted, fontFamily: T.sans, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'right' }}>
        {value && <span style={{ fontStyle: 'italic' }}>{value}</span>}
        {right ?? (onTap ? <span style={{ opacity: 0.42, fontSize: 17, fontFamily: T.serif }}>›</span> : null)}
      </div>
    </div>
  )
}

// Live "Luna with you" stat strip — three small counts that animate
// up on mount. Days logged, cycles tracked, articles saved. Quiet
// proof that the user has been showing up.
function LunaStats({ logs, cyclesLogged, savedArticles, accent }) {
  const daysLogged = useMemo(() => {
    if (!logs) return 0
    let n = 0
    for (const l of Object.values(logs)) {
      if (l && (hasMood(l) || (l.symptoms?.length) || l.flow || l.bbt || l.mucus || l.sex || l.sleep || l.note)) n++
    }
    return n
  }, [logs])
  const savedCount = Array.isArray(savedArticles) ? savedArticles.length : 0
  const animDays  = useCountUp(daysLogged,    1200)
  const animCycles = useCountUp(cyclesLogged, 1200)
  const animSaved  = useCountUp(savedCount,   1200)

  if (daysLogged === 0 && cyclesLogged === 0 && savedCount === 0) return null

  const Stat = ({ n, label }) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '6px 0' }}>
      <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 400, fontStyle: 'italic', color: accent, letterSpacing: -0.4, lineHeight: 1 }}>
        {n}
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 11.5, letterSpacing: 0.1, color: T.muted, marginTop: 6 }}>
        {label}
      </div>
    </div>
  )

  return (
    <div className="insight-stagger" style={{ padding: '0 16px 4px', animationDelay: '180ms' }}>
      <div style={{ padding: '8px 2px 4px', display: 'flex', alignItems: 'stretch', gap: 4 }}>
        <Stat n={animDays}   label="days shown up" />
        <div style={{ width: 1, background: 'rgba(26,19,16,0.06)', alignSelf: 'stretch' }} />
        <Stat n={animCycles} label="cycles" />
        <div style={{ width: 1, background: 'rgba(26,19,16,0.06)', alignSelf: 'stretch' }} />
        <Stat n={animSaved}  label="saved reads" />
      </div>
    </div>
  )
}

export default function Settings() {
  const { go, settings, updateSetting, cycleLength, periodLength, isPro, trialDaysLeft, displayName, birthControl, pregnancy } = useLuna()
  const clearLocalData = useLuna((s) => s.clearLocalData)
  const logs = useLuna((s) => s.logs)
  const store = useLuna()
  const cycle = useCycle(store)
  const phase = cycle?.phase
  const acc = phase?.color || T.accent
  const methodLabel = BC_LABELS[birthControl?.method] || 'None'
  const pregLabel = (() => {
    if (!pregnancy?.active || !pregnancy?.lmp) return 'Not active'
    const start = new Date(pregnancy.lmp + 'T00:00:00')
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const days = Math.floor((now - start) / 86400000)
    const wk = Math.max(1, Math.floor(days / 7) + 1)
    return `Week ${wk}`
  })()
  const session = useLuna((s) => s.session)
  const initial = (displayName || session?.user?.email || 'L').trim().charAt(0).toUpperCase()
  const cyclesLogged = cycle?.periodHistory?.length || 0

  const handleSignOut = async () => {
    await signOut()
    resetAnalytics()
    clearLocalData()
    window.location.reload()
  }

  const exportCSV = () => exportLunaCSV(useLuna.getState())
  const deleteAccount = () => deleteLunaAccount({ session, clearLocalData })
  return (
    <div className="home-stage">
      <Backdrop accent={acc} subtle />
      <Screen>
        <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '20px 22px 0', color: T.text }}>
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, animationDelay: '0ms' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{displayName ? `Hi, ${displayName.split(' ')[0]}.` : 'Welcome.'}</div>
            <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginTop: 6, fontStyle: 'italic' }}>
              Your account, your cycle, your preferences.
            </div>
          </div>
          {phase && (
            <div aria-hidden="true" style={{ color: acc, opacity: 0.55, paddingTop: 4 }}>
              <PhaseFlourish phaseId={phase.id} size={26} />
            </div>
          )}
        </div>
      </div>

      {/* Pro card — avatar now tinted to current phase color */}
      <div className="insight-stagger" style={{ padding: '20px 16px 8px', animationDelay: '90ms' }}>
        <Panel style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, background: acc, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 21, fontWeight: 400, fontStyle: 'italic', borderRadius: 999, boxShadow: `0 6px 14px -10px ${acc}90` }}>{initial}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 16, color: T.text, letterSpacing: -0.1 }}>{isPro ? 'Luna Pro' : 'Luna Free'}</div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, marginTop: 2 }}>
              {isPro ? 'Active' : `Free trial · ${trialDaysLeft} days left`}
            </div>
          </div>
          {!isPro && (
            <button onClick={() => go('paywall')} style={{ background: 'transparent', color: acc, border: `1px solid ${acc}34`, padding: '8px 13px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 0.4, borderRadius: 999 }}>
              Upgrade
            </button>
          )}
        </Panel>
      </div>

      {/* Live stats — days logged, cycles tracked, saved reads */}
      <LunaStats logs={logs} cyclesLogged={cyclesLogged} savedArticles={settings?.savedArticles} accent={acc} />

      {/* Your account — always shown, even when session is null, so
          the user never finds herself stuck with no auth affordance.
          Signed in: email + sign out + verify-email when applicable.
          Signed out: sign-in row that routes to Auth. */}
      <div className="insight-stagger" style={{ animationDelay: '240ms' }}>
        <SectionLabel color={acc}>Your account</SectionLabel>
        <Panel>
          {session ? (
            <>
              <Row label="Signed in as" value={session.user.email} />
              <Row label="Sign out" onTap={handleSignOut} />
              {!session.user.email_confirmed_at && (
                <Row label="Verify email" onTap={async () => {
                  try {
                    const { supabase } = await import('../lib/supabase')
                    const { error } = await supabase.auth.resend({
                      type: 'signup',
                      email: session.user.email,
                      options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
                    })
                    window.alert(error ? `Could not resend: ${error.message}` : `Verification email sent to ${session.user.email}.`)
                  } catch (e) {
                    window.alert(`Could not resend: ${e.message}`)
                  }
                }} />
              )}
            </>
          ) : (
            <>
              <Row label="Not signed in" value="local only" />
              <Row label="Sign in or create an account" onTap={() => go('auth')} />
            </>
          )}
        </Panel>
        <div style={{ padding: '8px 22px', fontSize: 11, color: T.muted, fontFamily: T.sans, lineHeight: 1.4 }}>
          {session ? 'Sign in on any device to come back to your cycle.' : 'Without an account, your cycle lives only on this device.'}
        </div>
      </div>

      {/* Your setup — single entry into the EditSetup screen, which
          edits every onboarding answer (intent, conditions, irregular,
          priorities) in place. Sub-label shows a short readback of what
          she said so she can see what's pinned at a glance. */}
      <div className="insight-stagger" style={{ animationDelay: '270ms' }}>
      <SectionLabel color={acc}>Your Luna</SectionLabel>
      <Panel>
        <Row label="Your setup" value={setupSummary(settings)} onTap={() => go('editSetup')} />
      </Panel>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '290ms' }}>
      <SectionLabel color={acc}>Your cycle</SectionLabel>
      <Panel>
        <Row label="Cycle & period length" value={`${cycleLength} / ${periodLength} days`} onTap={() => go('editCycleNumbers')} />
        <Row label="Update period start" onTap={() => go('editPeriodStart')} />
        <Row label="Period history" onTap={() => go('periodHistory')} />
        <Row label="Birth control" value={methodLabel} onTap={() => go('birthControl')} />
        <Row label="Pregnancy" value={pregLabel} onTap={() => go('pregnancy')} />
      </Panel>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '340ms' }}>
      <SectionLabel color={acc}>Privacy</SectionLabel>
      <Panel>
        <Row label="Your data, in the open" onTap={() => go('privacyDashboard')} />
        <Row label="Anonymous analytics" right={<Toggle on={settings.analytics} onChange={(v) => { updateSetting('analytics', v); setAnalyticsEnabled(v); if (v) capture('analytics_opted_in') }} />} />
        <Row label="Export everything" onTap={exportCSV} />
        <Row label="Doctor-ready PDF" onTap={() => go('watch')} />
        <Row label="Privacy Policy" onTap={() => go('privacy')} />
        <Row label="Terms" onTap={() => go('terms')} />
      </Panel>
      </div>

      {/* "Gentle reminders" section removed 2026-06-10: the three
          toggles weren't wired to anything — no notification code
          exists yet (deliberately, pre-native). Dead switches break
          trust harder than absent ones. Reintroduce with Capacitor
          LocalNotifications in the native build. */}

      <div className="insight-stagger" style={{ animationDelay: '440ms' }}>
      <SectionLabel color={acc}>Little touches</SectionLabel>
      <Panel>
        <Row label="Sticky note in the corner" right={<Toggle on={settings.stickyNoteEnabled !== false} onChange={(v) => updateSetting('stickyNoteEnabled', v)} />} />
        <Row label="Soft sounds" right={<Toggle on={Boolean(settings.sounds)} onChange={(v) => updateSetting('sounds', v)} />} />
      </Panel>
      <div style={{ padding: '8px 22px 12px', fontSize: 11, color: T.muted, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic' }}>
        The hand-drawn paper on Home that holds whatever you want to remember, and the quiet chimes when you save. Off if you'd rather less.
      </div>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '490ms' }}>
      <SectionLabel color={acc}>Your life stage</SectionLabel>
      <Panel>
        <Row label="Cycle tracking"
             value={settings?.lifecycle === 'ttc' ? 'Underlying' : 'Active'} />
        <Row label="Pregnancy"
             value={pregnancy?.active ? pregLabel : 'Available'}
             onTap={() => go('pregnancy')} />
        <Row label="Trying to conceive"
             value={settings?.lifecycle === 'ttc' ? 'Active' : 'Available'}
             onTap={() => {
               if (settings?.lifecycle === 'ttc') {
                 go('ttc')
               } else {
                 updateSetting('lifecycle', 'ttc')
                 go('ttc')
               }
             }} />
        <Row label="Perimenopause / menopause" value="Coming soon" />
      </Panel>
      <div style={{ padding: '8px 22px 12px', fontSize: 11, color: T.muted, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic' }}>
        Luna grows with you. Each stage gets its own thoughtful mode — built for the body you're in, not optimised against it.
      </div>
      </div>

      {/* "Coming as part of Luna Pro" section removed 2026-06-10:
          a settings page should only contain things that work, and
          half the rows were stale ("Long-form journal — Soon" after
          the Journal shipped). The Paywall owns the Pro pitch. */}

      <div className="insight-stagger" style={{ animationDelay: '590ms' }}>
      <SectionLabel color={acc}>When something is happening</SectionLabel>
      <Panel>
        <Row label="When it feels heavy" onTap={() => go('heavy')} />
        <Row label="Cramps right now" onTap={() => go('cramps')} />
        <Row label="Anxiety tonight" onTap={() => go('anxiety')} />
        <Row label="Can't sleep" onTap={() => go('insomnia')} />
        <Row label="UTI symptoms" onTap={() => go('utiHelper')} />
        <Row label="Period feels late" onTap={() => go('latePeriod')} />
        <Row label="Missed a pill" onTap={() => go('missedPill')} />
        <Row label="Sex has been hurting" onTap={() => go('painfulSex')} />
        <Row label="Postpartum bleeding" onTap={() => go('postpartumBleeding')} />
      </Panel>
      </div>

      {/* Former "More from Luna" — split into four labeled groups so
          11 mixed-purpose rows stop reading as a wall. Each group now
          also wears its functional category's soft tint:
            Reflective → lavender
            When something's wrong → warm rose
            Manage → golden cream
            Account → moonlight purple
          Cards stop reading as identical glass slabs. */}
      <div className="insight-stagger" style={{ animationDelay: '640ms' }}>
      <SectionLabel color={sectionColors('reflect').accent}>Reflective</SectionLabel>
      <Panel>
        <Row label="Cycle schools" value="5-day programs" onTap={() => go('cycleSchools')} />
        <Row label="For your mind and heart" onTap={() => go('reflect')} />
        <Row label="What we've noticed" onTap={() => go('insights')} />
        <Row label="Your year with Luna" onTap={() => go('yourYear')} />
        <Row label="Your sexual life, your way" onTap={() => go('intimate')} />
        <Row label="Share with someone" value="Pro" onTap={() => go('shareWith')} />
        <Row label="Shared with you" onTap={() => go('sharedWithYou')} />
      </Panel>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '680ms' }}>
      <SectionLabel color={sectionColors('urgent').accent}>When something's wrong</SectionLabel>
      <Panel>
        <Row label="When something feels off" onTap={() => go('watch')} />
        <Row label="Pregnancy loss support" onTap={() => go('pregnancyLoss')} />
      </Panel>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '720ms' }}>
      <SectionLabel color={sectionColors('care').accent}>Manage</SectionLabel>
      <Panel>
        <Row label="For your next visit" onTap={() => go('cheatsheet')} />
        <Row label="Care checklist"     onTap={() => go('care')} />
      </Panel>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '760ms' }}>
      <SectionLabel color={sectionColors('plan').accent}>Account</SectionLabel>
      <Panel>
        <Row label="View Pro features"  onTap={() => go('paywall')} />
        <Row label="Delete my account"  onTap={deleteAccount} danger />
      </Panel>
      </div>

      <div style={{ padding: '24px 22px 12px', textAlign: 'center', fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
        Luna — a Gloria app.<br/>
        <span style={{ fontStyle: 'normal', fontSize: 11, opacity: 0.7 }}>Named after a mother.</span>
      </div>
      <div style={{ height: 16 }} />
      </div>
      </Screen>
    </div>
  )
}
