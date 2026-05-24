import { T } from '../data/theme'
import { Masthead, Eyebrow, Toggle, Screen } from '../components/shared'
import useLuna from '../store/useLuna'
import { wipeVault, lock } from '../lib/crypto'
import { signOut } from '../lib/supabase'

const wipeAndReload = () => {
  if (window.confirm('This will permanently delete all your Luna data on this device. Continue?')) {
    wipeVault()
    window.location.reload()
  }
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: T.muted, fontFamily: T.sans, padding: '20px 22px 8px', textTransform: 'uppercase' }}>{children}</div>
}

function Row({ label, value, right, onTap, danger }) {
  return (
    <div onClick={onTap}
      style={{ background: T.card, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.hair}`, cursor: onTap ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 14, color: danger ? T.accent : T.text, fontFamily: T.sans }}>{label}</div>
      <div style={{ fontSize: 13, color: T.muted, fontFamily: T.sans, display: 'flex', alignItems: 'center', gap: 6 }}>
        {value && <span>{value}</span>}
        {right ?? (onTap ? <span style={{ opacity: 0.4 }}>›</span> : null)}
      </div>
    </div>
  )
}

export default function Settings() {
  const { go, settings, updateSetting, cycleLength, periodLength, isPro, trialDaysLeft, displayName } = useLuna()
  const session = useLuna((s) => s.session)
  const initial = (displayName || session?.user?.email || 'L').trim().charAt(0).toUpperCase()
  const handleSignOut = async () => {
    await signOut()
  }
  return (
    <Screen>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="You" />
        <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{displayName || 'Welcome'}.</div>
      </div>

      {/* Pro card */}
      <div style={{ padding: '20px 16px 8px' }}>
        <div style={{ background: T.card, padding: 16, border: `1px solid ${T.hair}`, display: 'flex', alignItems: 'center', gap: 14, borderRadius: T.r }}>
          <div style={{ width: 50, height: 50, background: T.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 22, fontWeight: 500, borderRadius: T.r }}>{initial}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, fontFamily: T.sans }}>{isPro ? 'Luna Pro' : 'Luna Free'}</div>
            <div style={{ fontSize: 11.5, color: T.muted, fontFamily: T.sans }}>
              {isPro ? 'Active' : `Free trial · ${trialDaysLeft} days left`}
            </div>
          </div>
          {!isPro && (
            <button onClick={() => go('paywall')} style={{ background: T.accent, color: '#fff', border: 'none', padding: '8px 12px', cursor: 'pointer', fontFamily: T.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: T.r }}>UPGRADE</button>
          )}
        </div>
      </div>

      <SectionLabel>Account</SectionLabel>
      <div style={{ margin: '0 16px', border: `1px solid ${T.hair}`, borderRadius: T.r, overflow: 'hidden' }}>
        {session
          ? <>
              <Row label="Signed in as" value={session.user.email} />
              <Row label="Sign out" onTap={handleSignOut} />
            </>
          : <Row label="Sign in or create account" onTap={() => go('auth')} />
        }
      </div>
      <div style={{ padding: '8px 22px', fontSize: 10.5, color: T.muted, fontFamily: T.sans, lineHeight: 1.4 }}>
        Your account is for recovery and sync. Cycle data stays encrypted on this device.
      </div>

      <SectionLabel>Cycle</SectionLabel>
      <div style={{ margin: '0 16px', border: `1px solid ${T.hair}`, borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Average cycle length" value={`${cycleLength} days`} onTap={() => go('onb2')} />
        <Row label="Average period length" value={`${periodLength} days`} />
        <Row label="Update last period start" onTap={() => go('onb1')} />
      </div>

      <SectionLabel>Privacy & Data</SectionLabel>
      <div style={{ margin: '0 16px', border: `1px solid ${T.hair}`, borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Storage" value="On-device · Encrypted" onTap={() => go('article')} />
        <Row label="Anonymous analytics" right={<Toggle on={settings.analytics} onChange={(v) => updateSetting('analytics', v)} />} />
        <Row label="Lock now" onTap={() => { lock(); window.location.reload() }} />
        <Row label="Export all data (CSV)" onTap={() => {}} />
        <Row label="Doctor-ready export (PDF)" onTap={() => go('watch')} />
        <Row label="Delete everything" onTap={wipeAndReload} danger />
      </div>

      <SectionLabel>Home Screen</SectionLabel>
      <div style={{ margin: '0 16px', border: `1px solid ${T.hair}`, borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Show AI editorial card"   right={<Toggle on={settings.showEditorial} onChange={(v) => updateSetting('showEditorial', v)} />} />
        <Row label="Show library suggestions" right={<Toggle on={settings.showLibrary}   onChange={(v) => updateSetting('showLibrary', v)} />} />
        <Row label="Show Health Watch banner" right={<Toggle on={settings.showWatch}     onChange={(v) => updateSetting('showWatch', v)} />} />
      </div>
      <div style={{ padding: '8px 22px', fontSize: 10.5, color: T.muted, fontFamily: T.sans, lineHeight: 1.4 }}>
        Prefer a bare calendar? Toggle anything off here — the home screen adapts.
      </div>

      <SectionLabel>Notifications</SectionLabel>
      <div style={{ margin: '0 16px', border: `1px solid ${T.hair}`, borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Period reminder"  right={<Toggle on={settings.notifyPeriod} onChange={(v) => updateSetting('notifyPeriod', v)} />} />
        <Row label="Daily log nudge"  right={<Toggle on={settings.notifyLog}    onChange={(v) => updateSetting('notifyLog', v)} />} />
        <Row label="Weekly editorial" right={<Toggle on={settings.notifyWeekly} onChange={(v) => updateSetting('notifyWeekly', v)} />} />
      </div>

      <SectionLabel>Support</SectionLabel>
      <div style={{ margin: '0 16px', border: `1px solid ${T.hair}`, borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Health Watch screener" onTap={() => go('watch')} />
        <Row label="View Pro features"     onTap={() => go('paywall')} />
        <Row label="Eat for your phase"    onTap={() => go('nourish')} />
        <Row label="Health care checklist" onTap={() => go('care')} />
        <Row label="Reset & start over"    onTap={wipeAndReload} danger />
      </div>

      <div style={{ height: 16 }} />
    </Screen>
  )
}
