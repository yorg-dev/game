import type { Direction } from '@/game/entities/Character'
import type { Connection } from '@/models/Connection'

// ---------------------------------------------------------------------------
// Shared types used by both client and server messages
// ---------------------------------------------------------------------------

export type WsStatus = 'idle' | 'connecting' | 'connected' | 'disconnected'

export interface PlayerState {
  userId: string
  playerId: string
  socketId: string
  name: string
  x: number
  y: number
  facing: Direction
  moving: boolean
}

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

export type ServerMessage =
  | { type: 'welcome'; playerId: string }
  | { type: 'players'; players: PlayerState[] }
  | {
      type: 'join'
      userId: string
      playerId: string
      socketId: string
      name: string
      x: number
      y: number
      facing: Direction
      moving: boolean
    }
  | {
      type: 'move'
      userId: string
      playerId: string
      x: number
      y: number
      facing: Direction
      moving: boolean
    }
  | { type: 'leave'; userId: string; playerId: string | null }
  | { type: 'placement-added'; worldX: number; worldY: number; connection: Connection }
  | { type: 'placement-removed'; connectionId: string }
  | { type: 'placement-moved'; connectionId: string; worldX: number; worldY: number }
  | {
      type: 'agent-added'
      networkId: string
      name: string
      templateId: string
      x: number
      y: number
    }
  | {
      type: 'agent-moved'
      networkId: string
      x: number
      y: number
      facing: Direction
      moving: boolean
    }
  | { type: 'agent-removed'; networkId: string }
  | { type: 'pong' }
  | { type: 'chat-message'; scope: 'world' | 'land'; authorName: string; text: string; ts: number }

export type ClientMessage =
  | {
      type: 'join'
      playerId: string
      socketId: string
      name: string
      x: number
      y: number
      facing: Direction
    }
  | { type: 'move'; x: number; y: number; facing: Direction; moving: boolean }
  | { type: 'leave' }
  | { type: 'chat'; scope: 'world' | 'land'; text: string; authorName: string }
  | { type: 'placement-added'; worldX: number; worldY: number; connection: Connection }
  | { type: 'placement-removed'; connectionId: string }
  | { type: 'placement-moved'; connectionId: string; worldX: number; worldY: number }
  | {
      type: 'agent-added'
      networkId: string
      name: string
      templateId: string
      x: number
      y: number
    }
  | {
      type: 'agent-moved'
      networkId: string
      x: number
      y: number
      facing: Direction
      moving: boolean
    }
  | { type: 'agent-removed'; networkId: string }

// ---------------------------------------------------------------------------
// Internal handler map
// ---------------------------------------------------------------------------

type HandlerSet<M extends ServerMessage> = Set<(msg: M) => void>
type HandlerMap = {
  [K in ServerMessage['type']]?: HandlerSet<Extract<ServerMessage, { type: K }>>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RECONNECT_DELAYS = [1_000, 2_000, 4_000, 8_000, 16_000]

// ---------------------------------------------------------------------------
// WsProvider
// ---------------------------------------------------------------------------

class WsProvider {
  private ws: WebSocket | null = null
  private url: string = ''
  private identifier: string = ''
  private handlers: HandlerMap = {}
  private statusListeners: Set<(s: WsStatus) => void> = new Set()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private attempt = 0
  private closing = false

  status: WsStatus = 'idle'

  // ── Public API ────────────────────────────────────────────────────────────

  connect(url: string, channel: string, params: Record<string, string> = {}): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    )
      return

    this.url = url
    this.identifier = JSON.stringify({ channel, ...params })
    this.closing = false
    this.attempt = 0
    this.open()
  }

  /** Disconnect and reconnect, rebuilding the URL (e.g. to pick up a new token). */
  reconnect(url: string, channel: string, params: Record<string, string> = {}): void {
    this.disconnect()
    this.connect(url, channel, params)
  }

  /** Switch to a different channel on an already-open connection. */
  subscribe(channel: string, params: Record<string, string> = {}): void {
    const newIdentifier = JSON.stringify({ channel, ...params })
    if (this.identifier === newIdentifier) return

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command: 'unsubscribe', identifier: this.identifier }))
      this.identifier = newIdentifier
      this.ws.send(JSON.stringify({ command: 'subscribe', identifier: this.identifier }))
      this.setStatus('connecting')
    } else {
      this.identifier = newIdentifier
    }
  }

  disconnect(): void {
    this.closing = true
    this.clearTimers()
    this.ws?.close()
    this.ws = null
    this.setStatus('disconnected')
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          command: 'message',
          identifier: this.identifier,
          data: JSON.stringify(msg),
        }),
      )
    }
  }

  /** Subscribe to a typed server message. Returns an unsubscribe function. */
  on<K extends ServerMessage['type']>(
    type: K,
    handler: (msg: Extract<ServerMessage, { type: K }>) => void,
  ): () => void {
    if (!this.handlers[type]) {
      ;(this.handlers as any)[type] = new Set()
    }
    ;(this.handlers[type] as HandlerSet<any>).add(handler)
    return () => (this.handlers[type] as HandlerSet<any> | undefined)?.delete(handler)
  }

  /** Subscribe to connection status changes. Returns an unsubscribe function. */
  onStatus(cb: (s: WsStatus) => void): () => void {
    this.statusListeners.add(cb)
    return () => this.statusListeners.delete(cb)
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private open(): void {
    this.setStatus('connecting')
    try {
      this.ws = new WebSocket(this.url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this.attempt = 0
      // ActionCable: subscribe to the channel before declaring connected
      this.ws!.send(JSON.stringify({ command: 'subscribe', identifier: this.identifier }))
    }

    this.ws.onmessage = (e: MessageEvent) => {
      try {
        const frame = JSON.parse(e.data as string)

        // ActionCable control frames
        if (frame.type === 'welcome') return // subscribe was already sent in onopen
        if (frame.type === 'ping') return // server heartbeat — ignore
        if (frame.type === 'disconnect') {
          this.ws?.close()
          return
        }
        if (frame.type === 'confirm_subscription') {
          console.log('[WS] subscribed to', this.identifier)
          this.setStatus('connected')
          return
        }
        if (frame.type === 'reject_subscription') {
          console.error('[WS] subscription rejected')
          return
        }

        // ActionCable application message: { identifier, message: {...} }
        if (frame.message) {
          const msg = frame.message as ServerMessage
          console.log('[WS] message received:', msg.type, msg)
          ;(this.handlers[msg.type] as HandlerSet<any> | undefined)?.forEach((fn) => fn(msg))
        }
      } catch {
        // ignore malformed frames
      }
    }

    this.ws.onclose = () => {
      this.clearTimers()
      if (!this.closing) {
        this.setStatus('disconnected')
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      // onclose fires immediately after — let it handle reconnect
      this.ws?.close()
    }
  }

  private scheduleReconnect(): void {
    const delay = RECONNECT_DELAYS[Math.min(this.attempt, RECONNECT_DELAYS.length - 1)]
    this.attempt++
    this.reconnectTimer = setTimeout(() => this.open(), delay)
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private setStatus(s: WsStatus): void {
    this.status = s
    this.statusListeners.forEach((fn) => fn(s))
  }
}

export const wsProvider = new WsProvider()
