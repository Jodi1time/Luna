// shared.jsx — utilities, primitives, palettes shared across Luna + Still

// ─────────────────────────────────────────────────────────────
// Phone shell — minimal iPhone-ish wrapper, lighter than IOSDevice.
// We use this so the screen is the full canvas (no extra chrome eating room)
// ─────────────────────────────────────────────────────────────
function Phone({ width = 360, height = 720, bg = '#fff', dark = false, children }) {
  return (
    <div style={{
      width, height,
      background: bg,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 0, // canvas card already rounds
      fontFamily: 'DM Sans, -apple-system, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      color: dark ? '#fff' : '#1c1410',
    }}>
      {/* Status bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 22px 0', zIndex: 30, pointerEvents: 'none',
        color: dark ? '#fff' : '#1c1410',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>9:41</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor"><rect x="0" y="6" width="2.5" height="4" rx="0.6"/><rect x="4" y="4" width="2.5" height="6" rx="0.6"/><rect x="8" y="2" width="2.5" height="8" rx="0.6"/><rect x="12" y="0" width="2.5" height="10" rx="0.6"/></svg>
          <svg width="22" height="11" viewBox="0 0 22 11"><rect x="0.5" y="0.5" width="18" height="10" rx="3" stroke="currentColor" fill="none" opacity="0.4"/><rect x="2" y="2" width="14.5" height="7" rx="1.6" fill="currentColor"/></svg>
        </div>
      </div>
      {/* Content */}
      <div className="phone-scroll" style={{
        position: 'absolute', inset: 0,
        paddingTop: 44,
      }}>
        {children}
      </div>
      {/* Home indicator */}
      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        width: 110, height: 4, borderRadius: 4,
        background: dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.28)',
        zIndex: 30,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab bar — generic, accepts items
// ─────────────────────────────────────────────────────────────
function TabBar({ items, active, onChange, dark = false, accent = '#000', bg }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 18, paddingTop: 10,
      background: bg || (dark ? 'rgba(20,15,12,0.85)' : 'rgba(255,255,255,0.85)'),
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: dark ? '0.5px solid rgba(255,255,255,0.08)' : '0.5px solid rgba(0,0,0,0.06)',
      display: 'flex', justifyContent: 'space-around',
      zIndex: 20,
    }}>
      {items.map((it) => {
        const on = active === it.key;
        return (
          <button key={it.key}
            onClick={() => onChange(it.key)}
            className="tap"
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 8px',
              color: on ? accent : (dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.42)'),
              fontFamily: 'inherit',
            }}>
            <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {it.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.1 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tiny icons (mono-line)
// ─────────────────────────────────────────────────────────────
const Icon = {
  home: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10l7-6 7 6v7a1 1 0 01-1 1h-4v-5H8v5H4a1 1 0 01-1-1z"/></svg>,
  calendar: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="14" height="14" rx="2"/><path d="M3 8h14M7 2v4M13 2v4"/></svg>,
  plus: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 4v12M4 10h12"/></svg>,
  insights: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16l4-4 3 3 7-7"/><path d="M14 8h3v3"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="2.4"/><path d="M10 3v2M10 15v2M3 10h2M15 10h2M5 5l1.5 1.5M13.5 13.5L15 15M5 15l1.5-1.5M13.5 6.5L15 5" strokeLinecap="round"/></svg>,
  history: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10a7 7 0 1014-1"/><path d="M3 5v4h4"/><path d="M10 6v4l2.5 2"/></svg>,
  play: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2v10l9-5z"/></svg>,
  lock: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="3" y="6" width="8" height="6" rx="1.5"/><path d="M5 6V4.5a2 2 0 014 0V6"/></svg>,
  sparkle: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0l1.4 4.6L13 6l-4.6 1.4L7 12l-1.4-4.6L1 6l4.6-1.4z" opacity=".9"/></svg>,
  moon: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M11.5 8.5A5 5 0 015.5 2.5 5 5 0 1011.5 8.5z"/></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h8M7 3l4 4-4 4"/></svg>,
  back: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 7H3M7 3L3 7l4 4"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l3 3 5-6"/></svg>,
  pause: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="3" y="2" width="3" height="10" rx="1"/><rect x="8" y="2" width="3" height="10" rx="1"/></svg>,
};

// ─────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────
function Button({ children, onClick, fill = '#1c1410', text = '#fff', style = {}, full, ghost, outline }) {
  const base = {
    border: 'none', cursor: 'pointer',
    padding: '14px 22px', borderRadius: 16,
    fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
    letterSpacing: -0.1,
    width: full ? '100%' : undefined,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  };
  if (ghost) {
    return <button className="tap" onClick={onClick} style={{ ...base, background: 'transparent', color: fill, ...style }}>{children}</button>;
  }
  if (outline) {
    return <button className="tap" onClick={onClick} style={{ ...base, background: 'transparent', color: fill, border: `1px solid ${fill}`, ...style }}>{children}</button>;
  }
  return <button className="tap" onClick={onClick} style={{ ...base, background: fill, color: text, ...style }}>{children}</button>;
}

// ─────────────────────────────────────────────────────────────
// Quick log emoji tap-targets
// ─────────────────────────────────────────────────────────────
function EmojiTap({ emoji, label, active, onClick, accent, bg = 'transparent', textColor }) {
  return (
    <button className="tap"
      onClick={onClick}
      style={{
        border: 'none', cursor: 'pointer',
        background: active ? accent : bg,
        color: active ? '#fff' : (textColor || 'inherit'),
        padding: '10px 6px',
        borderRadius: 14,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        minWidth: 56, fontFamily: 'inherit',
        transition: 'background .15s, color .15s',
      }}>
      <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
      <span style={{ fontSize: 10, fontWeight: 500, opacity: active ? 1 : 0.7 }}>{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// useScreen — tiny in-prototype router
// ─────────────────────────────────────────────────────────────
function useScreen(initial) {
  const [screen, setScreen] = React.useState(initial);
  const [stack, setStack] = React.useState([initial]);
  const go = React.useCallback((next) => {
    setScreen(next);
    setStack((s) => [...s, next]);
  }, []);
  const back = React.useCallback(() => {
    setStack((s) => {
      if (s.length <= 1) return s;
      const ns = s.slice(0, -1);
      setScreen(ns[ns.length - 1]);
      return ns;
    });
  }, []);
  return { screen, go, back };
}

// ─────────────────────────────────────────────────────────────
// Image placeholder (subtle stripes)
// ─────────────────────────────────────────────────────────────
function Placeholder({ width = '100%', height = 120, label = 'image', color = '#999' }) {
  return (
    <div style={{
      width, height, borderRadius: 12,
      background: `repeating-linear-gradient(45deg, transparent 0 6px, ${color}22 6px 7px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Mono, monospace', fontSize: 10, color, opacity: 0.7,
      letterSpacing: 0.5,
    }}>{label}</div>
  );
}

Object.assign(window, {
  Phone, TabBar, Icon, Button, EmojiTap, useScreen, Placeholder,
});
