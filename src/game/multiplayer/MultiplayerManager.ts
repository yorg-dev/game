import Phaser from 'phaser'
import { wsProvider } from '@/providers/wsProvider'
import { RemotePlayer } from '../entities/RemotePlayer'
import type { Direction } from '../entities/Character'
import type { PlayerState } from '@/providers/wsProvider'
import { EventBus } from '@/game/EventBus'
import authProvider from '@/providers/authProvider'
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive WebSocket URL from the API URL when VITE_WS_URL is not set. */
function resolveWsUrl(): string | null {
  const wsUrl = import.meta.env.VITE_WS_URL as string | undefined
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  const base: string | null = wsUrl
    ? wsUrl
    : apiUrl
      ? apiUrl.replace(/^http/, 'ws') + '/cable'
      : null

  if (!base) return null

  const token = authProvider.getToken()
  if (!token) return base

  return `${base}?token=${encodeURIComponent(token)}`
}

/**
 * Derive player identity for this tab.
 *
 * A per-tab suffix is always appended so two tabs logged in as the same
 * user get distinct playerIds — without it each tab filters the other out
 * as "self" and remote players never appear.
 */
function getLocalIdentity(): { playerId: string; name: string } {
  // Stable tab ID — survives hot-reload within a tab but differs across tabs
  let tabId = sessionStorage.getItem('tabId')
  if (!tabId) {
    tabId = Math.random().toString(36).slice(2, 8)
    sessionStorage.setItem('tabId', tabId)
  }

  const user = authProvider.getCurrentUser()
  if (user) {
    const userId = String(user.id ?? user.email ?? 'unknown')
    const name = user.email ? (user.email as string).split('@')[0] : userId.slice(0, 8)
    return { playerId: `${userId}:${tabId}`, name }
  }

  // Guest / anonymous
  return { playerId: `guest-${tabId}`, name: `guest-${tabId}` }
}

// ---------------------------------------------------------------------------
// MultiplayerManager
// ---------------------------------------------------------------------------

const SEND_INTERVAL_MS = 100 // broadcast position at most 10×/s
const MIN_MOVE_PX = 1 // min change in px before we bother sending

export class MultiplayerManager {
  private scene: Phaser.Scene
  private remotePlayers: Map<string, RemotePlayer> = new Map()
  private unsubs: Array<() => void> = []
  private localId = ''
  private localName = ''
  private localSocketId = '' // fresh random ID per WS connection
  private currentLandId = ''

  // Bidirectional maps to match networkId (stable, cross-client) ↔ local Agent id
  private networkToLocal: Map<string, number> = new Map()
  private localToNetwork: Map<number, string> = new Map()
  // networkIds of agents spawned by a remote client — position comes from WS, not local wander
  private remoteAgents: Set<string> = new Set()

  // Agent position throttle state (mirrors player throttle)
  private lastAgentSent: Map<string, { x: number; y: number; time: number }> = new Map()

  // Current player position — updated each tick, used for join messages
  private currentX: number = 0
  private currentY: number = 0
  private currentFacing: Direction = 'down'

  // throttle state
  private lastSentX = -9999
  private lastSentY = -9999
  private lastSentFacing: Direction = 'down'
  private lastSentTime = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  private sendJoin(): void {
    this.localSocketId = Math.random().toString(36).slice(2, 10)
    wsProvider.send({
      type: 'join',
      playerId: this.localId,
      socketId: this.localSocketId,
      name: this.localName,
      x: this.currentX,
      y: this.currentY,
      facing: this.currentFacing,
    })
  }

  /**
   * Connect to the WebSocket server and announce the local player.
   * Safe to call even when WS_URL is not configured — becomes a no-op.
   */
  init(x: number, y: number, facing: Direction, landId: string): void {
    const wsUrl = resolveWsUrl()
    if (!wsUrl) return

    const { playerId, name } = getLocalIdentity()
    this.localId = playerId
    this.localName = name
    this.currentLandId = landId
    this.currentX = x
    this.currentY = y
    this.currentFacing = facing
    console.log('[MP] init — localId:', playerId, 'land:', landId)

    // Subscribe to server messages
    this.unsubs.push(
      wsProvider.on('players', (msg) => this.onWorldState(msg.players)),
      wsProvider.on('join', (msg) => this.onJoin(msg)),
      wsProvider.on('move', (msg) => this.onMoved(msg)),
      wsProvider.on('leave', (msg) => this.onLeave(msg.playerId)),
      wsProvider.on('placement-added', (msg) => {
        console.log('[MP] placement-added received:', msg)
        EventBus.emit('add-connection', {
          connectionId: msg.connection.id,
          appId: msg.connection.appId,
          worldX: msg.worldX,
          worldY: msg.worldY,
          connection: msg.connection,
          remote: true,
        })
      }),
      wsProvider.on('placement-removed', (msg) => {
        EventBus.emit('remove-connection', { connectionId: msg.connectionId })
      }),
      wsProvider.on('placement-moved', (msg) => {
        EventBus.emit('move-connection', {
          connectionId: msg.connectionId,
          worldX: msg.worldX,
          worldY: msg.worldY,
        })
      }),
      wsProvider.on('agent-added', (msg) => {
        EventBus.emit('spawn-agent', {
          templateId: msg.templateId,
          name: msg.name,
          x: msg.x,
          y: msg.y,
          networkId: msg.networkId,
          remote: true,
        })
      }),
      wsProvider.on('agent-moved', (msg) => {
        const localId = this.networkToLocal.get(msg.networkId)
        if (localId !== undefined) {
          EventBus.emit('agent-remote-moved', {
            localId,
            x: msg.x,
            y: msg.y,
            facing: msg.facing,
            moving: msg.moving,
          })
        }
      }),
      wsProvider.on('agent-removed', (msg) => {
        const localId = this.networkToLocal.get(msg.networkId)
        if (localId !== undefined) {
          EventBus.emit('remove-agent', { id: localId })
        }
      }),
    )

    // Announce ourselves whenever we (re-)connect or subscribe to a new channel
    this.unsubs.push(
      wsProvider.onStatus((status) => {
        console.log('[MP] WS status:', status)
        if (status === 'connected') {
          this.sendJoin()
        }
      }),
    )

    // Resubscribe when the user switches to a different land; clear stale remote players
    this.unsubs.push(
      EventBus.on('land-ready', ({ land }) => {
        if (land.id === this.currentLandId) return
        this.currentLandId = land.id
        // Clear remote players and agent maps from the old land
        for (const rp of this.remotePlayers.values()) rp.destroy()
        this.remotePlayers.clear()
        this.networkToLocal.clear()
        this.localToNetwork.clear()
        this.remoteAgents.clear()
        this.lastAgentSent.clear()
        wsProvider.subscribe('LandChannel', { land_id: land.id })
      }),
    )

    // Reconnect with auth token once the session is established
    this.unsubs.push(
      EventBus.on('session-ready', () => {
        const freshUrl = resolveWsUrl()
        if (!freshUrl) return
        wsProvider.reconnect(freshUrl, 'LandChannel', { land_id: this.currentLandId })
      }),
    )

    wsProvider.connect(wsUrl, 'LandChannel', { land_id: landId })

    // If already connected (e.g. hot-reload)
    if (wsProvider.status === 'connected') {
      this.sendJoin()
    }
  }

  /**
   * Called every game frame. Throttles outgoing position broadcasts and
   * interpolates all remote player sprites toward their latest positions.
   */
  tick(x: number, y: number, facing: Direction, moving: boolean): void {
    // Always track current position so join messages use up-to-date coordinates
    this.currentX = x
    this.currentY = y
    this.currentFacing = facing

    const now = Date.now()
    const moved =
      Math.abs(x - this.lastSentX) > MIN_MOVE_PX ||
      Math.abs(y - this.lastSentY) > MIN_MOVE_PX ||
      facing !== this.lastSentFacing

    if (moved && now - this.lastSentTime >= SEND_INTERVAL_MS) {
      wsProvider.send({ type: 'move', x, y, facing, moving })
      this.lastSentX = x
      this.lastSentY = y
      this.lastSentFacing = facing
      this.lastSentTime = now
    }

    for (const rp of this.remotePlayers.values()) {
      rp.tick()
    }
  }

  /** True if a networkId is already registered (used to deduplicate echo-back). */
  hasAgent(networkId: string): boolean {
    return this.networkToLocal.has(networkId)
  }

  isRemoteAgent(networkId: string): boolean {
    return this.remoteAgents.has(networkId)
  }

  /** Called by GameScene after spawning an agent so networkId↔localId are tracked. */
  registerAgent(networkId: string, localId: number, isRemote = false): void {
    this.networkToLocal.set(networkId, localId)
    this.localToNetwork.set(localId, networkId)
    if (isRemote) this.remoteAgents.add(networkId)
  }

  /** Called by GameScene when an agent is removed locally. */
  unregisterAgent(localId: number): void {
    const networkId = this.localToNetwork.get(localId)
    if (networkId) {
      this.networkToLocal.delete(networkId)
      this.localToNetwork.delete(localId)
      this.remoteAgents.delete(networkId)
      this.lastAgentSent.delete(networkId)
    }
  }

  /**
   * Called every game frame by GameScene with each agent's current state.
   * Broadcasts position for owner-spawned agents at most 10×/s.
   */
  tickAgents(
    agents: Array<{ localId: number; x: number; y: number; facing: Direction; moving: boolean }>,
  ): void {
    const now = Date.now()
    for (const a of agents) {
      const networkId = this.localToNetwork.get(a.localId)
      if (!networkId || this.remoteAgents.has(networkId)) continue // skip remote agents

      const last = this.lastAgentSent.get(networkId)
      const moved =
        !last || Math.abs(a.x - last.x) > MIN_MOVE_PX || Math.abs(a.y - last.y) > MIN_MOVE_PX

      if (moved && now - (last?.time ?? 0) >= SEND_INTERVAL_MS) {
        wsProvider.send({
          type: 'agent-moved',
          networkId,
          x: a.x,
          y: a.y,
          facing: a.facing,
          moving: a.moving,
        })
        this.lastAgentSent.set(networkId, { x: a.x, y: a.y, time: now })
      }
    }
  }

  broadcastAgentAdded(
    networkId: string,
    name: string,
    templateId: string,
    x: number,
    y: number,
  ): void {
    wsProvider.send({ type: 'agent-added', networkId, name, templateId, x, y })
  }

  broadcastAgentRemoved(localId: number): void {
    const networkId = this.localToNetwork.get(localId)
    if (networkId) wsProvider.send({ type: 'agent-removed', networkId })
  }

  broadcastPlacementAdded(
    connection: import('@/models/Connection').Connection,
    worldX: number,
    worldY: number,
  ): void {
    wsProvider.send({ type: 'placement-added', worldX, worldY, connection })
  }

  broadcastPlacementRemoved(connectionId: string): void {
    wsProvider.send({ type: 'placement-removed', connectionId })
  }

  broadcastPlacementMoved(connectionId: string, worldX: number, worldY: number): void {
    wsProvider.send({ type: 'placement-moved', connectionId, worldX, worldY })
  }

  /** Clean up subscriptions, sprites, and announce departure. */
  destroy(): void {
    wsProvider.send({ type: 'leave' })
    for (const unsub of this.unsubs) unsub()
    this.unsubs = []
    for (const rp of this.remotePlayers.values()) rp.destroy()
    this.remotePlayers.clear()
  }

  // ── Message handlers ──────────────────────────────────────────────────────

  private onWorldState(players: PlayerState[]): void {
    console.log(
      '[MP] players snapshot:',
      players.map((p) => p.playerId),
    )

    const incoming = new Set(players.map((p) => p.playerId))

    // Remove any remote player not present in the fresh snapshot (stale / disconnected)
    for (const [id, rp] of this.remotePlayers) {
      if (!incoming.has(id)) {
        rp.destroy()
        this.remotePlayers.delete(id)
      }
    }

    for (const p of players) {
      if (p.playerId === this.localId) continue
      this.upsert(p)
    }
  }

  private onJoin(p: PlayerState): void {
    console.log(
      '[MP] join:',
      p.playerId,
      p.playerId === this.localId ? '(self, ignoring)' : '(remote)',
    )
    if (p.playerId === this.localId) return
    this.upsert(p)
  }

  private onLeave(playerId: string | null | undefined): void {
    if (!playerId) return
    console.log('[MP] player-left:', playerId)
    const rp = this.remotePlayers.get(playerId)
    if (rp) {
      rp.destroy()
      this.remotePlayers.delete(playerId)
    }
  }

  private onMoved(msg: {
    userId: string
    playerId: string
    x: number
    y: number
    facing: Direction
    moving: boolean
  }): void {
    this.remotePlayers.get(msg.playerId)?.moveTo(msg.x, msg.y, msg.facing, msg.moving)
  }

  private upsert(p: PlayerState): void {
    const existing = this.remotePlayers.get(p.playerId)
    if (existing) {
      existing.moveTo(p.x, p.y, p.facing, p.moving)
    } else {
      const rp = new RemotePlayer(this.scene, p.x, p.y, p.name, p.facing)
      this.remotePlayers.set(p.playerId, rp)
    }
  }
}
