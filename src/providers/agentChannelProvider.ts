// ---------------------------------------------------------------------------
// AgentChannelProvider
//
// A dedicated ActionCable client for AgentChannel.  Kept separate from
// wsProvider so the land multiplayer connection is never interrupted.
// ---------------------------------------------------------------------------

export interface VoiceCommandPayload {
  type: 'voice_command'
  agentId: string
  userId: number
  command: string
  transcript: string
}

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
  private handlers: Set<(msg: VoiceCommandPayload) => void> = new Set()

  connect(agentId: string): void {
    // Disconnect first if already connected to a different agent.
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      if (this.identifier === JSON.stringify({ channel: 'AgentChannel', agent_id: agentId })) return
      this.disconnect()
    }

    const url = resolveWsUrl()
    if (!url) return

    this.identifier = JSON.stringify({ channel: 'AgentChannel', agent_id: agentId })

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
        if (frame.type === 'ping') return
        if (frame.type === 'confirm_subscription') return
        if (frame.message?.type === 'voice_command') {
          this.handlers.forEach((fn) => fn(frame.message as VoiceCommandPayload))
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

  sendVoiceCommand(command: string, transcript: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    this.ws.send(
      JSON.stringify({
        command: 'message',
        identifier: this.identifier,
        data: JSON.stringify({ type: 'voice_command', command, transcript }),
      }),
    )
  }

  onVoiceCommand(handler: (msg: VoiceCommandPayload) => void): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
  }
}

export const agentChannelProvider = new AgentChannelProvider()
