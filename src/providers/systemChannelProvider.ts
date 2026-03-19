// ---------------------------------------------------------------------------
// SystemChannelProvider
//
// Subscribes to SystemChannel for admin-initiated broadcasts such as
// client reset commands. Kept as a singleton that connects once on boot.
// ---------------------------------------------------------------------------

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

class SystemChannelProvider {
  private ws: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 2000

  connect(): void {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) return

    const url = resolveWsUrl()
    if (!url) return

    try {
      this.ws = new WebSocket(url)
    } catch {
      this.scheduleReconnect()
      return
    }

    const identifier = JSON.stringify({ channel: 'SystemChannel' })

    this.ws.onopen = () => {
      this.reconnectDelay = 2000
      this.ws!.send(JSON.stringify({ command: 'subscribe', identifier }))
    }

    this.ws.onmessage = (e: MessageEvent) => {
      try {
        const frame = JSON.parse(e.data as string)
        if (
          frame.type === 'ping' ||
          frame.type === 'confirm_subscription' ||
          frame.type === 'welcome'
        )
          return
        if (frame.message?.type === 'reset') {
          this.handleReset()
        }
      } catch {
        // ignore malformed frames
      }
    }

    this.ws.onerror = () => this.ws?.close()
    this.ws.onclose = () => {
      this.ws = null
      this.scheduleReconnect()
    }
  }

  private handleReset(): void {
    console.info('[SystemChannel] Reset command received — clearing localStorage and reloading.')
    localStorage.clear()
    window.location.reload()
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000)
      this.connect()
    }, this.reconnectDelay)
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }
}

export const systemChannelProvider = new SystemChannelProvider()
