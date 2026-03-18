import { useState, useEffect, useRef } from 'react'
import { EventBus } from '@/game/EventBus'
import { VoiceButton } from './VoiceButton'

interface Ack {
  id: string
  agentName: string
  message: string
}

export function CommandBar() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [acks, setAcks] = useState<Ack[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when bar opens.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Keyboard shortcut: / opens the bar; Escape closes it.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key === '/' && !open) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Listen for acknowledgments and auto-dismiss them.
  useEffect(() => {
    return EventBus.on('command-acknowledged', ({ commandId, agentId, agentName }) => {
      const ack: Ack = {
        id: `${commandId}-${agentId}`,
        agentName,
        message: 'acknowledged',
      }
      setAcks((prev) => [...prev, ack])
      setTimeout(() => {
        setAcks((prev) => prev.filter((a) => a.id !== ack.id))
      }, 3500)
    })
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return

    EventBus.emit('command-issued', {
      id: `cmd_${Date.now()}`,
      text: trimmed,
    })

    setText('')
    setOpen(false)
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {/* Command bar */}
      <div
        className={`flex items-center gap-2 transition-all duration-200 pointer-events-auto ${open ? 'w-[480px]' : 'w-auto'}`}
      >
        {open ? (
          <form
            onSubmit={handleSubmit}
            className="flex w-full gap-2"
            onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
          >
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Issue a command to all Agents…"
              className="h-9 flex-1 px-3 rounded-md bg-black/80 border border-white/20 text-white text-sm placeholder:text-white/30 backdrop-blur-sm focus:outline-none focus:border-white/50"
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="shrink-0 h-9 px-3 rounded-md bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
            <button
              type="button"
              className="shrink-0 h-9 px-3 rounded-md text-white/50 hover:text-white hover:bg-white/10 text-sm transition-colors"
              onClick={() => setOpen(false)}
            >
              Esc
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-md bg-black/70 border border-white/20 text-white/60 text-xs hover:text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
            >
              <span className="font-mono text-white/40">&gt;_</span>
              Issue Command
              <kbd className="ml-1 text-[10px] text-white/30 font-mono">/</kbd>
            </button>
            <VoiceButton />
          </div>
        )}
      </div>

      {/* Acknowledgment chips */}
      {acks.length > 0 && (
        <div className="flex flex-col gap-1 items-center pointer-events-none">
          {acks.map((ack) => (
            <div
              key={ack.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-white/10 backdrop-blur-sm text-xs text-white/60"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              <span className="text-white/80 font-medium">{ack.agentName}</span>
              <span>{ack.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
