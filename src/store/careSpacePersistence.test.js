import { beforeEach, describe, expect, it, vi } from 'vitest'

const cloud = vi.hoisted(() => ({ saveProfile: vi.fn(), loadProfile: vi.fn(), loadLogs: vi.fn(), loadJournalEntries: vi.fn() }))
const connection = vi.hoisted(() => ({ supabaseEnabled: true }))
vi.mock('../lib/cloud', () => ({ ...cloud, upsertLog: vi.fn(), deleteLog: vi.fn(), upsertJournalEntry: vi.fn(), deleteJournalEntryCloud: vi.fn(), fireAndForget: vi.fn() }))
vi.mock('../lib/supabase', () => connection)
const cache = new Map()
vi.stubGlobal('localStorage', { getItem: key => cache.get(key) || null, setItem: (key, value) => cache.set(key, value), removeItem: key => cache.delete(key) })
const { default: useLuna } = await import('./useLuna')

beforeEach(() => {
  vi.clearAllMocks(); cache.clear(); connection.supabaseEnabled = true
  useLuna.getState().clearLocalData()
  useLuna.getState().setSession({ user: { id: 'owner-a' } })
  cloud.saveProfile.mockResolvedValue(undefined)
})

describe('care record persistence', () => {
  it('waits for account acknowledgement and preserves other settings', async () => {
    useLuna.setState({ settings: { sounds: true, pcosQuestions: [{ text: 'Existing question' }] } })
    let resolve
    cloud.saveProfile.mockReturnValueOnce(new Promise(r => { resolve = r }))
    const pending = useLuna.getState().saveCareSpace({ concern: { id: 'c', label: 'My energy' } })
    expect(useLuna.getState().settings.pcosCareSpace).toBeUndefined()
    resolve(); expect(await pending).toBe('account')
    expect(cloud.saveProfile).toHaveBeenCalledWith(expect.objectContaining({ settings: expect.objectContaining({ sounds: true }) }), { requireSaved: true, expectedUserId: 'owner-a' })
    expect(useLuna.getState().settings.pcosCareSpace.concern.label).toBe('My energy')
    expect(JSON.parse(cache.get('luna-store')).state.settings.pcosCareSpace.concern.id).toBe('c')
  })
  it('does not store an entry or claim success after a failed account write', async () => {
    cloud.saveProfile.mockRejectedValueOnce(new Error('offline'))
    await expect(useLuna.getState().saveCareSpace({ entries: [{ id: 'new' }] })).rejects.toThrow('offline')
    expect(useLuna.getState().settings.pcosCareSpace).toBeUndefined()
  })
  it('requires a session when cloud storage is enabled', async () => {
    useLuna.getState().setSession(null)
    await expect(useLuna.getState().saveCareSpace({ concern: null })).rejects.toThrow('Sign in')
    expect(cloud.saveProfile).not.toHaveBeenCalled()
  })
  it('never puts a finishing save in another account’s local cache', async () => {
    let resolve
    cloud.saveProfile.mockReturnValueOnce(new Promise(r => { resolve = r }))
    const pending = useLuna.getState().saveCareSpace({ entries: [{ id: 'private' }] })
    useLuna.getState().clearLocalData()
    useLuna.getState().setSession({ user: { id: 'owner-b' } })
    resolve()
    await expect(pending).rejects.toThrow('Account changed')
    expect(useLuna.getState().settings.pcosCareSpace).toBeUndefined()
  })
  it('saves and restores an edited draft alongside existing entries', async () => {
    await useLuna.getState().saveCareSpace({ entries: [{ id: 'one' }] })
    await useLuna.getState().saveCareSpace({ visitDraft: 'My edited words' })
    const saved = JSON.parse(cache.get('luna-store')).state
    expect(saved.settings.pcosCareSpace.entries).toEqual([{ id: 'one' }])
    expect(saved.settings.pcosCareSpace.visitDraft).toBe('My edited words')
  })
  it('labels development-only local saves separately and clears care data on sign-out', async () => {
    connection.supabaseEnabled = false
    expect(await useLuna.getState().saveCareSpace({ visitDraft: 'Personal draft' })).toBe('device')
    expect(cloud.saveProfile).not.toHaveBeenCalled()
    useLuna.getState().clearLocalData()
    expect(useLuna.getState().settings.pcosCareSpace).toBeUndefined()
  })
})
