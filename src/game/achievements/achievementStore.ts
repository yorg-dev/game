// ---------------------------------------------------------------------------
// achievementStore
//
// Tracks which achievements the player has earned.
// Definitions are loaded from the API (fallback to mocks).
// Earned state is persisted in localStorage.
// EventBus listeners auto-unlock achievements as game events fire.
// ---------------------------------------------------------------------------

import { EventBus } from '../EventBus'
import { achievementProvider } from '@/providers/achievementProvider'
import { SAMPLE_ACHIEVEMENTS } from '@/mocks/achievements'
import { getQuestsWithProgress } from '../quest/questStore'
import type { Achievement } from '@/models/Achievement'

const STORAGE_KEY = 'yorg-achievements'

// id → ISO unlock timestamp
type Progress = Record<string, string>

let availableAchievements: Achievement[] = SAMPLE_ACHIEVEMENTS
let activeAgentCount = 0
let loadInFlight = false

// ── Storage helpers ──────────────────────────────────────────────────────────

function loadRaw(): Progress {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Progress
  } catch {
    return {}
  }
}

function saveRaw(p: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // Ignore (private browsing, quota)
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Returns all achievement definitions hydrated with earned timestamps. */
export function getAchievementsWithProgress(): Achievement[] {
  const raw = loadRaw()
  return availableAchievements.map((a) => ({
    ...a,
    unlockedAt: raw[a.id],
  }))
}

/**
 * Fetch achievement definitions from the API and update the in-memory cache.
 * Emits `achievements-updated` so subscribed components re-render.
 */
export async function loadAchievements(): Promise<void> {
  if (loadInFlight) return
  loadInFlight = true
  try {
    availableAchievements = await achievementProvider.getAchievements()
    EventBus.emit('achievements-updated', undefined)
  } finally {
    loadInFlight = false
  }
}

/**
 * Mark an achievement as earned. Emits `achievement-unlocked` on new unlock.
 * Returns true if this was a new unlock, false if already earned.
 */
export function unlock(id: string): boolean {
  const raw = loadRaw()
  if (raw[id]) return false // already earned

  raw[id] = new Date().toISOString()
  saveRaw(raw)

  const achievement = availableAchievements.find((a) => a.id === id)
  if (!achievement) return false

  EventBus.emit('achievement-unlocked', {
    id,
    title: achievement.title,
    icon: achievement.icon,
    rarity: achievement.rarity,
  })

  // Meta-achievement checks run after emitting so they appear as separate toasts.
  checkMetaAchievements()
  return true
}

export function resetAll(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ── Meta achievements ────────────────────────────────────────────────────────

function checkMetaAchievements(): void {
  const raw = loadRaw()
  const baseIds = availableAchievements
    .map((a) => a.id)
    .filter((id) => id !== 'overachiever' && id !== 'master-of-yorg')

  // Overachiever: 5+ base achievements earned
  if (baseIds.filter((id) => !!raw[id]).length >= 5) unlock('overachiever')

  // Master of Yorg: everything except itself
  const allExceptMaster = availableAchievements.map((a) => a.id).filter((id) => id !== 'master-of-yorg')
  if (allExceptMaster.every((id) => !!raw[id])) unlock('master-of-yorg')
}

// ── Auto-wiring ──────────────────────────────────────────────────────────────

let initialized = false

export function initAchievementListeners(): void {
  if (initialized) return
  initialized = true

  EventBus.on('player-moved', () => unlock('first-steps'))

  EventBus.on('agent-spawned', () => {
    unlock('agent-summoner')
    activeAgentCount++
    if (activeAgentCount >= 3) unlock('multitasker')
  })

  EventBus.on('agent-removed', () => {
    activeAgentCount = Math.max(0, activeAgentCount - 1)
  })

  EventBus.on('command-issued', () => unlock('the-commander'))

  EventBus.on('add-connection', ({ remote }) => {
    if (!remote) unlock('networked')
  })

  EventBus.on('agent-message', () => unlock('conversationalist'))

  EventBus.on('voice-command', () => unlock('voice-of-command'))

  EventBus.on('agent-execution-complete', () => unlock('task-observer'))

  EventBus.on('quest-step-completed', ({ questId }) => {
    const quest = getQuestsWithProgress().find((q) => q.id === questId)
    if (quest?.status !== 'completed') return
    // First completed quest
    unlock('quest-pioneer')
    // Specific quest completions
    if (questId === 'explore') unlock('ai-explorer')
  })
}
