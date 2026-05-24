// luna-editorial-screens-a.jsx — Welcome, Onboarding, Home, Phase Detail

// ─────────────────────────────────────────────────────────────
// WELCOME — privacy-first hero
// ─────────────────────────────────────────────────────────────
function EdWelcome({ ctx }) {
  const { theme, go } = ctx;
  return (
    <div className="fade-up" style={{
      position: 'absolute', inset: 0, padding: '60px 28px 30px',
      display: 'flex', flexDirection: 'column',
      background: theme.bg, color: theme.text,
    }}>
      <div style={{ fontSize: 10, letterSpacing: 2.5, fontWeight: 700, fontFamily: theme.sans, marginBottom: 32 }}>
        LUNA · ISSUE 01
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          fontFamily: theme.serif, fontSize: 70, fontWeight: 300,
          color: theme.accent, lineHeight: 0.95, letterSpacing: -3,
          fontStyle: 'italic',
        }}>Luna.</div>
        <div style={{
          fontFamily: theme.serif, fontSize: 30, fontWeight: 500,
          letterSpacing: -0.6, lineHeight: 1.1, marginTop: 18,
        }}>
          A cycle tracker that interprets,<br />
          <em>not just logs.</em>
        </div>
        <div style={{
          fontFamily: theme.serif, fontSize: 17, lineHeight: 1.55,
          color: theme.muted, marginTop: 16, paddingRight: 12,
        }}>
          Phase-specific guidance grounded in peer-reviewed research. A knowledgeable friend, in your pocket.
        </div>
      </div>

      {/* Trust strip — three pillars, magazine style */}
      <div style={{
        marginTop: 24, padding: '14px 0',
        borderTop: `1px solid ${theme.hair}`, borderBottom: `1px solid ${theme.hair}`,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
      }}>
        {[
          { e: '01', h: 'Yours alone', s: 'Stored on your phone, encrypted.' },
          { e: '02', h: 'Evidence-led', s: 'Every claim sourced from clinical research.' },
          { e: '03', h: 'Quiet by design', s: 'No notifications you didn’t ask for.' },
        ].map((p, i) => (
          <div key={i}>
            <div style={{ fontFamily: theme.mono, fontSize: 10, color: theme.accent, marginBottom: 6 }}>{p.e}</div>
            <div style={{ fontFamily: theme.serif, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{p.h}</div>
            <div style={{ fontSize: 10.5, color: theme.muted, lineHeight: 1.4, fontFamily: theme.sans }}>{p.s}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        <Button fill={theme.accent} full onClick={() => go('onb1')}
          style={{ borderRadius: theme.radius, padding: '16px 22px', fontFamily: theme.sans, letterSpacing: 0.3 }}>
          BEGIN
        </Button>
        <button className="tap" onClick={() => go('home')}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: theme.muted, fontFamily: theme.sans, fontSize: 12,
            marginTop: 12, padding: 8, width: '100%',
          }}>
          Skip to demo →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ONBOARDING — 3 steps, last one is privacy choice
// ─────────────────────────────────────────────────────────────
function EdOnb({ step, ctx }) {
  const { theme, go } = ctx;
  const next = step < 3 ? () => go('onb' + (step + 1)) : () => go('home');

  return (
    <div className="fade-up" style={{
      position: 'absolute', inset: 0, padding: '60px 28px 30px',
      display: 'flex', flexDirection: 'column',
      background: theme.bg, color: theme.text,
    }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 36 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 2, flex: 1, background: i <= step ? theme.accent : theme.hair }} />
        ))}
      </div>

      <div style={{ fontFamily: theme.mono, fontSize: 10, letterSpacing: 1, color: theme.muted, marginBottom: 6 }}>
        STEP {step} / 3
      </div>

      {step === 1 && (
        <>
          <div style={{ fontFamily: theme.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
            When did your<br /><em>last period</em> start?
          </div>
          <div style={{ fontSize: 14, color: theme.muted, marginBottom: 28, fontFamily: theme.sans }}>
            Estimate is fine — Luna refines predictions as you log.
          </div>
          <OnbDate theme={theme} />
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ fontFamily: theme.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
            How long is your<br /><em>cycle, typically?</em>
          </div>
          <div style={{ fontSize: 14, color: theme.muted, marginBottom: 28, fontFamily: theme.sans }}>
            Average is 28 days. Anywhere 21–35 is medically normal.
          </div>
          <OnbCycle theme={theme} />
          <EdSourceLine theme={theme}>ACOG — Menstrual Cycle Norms</EdSourceLine>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ fontFamily: theme.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
            Where does your<br /><em>data live?</em>
          </div>
          <div style={{ fontSize: 14, color: theme.muted, marginBottom: 20, fontFamily: theme.sans, lineHeight: 1.5 }}>
            Your default is on-device only. We recommend this. You can change it any time in Settings.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'local', label: 'On-device only', sub: 'Encrypted on this phone. Nothing leaves.', rec: true },
              { id: 'sync', label: 'Sync with end-to-end encryption', sub: 'Back up across your devices. We can\'t read it.', rec: false },
            ].map((o) => (
              <div key={o.id} className="tap" style={{
                padding: 16, border: `1px solid ${o.rec ? theme.accent : theme.hair}`,
                background: o.rec ? theme.accent + '0E' : theme.card,
                cursor: 'pointer', position: 'relative',
              }}>
                {o.rec && (
                  <div style={{
                    position: 'absolute', top: -1, right: -1, padding: '3px 8px',
                    background: theme.accent, color: '#fff', fontSize: 9, letterSpacing: 1.2,
                    fontWeight: 700, fontFamily: theme.sans,
                  }}>RECOMMENDED</div>
                )}
                <div style={{ fontFamily: theme.serif, fontSize: 17, fontWeight: 500, marginBottom: 3 }}>{o.label}</div>
                <div style={{ fontSize: 12, color: theme.muted, fontFamily: theme.sans }}>{o.sub}</div>
              </div>
            ))}
          </div>
          <EdSourceLine theme={theme}>You can change this any time in Settings → Privacy</EdSourceLine>
        </>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: 10 }}>
        {step > 1 && (
          <Button outline fill={theme.text} onClick={() => go('onb' + (step - 1))}
            style={{ borderRadius: theme.radius, fontFamily: theme.sans }}>{Icon.back}</Button>
        )}
        <Button fill={theme.accent} full onClick={next}
          style={{ borderRadius: theme.radius, fontFamily: theme.sans, letterSpacing: 0.3 }}>
          {step < 3 ? 'CONTINUE' : 'ENTER LUNA'} {Icon.arrow}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME — editorial cover with hero day + phase + reading list
// ─────────────────────────────────────────────────────────────
function EdHome({ ctx }) {
  const { theme, cycleDay, go, openPhase, openArticle } = ctx;
  const phase = LUNA_PHASES.ovulation;
  const featuredArticles = LUNA_ARTICLES.slice(0, 3);

  return (
    <div className="fade-up phone-scroll" style={{ position: 'absolute', inset: 0, paddingBottom: 96, color: theme.text, overflow: 'auto' }}>
      <div style={{ padding: '12px 22px 0' }}>
        <EdMasthead theme={theme} />

        {/* Cover: huge day + phase */}
        <div>
          <EdEyebrow theme={theme}>CYCLE DAY · OVULATORY WINDOW</EdEyebrow>
          <div style={{ fontFamily: theme.serif, fontSize: 180, fontWeight: 300, color: theme.accent, lineHeight: 0.82, letterSpacing: -7, marginTop: -6 }}>
            {cycleDay}
          </div>
          <div style={{
            fontFamily: theme.serif, fontSize: 36, fontWeight: 400, fontStyle: 'italic',
            letterSpacing: -0.8, marginTop: 4, lineHeight: 1,
          }}>{phase.name}.</div>
          <div style={{ fontFamily: theme.serif, fontSize: 18, lineHeight: 1.5, marginTop: 14, color: theme.text }}>
            {phase.bodyMood} <em style={{ color: theme.accent }}>Peak window for focus, training, and big asks.</em>
          </div>
          <button onClick={() => openPhase('ovulation')} className="tap"
            style={{
              marginTop: 14, background: 'transparent', border: `1px solid ${theme.text}`,
              padding: '10px 14px', cursor: 'pointer',
              fontFamily: theme.sans, fontSize: 11, letterSpacing: 2, fontWeight: 700, color: theme.text,
            }}>
            READ THE FULL PHASE BRIEF →
          </button>
        </div>

        {/* Quick log row */}
        <div style={{ borderTop: `1px solid ${theme.hair}`, borderBottom: `1px solid ${theme.hair}`, padding: '14px 0', marginTop: 22, marginBottom: 22 }}>
          <EdEyebrow theme={theme}>LOG · TAKES 10 SECONDS</EdEyebrow>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {[
              { e: '😌', l: 'Calm' },
              { e: '⚡', l: 'Energy' },
              { e: '😴', l: 'Tired' },
              { e: '😣', l: 'Cramps' },
              { e: '🥺', l: 'Low' },
            ].map((m, i) => (
              <EmojiTap key={i} emoji={m.e} label={m.l} accent={theme.accent} textColor={theme.text} />
            ))}
          </div>
          <button onClick={() => go('log')} className="tap"
            style={{ marginTop: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: theme.accent, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, fontFamily: theme.sans, padding: 0 }}>
            FULL LOG →
          </button>
        </div>

        {/* The Editorial — feature insight */}
        <EdEyebrow theme={theme}>THE EDITORIAL · THIS WEEK</EdEyebrow>
        <button onClick={() => go('insights')} className="tap"
          style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer', width: '100%', color: theme.text, fontFamily: 'inherit', marginBottom: 4 }}>
          <div style={{ fontFamily: theme.serif, fontSize: 24, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1.2 }}>
            Your energy peaks have shifted <em style={{ color: theme.accent }}>two days earlier.</em>
          </div>
          <div style={{ fontFamily: theme.serif, fontSize: 14, lineHeight: 1.55, color: theme.muted, marginTop: 10 }}>
            Across three cycles, your most-energized log entries moved from day 16 to day 14. Cramps on day 1 are also milder. Your body is settling.
          </div>
          <div style={{ marginTop: 12, fontFamily: theme.sans, fontSize: 10, color: theme.muted, letterSpacing: 1, fontWeight: 600 }}>
            BY LUNA · GROUNDED IN YOUR LAST 3 CYCLES
          </div>
        </button>

        <EdRule theme={theme} />

        {/* Reading list */}
        <EdEyebrow theme={theme}>FROM THE LIBRARY</EdEyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
          {featuredArticles.map((a) => (
            <button key={a.id} onClick={() => openArticle(a.id)} className="tap"
              style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer', width: '100%', color: theme.text, fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 9.5, fontFamily: theme.mono, color: theme.accent, letterSpacing: 1 }}>{a.cat.toUpperCase()}</span>
                <span style={{ fontSize: 10, color: theme.muted, fontFamily: theme.sans }}>{a.read}</span>
              </div>
              <div style={{ fontFamily: theme.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.25, marginBottom: 4 }}>{a.title}</div>
              <div style={{ fontFamily: theme.sans, fontSize: 12.5, color: theme.muted, lineHeight: 1.4 }}>{a.summary}</div>
            </button>
          ))}
        </div>

        <button onClick={() => go('library')} className="tap"
          style={{ marginTop: 16, background: 'transparent', border: `1px solid ${theme.hair}`, padding: '10px 14px', cursor: 'pointer', fontFamily: theme.sans, fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: theme.text, width: '100%' }}>
          OPEN THE FULL LIBRARY →
        </button>

        {/* Health Watch teaser */}
        <div style={{
          marginTop: 22, padding: 18, background: theme.text, color: '#FAF4ED',
          cursor: 'pointer',
        }} className="tap" onClick={() => go('watch')}>
          <div style={{ fontFamily: theme.sans, fontSize: 10, letterSpacing: 2, color: theme.accent, fontWeight: 700, marginBottom: 8 }}>
            HEALTH WATCH
          </div>
          <div style={{ fontFamily: theme.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.25 }}>
            Worried about your symptoms? <em style={{ color: theme.accent }}>Take the screener.</em>
          </div>
          <div style={{ fontFamily: theme.sans, fontSize: 12, color: 'rgba(250,244,237,0.7)', marginTop: 8, lineHeight: 1.4 }}>
            Quick checks for PMDD, endometriosis, iron deficiency, PCOS. Not a diagnosis — a conversation starter for your doctor.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PHASE DETAIL — the differentiator. Deep dive per phase.
// ─────────────────────────────────────────────────────────────
function EdPhaseDetail({ ctx }) {
  const { theme, phaseId, back } = ctx;
  const p = LUNA_PHASES[phaseId] || LUNA_PHASES.ovulation;
  return (
    <div className="fade-up phone-scroll" style={{ position: 'absolute', inset: 0, color: theme.text, background: theme.bg, overflow: 'auto', paddingBottom: 30 }}>
      <div style={{ padding: '12px 22px 0' }}>
        <EdMasthead theme={theme} issue={`Phase Brief · ${p.name}`} onBack={back} />
      </div>

      {/* Hero */}
      <div style={{ padding: '0 22px' }}>
        <EdEyebrow theme={theme} color={p.color}>{p.name.toUpperCase()} · DAYS {p.days}</EdEyebrow>
        <div style={{ fontFamily: theme.serif, fontSize: 44, fontWeight: 400, lineHeight: 1, letterSpacing: -1.2, fontStyle: 'italic', color: p.color, marginTop: 4 }}>
          {p.name}.
        </div>
        <div style={{ fontFamily: theme.serif, fontSize: 18, lineHeight: 1.5, marginTop: 14 }}>
          {p.whatsHappening}
        </div>
        <div style={{ fontFamily: theme.serif, fontSize: 15, lineHeight: 1.55, color: theme.muted, marginTop: 10, fontStyle: 'italic' }}>
          {p.bodyMood}
        </div>
        <div style={{ marginTop: 14, padding: 12, background: theme.subtle }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, fontFamily: theme.sans, color: theme.muted, marginBottom: 4 }}>HORMONES</div>
          <div style={{ fontFamily: theme.serif, fontSize: 14 }}>{p.hormones}</div>
        </div>
        <EdSourceLine theme={theme}>{p.sourceBody}</EdSourceLine>
      </div>

      <EdRule theme={theme} />

      {/* Nutrition */}
      <div style={{ padding: '0 22px' }}>
        <EdEyebrow theme={theme}>NUTRITION</EdEyebrow>
        <div style={{ fontFamily: theme.serif, fontSize: 26, fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.4, marginBottom: 14 }}>
          {p.nutrition.headline}
        </div>
        <BrickList theme={theme} title="Lean in" items={p.nutrition.do} positive />
        {p.nutrition.avoid?.length > 0 && (
          <BrickList theme={theme} title="Ease off" items={p.nutrition.avoid} />
        )}
        {p.nutrition.note && (
          <div style={{ marginTop: 12, padding: 12, borderLeft: `2px solid ${theme.accent}`, background: theme.faint, fontFamily: theme.serif, fontSize: 14, fontStyle: 'italic', lineHeight: 1.5 }}>
            {p.nutrition.note}
          </div>
        )}
        <EdSourceLine theme={theme}>{p.nutrition.source}</EdSourceLine>
      </div>

      <EdRule theme={theme} />

      {/* Exercise */}
      <div style={{ padding: '0 22px' }}>
        <EdEyebrow theme={theme}>MOVEMENT</EdEyebrow>
        <div style={{ fontFamily: theme.serif, fontSize: 26, fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.4, marginBottom: 14 }}>
          {p.exercise.headline}
        </div>
        <BrickList theme={theme} title="Best fit now" items={p.exercise.do} positive />
        {p.exercise.avoid?.length > 0 && (
          <BrickList theme={theme} title="Ease off" items={p.exercise.avoid} />
        )}
        {p.exercise.note && (
          <div style={{ marginTop: 12, padding: 12, borderLeft: `2px solid ${theme.accent}`, background: theme.faint, fontFamily: theme.serif, fontSize: 14, fontStyle: 'italic', lineHeight: 1.5 }}>
            {p.exercise.note}
          </div>
        )}
        <EdSourceLine theme={theme}>{p.exercise.source}</EdSourceLine>
      </div>

      <EdRule theme={theme} />

      {/* Red flag */}
      <div style={{ padding: '0 22px' }}>
        <div style={{ padding: 16, border: `1px solid ${theme.accent}`, background: '#fff' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, color: theme.accent, fontFamily: theme.sans, marginBottom: 8 }}>
            ⚠ TALK TO YOUR DOCTOR IF
          </div>
          <div style={{ fontFamily: theme.serif, fontSize: 15, lineHeight: 1.5 }}>
            {p.redFlag}
          </div>
        </div>
      </div>
    </div>
  );
}

function BrickList({ theme, title, items, positive }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10, letterSpacing: 1.5, fontWeight: 700, fontFamily: theme.sans,
        color: positive ? theme.accent : theme.muted, marginBottom: 8,
      }}>{title.toUpperCase()}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            fontFamily: theme.serif, fontSize: 14.5, lineHeight: 1.45,
          }}>
            <span style={{ color: positive ? theme.accent : theme.muted, fontFamily: theme.mono, fontSize: 11, marginTop: 4, flexShrink: 0, width: 14 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { LunaEditorial, EdWelcome, EdOnb, EdHome, EdPhaseDetail, BrickList });
