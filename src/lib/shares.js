// Shares — partner / supporter sharing client.
//
// All calls go through the supabase client. The actual access-control
// lives in Postgres RLS + the SECURITY DEFINER functions (defined in
// supabase-schema.sql under "shares"). This module is just a thin
// typed surface so screens don't have to know the SQL shapes.

import { supabase, supabaseEnabled } from './supabase'

// 16-char invite code — alphanumeric, no ambiguous chars (no 0/O/1/I).
// Enough entropy to resist random guessing.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateInviteCode() {
  const buf = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf)
  } else {
    for (let i = 0; i < 16; i++) buf[i] = Math.floor(Math.random() * 256)
  }
  let out = ''
  for (let i = 0; i < 16; i++) out += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length]
  return out
}

// Scope shape:
//   { cycle: boolean, fullLog: boolean }
// "cycle" is always true for an active share (phase + predictions are
// computed client-side from the redacted profile). "fullLog" gates
// access to the partner's logs table (symptoms, mood, flow, etc.).
export const SHARE_SCOPES = {
  CYCLE_ONLY: { cycle: true, fullLog: false },
  FULL_PICTURE: { cycle: true, fullLog: true },
}

// ── Outgoing (data owner side) ─────────────────────────────────

// Create a new pending invite. The user picks the scope first, then
// hands the returned invite code (or a deep-link containing it) to
// the person they want to share with.
export async function createInvite(scope = SHARE_SCOPES.CYCLE_ONLY) {
  if (!supabaseEnabled) throw new Error('Sharing requires an account')
  const { data: auth } = await supabase.auth.getUser()
  const fromUserId = auth?.user?.id
  if (!fromUserId) throw new Error('Not signed in')

  const inviteCode = generateInviteCode()
  const { data, error } = await supabase
    .from('shares')
    .insert({
      from_user_id: fromUserId,
      invite_code: inviteCode,
      scope,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// All shares the current user has CREATED (outgoing) — pending +
// accepted + revoked. Used by the manage-shares screen.
export async function listOutgoingShares() {
  if (!supabaseEnabled) return []
  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Revoke a share you created. Sets status=revoked + revoked_at.
// Once revoked, the recipient's read functions return null.
export async function revokeOutgoingShare(shareId) {
  if (!supabaseEnabled) throw new Error('Sharing requires an account')
  const { data, error } = await supabase
    .from('shares')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
    })
    .eq('id', shareId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Update the scope of an active share. Only the owner can do this.
export async function updateShareScope(shareId, scope) {
  if (!supabaseEnabled) throw new Error('Sharing requires an account')
  const { data, error } = await supabase
    .from('shares')
    .update({ scope })
    .eq('id', shareId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Incoming (recipient side) ──────────────────────────────────

// Look at a pending invite by code WITHOUT accepting — used by the
// accept screen to show "X is offering you the cycle picture" before
// the user commits. Calls the preview_share_invite RPC which checks
// the invite is still pending and returns the owner's display name.
export async function previewInvite(code) {
  if (!supabaseEnabled) throw new Error('Sharing requires an account')
  const { data, error } = await supabase.rpc('preview_share_invite', { code })
  if (error) throw error
  return data
}

// Accept a pending invite by code. Updates the share row to set
// to_user_id = current user, status = 'accepted', accepted_at = now,
// invite_code = null (so it can't be reused). Uses the accept-policy
// in RLS which only allows this transition.
export async function acceptInvite(code) {
  if (!supabaseEnabled) throw new Error('Sharing requires an account')
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth?.user?.id
  if (!userId) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('shares')
    .update({
      to_user_id: userId,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      invite_code: null,
    })
    .eq('invite_code', code)
    .eq('status', 'pending')
    .select()
    .single()
  if (error) throw error
  return data
}

// All shares where the current user is the RECIPIENT (incoming).
// Used by the "Shared with you" surface.
export async function listIncomingShares() {
  if (!supabaseEnabled) return []
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth?.user?.id
  if (!userId) return []

  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .eq('to_user_id', userId)
    .eq('status', 'accepted')
    .is('revoked_at', null)
    .order('accepted_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Revoke an incoming share from the recipient's side. The data owner
// won't be re-notified — the share row just becomes inactive on both
// ends.
export async function revokeIncomingShare(shareId) {
  if (!supabaseEnabled) throw new Error('Sharing requires an account')
  const { data, error } = await supabase
    .from('shares')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
    })
    .eq('id', shareId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Read the shared profile of a data owner the recipient has an active
// share with. Goes through the SECURITY DEFINER function which checks
// the share is active AND strips private settings (journalEntries,
// savedArticles, reflectHistory, etc.) before returning. Returns null
// if no active share.
export async function getSharedProfile(targetUserId) {
  if (!supabaseEnabled) return null
  const { data, error } = await supabase.rpc('get_shared_profile', {
    target_user_id: targetUserId,
  })
  if (error) throw error
  return data || null
}

// Read the shared logs of a data owner. Only returns rows when the
// share's scope.fullLog is true (otherwise empty). Server-enforced
// via SECURITY DEFINER.
export async function getSharedLogs(targetUserId) {
  if (!supabaseEnabled) return []
  const { data, error } = await supabase.rpc('get_shared_logs', {
    target_user_id: targetUserId,
  })
  if (error) throw error
  return data || []
}

// ── Helpers ──────────────────────────────────────────────────────

// Build the deep-link URL for a code. lunadiary.app/share?code=X
// opens the app and routes to the accept screen.
export function inviteUrl(code) {
  if (typeof window === 'undefined') return `/share?code=${code}`
  return `${window.location.origin}/share?code=${code}`
}

// Human-readable scope label for UI.
export function scopeLabel(scope) {
  if (!scope) return 'Nothing yet'
  if (scope.fullLog) return 'The full picture'
  if (scope.cycle) return 'The cycle picture'
  return 'Nothing yet'
}

export function scopeBlurb(scope) {
  if (!scope) return ''
  if (scope.fullLog) return 'Phase, predictions, symptoms, mood, flow, sleep, BBT. Diary entries stay private.'
  if (scope.cycle) return 'Phase, cycle day, period prediction, fertile window. No symptoms, no diary.'
  return ''
}
