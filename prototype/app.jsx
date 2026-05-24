// app.jsx — Luna Editorial mount + onboarding helpers
//
// Renders a single Luna Editorial phone prototype centred on the page.
// OnbDate / OnbCycle live here because the editorial onboarding screens
// reference them; they were originally defined alongside the earlier
// Luna variants in luna.jsx.

function OnbDate({ theme }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dates = Array.from({ length: 28 }, (_, i) => i + 1);
  const selected = 6;
  return (
    <div>
      <div style={{
        background: theme.card, padding: 16, borderRadius: theme.radius,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontFamily: theme.sans }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>October 2025</span>
          <span style={{ color: theme.muted, fontSize: 13 }}>‹ ›</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {days.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10, color: theme.muted, fontFamily: theme.sans }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {dates.map((d) => (
            <div key={d} style={{
              aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontFamily: theme.sans, fontWeight: d === selected ? 600 : 400,
              background: d === selected ? theme.accent : 'transparent',
              color: d === selected ? '#fff' : theme.text,
              borderRadius: theme.radius,
            }}>{d}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OnbCycle({ theme }) {
  const [val, setVal] = React.useState(28);
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span style={{ fontFamily: theme.serif, fontSize: 96, fontWeight: 300, color: theme.accent, lineHeight: 1 }}>{val}</span>
        <span style={{ fontFamily: theme.sans, fontSize: 14, color: theme.muted, marginLeft: 8 }}>days</span>
      </div>
      <input type="range" min={21} max={45} value={val} onChange={(e) => setVal(+e.target.value)}
        style={{ width: '100%', accentColor: theme.accent }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.muted, marginTop: 6, fontFamily: theme.sans }}>
        <span>21</span><span>33</span><span>45</span>
      </div>
    </div>
  );
}

Object.assign(window, { OnbDate, OnbCycle });

function LunaSite() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 20px 60px',
      background: '#F4EFE5',
      color: '#1A1310',
      fontFamily: '"DM Sans", -apple-system, system-ui, sans-serif',
    }}>
      <header style={{
        width: '100%', maxWidth: 720,
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        paddingBottom: 18, marginBottom: 36,
        borderBottom: '1px solid rgba(26,19,16,0.10)',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2.5, fontWeight: 700 }}>
          LUNA · ISSUE 01
        </div>
        <div style={{ fontSize: 11, color: '#756A60', letterSpacing: 1 }}>
          Interactive prototype
        </div>
      </header>

      <div style={{ maxWidth: 720, width: '100%', marginBottom: 40 }}>
        <div style={{
          fontFamily: '"Newsreader", Georgia, serif',
          fontSize: 56, fontWeight: 300, color: '#C84E2E',
          lineHeight: 0.95, letterSpacing: -2.4, fontStyle: 'italic',
          marginBottom: 18,
        }}>Luna.</div>
        <div style={{
          fontFamily: '"Newsreader", Georgia, serif',
          fontSize: 26, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.2,
          marginBottom: 14,
        }}>
          A cycle tracker that interprets, <em>not just logs.</em>
        </div>
        <div style={{
          fontFamily: '"Newsreader", Georgia, serif',
          fontSize: 16, lineHeight: 1.55, color: '#756A60', maxWidth: 540,
        }}>
          Phase-specific guidance grounded in peer-reviewed research. Tap through the prototype below — every screen is wired, every claim is sourced.
        </div>
      </div>

      <div style={{
        background: '#1A1310',
        borderRadius: 36,
        padding: 8,
        boxShadow: '0 24px 60px rgba(26,19,16,0.18), 0 4px 14px rgba(26,19,16,0.08)',
      }}>
        <div style={{ borderRadius: 28, overflow: 'hidden', background: '#F4EFE5' }}>
          <LunaEditorial />
        </div>
      </div>

      <footer style={{
        marginTop: 48, paddingTop: 18, maxWidth: 720, width: '100%',
        borderTop: '1px solid rgba(26,19,16,0.10)',
        fontFamily: '"DM Mono", ui-monospace, monospace',
        fontSize: 10, color: '#756A60', letterSpacing: 0.5,
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <span>EVIDENCE-LED · PLAIN ENGLISH</span>
        <span>YOURS ALONE · QUIET BY DESIGN</span>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<LunaSite />);
