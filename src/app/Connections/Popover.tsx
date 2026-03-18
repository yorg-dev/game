import { useState, useEffect } from 'react'
import { RecordContextProvider } from 'ra-core'
import { EventBus } from '@/game/EventBus'
import type { Connection } from '@/models/Connection'
import { ConnectionShow } from './Show'

export function ConnectionPopover() {
  const [connection, setConnection] = useState<Connection | null>(null)

  useEffect(() => {
    return EventBus.on('connection-clicked', ({ connection }) => {
      setConnection(connection)
    })
  }, [])

  if (!connection) return null

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setConnection(null)}
    >
      <RecordContextProvider value={connection}>
        <div
          className="relative w-full max-w-sm bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
        >
          <button
            onClick={() => setConnection(null)}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] hover:brightness-110 transition-[filter]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M10 2L2 10M2 2l8 8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
              />
            </svg>
          </button>

          <ConnectionShow />
        </div>
      </RecordContextProvider>
    </div>
  )
}
