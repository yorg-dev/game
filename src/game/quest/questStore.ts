// ---------------------------------------------------------------------------
// questStore
//
// Persistent quest progress for the in-game quest tracker.
// Quest definitions are loaded from the API (falling back to mocks).
// Progress is stored in localStorage so it survives page refreshes.
// EventBus listeners auto-complete steps as the player interacts with the game.
// ---------------------------------------------------------------------------

import { EventBus } from '../EventBus'
import { SAMPLE_QUESTS } from '@/mocks/quests'
import type { Quest } from '@/models/Quest'

const STORAGE_KEY = 'yorg-quest-progress'

type RawProgress = Record<string, Record<string, boolean>>

// In-memory cache of quest definitions.  Starts with the mock list so the
// tracker renders immediately; replaced with API data once loadQuests() resolves.
let availableQuests: Quest[] = SAMPLE_QUESTS

function loadRaw(): RawProgress {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as RawProgress
  } catch {
    return {}
  }
}

function saveRaw(p: RawProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // Ignore (private browsing, storage quota)
  }
}

/**
 * Returns all quest definitions hydrated with persisted progress.
 * Quest status is derived: completed → all steps done; active → previous
 * quest completed (or first quest); locked → previous quest not done yet.
 */
export function getQuestsWithProgress(): Quest[] {
  const raw = loadRaw()
  const result: Quest[] = []

  for (let i = 0; i < availableQuests.length; i++) {
    const def = availableQuests[i]
    const progress = raw[def.id] ?? {}
    const steps = def.steps.map((s) => ({ ...s, isComplete: progress[s.id] === true }))
    const allDone = steps.every((s) => s.isComplete)
    const prevDone = i === 0 || result[i - 1]?.status === 'completed'

    result.push({
      ...def,
      steps,
      status: allDone ? 'completed' : prevDone ? 'active' : 'locked',
    })
  }

  return result
}

/**
 * Update the in-memory quest definitions from data returned by the API.
 * Emits `quests-updated` so subscribed components re-render.
 */
export function setQuests(quests: Quest[]): void {
  availableQuests = quests
  EventBus.emit('quests-updated', undefined)
}

/**
 * Marks a quest step as complete. Emits `quest-step-completed` if it was
 * newly completed. Returns true on new completion, false if already done.
 */
export function completeStep(questId: string, stepId: string): boolean {
  const raw = loadRaw()
  if (raw[questId]?.[stepId]) return false
  if (!raw[questId]) raw[questId] = {}
  raw[questId][stepId] = true
  saveRaw(raw)
  EventBus.emit('quest-step-completed', { questId, stepId })
  return true
}

export function resetAll(): void {
  localStorage.removeItem(STORAGE_KEY)
  availableQuests = SAMPLE_QUESTS
}

// ---------------------------------------------------------------------------
// Auto-wiring: subscribe to game events and advance quest steps.
// Called once at module load — guarded against double-registration.
// ---------------------------------------------------------------------------

let initialized = false

export function initQuestListeners(): void {
  if (initialized) return
  initialized = true

  EventBus.on('player-moved', () => completeStep('tutorial', 'move'))
  EventBus.on('agent-spawned', () => completeStep('tutorial', 'spawn'))
  EventBus.on('command-issued', () => completeStep('tutorial', 'command'))

  EventBus.on('agent-message', () => completeStep('explore', 'direct-chat'))
  EventBus.on('add-connection', ({ remote }) => {
    if (!remote) completeStep('explore', 'connection')
  })
  EventBus.on('voice-command', () => completeStep('explore', 'voice'))
}
