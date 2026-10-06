import { beforeEach, describe, expect, it, vi } from 'vitest'
const db = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), update: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn() }))
vi.mock('./supabase', () => ({ supabaseEnabled: true, supabase: { auth: { getUser: db.getUser }, from: db.from } }))
vi.mock('./sentry', () => ({ reportError: vi.fn() }))
import { saveProfile } from './cloud'
beforeEach(() => {
  vi.clearAllMocks()
  db.getUser.mockResolvedValue({ data: { user: { id: 'owner' } } })
  db.from.mockReturnValue({ update: db.update })
  db.update.mockReturnValue({ eq: db.eq })
  db.eq.mockReturnValue({ select: db.select })
  db.select.mockReturnValue({ single: db.single })
  db.single.mockResolvedValue({ data: { id: 'owner' }, error: null })
})
describe('acknowledged profile writes', () => {
  it('filters by authenticated owner and checks one returned row', async () => {
    await saveProfile({ settings: {} }, { requireSaved: true })
    expect(db.eq).toHaveBeenCalledWith('id', 'owner')
    expect(db.select).toHaveBeenCalledWith('id')
    expect(db.single).toHaveBeenCalledOnce()
  })
  it('rejects a zero-row/RLS failure', async () => {
    db.single.mockResolvedValueOnce({ error: new Error('No row') })
    await expect(saveProfile({}, { requireSaved: true })).rejects.toThrow('No row')
  })
  it('rejects a missing authenticated user', async () => {
    db.getUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(saveProfile({}, { requireSaved: true })).rejects.toThrow('Sign in')
    expect(db.from).not.toHaveBeenCalled()
  })
  it('cannot write a previous account’s care data into a new account', async () => {
    await expect(saveProfile({}, { requireSaved: true, expectedUserId: 'different-owner' })).rejects.toThrow('Account changed')
    expect(db.from).not.toHaveBeenCalled()
  })
})
