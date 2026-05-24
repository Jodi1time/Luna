// luna-editorial.jsx — Refined Luna Editorial direction with evidence-grounded
// content. All medical claims sourced from luna-data.jsx.
//
// Editorial visual system:
// - Big serif type (Newsreader) for headlines, italic accents for quotes
// - DM Sans for body and metadata
// - Tabular numeric scales (issue numbers, days, dates)
// - Sharp corners (radius 4)
// - Single warm-terracotta accent, deep ink text on warm cream
// - Magazine-style hairline dividers and small uppercase eyebrow labels
//
// Screens added beyond the v1 prototype:
// - PhaseDetail (hormones · nutrition · exercise · mood · red flags · sources)
// - Library (evidence-based article list)
// - Article (full article with citations)
// - HealthWatch (PMDD / endo / iron / PCOS screening + red flags)
// - SymptomDetail (tap a logged symptom to see WHY + evidence + when-to-see-doctor)
// - Privacy (full data handling explainer)

const EDITORIAL_THEME = {
  bg: '#F4EFE5',
  card: '#FFFFFF',
  subtle: '#EBE3D5',
  accent: '#C84E2E',
  accent2: '#1A1310',
  text: '#1A1310',
  muted: '#756A60',
  hair: 'rgba(26,19,16,0.1)',
  faint: 'rgba(26,19,16,0.06)',
  serif: '"Newsreader", Georgia, serif',
  sans: '"DM Sans", -apple-system, system-ui, sans-serif',
  mono: '"DM Mono", ui-monospace, monospace',
  radius: 4,
};

// ─────────────────────────────────────────────────────────────
// LunaEditorial — top-level app
// ─────────────────────────────────────────────────────────────
function LunaEditorial({ tweaks = {} }) {
  const theme = applyEditorialTweaks(EDITORIAL_THEME, tweaks);
  const [screen, setScreen] = React.useState('welcome');
  const [stack, setStack] = React.useState(['welcome']);
  const [logged, setLogged] = React.useState({ mood: null, symptoms: [], flow: null });
  const [phaseId, setPhaseId] = React.useState('ovulation');
  const [articleId, setArticleId] = React.useState(null);
  const [symptomId, setSymptomId] = React.useState(null);
  const cycleDay = 14;

  const go = (s) => { setScreen(s); setStack((st) => [...st, s]); };
  const back = () => setStack((st) => {
    if (st.length <= 1) return st;
    const ns = st.slice(0, -1);
    setScreen(ns[ns.length - 1]);
    return ns;
  });
  const openArticle = (id) => { setArticleId(id); go('article'); };
  const openSymptom = (id) => { setSymptomId(id); go('symptom'); };
  const openPhase = (id) => { setPhaseId(id); go('phase'); };

  const ctx = { theme, screen, go, back, logged, setLogged, cycleDay,
    phaseId, articleId, symptomId, openArticle, openSymptom, openPhase };

  return (
    <Phone width={360} height={720} bg={theme.bg}>
      <div style={{ position: 'absolute', inset: 0, background: theme.bg }}>
        {screen === 'welcome'  && <EdWelcome ctx={ctx} />}
        {screen === 'onb1'     && <EdOnb step={1} ctx={ctx} />}
        {screen === 'onb2'     && <EdOnb step={2} ctx={ctx} />}
        {screen === 'onb3'     && <EdOnb step={3} ctx={ctx} />}
        {screen === 'home'     && <EdHome ctx={ctx} />}
        {screen === 'phase'    && <EdPhaseDetail ctx={ctx} />}
        {screen === 'log'      && <EdLog ctx={ctx} />}
        {screen === 'symptom'  && <EdSymptomDetail ctx={ctx} />}
        {screen === 'calendar' && <EdCalendar ctx={ctx} />}
        {screen === 'insights' && <EdInsights ctx={ctx} />}
        {screen === 'library'  && <EdLibrary ctx={ctx} />}
        {screen === 'article'  && <EdArticle ctx={ctx} />}
        {screen === 'watch'    && <EdHealthWatch ctx={ctx} />}
        {screen === 'privacy'  && <EdPrivacy ctx={ctx} />}
        {screen === 'paywall'  && <EdPaywall ctx={ctx} />}
        {screen === 'settings' && <EdSettings ctx={ctx} />}
      </div>
      {['home', 'calendar', 'insights', 'library', 'settings'].includes(screen) && (
        <EdTabBar ctx={ctx} />
      )}
    </Phone>
  );
}

function applyEditorialTweaks(base, t) {
  const palettes = window.LUNA_PALETTES || {};
  const p = palettes[t.lunaPalette];
  if (!p) return base;
  return { ...base, accent: p.accent, bg: p.bg, subtle: p.subtle };
}

// LunaEditorialAt — starts the prototype at a specific screen. Used in the
// design canvas to show key screens side-by-side without forcing the user
// to tap through every flow first. Still fully interactive once mounted.
function LunaEditorialAt({ screen, articleId, symptomId, phaseId, tweaks = {} }) {
  const theme = applyEditorialTweaks(EDITORIAL_THEME, tweaks);
  const [cur, setCur] = React.useState(screen || 'home');
  const [stack, setStack] = React.useState([screen || 'home']);
  const [logged, setLogged] = React.useState({ mood: null, symptoms: [], flow: null });
  const [phId, setPhId] = React.useState(phaseId || 'ovulation');
  const [artId, setArtId] = React.useState(articleId || 'pmdd');
  const [symId, setSymId] = React.useState(symptomId || 'cramps');
  const cycleDay = 14;

  const go = (s) => { setCur(s); setStack((st) => [...st, s]); };
  const back = () => setStack((st) => {
    if (st.length <= 1) return st;
    const ns = st.slice(0, -1);
    setCur(ns[ns.length - 1]);
    return ns;
  });
  const openArticle = (id) => { setArtId(id); go('article'); };
  const openSymptom = (id) => { setSymId(id); go('symptom'); };
  const openPhase = (id) => { setPhId(id); go('phase'); };

  const ctx = { theme, screen: cur, go, back, logged, setLogged, cycleDay,
    phaseId: phId, articleId: artId, symptomId: symId,
    openArticle, openSymptom, openPhase };

  return (
    <Phone width={360} height={720} bg={theme.bg}>
      <div style={{ position: 'absolute', inset: 0, background: theme.bg }}>
        {cur === 'welcome'  && <EdWelcome ctx={ctx} />}
        {cur === 'onb1'     && <EdOnb step={1} ctx={ctx} />}
        {cur === 'onb2'     && <EdOnb step={2} ctx={ctx} />}
        {cur === 'onb3'     && <EdOnb step={3} ctx={ctx} />}
        {cur === 'home'     && <EdHome ctx={ctx} />}
        {cur === 'phase'    && <EdPhaseDetail ctx={ctx} />}
        {cur === 'log'      && <EdLog ctx={ctx} />}
        {cur === 'symptom'  && <EdSymptomDetail ctx={ctx} />}
        {cur === 'calendar' && <EdCalendar ctx={ctx} />}
        {cur === 'insights' && <EdInsights ctx={ctx} />}
        {cur === 'library'  && <EdLibrary ctx={ctx} />}
        {cur === 'article'  && <EdArticle ctx={ctx} />}
        {cur === 'watch'    && <EdHealthWatch ctx={ctx} />}
        {cur === 'privacy'  && <EdPrivacy ctx={ctx} />}
        {cur === 'paywall'  && <EdPaywall ctx={ctx} />}
        {cur === 'settings' && <EdSettings ctx={ctx} />}
      </div>
      {['home', 'calendar', 'insights', 'library', 'settings'].includes(cur) && (
        <EdTabBar ctx={ctx} />
      )}
    </Phone>
  );
}

// ─────────────────────────────────────────────────────────────
// Reusable Editorial chrome
// ─────────────────────────────────────────────────────────────
function EdMasthead({ theme, issue = 'No. 14', date = 'Wed · 23 Oct', onBack }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '8px 0 14px', borderBottom: `1px solid ${theme.hair}`,
      fontFamily: theme.sans, marginBottom: 18,
    }}>
      <div style={{ fontSize: 10, letterSpacing: 2.5, fontWeight: 700 }}>
        {onBack ? (
          <button onClick={onBack} className="tap" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 10, letterSpacing: 2.5, fontWeight: 700, fontFamily: 'inherit', padding: 0 }}>
            ← LUNA · {issue}
          </button>
        ) : (
          <>LUNA · {issue}</>
        )}
      </div>
      <div style={{ fontSize: 10, color: theme.muted, letterSpacing: 1 }}>{date}</div>
    </div>
  );
}

function EdEyebrow({ theme, children, color }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: 2, fontFamily: theme.sans, fontWeight: 700,
      color: color || theme.muted, textTransform: 'uppercase', marginBottom: 8,
    }}>{children}</div>
  );
}

function EdSourceLine({ theme, children }) {
  return (
    <div style={{
      fontSize: 10, fontFamily: theme.mono, color: theme.muted,
      letterSpacing: 0.5, marginTop: 8, paddingTop: 8,
      borderTop: `1px solid ${theme.hair}`,
    }}>SOURCE — {children}</div>
  );
}

function EdRule({ theme }) {
  return <div style={{ height: 1, background: theme.hair, margin: '16px 0' }} />;
}

// ─────────────────────────────────────────────────────────────
// Tab bar — editorial flavored
// ─────────────────────────────────────────────────────────────
function EdTabBar({ ctx }) {
  const { theme, screen, go } = ctx;
  const items = [
    { key: 'home', label: 'Today', icon: Icon.home },
    { key: 'calendar', label: 'Calendar', icon: Icon.calendar },
    { key: 'log', label: '', icon: (
      <div style={{
        width: 38, height: 38, borderRadius: 0,
        background: theme.accent, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: -8,
      }}>{Icon.plus}</div>
    ) },
    { key: 'library', label: 'Library', icon: Icon.insights },
    { key: 'settings', label: 'You', icon: Icon.settings },
  ];
  return (
    <TabBar items={items} active={screen} onChange={go}
      dark={false} accent={theme.accent} bg="rgba(244,239,229,0.92)" />
  );
}

Object.assign(window, { LunaEditorial, LunaEditorialAt, EDITORIAL_THEME });
