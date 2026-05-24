// luna-editorial-screens-b.jsx — Log, Symptom, Calendar, Insights, Library, Article, Watch, Privacy, Paywall, Settings

// ─────────────────────────────────────────────────────────────
// LOG ENTRY — every symptom tappable for "why" detail
// ─────────────────────────────────────────────────────────────
function EdLog({ ctx }) {
  const { theme, back, logged, setLogged, openSymptom } = ctx;
  const moods = ['😌', '⚡', '😴', '😣', '🥺', '🤗', '😤'];
  const flowLevels = ['Spotting', 'Light', 'Medium', 'Heavy'];

  const toggleSym = (id) => setLogged((s) => ({
    ...s, symptoms: s.symptoms.includes(id) ? s.symptoms.filter((x) => x !== id) : [...s.symptoms, id],
  }));

  return (
    <div className="fade-up phone-scroll" style={{
      position: 'absolute', inset: 0,
      background: theme.bg, color: theme.text,
      padding: '12px 22px 30px', overflow: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontFamily: theme.sans }}>
        <button onClick={back} className="tap" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted, padding: 6, fontFamily: 'inherit' }}>{Icon.close}</button>
        <div style={{ fontSize: 11, color: theme.muted, letterSpacing: 1.5, fontWeight: 700 }}>WED · 23 OCT</div>
        <button onClick={back} className="tap" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.accent, padding: 6, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, fontFamily: 'inherit' }}>SAVE</button>
      </div>

      <div style={{ fontFamily: theme.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, margin: '14px 0 6px' }}>
        How was<br /><em>today?</em>
      </div>
      <div style={{ fontSize: 13, color: theme.muted, marginBottom: 22, fontFamily: theme.sans }}>
        Tap to log. Long-tap any symptom to see the evidence behind it.
      </div>

      {/* Mood */}
      <EdEyebrow theme={theme}>MOOD</EdEyebrow>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
        {moods.map((m) => (
          <button key={m} className="tap"
            onClick={() => setLogged((s) => ({ ...s, mood: m }))}
            style={{
              border: 'none', cursor: 'pointer', width: 42, height: 42,
              fontSize: 22,
              background: logged.mood === m ? theme.accent + '22' : 'transparent',
              outline: logged.mood === m ? `1.5px solid ${theme.accent}` : 'none',
              fontFamily: 'inherit',
            }}>{m}</button>
        ))}
      </div>

      {/* Symptoms */}
      <EdEyebrow theme={theme}>SYMPTOMS · TAP THE INFO ICON FOR EVIDENCE</EdEyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 22 }}>
        {Object.entries(LUNA_SYMPTOMS).slice(0, 8).map(([id, s]) => {
          const on = logged.symptoms.includes(id);
          return (
            <div key={id} style={{
              border: `1px solid ${on ? theme.accent : theme.hair}`,
              background: on ? theme.accent + '12' : theme.card,
              padding: '12px 4px 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              fontFamily: 'inherit',
              position: 'relative',
            }}>
              <button
                onClick={() => toggleSym(id)}
                className="tap"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  fontFamily: 'inherit', color: theme.text, padding: 0, width: '100%',
                }}>
                <span style={{ fontSize: 20 }}>{s.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 500 }}>{s.label}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openSymptom(id); }}
                className="tap"
                style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 16, height: 16, padding: 0,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: theme.muted, fontSize: 11, fontFamily: theme.mono, fontWeight: 700,
                }}>?</button>
            </div>
          );
        })}
      </div>

      {/* Flow */}
      <EdEyebrow theme={theme}>FLOW</EdEyebrow>
      <div style={{ display: 'flex', gap: 4, marginBottom: 22 }}>
        {flowLevels.map((f) => {
          const on = logged.flow === f;
          return (
            <button key={f} className="tap"
              onClick={() => setLogged((s) => ({ ...s, flow: f }))}
              style={{
                flex: 1, border: `1px solid ${on ? theme.accent : theme.hair}`,
                background: on ? theme.accent : theme.card,
                color: on ? '#fff' : theme.text,
                padding: '12px 4px',
                cursor: 'pointer', fontFamily: theme.sans, fontSize: 11, letterSpacing: 1, fontWeight: 600, textTransform: 'uppercase',
              }}>{f}</button>
          );
        })}
      </div>

      {/* Note */}
      <EdEyebrow theme={theme}>NOTE</EdEyebrow>
      <div style={{
        background: theme.card, border: `1px solid ${theme.hair}`,
        padding: 14, fontFamily: theme.serif, fontStyle: 'italic',
        color: theme.muted, fontSize: 14, minHeight: 56,
      }}>
        What was on your mind today?
      </div>

      <EdSourceLine theme={theme}>Daily symptom tracking improves diagnostic accuracy for PMDD &amp; menstrual disorders — ACOG</EdSourceLine>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SYMPTOM DETAIL — why it happens + evidence + red flag
// ─────────────────────────────────────────────────────────────
function EdSymptomDetail({ ctx }) {
  const { theme, symptomId, back } = ctx;
  const s = LUNA_SYMPTOMS[symptomId];
  if (!s) return <div style={{ padding: 20 }}>Symptom not found</div>;
  return (
    <div className="fade-up phone-scroll" style={{ position: 'absolute', inset: 0, background: theme.bg, color: theme.text, overflow: 'auto', paddingBottom: 30 }}>
      <div style={{ padding: '12px 22px 0' }}>
        <EdMasthead theme={theme} issue="Symptom" onBack={back} />
      </div>

      <div style={{ padding: '0 22px' }}>
        <EdEyebrow theme={theme}>SYMPTOM · EVIDENCE BRIEF</EdEyebrow>
        <div style={{ fontFamily: theme.serif, fontSize: 38, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05 }}>
          <span style={{ fontSize: 44, marginRight: 10 }}>{s.emoji}</span>
          <em>{s.label}</em>
        </div>

        <EdRule theme={theme} />

        <EdEyebrow theme={theme}>WHY IT HAPPENS</EdEyebrow>
        <div style={{ fontFamily: theme.serif, fontSize: 17, lineHeight: 1.55 }}>{s.why}</div>

        <EdRule theme={theme} />

        <EdEyebrow theme={theme}>WHAT THE EVIDENCE SAYS</EdEyebrow>
        <BrickList theme={theme} title="Try" items={s.evidence} positive />

        {s.redFlag && (
          <>
            <EdRule theme={theme} />
            <div style={{ padding: 16, border: `1px solid ${theme.accent}`, background: '#fff' }}>
              <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, color: theme.accent, fontFamily: theme.sans, marginBottom: 8 }}>
                ⚠ WHEN TO ESCALATE
              </div>
              <div style={{ fontFamily: theme.serif, fontSize: 15, lineHeight: 1.5 }}>
                {s.redFlag}
              </div>
            </div>
          </>
        )}

        <EdSourceLine theme={theme}>{s.source}</EdSourceLine>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CALENDAR — same as v1 but editorial-styled
// ─────────────────────────────────────────────────────────────
function EdCalendar({ ctx }) {
  const { theme } = ctx;
  const today = 23;
  const phaseFor = (d) => {
    if (d >= 1 && d <= 5) return LUNA_PHASES.menstrual;
    if (d >= 6 && d <= 12) return LUNA_PHASES.follicular;
    if (d >= 13 && d <= 15) return LUNA_PHASES.ovulation;
    if (d >= 16 && d <= 28) return LUNA_PHASES.luteal;
    return null;
  };

  return (
    <div className="fade-up phone-scroll" style={{ position: 'absolute', inset: 0, paddingBottom: 90, overflow: 'auto', background: theme.bg, color: theme.text }}>
      <div style={{ padding: '12px 22px 0' }}>
        <EdMasthead theme={theme} issue="The Calendar" />
        <EdEyebrow theme={theme}>OCT 2025</EdEyebrow>
        <div style={{ fontFamily: theme.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1, marginBottom: 14 }}>
          October.
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16, fontSize: 10, fontFamily: theme.sans, color: theme.muted }}>
          {Object.values(LUNA_PHASES).map((p) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, background: p.color }} />{p.name}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 9, color: theme.muted, fontFamily: theme.mono, fontWeight: 600, letterSpacing: 1 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
            const ph = phaseFor(d);
            const isToday = d === today;
            const predicted = d > today;
            return (
              <div key={d} style={{
                aspectRatio: '1', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontFamily: theme.serif,
                fontWeight: isToday ? 600 : 400,
                background: ph && !predicted ? ph.color + (isToday ? '' : '22') : 'transparent',
                color: isToday && ph ? '#fff' : theme.text,
                border: predicted && ph ? `1px dashed ${ph.color}77` : 'none',
              }}>{d}</div>
            );
          })}
        </div>

        <EdRule theme={theme} />

        {/* Predictions with reasoning */}
        <EdEyebrow theme={theme}>PREDICTIONS · WITH REASONING</EdEyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          {[
            { label: 'Next period', date: 'Nov 6', conf: '95%', why: 'Based on your last 3 cycles (avg 28 days, ±1).' },
            { label: 'Fertile window', date: 'Oct 22 – Oct 25', conf: '88%', why: 'Predicted from cycle length and prior ovulation indicators.' },
            { label: 'PMS window', date: 'Nov 1 – Nov 5', conf: '76%', why: 'You\'ve logged mood + bloating in this window in 4 of 5 prior cycles.' },
          ].map((p, i) => (
            <div key={i} style={{ padding: 14, background: theme.card, border: `1px solid ${theme.hair}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 10, letterSpacing: 1.5, color: theme.muted, fontWeight: 700, fontFamily: theme.sans }}>{p.label.toUpperCase()}</span>
                <span style={{ fontSize: 10, fontFamily: theme.mono, color: theme.accent }}>{p.conf}</span>
              </div>
              <div style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 500, marginTop: 4 }}>{p.date}</div>
              <div style={{ fontFamily: theme.sans, fontSize: 11.5, color: theme.muted, marginTop: 6, lineHeight: 1.4 }}>
                <em>Why:</em> {p.why}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INSIGHTS — long form, sourced
// ─────────────────────────────────────────────────────────────
function EdInsights({ ctx }) {
  const { theme } = ctx;
  return (
    <div className="fade-up phone-scroll" style={{ position: 'absolute', inset: 0, paddingBottom: 90, overflow: 'auto', background: theme.bg, color: theme.text }}>
      <div style={{ padding: '12px 22px 0' }}>
        <EdMasthead theme={theme} issue="The Editorial · Week 14" />

        {/* Lead story */}
        <EdEyebrow theme={theme}>LEAD INSIGHT</EdEyebrow>
        <div style={{ fontFamily: theme.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 14 }}>
          Your energy peaks have shifted <em style={{ color: theme.accent }}>two days earlier.</em>
        </div>
        <div style={{ fontFamily: theme.serif, fontSize: 16, lineHeight: 1.6, marginBottom: 12 }}>
          Across three cycles, your most-energized log entries moved from day 16 to day 14. Cramps on day 1 dropped from "moderate" in 3 of 3 cycles to "mild" in 2 of the last 3. Your body is settling.
        </div>
        <div style={{ fontFamily: theme.serif, fontSize: 15, lineHeight: 1.55, color: theme.muted, fontStyle: 'italic' }}>
          One to watch: sleep dipped on days 24–26 in two of your last three cycles. Magnesium 400mg/day from day 22 onward has RCT support for sleep quality in luteal phase. Worth trying.
        </div>
        <EdSourceLine theme={theme}>Methodology — 90 log entries · 3 cycles · pattern analysis</EdSourceLine>

        <EdRule theme={theme} />

        {/* Pattern cards */}
        <EdEyebrow theme={theme}>PATTERNS WE'RE WATCHING</EdEyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
          {[
            {
              tag: 'MOOD', col: LUNA_PHASES.ovulation.color,
              title: 'Energy peaks 2 days earlier',
              body: 'You used to spike around day 16. Last 3 cycles → day 14.',
              source: 'Pattern detected · 4 / 4 cycles',
            },
            {
              tag: 'SYMPTOM', col: LUNA_PHASES.luteal.color,
              title: 'Headaches cluster days 24–25',
              body: 'Same in 4 of last 5 cycles. Pattern consistent with menstrual migraine (estrogen drop trigger).',
              source: 'American Headache Society',
            },
            {
              tag: 'SLEEP', col: LUNA_PHASES.menstrual.color,
              title: 'Sleep drops in late luteal',
              body: 'Average sleep falls from 7.4h to 6.5h. This is documented — body temp rises and progesterone falls.',
              source: 'Mong & Cusmano 2016',
            },
          ].map((p, i) => (
            <div key={i} style={{ padding: 14, background: theme.card, border: `1px solid ${theme.hair}`, borderLeft: `3px solid ${p.col}` }}>
              <div style={{ fontSize: 9.5, letterSpacing: 1.5, fontWeight: 700, color: p.col, fontFamily: theme.sans, marginBottom: 6 }}>{p.tag}</div>
              <div style={{ fontFamily: theme.serif, fontSize: 17, fontWeight: 500, marginBottom: 4, lineHeight: 1.2 }}>{p.title}</div>
              <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.45, fontFamily: theme.sans }}>{p.body}</div>
              <div style={{ marginTop: 8, fontSize: 9.5, fontFamily: theme.mono, color: theme.muted, letterSpacing: 0.5 }}>
                {p.source}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LIBRARY — evidence-based articles list
// ─────────────────────────────────────────────────────────────
function EdLibrary({ ctx }) {
  const { theme, openArticle } = ctx;
  const cats = ['All', ...new Set(LUNA_ARTICLES.map((a) => a.cat))];
  const [cat, setCat] = React.useState('All');
  const filtered = cat === 'All' ? LUNA_ARTICLES : LUNA_ARTICLES.filter((a) => a.cat === cat);

  return (
    <div className="fade-up phone-scroll" style={{ position: 'absolute', inset: 0, paddingBottom: 96, overflow: 'auto', background: theme.bg, color: theme.text }}>
      <div style={{ padding: '12px 22px 0' }}>
        <EdMasthead theme={theme} issue="The Library" />
        <EdEyebrow theme={theme}>EVIDENCE-LED · PLAIN ENGLISH</EdEyebrow>
        <div style={{ fontFamily: theme.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>
          The Library.
        </div>
        <div style={{ fontFamily: theme.serif, fontSize: 15, lineHeight: 1.55, color: theme.muted, marginTop: 10 }}>
          Every article cites peer-reviewed research or major medical bodies. Plain language, clearly sourced.
        </div>

        {/* Cat filter */}
        <div style={{ display: 'flex', gap: 6, marginTop: 18, flexWrap: 'wrap' }}>
          {cats.map((c) => (
            <button key={c} className="tap" onClick={() => setCat(c)}
              style={{
                background: cat === c ? theme.text : 'transparent',
                color: cat === c ? theme.bg : theme.text,
                border: `1px solid ${cat === c ? theme.text : theme.hair}`,
                padding: '6px 10px', cursor: 'pointer',
                fontFamily: theme.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6,
              }}>{c}</button>
          ))}
        </div>

        <EdRule theme={theme} />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((a, i) => (
            <button key={a.id} onClick={() => openArticle(a.id)} className="tap"
              style={{
                background: 'transparent', border: 'none', textAlign: 'left',
                padding: '16px 0', cursor: 'pointer', width: '100%', color: theme.text, fontFamily: 'inherit',
                borderBottom: i < filtered.length - 1 ? `1px solid ${theme.hair}` : 'none',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 9.5, fontFamily: theme.mono, color: theme.accent, letterSpacing: 1 }}>{a.cat.toUpperCase()}</span>
                <span style={{ fontSize: 10, color: theme.muted, fontFamily: theme.sans }}>{a.read}</span>
              </div>
              <div style={{ fontFamily: theme.serif, fontSize: 20, fontWeight: 500, lineHeight: 1.2, marginBottom: 6 }}>{a.title}</div>
              <div style={{ fontFamily: theme.sans, fontSize: 12.5, color: theme.muted, lineHeight: 1.5 }}>{a.summary}</div>
              {a.tag && (
                <div style={{ marginTop: 8, display: 'inline-block', fontSize: 9, fontFamily: theme.mono, color: theme.accent, padding: '3px 6px', border: `1px solid ${theme.accent}` }}>
                  {a.tag.toUpperCase()}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ARTICLE DETAIL — full text + sources
// ─────────────────────────────────────────────────────────────
function EdArticle({ ctx }) {
  const { theme, articleId, back } = ctx;
  const a = LUNA_ARTICLES.find((x) => x.id === articleId) || LUNA_ARTICLES[0];
  return (
    <div className="fade-up phone-scroll" style={{ position: 'absolute', inset: 0, background: theme.bg, color: theme.text, overflow: 'auto', paddingBottom: 30 }}>
      <div style={{ padding: '12px 22px 0' }}>
        <EdMasthead theme={theme} issue={a.cat} onBack={back} />

        <EdEyebrow theme={theme} color={theme.accent}>{a.cat.toUpperCase()} · {a.read}</EdEyebrow>
        <div style={{ fontFamily: theme.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05 }}>
          {a.title}
        </div>
        <div style={{ fontFamily: theme.serif, fontSize: 17, lineHeight: 1.55, color: theme.muted, marginTop: 12, fontStyle: 'italic' }}>
          {a.summary}
        </div>

        <EdRule theme={theme} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {a.body.map((p, i) => (
            <p key={i} style={{ fontFamily: theme.serif, fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>
              {i === 0 && <span style={{
                float: 'left', fontSize: 56, lineHeight: 0.85, fontWeight: 400, marginRight: 6, marginTop: 4,
                color: theme.accent, fontFamily: theme.serif,
              }}>{p[0]}</span>}
              {i === 0 ? p.slice(1) : p}
            </p>
          ))}
        </div>

        <div style={{ marginTop: 22, padding: 14, background: theme.subtle }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: theme.muted, fontFamily: theme.sans, marginBottom: 8 }}>
            SOURCES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {a.sources.map((s, i) => (
              <div key={i} style={{ fontSize: 11.5, fontFamily: theme.mono, lineHeight: 1.4 }}>
                {String(i + 1).padStart(2, '0')} — {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HEALTH WATCH — symptom checker for PMDD, endo, iron, PCOS
// ─────────────────────────────────────────────────────────────
function EdHealthWatch({ ctx }) {
  const { theme, back, openArticle } = ctx;
  const [answers, setAnswers] = React.useState({});
  const toggle = (id) => setAnswers((a) => ({ ...a, [id]: !a[id] }));
  const flagsTriggered = LUNA_RED_FLAGS.filter((f) => answers[f.id]);

  return (
    <div className="fade-up phone-scroll" style={{ position: 'absolute', inset: 0, background: theme.bg, color: theme.text, overflow: 'auto', paddingBottom: 30 }}>
      <div style={{ padding: '12px 22px 0' }}>
        <EdMasthead theme={theme} issue="Health Watch" onBack={back} />

        <EdEyebrow theme={theme}>SCREENER · NOT A DIAGNOSIS</EdEyebrow>
        <div style={{ fontFamily: theme.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1 }}>
          When should you talk to a doctor?
        </div>
        <div style={{ fontFamily: theme.serif, fontSize: 14.5, lineHeight: 1.55, color: theme.muted, marginTop: 10 }}>
          Tap any that apply to you. This isn't a diagnosis — it's a conversation starter you can show your provider. Luna will export the answers as a PDF if you want.
        </div>

        <EdRule theme={theme} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LUNA_RED_FLAGS.map((f) => {
            const on = !!answers[f.id];
            return (
              <button key={f.id} className="tap" onClick={() => toggle(f.id)}
                style={{
                  border: `1px solid ${on ? theme.accent : theme.hair}`,
                  background: on ? theme.accent + '0E' : theme.card,
                  padding: '14px 14px 14px 42px',
                  cursor: 'pointer', fontFamily: 'inherit', color: theme.text,
                  textAlign: 'left', position: 'relative',
                }}>
                <div style={{
                  position: 'absolute', top: 14, left: 14,
                  width: 16, height: 16,
                  border: `1.5px solid ${on ? theme.accent : theme.muted}`,
                  background: on ? theme.accent : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  {on ? Icon.check : null}
                </div>
                <div style={{ fontFamily: theme.serif, fontSize: 14.5, fontWeight: 500, marginBottom: on ? 6 : 0, lineHeight: 1.35 }}>
                  {f.q}
                </div>
                {on && (
                  <div className="fade-up" style={{ fontFamily: theme.sans, fontSize: 12, color: theme.muted, lineHeight: 1.45 }}>
                    {f.a}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {flagsTriggered.length > 0 && (
          <div className="fade-up" style={{ marginTop: 22, padding: 18, background: theme.text, color: '#FAF4ED' }}>
            <div style={{ fontFamily: theme.sans, fontSize: 10, letterSpacing: 2, color: theme.accent, fontWeight: 700, marginBottom: 8 }}>
              NEXT STEP
            </div>
            <div style={{ fontFamily: theme.serif, fontSize: 19, lineHeight: 1.3, marginBottom: 10 }}>
              You flagged <strong>{flagsTriggered.length}</strong> {flagsTriggered.length === 1 ? 'item' : 'items'}. <em style={{ color: theme.accent }}>Worth a doctor's visit.</em>
            </div>
            <div style={{ fontFamily: theme.sans, fontSize: 12, color: 'rgba(250,244,237,0.7)', lineHeight: 1.5, marginBottom: 12 }}>
              Luna can export your symptom log + these answers as a PDF you can email to your provider. Cycle tracking data improves diagnostic accuracy for cycle-related conditions.
            </div>
            <button className="tap" style={{
              background: theme.accent, color: '#fff', border: 'none',
              padding: '10px 14px', cursor: 'pointer',
              fontFamily: theme.sans, fontSize: 11, letterSpacing: 2, fontWeight: 700,
            }}>EXPORT DOCTOR-READY PDF →</button>
          </div>
        )}

        <EdRule theme={theme} />

        <EdEyebrow theme={theme}>LEARN MORE</EdEyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['pmdd', 'endo', 'iron', 'pcos'].map((id) => {
            const a = LUNA_ARTICLES.find((x) => x.id === id);
            if (!a) return null;
            return (
              <button key={id} onClick={() => openArticle(id)} className="tap"
                style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer', color: theme.text, fontFamily: 'inherit' }}>
                <div style={{ fontFamily: theme.serif, fontSize: 16, fontWeight: 500, lineHeight: 1.25 }}>{a.title} →</div>
                <div style={{ fontFamily: theme.sans, fontSize: 11.5, color: theme.muted, marginTop: 2 }}>{a.read} · {a.cat}</div>
              </button>
            );
          })}
        </div>

        <EdSourceLine theme={theme}>This screener is informational. It does not replace a clinical evaluation.</EdSourceLine>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRIVACY — full data handling explainer
// ─────────────────────────────────────────────────────────────
function EdPrivacy({ ctx }) {
  const { theme, back } = ctx;
  const a = LUNA_ARTICLES.find((x) => x.id === 'privacy');
  if (!a) return null;
  return <EdArticle ctx={{ ...ctx, articleId: 'privacy' }} />;
}

// ─────────────────────────────────────────────────────────────
// PAYWALL — editorial
// ─────────────────────────────────────────────────────────────
function EdPaywall({ ctx }) {
  const { theme, back } = ctx;
  const [plan, setPlan] = React.useState('annual');
  return (
    <div className="fade-up phone-scroll" style={{ position: 'absolute', inset: 0, background: theme.bg, color: theme.text, padding: '12px 22px 24px', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
        <button onClick={back} className="tap" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted, padding: 6 }}>{Icon.close}</button>
      </div>

      <EdEyebrow theme={theme} color={theme.accent}>LUNA · PRO</EdEyebrow>
      <div style={{ fontFamily: theme.serif, fontSize: 38, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 18 }}>
        Insights that actually <em style={{ color: theme.accent }}>get you.</em>
      </div>

      <div style={{ marginBottom: 22 }}>
        {[
          ['Weekly AI editorial', 'Plain-language patterns, written for you.'],
          ['Full Library access', 'Every article and phase brief unlocked.'],
          ['Predictions with reasoning', 'Every “Why” badge expanded.'],
          ['Doctor-ready exports', 'PDF + CSV with daily symptom data.'],
          ['Quiet companion', 'No mid-app upsells once you’re in.'],
        ].map(([t, sub], i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < 4 ? `1px solid ${theme.hair}` : 'none' }}>
            <div style={{ color: theme.accent, marginTop: 4, fontFamily: theme.mono, fontSize: 11 }}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: theme.serif, fontSize: 16, fontWeight: 500 }}>{t}</div>
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 2, fontFamily: theme.sans }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {[
          { id: 'annual', label: 'ANNUAL', price: '$49.99', sub: '$4.16/mo · Save 40%', badge: 'BEST VALUE' },
          { id: 'monthly', label: 'MONTHLY', price: '$6.99', sub: 'Cancel anytime', badge: null },
        ].map((p) => {
          const on = plan === p.id;
          return (
            <button key={p.id} className="tap" onClick={() => setPlan(p.id)}
              style={{
                cursor: 'pointer', textAlign: 'left',
                border: `1.5px solid ${on ? theme.accent : theme.hair}`,
                background: on ? theme.accent + '0E' : theme.card,
                color: theme.text, padding: 14,
                display: 'flex', alignItems: 'center', gap: 12,
                fontFamily: 'inherit', position: 'relative',
              }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: theme.sans, fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.sans, marginTop: 2 }}>{p.sub}</div>
              </div>
              <div style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 500 }}>{p.price}</div>
              {p.badge && (
                <div style={{
                  position: 'absolute', top: -1, right: -1,
                  background: theme.accent, color: '#fff',
                  fontSize: 9, fontWeight: 700, letterSpacing: 1,
                  padding: '3px 8px', fontFamily: theme.sans,
                }}>{p.badge}</div>
              )}
            </button>
          );
        })}
      </div>

      <Button fill={theme.accent} full onClick={back}
        style={{ borderRadius: theme.radius, fontFamily: theme.sans, letterSpacing: 0.5 }}>
        START 7-DAY FREE TRIAL
      </Button>
      <div style={{ fontSize: 10, color: theme.muted, textAlign: 'center', marginTop: 10, fontFamily: theme.sans }}>
        Cancel any time in Settings. Free trial then $49.99/yr.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SETTINGS — editorial
// ─────────────────────────────────────────────────────────────
function EdSettings({ ctx }) {
  const { theme, go } = ctx;
  const SectionTitle = ({ children }) => (
    <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: theme.muted, fontFamily: theme.sans, padding: '20px 22px 8px', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
  const Row = ({ label, value, right, top, bottom, onTap, accent }) => (
    <div onClick={onTap} className={onTap ? 'tap' : ''} style={{
      background: theme.card, padding: '14px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: bottom ? 'none' : `1px solid ${theme.hair}`,
      cursor: onTap ? 'pointer' : 'default',
    }}>
      <div style={{ fontSize: 14, color: accent ? theme.accent : theme.text, fontFamily: theme.sans }}>{label}</div>
      <div style={{ fontSize: 13, color: theme.muted, fontFamily: theme.sans, display: 'flex', alignItems: 'center', gap: 6 }}>
        {value && <span>{value}</span>}
        {right || <span style={{ color: theme.muted, opacity: 0.5 }}>›</span>}
      </div>
    </div>
  );
  const Toggle = ({ on = true }) => (
    <div style={{ width: 36, height: 22, borderRadius: 11, background: on ? theme.accent : theme.hair, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
    </div>
  );

  return (
    <div className="fade-up phone-scroll" style={{ position: 'absolute', inset: 0, paddingBottom: 96, overflow: 'auto', background: theme.bg, color: theme.text }}>
      <div style={{ padding: '12px 22px 0' }}>
        <EdMasthead theme={theme} issue="You" />
        <div style={{ fontFamily: theme.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>Mira.</div>
      </div>

      <div style={{ padding: '20px 16px 8px' }}>
        <div style={{
          background: theme.card, padding: 16, border: `1px solid ${theme.hair}`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ width: 50, height: 50, background: theme.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.serif, fontSize: 22, fontWeight: 500 }}>M</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, fontFamily: theme.sans }}>Luna Pro</div>
            <div style={{ fontSize: 11.5, color: theme.muted, fontFamily: theme.sans }}>Free trial · 5 days left</div>
          </div>
        </div>
      </div>

      <SectionTitle>Cycle</SectionTitle>
      <div style={{ margin: '0 16px', border: `1px solid ${theme.hair}` }}>
        <Row label="Average cycle length" value="28 days" onTap={() => {}} />
        <Row label="Average period length" value="5 days" onTap={() => {}} />
        <Row label="Edit cycle phases" bottom onTap={() => {}} />
      </div>

      <SectionTitle>Privacy &amp; Data</SectionTitle>
      <div style={{ margin: '0 16px', border: `1px solid ${theme.hair}` }}>
        <Row label="Storage" value="On-device only" onTap={() => go('privacy')} accent />
        <Row label="Lock with Face ID" right={<Toggle on />} />
        <Row label="Anonymous analytics" right={<Toggle on={false} />} />
        <Row label="Export all data (CSV)" onTap={() => {}} />
        <Row label="Doctor-ready export (PDF)" onTap={() => go('watch')} />
        <Row label="Delete everything" bottom onTap={() => {}} accent />
      </div>

      <SectionTitle>Home Screen</SectionTitle>
      <div style={{ margin: '0 16px', border: `1px solid ${theme.hair}` }}>
        <Row label="Show AI editorial card" right={<Toggle on />} />
        <Row label="Show library suggestions" right={<Toggle on />} />
        <Row label="Show Health Watch banner" right={<Toggle on />} bottom />
      </div>
      <div style={{ padding: '8px 22px', fontSize: 10.5, color: theme.muted, fontFamily: theme.sans, lineHeight: 1.4 }}>
        Prefer a bare calendar? Toggle anything off here — the home screen adapts.
      </div>

      <SectionTitle>Notifications</SectionTitle>
      <div style={{ margin: '0 16px', border: `1px solid ${theme.hair}` }}>
        <Row label="Period reminder" right={<Toggle on />} />
        <Row label="Daily log nudge" value="9:00 PM" onTap={() => {}} />
        <Row label="Weekly editorial" right={<Toggle on />} bottom />
      </div>

      <SectionTitle>Support</SectionTitle>
      <div style={{ margin: '0 16px', border: `1px solid ${theme.hair}` }}>
        <Row label="View paywall (demo)" onTap={() => go('paywall')} />
        <Row label="Health Watch screener" onTap={() => go('watch')} />
        <Row label="Reset demo state" bottom onTap={() => go('welcome')} />
      </div>

      <div style={{ height: 30 }} />
    </div>
  );
}

Object.assign(window, {
  EdLog, EdSymptomDetail, EdCalendar, EdInsights, EdLibrary, EdArticle,
  EdHealthWatch, EdPrivacy, EdPaywall, EdSettings,
});
