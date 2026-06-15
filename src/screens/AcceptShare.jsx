import { useEffect, useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Screen, Eyebrow } from '../components/shared'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import { previewInvite, acceptInvite, scopeLabel, scopeBlurb } from '../lib/shares'
import useLuna from '../store/useLuna'
import { MoonsMeeting } from '../components/Illustrations'

// AcceptShare — entered via a deep-link lunadiary.app/share?code=ABC.
// App.jsx detects the code on cold start and routes here. Shows the
// data owner's display name + chosen scope, then a single Accept
// button that calls acceptInvite. After accept, routes to the
// "Shared with you" surface.
//
// If the user isn't signed in, this screen sends them to Auth first
// and remembers the code so they can come back and accept.

export default function AcceptShare() {
  const { back, go, session, settings } = useLuna()
  const code = useLuna((s) => s.activeShareCode)
  const setActiveShareCode = (c) => useLuna.setState({ activeShareCode: c })
  const accent = sectionColors('plan').accent

  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) {
      setError('No invite code found.')
      setLoading(false)
      return
    }
    if (!session?.user) {
      // Need to sign in first — store the code so App routes back here
      // after sign-in. (The code is already in store as activeShareCode.)
      return
    }
    let cancelled = false
    setLoading(true)
    previewInvite(code)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setError("This invite isn't valid anymore — it may have been used or revoked.")
        } else {
          setPreview(data)
        }
      })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Could not load this invite.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [code, session?.user?.id])

  const handleAccept = async () => {
    if (!code) return
    setAccepting(true)
    setError('')
    try {
      await acceptInvite(code)
      setActiveShareCode(null)
      // Success haptic — the moment two people land in each other's
      // app via the share link is a small ceremony.
      import('../lib/haptics').then(({ hapticSuccess }) => hapticSuccess())
      go('sharedWithYou')
    } catch (e) {
      setError(e?.message || 'Could not accept this invite. It may have expired.')
      setAccepting(false)
    }
  }

  const handleDecline = () => {
    setActiveShareCode(null)
    back()
  }

  // Not signed in — gentle prompt to sign in / create account first.
  if (!session?.user) {
    return (
      <Screen padBottom={40}>
        <div style={{ padding: '12px 22px 0', color: T.text }}>
          <Masthead issue="an invite for you" onBack={back} />
          <Eyebrow color={accent}>someone wants to share with you</Eyebrow>
          <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.1, marginBottom: 14 }}>
            Sign in first.
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14.5, color: T.muted, lineHeight: 1.6, marginBottom: 22 }}>
            You'll need a Luna account to see what's being shared with you. Sign in or create one — your invite is saved here.
          </div>
          <button onClick={() => go('auth')}
            className="alive-card"
            style={{
              width: '100%', background: accent, color: '#fff', border: 'none',
              padding: '14px 16px', borderRadius: 999, cursor: 'pointer',
              fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4,
              boxShadow: `0 12px 24px -10px ${accent}80`,
            }}>
            Sign in or create account
          </button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="an invite for you" onBack={back} />

        <Eyebrow color={accent}>someone wants to share with you</Eyebrow>

        {loading && (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 15, color: T.muted, marginTop: 22 }}>
            Reading the invite…
          </div>
        )}

        {!loading && error && (
          <>
            <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginTop: 10, marginBottom: 14 }}>
              That invite didn't open.
            </div>
            <div className="frost-card" style={{
              padding: 16,
              background: 'rgba(253,250,245,0.55)',
              border: `1px solid ${T.accent}40`,
              borderRadius: 16,
              fontFamily: T.serif, fontStyle: 'italic',
              fontSize: 14, color: T.text, lineHeight: 1.6,
              marginBottom: 18,
            }}>
              {error}
            </div>
            <button onClick={handleDecline}
              style={{
                width: '100%', background: 'transparent',
                border: '1px solid rgba(26,19,16,0.08)',
                color: T.text, padding: '13px 16px', borderRadius: 999, cursor: 'pointer',
                fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.3,
              }}>
              Back to Luna
            </button>
          </>
        )}

        {!loading && preview && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 8px', color: accent }}>
              <MoonsMeeting size={140} accent={accent} />
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.1, marginTop: 4, marginBottom: 16 }}>
              <em style={{ color: accent }}>{preview.from_name || 'Someone'}</em> wants you in their corner.
            </div>

            <div className="alive-card frost-card" style={{
              padding: 20,
              background: sectionPaper('plan'),
              border: `1px solid ${accent}28`,
              borderRadius: 22,
              boxShadow: `0 14px 30px -22px ${accent}50`,
              marginBottom: 18,
            }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 8 }}>
                what {preview.from_name?.split(' ')[0] || 'they'} is sharing
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2, marginBottom: 8 }}>
                {scopeLabel(preview.scope)}
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.muted, lineHeight: 1.6 }}>
                {scopeBlurb(preview.scope)}
              </div>
            </div>

            <div className="frost-card" style={{
              padding: 14,
              background: 'rgba(253,250,245,0.55)',
              border: '1px solid rgba(26,19,16,0.06)',
              borderRadius: 14,
              fontFamily: T.serif, fontStyle: 'italic',
              fontSize: 13, color: T.text, lineHeight: 1.6,
              marginBottom: 18,
            }}>
              Read-only — you can see what they share, but you can't log or edit anything for them. They can revoke any time, and so can you.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleAccept} disabled={accepting}
                className="alive-card"
                style={{
                  width: '100%', background: accent, color: '#fff', border: 'none',
                  padding: '16px 16px', borderRadius: 999, cursor: accepting ? 'default' : 'pointer',
                  fontFamily: T.serif, fontStyle: 'italic', fontSize: 17, fontWeight: 500, letterSpacing: -0.2,
                  opacity: accepting ? 0.6 : 1,
                  boxShadow: `0 14px 28px -10px ${accent}80`,
                }}>
                {accepting ? 'accepting…' : 'Accept the invite'}
              </button>
              <button onClick={handleDecline}
                style={{
                  width: '100%', background: 'transparent',
                  border: '1px solid rgba(26,19,16,0.08)',
                  color: T.muted, padding: '12px 16px', borderRadius: 999, cursor: 'pointer',
                  fontFamily: T.serif, fontStyle: 'italic', fontSize: 14,
                }}>
                Not right now
              </button>
            </div>
          </>
        )}

        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
