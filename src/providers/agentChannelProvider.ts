// ---------------------------------------------------------------------------
// AgentChannelProvider
//
// A dedicated ActionCable client for AgentChannel.  Kept separate from
// wsProvider so the land multiplayer connection is never interrupted.
//
// The channel identifier uses the agent's slug (not UUID) which matches
// what AgentChannel streams on: "yorg:agent:#{params[:agent_id]}"
// ---------------------------------------------------------------------------

// Server → client message types broadcast by CommandJob
export type AgentServerMessage =
  | { type: 'acknowledged'; agentId: string; transcript: string; timestamp: string }
  | { type: 'thinking'; agentId: string }
  | { type: 'result'; agentId: string; output: string; transcript: string; timestamp: string }
  | { type: 'error'; agentId: string; message: string; timestamp: string }
  | { type: 'tool_executing'; agentId: string; toolName: string }
  | { type: 'tool_executed'; agentId: string; toolName: string }
  | { type: 'tool_error'; agentId: string; toolName: string; message: string }

function resolveWsUrl(): string | null {
  const wsUrl = import.meta.env.VITE_WS_URL as string | undefined
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  const base: string | null = wsUrl
    ? wsUrl
    : apiUrl
      ? apiUrl.replace(/^http/, 'ws') + '/cable'
      : null
  if (!base) return null
  const token = localStorage.getItem('token')
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}

class AgentChannelProvider {
  private ws: WebSocket | null = null
  private identifier: string = ''
  private currentSlug: string = ''
  private messageHandlers: Set<(msg: AgentServerMessage) => void> = new Set()

  /** Connect (or re-connect) to the channel for the given agent slug. */
  connect(agentSlug: string): void {
    const newIdentifier = JSON.stringify({ channel: 'AgentChannel', agent_id: agentSlug })

    // Already connected to this agent — nothing to do.
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED && this.identifier === newIdentifier) {
      return
    }

    this.disconnect()

    const url = resolveWsUrl()
    if (!url) return

    this.identifier = newIdentifier
    this.currentSlug = agentSlug

    try {
      this.ws = new WebSocket(url)
    } catch {
      return
    }

    this.ws.onopen = () => {
      this.ws!.send(JSON.stringify({ command: 'subscribe', identifier: this.identifier }))
    }

    this.ws.onmessage = (e: MessageEvent) => {
      try {
        const frame = JSON.parse(e.data as string)
        if (frame.type === 'ping' || frame.type === 'confirm_subscription') return
        if (frame.message) {
          const msg = frame.message as AgentServerMessage
          this.messageHandlers.forEach((fn) => fn(msg))
        }
      } catch {
        // ignore malformed frames
      }
    }

    this.ws.onerror = () => this.ws?.close()
    this.ws.onclose = () => {
      this.ws = null
    }
  }

  /** Returns true if the message was sent, false if not connected. */
  sendVoiceCommand(command: string, transcript: string): boolean {
    return this.send({ type: 'voice_command', command, transcript })
  }

  /** Returns true if the message was sent, false if not connected. */
  sendChat(text: string): boolean {
    return this.send({ type: 'chat_message', text })
  }

  /** Subscribe to all server messages. Returns an unsubscribe function. */
  onMessage(handler: (msg: AgentServerMessage) => void): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  get slug(): string {
    return this.currentSlug
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
    this.identifier = ''
    this.currentSlug = ''
  }

  private send(data: object): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false
    this.ws.send(
      JSON.stringify({
        command: 'message',
        identifier: this.identifier,
        data: JSON.stringify(data),
      }),
    )
    return true
  }
}

export const agentChannelProvider = new AgentChannelProvider()
