// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const cloud = vi.hoisted(() => ({ saveProfile: vi.fn() }))
vi.mock('../lib/cloud', () => ({ ...cloud, loadProfile: vi.fn(), loadLogs: vi.fn(), loadJournalEntries: vi.fn(), upsertLog: vi.fn(), deleteLog: vi.fn(), upsertJournalEntry: vi.fn(), deleteJournalEntryCloud: vi.fn(), fireAndForget: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabaseEnabled: true }))
import useLuna from '../store/useLuna'
import PcosCompanion from './PcosCompanion'
import { todayKey } from '../lib/dateOnly'

let root, host
const saved = () => useLuna.getState().settings.pcosCareSpace
function button(text) {
  const found = [...host.querySelectorAll('button')].find(x => x.textContent.trim() === text)
  if (!found) throw new Error(`Missing button: ${text}`)
  return found
}
async function click(target) { await act(async () => (typeof target === 'string' ? button(target) : target).click()) }
async function fill(selector, value) {
  const field = host.querySelector(selector)
  await act(async () => {
    const proto = field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(field, value)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function mount() {
  host = document.createElement('div'); document.body.appendChild(host)
  root = createRoot(host)
  await act(async () => root.render(<PcosCompanion />))
}
beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.clearAllMocks(); localStorage.clear()
  window.confirm = vi.fn(() => true)
  window.matchMedia = vi.fn(() => ({ matches: true }))
  Element.prototype.scrollIntoView = vi.fn()
  cloud.saveProfile.mockResolvedValue(undefined)
  useLuna.getState().clearLocalData()
  useLuna.getState().setSession({ user: { id: 'test-user' } })
  await mount()
})
afterEach(async () => { await act(async () => root.unmount()); host.remove() })

describe('care space interactions', () => {
  it('pins a concern, records impact, and brings only selected entries into a saved draft', async () => {
    await click('Choose my focus')
    await fill('#care-focus-label', 'Acne affects my confidence')
    await click('Keep this in focus')
    expect(saved().concern.followUps).toBe(false)
    expect(host.textContent).toContain('Saved to your account.')
    await click('Update my concern')
    await click('Harder today'); await click('Confidence')
    await fill('#care-entry-note', 'Avoided a social event')
    await click('Save this moment')
    expect(saved().entries[0]).toMatchObject({ note: 'Avoided a social event', impacts: ['Confidence'], feeling: 'Harder today' })
    await click('Prepare my conversation notes →')
    expect(host.querySelector('#care-draft').value).not.toContain('Avoided a social event')
    await click(host.querySelector('.care-entry-choice input'))
    await click('Prepare my conversation notes →')
    expect(host.querySelector('#care-draft').value).toContain('Avoided a social event')
    await fill('#care-draft', 'My edited appointment note')
    await click('Save edited draft')
    expect(saved().visitDraft).toBe('My edited appointment note')
    await act(async () => root.unmount()); host.remove()
    await mount()
    expect(host.querySelector('#care-draft').value).toBe('My edited appointment note')
  })
  it('does not silently include a personal reflection', async () => {
    await click('A moment for me')
    await fill('#care-entry-note', 'A hurtful comment upset me')
    await click('Save this moment')
    expect(saved().entries[0].kind).toBe('reflection')
    await click('Prepare my conversation notes →')
    expect(host.querySelector('#care-draft').value).not.toContain('A hurtful comment')
    expect(host.querySelector('.care-entry-choice input').checked).toBe(false)
    await click(host.querySelector('.care-entry-choice input'))
    await click('Prepare my conversation notes →')
    expect(host.querySelector('#care-draft').value).toContain('Personal reflection (selected by me)')
  })
  it('keeps words in the form on save failure and supports retry', async () => {
    await click('A moment for me'); await fill('#care-entry-note', 'Please keep these words')
    cloud.saveProfile.mockRejectedValueOnce(new Error('network error'))
    await click('Save this moment')
    expect(host.querySelector('[role=alert]').textContent).toContain('weren’t saved')
    expect(host.querySelector('#care-entry-note').value).toBe('Please keep these words')
    expect(saved()).toBeUndefined()
    await click('Save this moment')
    expect(saved().entries[0].note).toBe('Please keep these words')
  })
  it('dismisses a follow-up without recording a symptom-free day', async () => {
    await click('Choose my focus')
    await click(host.querySelector('.care-entry-form input[type=checkbox]'))
    await click('Keep this in focus')
    await click('Not today')
    expect(saved().concern.dismissedOn).toBe(todayKey())
    expect(saved().entries).toEqual([])
    expect(useLuna.getState().logs).toEqual({})
    expect([...host.querySelectorAll('button')].some(x => x.textContent === 'Not today')).toBe(false)
  })
  it('edits and deletes a saved moment without duplicating it', async () => {
    await click('A moment for me'); await fill('#care-entry-note', 'Original'); await click('Save this moment')
    await click('Edit'); await fill('#care-entry-note', 'Revised'); await click('Save changes')
    expect(saved().entries).toHaveLength(1)
    expect(saved().entries[0].note).toBe('Revised')
    await click('Delete'); expect(saved().entries).toEqual([])
  })
  it('focuses appointment preparation from the care-space action', async () => {
    await click('Prepare for care →')
    expect(document.activeElement).toBe(host.querySelector('.care-visit'))
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })
  it('loads a delayed account draft without overwriting unsaved edits', async () => {
    await act(async () => useLuna.setState({ settings: { ...useLuna.getState().settings, pcosCareSpace: { visitDraft: 'Loaded from account' } } }))
    expect(host.querySelector('#care-draft').value).toBe('Loaded from account')
    await fill('#care-draft', 'My unsaved edit')
    await act(async () => useLuna.setState({ settings: { ...useLuna.getState().settings, pcosCareSpace: { visitDraft: 'Later cloud value' } } }))
    expect(host.querySelector('#care-draft').value).toBe('My unsaved edit')
  })
  it('keeps an appointment question after a failed save and confirms its retry', async () => {
    await fill('#care-question', 'What should I ask about my skin?')
    cloud.saveProfile.mockRejectedValueOnce(new Error('network error'))
    await click('Save question')
    expect(host.querySelector('#care-question').value).toBe('What should I ask about my skin?')
    expect(useLuna.getState().settings.pcosQuestions).toBeUndefined()
    await click('Save question')
    expect(host.querySelector('#care-question').value).toBe('')
    expect(useLuna.getState().settings.pcosQuestions[0].text).toBe('What should I ask about my skin?')
    await click('Remove')
    expect(useLuna.getState().settings.pcosQuestions).toEqual([])
  })
})
