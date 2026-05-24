import { T } from '../../data/theme'

// ── Icons ────────────────────────────────────────────────────
export const Icons = {
  home:     <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10l7-6 7 6v7a1 1 0 01-1 1h-4v-5H8v5H4a1 1 0 01-1-1z"/></svg>,
  calendar: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="14" height="14" rx="2"/><path d="M3 8h14M7 2v4M13 2v4"/></svg>,
  plus:     <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 4v12M4 10h12"/></svg>,
  library:  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16l4-4 3 3 7-7"/><path d="M14 8h3v3"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="2.4"/><path d="M10 3v2M10 15v2M3 10h2M15 10h2M5 5l1.5 1.5M13.5 13.5L15 15M5 15l1.5-1.5M13.5 6.5L15 5" strokeLinecap="round"/></svg>,
  back:     <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 7H3M7 3L3 7l4 4"/></svg>,
  close:    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>,
  arrow:    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h8M7 3l4 4-4 4"/></svg>,
  check:    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l4 4 6-7"/></svg>,
}

// ── App shell — phone-shaped viewport ───────────────────────
export function AppShell({ children }) {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#E8E3D8',
      padding: '0',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 430,
        minHeight: '100dvh',
        background: T.bg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  )
}

// ── Tab bar ──────────────────────────────────────────────────
export function TabBar({ active, onChange }) {
  const items = [
    { key: 'home',     label: 'Today',    icon: Icons.home },
    { key: 'calendar', label: 'Calendar', icon: Icons.calendar },
    { key: 'log',      label: '',         icon: null },
    { key: 'library',  label: 'Library',  icon: Icons.library },
    { key: 'settings', label: 'You',      icon: Icons.settings },
  ]
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      paddingTop: 10,
      background: 'rgba(244,239,229,0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `0.5px solid ${T.hair}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      zIndex: 50,
    }}>
      {items.map((it) => {
        if (it.key === 'log') {
          return (
            <button key="log" onClick={() => onChange('log')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{
                width: 44, height: 44,
                background: T.accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: T.r, marginBottom: 2,
              }}>{Icons.plus}</div>
            </button>
          )
        }
        const on = active === it.key
        return (
          <button key={it.key} onClick={() => onChange(it.key)}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 12px',
              color: on ? T.accent : 'rgba(26,19,16,0.42)',
              fontFamily: T.sans,
            }}>
            <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {it.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: 500 }}>{it.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Masthead ─────────────────────────────────────────────────
export function Masthead({ issue = 'No. 1', date, onBack }) {
  const d = date || new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', ' ·')
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '8px 0 14px', borderBottom: `1px solid ${T.hair}`, marginBottom: 18,
      fontFamily: T.sans,
    }}>
      <div style={{ fontSize: 10, letterSpacing: 2.5, fontWeight: 700 }}>
        {onBack
          ? <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text, fontSize: 10, letterSpacing: 2.5, fontWeight: 700, fontFamily: T.sans, padding: 0 }}>← LUNA · {issue}</button>
          : <>LUNA · {issue}</>}
      </div>
      <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1 }}>{d}</div>
    </div>
  )
}

// ── Eyebrow ──────────────────────────────────────────────────
export function Eyebrow({ children, color }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: 2, fontFamily: T.sans, fontWeight: 700, color: color || T.muted, textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </div>
  )
}

// ── Rule ─────────────────────────────────────────────────────
export function Rule() {
  return <div style={{ height: 1, background: T.hair, margin: '18px 0' }} />
}

// ── Source line ──────────────────────────────────────────────
export function SourceLine({ children }) {
  return (
    <div style={{ fontSize: 10, fontFamily: T.mono, color: T.muted, letterSpacing: 0.5, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.hair}` }}>
      SOURCE — {children}
    </div>
  )
}

// ── CTAButton ────────────────────────────────────────────────
export function CTAButton({ children, onClick, outline, full, style: s = {} }) {
  const base = {
    border: outline ? `1px solid ${T.text}` : 'none',
    background: outline ? 'transparent' : T.accent,
    color: outline ? T.text : '#fff',
    padding: '15px 22px', borderRadius: T.r,
    fontFamily: T.sans, fontSize: 12, fontWeight: 700,
    letterSpacing: 0.4, cursor: 'pointer',
    width: full ? '100%' : undefined,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...s,
  }
  return <button onClick={onClick} style={base}>{children}</button>
}

// ── Brick list (numbered items) ──────────────────────────────
export function BrickList({ title, items, positive = false }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, fontFamily: T.sans, color: positive ? T.accent : T.muted, marginBottom: 8, textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.45 }}>
            <span style={{ color: positive ? T.accent : T.muted, fontFamily: T.mono, fontSize: 11, marginTop: 3, flexShrink: 0, width: 16 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span>{it}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Screen wrapper (scrollable, padded, fade-in) ─────────────
export function Screen({ children, padBottom = 96, style: s = {} }) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto', overflowX: 'hidden',
      scrollbarWidth: 'none',
      paddingBottom: padBottom,
      animation: 'fadeUp .3s ease-out both',
      ...s,
    }}>
      {children}
    </div>
  )
}

// ── Toggle ───────────────────────────────────────────────────
export function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 40, height: 24, borderRadius: 12,
      background: on ? T.accent : T.hair,
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background .2s',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 19 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        transition: 'left .2s',
      }} />
    </button>
  )
}
