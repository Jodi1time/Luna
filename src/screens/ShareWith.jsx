import { useEffect, useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Screen, Eyebrow } from '../components/shared'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import ContextualTip from '../components/ContextualTip'
import {
  createInvite,
  listOutgoingShares,
  revokeOutgoingShare,
  updateShareScope,
  inviteUrl,
  scopeLabel,
  scopeBlurb,
  SHARE_SCOPES,
} from '../lib/shares'
import useLuna from '../store/useLuna'

// ── Share With Someone — Pro-only feature
//
// Lives at Settings → "Share with someone." Lets a Pro user generate
// an invite link, choose what's shared, send the link via any channel,
// and manage active shares (revoke any).
//
// Recipient flow lives separately in AcceptShare.jsx — they open the
// deep-link, accept, and see the data on a "Shared with you" surface.

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function PaywallHint({ onUpgrade }) {
  const accent = sectionColors('plan').accent
  return (
    <div className="alive-card frost-card" style={{
      padding: 22,
      background: sectionPaper('plan'),
      border: `1px solid ${accent}28`,
      borderRadius: 22,
      boxShadow: `0 14px 30px -22px ${accent}50`,
      marginBottom: 18,
    }}>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 8 }}>
        a luna pro feature
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1.2, marginBottom: 10 }}>
        Share with someone who supports you.
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14.5, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>
        A partner, your mother, a doula, a sister — anyone you'd want to know where you are this week. You pick what they see. Diary entries stay private.
      </div>
      <button onClick={onUpgrade}
        className="alive-card"
        style={{
          width: '100%', background: accent, color: '#fff', border: 'none',
          padding: '14px 16px', borderRadius: 999, cursor: 'pointer',
          fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4,
          boxShadow: `0 12px 24px -10px ${accent}80`,
        }}>
        Open Luna Pro
      </button>
    </div>
  )
}

function ScopePicker({ value, onChange }) {
  const accent = sectionColors('plan').accent
  const options = [
    { key: 'cycle', label: 'The cycle picture', scope: SHARE_SCOPES.CYCLE_ONLY },
    { key: 'full',  label: 'The full picture',  scope: SHARE_SCOPES.FULL_PICTURE },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map((o) => {
        const on = JSON.stringify(value) === JSON.stringify(o.scope)
        return (
          <button key={o.key} onClick={() => onChange(o.scope)}
            className={`alive-card frost-card${on ? ' tap-bloom' : ''}`}
            style={{
              padding: 16,
              background: on ? `${accent}14` : 'rgba(253,250,245,0.55)',
              border: `1px solid ${on ? accent + '55' : 'rgba(26,19,16,0.06)'}`,
              borderRadius: 18,
              textAlign: 'left', cursor: 'pointer',
              color: T.text, fontFamily: 'inherit',
              boxShadow: on ? `0 12px 22px -16px ${accent}60` : '0 10px 22px -22px rgba(26,19,16,0.18)',
              transition: 'all 0.2s var(--ease-out)',
            }}>
            <div style={{ fontFamily: T.serif, fontStyle: on ? 'italic' : 'normal', fontSize: 17, fontWeight: 500, letterSpacing: -0.2, marginBottom: 4, color: on ? accent : T.text }}>
              {o.label}
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.55 }}>
              {scopeBlurb(o.scope)}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function ShareWith() {
  const store = useLuna()
  const { back, go, isPro } = store
  const accent = sectionColors('plan').accent
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [scope, setScope] = useState(SHARE_SCOPES.CYCLE_ONLY)
  const [newInvite, setNewInvite] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [error, setError] = useState('')

  const refresh = async () => {
    if (!isPro) return
    setLoading(true)
    try {
      const list = await listOutgoingShares()
      setShares(list)
    } catch (e) {
      setError(e?.message || 'Could not load your shares')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      const invite = await createInvite(scope)
      setNewInvite(invite)
      // Analytics: scope only — never the code or recipient.
      import('../lib/posthog').then(({ capture }) => capture('share_invite_created', { scope }))
      await refresh()
    } catch (e) {
      setError(e?.message || 'Could not create invite')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id) => {
    const ok = window.confirm('Revoke this share? The person you shared with will no longer see your cycle.')
    if (!ok) return
    try {
      await revokeOutgoingShare(id)
      await refresh()
    } catch (e) {
      setError(e?.message || 'Could not revoke')
    }
  }

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(code))
      setCopiedId(code)
      setTimeout(() => setCopiedId(null), 1800)
    } catch {
      // Fallback for browsers without async clipboard
      window.prompt('Copy this link:', inviteUrl(code))
    }
  }

  if (!isPro) {
    return (
      <Screen padBottom={40}>
        <div style={{ padding: '12px 22px 0', color: T.text }}>
          <Masthead issue="share with someone" onBack={back} />
          <Eyebrow color={accent}>luna pro</Eyebrow>
          <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 22 }}>
            A small bridge.
          </div>
          <PaywallHint onUpgrade={() => go('paywall')} />
          <div className="frost-card" style={{
            padding: 16,
            background: 'rgba(253,250,245,0.55)',
            border: '1px solid rgba(26,19,16,0.06)',
            borderRadius: 18,
            fontFamily: T.serif, fontStyle: 'italic',
            fontSize: 13, color: T.text, lineHeight: 1.6,
          }}>
            Whatever you share, you keep control of. Revoke any time. Diary entries and photos are never shared.
          </div>
        </div>
      </Screen>
    )
  }

  const active = shares.filter((s) => s.status === 'accepted')
  const pending = shares.filter((s) => s.status === 'pending')

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="share with someone" onBack={back} />

        <Eyebrow color={accent}>luna pro</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10 }}>
          Who do you want<br /><em>to keep close?</em>
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14.5, color: T.muted, lineHeight: 1.55, marginBottom: 22 }}>
          A partner, your mother, a sister, a doula. You choose what they see and you can revoke any time. They need to download Luna and accept your invite.
        </div>

        <ContextualTip tipId="share-link" accent={accent}>
          The link works anywhere — Messages, WhatsApp, email. Diary entries and photos are never shared, even at the full-picture scope.
        </ContextualTip>

        {/* Newly created invite — show the link prominently */}
        {newInvite && (
          <div className="alive-card frost-card" style={{
            padding: 20,
            background: sectionPaper('plan'),
            border: `1px solid ${accent}40`,
            borderRadius: 22,
            boxShadow: `0 14px 30px -22px ${accent}55`,
            marginBottom: 22,
          }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 8 }}>
              your invite is ready
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, marginBottom: 10, lineHeight: 1.4 }}>
              Send this link to {newInvite.invite_code ? "the person you'd like to share with" : 'them'}.
            </div>
            <div style={{
              padding: '12px 14px',
              background: 'rgba(253,250,245,0.55)',
              border: '1px solid rgba(26,19,16,0.08)',
              borderRadius: 14,
              fontFamily: T.mono, fontSize: 12, color: T.text,
              wordBreak: 'break-all',
              lineHeight: 1.5,
              marginBottom: 12,
            }}>
              {inviteUrl(newInvite.invite_code)}
            </div>
            <button onClick={() => handleCopy(newInvite.invite_code)}
              className={`alive-card${copiedId === newInvite.invite_code ? ' tap-bloom' : ''}`}
              style={{
                width: '100%', background: accent, color: '#fff', border: 'none',
                padding: '13px 16px', borderRadius: 999, cursor: 'pointer',
                fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4,
                boxShadow: `0 12px 24px -12px ${accent}80`,
              }}>
              {copiedId === newInvite.invite_code ? '✓  Copied' : 'Copy link'}
            </button>
            <div style={{ marginTop: 10, fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, lineHeight: 1.5, textAlign: 'center' }}>
              You're sharing: <strong style={{ fontStyle: 'normal', fontWeight: 600 }}>{scopeLabel(newInvite.scope).toLowerCase()}</strong>.
            </div>
          </div>
        )}

        {/* Create new invite */}
        {!newInvite && (
          <>
            <Eyebrow color={accent}>what to share</Eyebrow>
            <div style={{ marginBottom: 22 }}>
              <ScopePicker value={scope} onChange={setScope} />
            </div>
            <button onClick={handleCreate} disabled={creating}
              className="alive-card"
              style={{
                width: '100%', background: accent, color: '#fff', border: 'none',
                padding: '16px 16px', borderRadius: 999, cursor: creating ? 'default' : 'pointer',
                fontFamily: T.serif, fontStyle: 'italic', fontSize: 17, fontWeight: 500, letterSpacing: -0.2,
                opacity: creating ? 0.6 : 1,
                marginBottom: 22,
                boxShadow: `0 14px 28px -10px ${accent}80`,
              }}>
              {creating ? 'creating…' : 'Create an invite link'}
            </button>
          </>
        )}

        {error && (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.accent, lineHeight: 1.5, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {/* Pending invites — not yet accepted */}
        {pending.length > 0 && (
          <>
            <Eyebrow color={T.muted}>waiting to be accepted</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              {pending.map((s) => (
                <div key={s.id} className="frost-card" style={{
                  padding: 14,
                  background: 'rgba(253,250,245,0.55)',
                  border: '1px solid rgba(26,19,16,0.06)',
                  borderRadius: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                    <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.text, letterSpacing: -0.1 }}>
                      {scopeLabel(s.scope).toLowerCase()}
                    </div>
                    <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted }}>
                      sent {fmtDate(s.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleCopy(s.invite_code)}
                      style={{
                        flex: 1, background: 'rgba(253,250,245,0.55)',
                        border: '1px solid rgba(26,19,16,0.08)',
                        padding: '9px 12px', borderRadius: 999, cursor: 'pointer',
                        fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, color: T.text, letterSpacing: 0.3,
                      }}>
                      {copiedId === s.invite_code ? '✓ Copied' : 'Copy link'}
                    </button>
                    <button onClick={() => handleRevoke(s.id)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${T.accent}40`,
                        color: T.accent,
                        padding: '9px 12px', borderRadius: 999, cursor: 'pointer',
                        fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3,
                      }}>
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Active shares — accepted */}
        {active.length > 0 && (
          <>
            <Eyebrow color={accent}>who has access</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              {active.map((s) => (
                <div key={s.id} className="frost-card" style={{
                  padding: 14,
                  background: sectionPaper('plan'),
                  border: `1px solid ${accent}22`,
                  borderRadius: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                    <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.text, letterSpacing: -0.1 }}>
                      {scopeLabel(s.scope).toLowerCase()}
                    </div>
                    <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted }}>
                      since {fmtDate(s.accepted_at)}
                    </div>
                  </div>
                  <button onClick={() => handleRevoke(s.id)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: `1px solid ${T.accent}40`,
                      color: T.accent,
                      padding: '9px 12px', borderRadius: 999, cursor: 'pointer',
                      fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3,
                      marginTop: 4,
                    }}>
                    Stop sharing
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && shares.length === 0 && !newInvite && (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.6, marginTop: 8 }}>
            No active shares yet. Create an invite above when you're ready.
          </div>
        )}

        <div className="frost-card" style={{
          marginTop: 18,
          padding: 16,
          background: 'rgba(253,250,245,0.55)',
          border: '1px solid rgba(26,19,16,0.06)',
          borderRadius: 18,
          fontFamily: T.serif, fontStyle: 'italic',
          fontSize: 13, color: T.text, lineHeight: 1.6,
        }}>
          Diary entries and photos are never shared, even at full picture. Whatever you share, the person seeing it can only read — they can't log, edit, or delete anything for you. Revoke any time and their access goes blank.
        </div>

        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
