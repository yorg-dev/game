import { useState, useEffect, useRef } from 'react'
import { voiceService } from '@/game/voice/voiceService'
import { agentChannelProvider } from '@/providers/agentChannelProvider'
import { EventBus } from '@/game/EventBus'
import { getActiveLand } from '@/providers/activeLand'

/**
 * Microphone button that listens for speech and sends it to the server via
 * AgentChannel.  Shows interim transcript as the user speaks.
 */
export function VoiceButton() {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const unsubsRef = useRef<Array<() => void>>([])

  useEffect(() => {
    if (!voiceService.isSupported()) return

    // Connect AgentChannel using the active land ID as the agent_id so all
    // agents on this land share the same voice command stream.
    agentChannelProvider.connect(getActiveLand().land.id)

    // Forward confirmed voice_command payloads to the EventBus so GameScene
    // can react identically to typed commands.
    const unsub = agentChannelProvider.onVoiceCommand((msg) => {
      EventBus.emit('voice-command', {
        agentId: msg.agentId,
        command: msg.command,
        transcript: msg.transcript,
        userId: msg.userId,
      })
    })

    unsubsRef.current.push(unsub)
    return () => {
      unsubsRef.current.forEach((fn) => fn())
      unsubsRef.current = []
      agentChannelProvider.disconnect()
    }
  }, [])

  // Reconnect when the active land changes.
  useEffect(() => {
    return EventBus.on('land-ready', ({ land }) => {
      agentChannelProvider.connect(land.id)
    })
  }, [])

  function toggleListening() {
    if (!voiceService.isSupported()) return

    if (listening) {
      voiceService.stop()
      setListening(false)
      setInterim('')
      return
    }

    setListening(true)

    const unsubInterim = voiceService.onInterim((text) => setInterim(text))
    const unsubFinal = voiceService.onFinal((text) => {
      setInterim('')
      setListening(false)
      if (text) agentChannelProvider.sendVoiceCommand(text, text)
      unsubInterim()
      unsubFinal()
    })

    voiceService.start()
  }

  if (!voiceService.isSupported()) return null

  return (
    <div className="relative flex items-center">
      <button
        onClick={toggleListening}
        title={listening ? 'Stop listening' : 'Voice command'}
        className={[
          'flex items-center justify-center w-9 h-9 rounded-md border transition-colors',
          listening
            ? 'bg-red-500/90 border-red-400 text-white animate-pulse'
            : 'bg-black/70 border-white/20 text-white/60 hover:text-white hover:bg-black/90',
        ].join(' ')}
      >
        <MicIcon />
      </button>

      {interim && (
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-black/80 border border-white/20 text-white/70 text-xs backdrop-blur-sm pointer-events-none">
          {interim}…
        </div>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  )
}
