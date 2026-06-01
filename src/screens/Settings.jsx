import { useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Toggle, Screen } from '../components/shared'
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

function SectionLabel({ children, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '22px 22px 8px' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color || T.muted, opacity: 0.6 }} />
      <div style={{ fontSize: 10, letterSpacing: 1.4, fontWeight: 700, color: T.muted, fontFamily: T.sans, textTransform: 'uppercase' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, right, onTap, danger }) {
  return (
    <div onClick={onTap}
      style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.hair}`, cursor: onTap ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 14, color: danger ? T.accent : T.text, fontFamily: T.sans }}>{label}</div>
      <div style={{ fontSize: 13, color: T.muted, fontFamily: T.sans, display: 'flex', alignItems: 'center', gap: 6 }}>
        {value && <span>{value}</span>}
        {right ?? (onTap ? <span style={{ opacity: 0.4 }}>›</span> : null)}
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
      if (l && (l.mood || (l.symptoms?.length) || l.flow || l.bbt || l.mucus || l.sex || l.sleep || l.note)) n++
    }
    return n
  }, [logs])
  const savedCount = Array.isArray(savedArticles) ? savedArticles.length : 0
  const animDays  = useCountUp(daysLogged,    1200)
  const animCycles = useCountUp(cyclesLogged, 1200)
  const animSaved  = useCountUp(savedCount,   1200)

  if (daysLogged === 0 && cyclesLogged === 0 && savedCount === 0) return null

  const Stat = ({ n, label }) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '4px 0' }}>
      <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, fontStyle: 'italic', color: accent, letterSpacing: -0.4, lineHeight: 1 }}>
        {n}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1, fontWeight: 600, color: T.muted, marginTop: 4 }}>
        {label}
      </div>
    </div>
  )

  return (
    <div className="insight-stagger" style={{ padding: '0 16px 4px', animationDelay: '180ms' }}>
      <div className="glass-card" style={{ padding: '14px 8px', borderRadius: T.r, display: 'flex', alignItems: 'stretch', gap: 4 }}>
        <Stat n={animDays}   label="DAYS LOGGED" />
        <div style={{ width: 1, background: T.hair, alignSelf: 'stretch' }} />
        <Stat n={animCycles} label="CYCLES" />
        <div style={{ width: 1, background: T.hair, alignSelf: 'stretch' }} />
        <Stat n={animSaved}  label="SAVED READS" />
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
        <div className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, borderRadius: T.r }}>
          <div style={{ width: 50, height: 50, background: acc, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 22, fontWeight: 500, fontStyle: 'italic', borderRadius: T.r }}>{initial}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, fontFamily: T.sans }}>{isPro ? 'Luna Pro' : 'Luna Free'}</div>
            <div style={{ fontSize: 11.5, color: T.muted, fontFamily: T.sans }}>
              {isPro ? 'Active' : `Free trial · ${trialDaysLeft} days left`}
            </div>
          </div>
          {!isPro && (
            <button onClick={() => go('paywall')} style={{ background: acc, color: '#fff', border: 'none', padding: '8px 12px', cursor: 'pointer', fontFamily: T.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: T.r }}>UPGRADE</button>
          )}
        </div>
      </div>

      {/* Live stats — days logged, cycles tracked, saved reads */}
      <LunaStats logs={logs} cyclesLogged={cyclesLogged} savedArticles={settings?.savedArticles} accent={acc} />

      {session && <div className="insight-stagger" style={{ animationDelay: '240ms' }}>
        <SectionLabel color={acc}>Your account</SectionLabel>
        <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
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
        </div>
        <div style={{ padding: '8px 22px', fontSize: 10.5, color: T.muted, fontFamily: T.sans, lineHeight: 1.4 }}>
          Sign in on any device to come back to your cycle.
        </div>
      </div>}

      <div className="insight-stagger" style={{ animationDelay: '290ms' }}>
      <SectionLabel color={acc}>Your cycle</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Cycle & period length" value={`${cycleLength} / ${periodLength} days`} onTap={() => go('editCycleNumbers')} />
        <Row label="Update period start" onTap={() => go('editPeriodStart')} />
        <Row label="Period history" onTap={() => go('periodHistory')} />
        <Row label="Birth control" value={methodLabel} onTap={() => go('birthControl')} />
        <Row label="Pregnancy" value={pregLabel} onTap={() => go('pregnancy')} />
      </div>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '340ms' }}>
      <SectionLabel color={acc}>Privacy</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Your data, in the open" onTap={() => go('privacyDashboard')} />
        <Row label="Anonymous analytics" right={<Toggle on={settings.analytics} onChange={(v) => { updateSetting('analytics', v); setAnalyticsEnabled(v); if (v) capture('analytics_opted_in') }} />} />
        <Row label="Soft sounds" right={<Toggle on={Boolean(settings.sounds)} onChange={(v) => updateSetting('sounds', v)} />} />
        <Row label="Export everything" onTap={exportCSV} />
        <Row label="Doctor-ready PDF" onTap={() => go('watch')} />
        <Row label="Privacy Policy" onTap={() => go('privacy')} />
        <Row label="Terms" onTap={() => go('terms')} />
      </div>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '390ms' }}>
      <SectionLabel color={acc}>Gentle reminders</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Period reminder"  right={<Toggle on={settings.notifyPeriod} onChange={(v) => updateSetting('notifyPeriod', v)} />} />
        <Row label="Daily check-in"   right={<Toggle on={settings.notifyLog}    onChange={(v) => updateSetting('notifyLog', v)} />} />
        <Row label="Weekly editorial" right={<Toggle on={settings.notifyWeekly} onChange={(v) => updateSetting('notifyWeekly', v)} />} />
      </div>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '440ms' }}>
      <SectionLabel color={acc}>On your Home screen</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Sticky note in the corner" right={<Toggle on={settings.stickyNoteEnabled !== false} onChange={(v) => updateSetting('stickyNoteEnabled', v)} />} />
      </div>
      <div style={{ padding: '8px 22px 12px', fontSize: 11, color: T.muted, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic' }}>
        The little hand-drawn paper that holds whatever you want to remember. Off if you'd rather a cleaner Home.
      </div>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '490ms' }}>
      <SectionLabel color={acc}>Your life stage</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
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
      </div>
      <div style={{ padding: '8px 22px 12px', fontSize: 11, color: T.muted, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic' }}>
        Luna grows with you. Each stage gets its own thoughtful mode — built for the body you're in, not optimised against it.
      </div>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '540ms' }}>
      <SectionLabel color={acc}>Coming as part of Luna Pro</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Talk to Luna" value="Soon" />
        <Row label="Pregnancy companion" value="v1.1" />
        <Row label="Postpartum mode" value="v1.1" />
        <Row label="Long-form journal" value="Soon" />
        <Row label="Personalised monthly reflection" value="Soon" />
      </div>
      <div style={{ padding: '8px 22px 12px', fontSize: 11, color: T.muted, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic' }}>
        Pro is for the depth — the AI companion, the deep life-stage modes, the long-form reflective tools. Everything you need to take care of yourself stays free.
      </div>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '590ms' }}>
      <SectionLabel color={acc}>When something is happening</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="When it feels heavy" onTap={() => go('heavy')} />
        <Row label="Cramps right now" onTap={() => go('cramps')} />
        <Row label="Anxiety tonight" onTap={() => go('anxiety')} />
        <Row label="Can't sleep" onTap={() => go('insomnia')} />
        <Row label="UTI symptoms" onTap={() => go('utiHelper')} />
        <Row label="Period feels late" onTap={() => go('latePeriod')} />
        <Row label="Missed a pill" onTap={() => go('missedPill')} />
        <Row label="Sex has been hurting" onTap={() => go('painfulSex')} />
        <Row label="Postpartum bleeding" onTap={() => go('postpartumBleeding')} />
      </div>
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
      <div style={{
        margin: '0 16px', borderRadius: T.r, overflow: 'hidden',
        background: sectionPaper('reflect'),
        border: `1px solid ${sectionColors('reflect').accent}22`,
      }}>
        <Row label="For your mind and heart" onTap={() => go('reflect')} />
        <Row label="What we've noticed" onTap={() => go('insights')} />
        <Row label="Your year with Luna" onTap={() => go('yourYear')} />
        <Row label="Your sexual life, your way" onTap={() => go('intimate')} />
      </div>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '680ms' }}>
      <SectionLabel color={sectionColors('urgent').accent}>When something's wrong</SectionLabel>
      <div style={{
        margin: '0 16px', borderRadius: T.r, overflow: 'hidden',
        background: sectionPaper('urgent'),
        border: `1px solid ${sectionColors('urgent').accent}22`,
      }}>
        <Row label="When something feels off" onTap={() => go('watch')} />
        <Row label="Pregnancy loss support" onTap={() => go('pregnancyLoss')} />
      </div>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '720ms' }}>
      <SectionLabel color={sectionColors('care').accent}>Manage</SectionLabel>
      <div style={{
        margin: '0 16px', borderRadius: T.r, overflow: 'hidden',
        background: sectionPaper('care'),
        border: `1px solid ${sectionColors('care').accent}22`,
      }}>
        <Row label="For your next visit" onTap={() => go('cheatsheet')} />
        <Row label="Eat for your phase" onTap={() => go('nourish')} />
        <Row label="Care checklist"     onTap={() => go('care')} />
      </div>
      </div>

      <div className="insight-stagger" style={{ animationDelay: '760ms' }}>
      <SectionLabel color={sectionColors('plan').accent}>Account</SectionLabel>
      <div style={{
        margin: '0 16px', borderRadius: T.r, overflow: 'hidden',
        background: sectionPaper('plan'),
        border: `1px solid ${sectionColors('plan').accent}22`,
      }}>
        <Row label="View Pro features"  onTap={() => go('paywall')} />
        <Row label="Delete my account"  onTap={deleteAccount} danger />
      </div>
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
