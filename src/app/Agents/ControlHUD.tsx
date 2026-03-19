import { useState, useEffect } from 'react'
import { EventBus } from '@/game/EventBus'

export function ControlHUD() {
  const [agent, setAgent] = useState<{ id: number; name: string } | null>(null)

  useEffect(() => {
    return EventBus.on('controlled-agent-changed', (payload) => {
      setAgent(payload)
    })
  }, [])

  if (!agent) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-xl border-4 border-wood-700 bg-parchment-150 shadow-[inset_0_0_0_3px_var(--color-parchment-50)]">
      <span className="text-xs font-bold text-wood-700 uppercase tracking-widest">Controlling</span>
      <span className="text-sm font-bold text-soil-800">{agent.name}</span>
      <button
        onClick={() => EventBus.emit('release-agent', undefined)}
        className="px-2 py-0.5 rounded-lg border-2 border-wood-700 bg-wood-500 shadow-[inset_0_2px_0_0_var(--color-wood-300),inset_0_-3px_0_0_var(--color-wood-900)] text-xs font-bold text-soil-800 hover:brightness-110 transition-[filter]"
      >
        Release
      </button>
    </div>
  )
}
