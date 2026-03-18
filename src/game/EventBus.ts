import type Phaser from 'phaser'
import type { Connection } from '@/models/Connection'
import type { DialogLine } from './dialog/DialogScript'
import type { AppInterior, InteriorAction } from './interiors/AppInterior'
import type { ActiveLandState } from '@/providers/activeLand'

/**
 * Typed events that cross the React/Phaser boundary.
 * All inter-system communication MUST go through this bus — never via
 * direct cross-system references (Constitution Principle III).
 */
export interface GameEventMap {
  /** Fired by a Scene once its create() has finished. */
  'scene-ready': Phaser.Scene
  /** React → Phaser: user submitted the New Agent modal. */
  'spawn-agent': {
    templateId: string
    name: string
    x?: number
    y?: number
    networkId?: string
    remote?: boolean
  }
  /** Phaser → React: a new Agent was added to the scene. */
  'agent-spawned': { id: number; name: string; templateId: string; networkId?: string }
  /**
   * React → Phaser: GameMenu just mounted and wants the current agent list.
   * GameScene responds by re-emitting agent-spawned for each existing agent.
   */
  'request-agent-sync': undefined
  /** Phaser → React: user clicked a Agent in the game world — open the popover. */
  'agent-clicked': { id: number; name: string; templateId: string; tab?: 'overview' | 'chat' }
  /** React → Phaser: remove a Agent from the scene. */
  'remove-agent': { id: number }
  /** React → Phaser: user clicked "Take Control" on an agent. */
  'select-agent': { id: number }
  /** Phaser → React: an agent was taken control of, or null when released. */
  'controlled-agent-changed': { id: number; name: string } | null
  /** React → Phaser: player clicked Release in ControlHUD. */
  'release-agent': undefined
  /** Phaser → React: a Agent was removed from the scene. */
  'agent-removed': { id: number }
  /** React → Phaser: the user issued a natural-language command to all Agents. */
  'command-issued': { id: string; text: string }
  /** Phaser → React: a Agent has acknowledged a command. */
  'command-acknowledged': { commandId: string; agentId: number; agentName: string }
  /** Phaser → React: user clicked a connection house in the game world. */
  'connection-clicked': { connectionId: string; appId: string; connection: Connection }
  /** React → Phaser (or WS → Phaser): a new connection was added — place a house in the world.
   *  `remote: true` when sourced from a WS broadcast — GameScene skips re-broadcasting in that case. */
  'add-connection': {
    connectionId: string
    appId: string
    worldX: number
    worldY: number
    connection: Connection
    remote?: boolean
  }
  /** WS → Phaser: a connection placement was removed by another client. */
  'remove-connection': { connectionId: string }
  /** WS → Phaser: a connection placement was moved by another client. */
  'move-connection': { connectionId: string; worldX: number; worldY: number }
  /** WS → Phaser: a remote agent moved — apply state to the local sprite. */
  'agent-remote-moved': {
    localId: number
    x: number
    y: number
    facing: import('./entities/Character').Direction
    moving: boolean
  }
  /** React → Phaser: user sent a direct message to a specific Agent. */
  'agent-message': { messageId: string; agentId: number; text: string }
  /** Phaser → React: a specific Agent replied to a direct message. */
  'agent-response': { messageId: string; agentId: number; text: string }
  /** Phaser → React: start a click-through dialog sequence. */
  'dialog-start': { lines: DialogLine[] }
  /** React → Phaser: the dialog was fully dismissed. */
  'dialog-end': undefined
  /** Phaser → React: player entered a connection house. */
  'enter-house': { appId: string; connection: Connection; interior: AppInterior }
  /** Phaser → React: player exited a house back to the world. */
  'exit-house': undefined
  /** React → Phaser: user clicked Leave in IndoorHUD. */
  'leave-house': undefined
  /** Phaser → React: player activated a terminal inside a house. */
  'terminal-interact': { appId: string; action: InteriorAction }
  /** TitleScene → React: player selected "Load World" — show login modal. */
  'show-login': { tab?: 'login' | 'register' } | undefined
  /** React → TitleScene: user successfully logged in — proceed to load world. */
  'login-confirmed': undefined
  /** React → TitleScene: user dismissed the login modal. */
  'login-cancelled': undefined
  /** TitleScene → React: player selected a menu option to start the game. */
  'game-started': undefined
  /** App → all: connections have been loaded (from backend or fallback). */
  'connections-loaded': { connections: Connection[] }
  /**
   * App → Phaser: the active Land and all its placements are ready.
   * GameScene uses this to position houses, signs, and chests.
   * Also fired when the user switches to a different Land mid-session.
   */
  'land-ready': ActiveLandState
  /** Phaser → React: player clicked the bulletin board sign — open notifications. */
  'sign-clicked': undefined
  /** App → all: a session token is now available (guest or real). */
  'session-ready': undefined
  /** ProfileButton → all: user signed out — return to TitleScene. */
  logout: undefined
  /** AgentChannel → game: a voice command was confirmed by the server. */
  'voice-command': { agentId: string; command: string; transcript: string; userId: number }
  /** GameScene → all: player moved using WASD for the first time (one-shot per session). */
  'player-moved': undefined
  /** questStore → React: a quest step was marked complete. */
  'quest-step-completed': { questId: string; stepId: string }
  /** GameScene → all: an agent gained XP from a command, voice, or chat. */
  'agent-xp-gained': {
    agentId: number
    agentSlug: string
    xpGained: number
    level: number
    xp: number
    xpToNext: number
  }
  /** GameScene → all: an agent crossed a level threshold. */
  'agent-leveled-up': {
    agentId: number
    agentSlug: string
    newLevel: number
    previousLevel: number
  }
  /** questStore → React: available quest definitions were (re)loaded from the API. */
  'quests-updated': undefined
  /** Phaser → React: an agent is walking toward the player and will execute a task. */
  'agent-executing': {
    agentId: number
    agentName: string
    templateId: string
    command: string
    steps: string[] // skill IDs in execution order
  }
  /** Phaser → React: a single skill step changed status during execution. */
  'agent-step-progress': {
    agentId: number
    stepIndex: number
    status: 'running' | 'done'
  }
  /** Phaser → React: an agent finished all skill steps. */
  'agent-execution-complete': {
    agentId: number
    summary: string
  }
  /** achievementStore → React: an achievement was just earned. */
  'achievement-unlocked': {
    id: string
    title: string
    icon: string
    rarity: import('@/models/Achievement').AchievementRarity
  }
  /** achievementStore → React: achievement definitions were (re)loaded from the API. */
  'achievements-updated': undefined
  /** Any component → App: open the achievements modal. */
  'show-achievements': undefined
  /** Any component → App: open the experts directory modal. */
  'show-experts': undefined
  /** Any component → App: open the leaderboard modal. */
  'show-leaderboard': undefined
}

type Listener<T> = (payload: T) => void

class TypedEventBus {
  // Stored as unknown listeners; type safety is enforced by the public API.
  private readonly listeners = new Map<string, Set<Listener<unknown>>>()

  on<K extends keyof GameEventMap>(event: K, fn: Listener<GameEventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    // Safe: the set for key K only ever holds Listener<GameEventMap[K]> values.
    ;(this.listeners.get(event) as Set<Listener<GameEventMap[K]>>).add(fn)
    return () => this.off(event, fn)
  }

  off<K extends keyof GameEventMap>(event: K, fn: Listener<GameEventMap[K]>): void {
    // Safe: same key-to-type invariant as above.
    ;(this.listeners.get(event) as Set<Listener<GameEventMap[K]>> | undefined)?.delete(fn)
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    // Safe: same key-to-type invariant as above.
    ;(this.listeners.get(event) as Set<Listener<GameEventMap[K]>> | undefined)?.forEach((fn) =>
      fn(payload),
    )
  }
}

export const EventBus = new TypedEventBus()
