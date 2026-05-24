import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import { ARTICLES } from '../data/lunaData'
import { useCycle } from '../hooks/useCycle'
import useLuna from '../store/useLuna'

export default function Home() {
  const store = useLuna()
  const { go, goPhase, goArticle, settings, saveLog } = store
  const { cycleDay, phase } = useCycle(store)
  const [quickMood, setQuickMood] = useState(null)
  const featuredArticles = ARTICLES.slice(0, 3)

  const handleQuickMood = (m) => {
    setQuickMood(m)
    saveLog(new Date(), { mood: m })
  }

  return (
    <Screen>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue={cycleDay ? `No. ${cycleDay}` : 'No. 1'} />

        {/* Cover block */}
        <div style={{ marginBottom: 4 }}>
          <Eyebrow>{phase ? `CYCLE DAY · ${phase.name.toUpperCase()} WINDOW` : 'CYCLE DAY'}</Eyebrow>
          <div style={{ fontFamily: T.serif, fontSize: 160, fontWeight: 300, color: T.accent, lineHeight: 0.82, letterSpacing: -7, marginTop: 22 }}>
            {cycleDay || '—'}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 400, fontStyle: 'italic', letterSpacing: -0.8, marginTop: 6, lineHeight: 1 }}>
            {phase?.name || 'Start logging'}.
          </div>
          {phase && (
            <div style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.5, marginTop: 12, color: T.text }}>
              {phase.bodyMood} <em style={{ color: T.accent }}>
                {phase.id === 'ovulation' ? 'Peak window for focus, training, and big asks.' :
                 phase.id === 'follicular' ? 'Energy rising — good time for new starts.' :
                 phase.id === 'luteal'     ? 'Honour rest. Cravings are biology, not weakness.' :
                                            'Be gentle with yourself. Rest is productive.'}
              </em>
            </div>
          )}
          {phase && (
            <button onClick={() => goPhase(phase.id)}
              style={{ marginTop: 14, background: 'transparent', border: `1px solid ${T.text}`, padding: '10px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, letterSpacing: 2, fontWeight: 700, color: T.text, borderRadius: T.r }}>
              READ THE FULL PHASE BRIEF →
            </button>
          )}
          {/* Nourish card */}
          {phase && (
            <div style={{ marginTop: 14, padding: 14, background: T.card, border: `1px solid ${T.hair}`, borderLeft: `3px solid ${phase.color}`, borderRadius: T.r }}>
              <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, fontFamily: T.sans, color: T.accent, marginBottom: 6 }}>EAT FOR YOUR PHASE</div>
              <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{phase.nutrition.headline}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                {phase.nutrition.do.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: T.accent, fontFamily: T.mono, fontSize: 10, marginTop: 2, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.muted, lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => go('nourish')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.sans, padding: 0 }}>
                FULL NUTRITION GUIDE →
              </button>
            </div>
          )}
        </div>

        {/* Quick log */}
        <div style={{ borderTop: `1px solid ${T.hair}`, borderBottom: `1px solid ${T.hair}`, padding: '14px 0', marginTop: 22, marginBottom: 22 }}>
          <Eyebrow>LOG · TAKES 10 SECONDS</Eyebrow>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {[['😌','Calm'],['⚡','Energy'],['😴','Tired'],['😣','Cramps'],['🥺','Low']].map(([e, l]) => (
              <button key={l} onClick={() => handleQuickMood(l)}
                style={{
                  border: 'none', cursor: 'pointer', background: quickMood === l ? T.accent + '22' : 'transparent',
                  outline: quickMood === l ? `1.5px solid ${T.accent}` : 'none',
                  padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  minWidth: 52, borderRadius: T.r,
                  color: T.text, fontFamily: T.sans,
                }}>
                <span style={{ fontSize: 22 }}>{e}</span>
                <span style={{ fontSize: 10, fontWeight: 500 }}>{l}</span>
              </button>
            ))}
          </div>
          <button onClick={() => go('log')}
            style={{ marginTop: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.sans, padding: 0 }}>
            FULL LOG →
          </button>
        </div>

        {/* Editorial card */}
        {settings.showEditorial && <>
          <Eyebrow>THE EDITORIAL · THIS WEEK</Eyebrow>
          <button onClick={() => go('insights')}
            style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer', width: '100%', color: T.text, fontFamily: 'inherit', marginBottom: 4 }}>
            <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1.25 }}>
              {phase?.id === 'luteal' ? <>Your brain is asking for carbs — <em style={{ color: T.accent }}>that's biology.</em></> :
               phase?.id === 'ovulation' ? <>Peak energy window: <em style={{ color: T.accent }}>your body is ready.</em></> :
               phase?.id === 'follicular' ? <>Estrogen is rising. <em style={{ color: T.accent }}>Make the most of it.</em></> :
               <>Rest is productive. <em style={{ color: T.accent }}>Honour this phase.</em></>}
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.55, color: T.muted, marginTop: 10 }}>
              {phase ? phase.bodyMood : 'Start logging to unlock personalised insights.'}
            </div>
            <div style={{ marginTop: 10, fontFamily: T.sans, fontSize: 10, color: T.muted, letterSpacing: 1, fontWeight: 600 }}>
              BY LUNA · BASED ON YOUR PHASE
            </div>
          </button>
          <Rule />
        </>}

        {/* Library preview */}
        {settings.showLibrary && <>
          <Eyebrow>FROM THE LIBRARY</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
            {featuredArticles.map((a) => (
              <button key={a.id} onClick={() => goArticle(a.id)}
                style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer', width: '100%', color: T.text, fontFamily: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 9.5, fontFamily: T.mono, color: T.accent, letterSpacing: 1 }}>{a.cat.toUpperCase()}</span>
                  <span style={{ fontSize: 10, color: T.muted, fontFamily: T.sans }}>{a.read}</span>
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.25, marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.muted, lineHeight: 1.45 }}>{a.summary}</div>
              </button>
            ))}
          </div>
          <button onClick={() => go('library')}
            style={{ marginTop: 16, background: 'transparent', border: `1px solid ${T.hair}`, padding: '10px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: T.text, width: '100%', borderRadius: T.r }}>
            OPEN THE FULL LIBRARY →
          </button>
        </>}

        {/* Health Watch teaser */}
        {settings.showWatch && (
          <div style={{ marginTop: 22, padding: 18, background: T.text, color: '#FAF4ED', cursor: 'pointer', borderRadius: T.r }} onClick={() => go('watch')}>
            <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: 2, color: T.accent, fontWeight: 700, marginBottom: 8 }}>HEALTH WATCH</div>
            <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.25 }}>
              Worried about your symptoms? <em style={{ color: T.accent }}>Take the screener.</em>
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 12, color: 'rgba(250,244,237,0.7)', marginTop: 8, lineHeight: 1.4 }}>
              Quick checks for PMDD, endometriosis, iron deficiency, PCOS. Not a diagnosis — a conversation starter for your doctor.
            </div>
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
