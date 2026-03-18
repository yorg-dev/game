import { useState, useEffect } from 'react'
import { ListBase } from 'ra-core'
import { EventBus } from '@/game/EventBus'
import { ExpertGrid } from './Grid'

export function ExpertList() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    return EventBus.on('show-experts', () => setOpen(true))
  }, [])

  if (!open) return null

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setOpen(false)}
    >
      <ListBase
        resource="experts"
        perPage={100}
        sort={{ field: 'name', order: 'ASC' }}
        disableSyncWithLocation
      >
        <div
          className="relative flex flex-col w-full max-w-xl bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
          style={{ maxHeight: '85vh' }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
        >
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
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

          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b-4 border-[#7a5230] bg-[#dcc898] pr-14 shrink-0">
            <h2 className="text-[#3d2010] font-bold text-base">Experts Directory</h2>
            <p className="text-xs text-[#7a5230] mt-0.5">
              Find specialists who can help with your land.
            </p>
          </div>

          <ExpertGrid />
        </div>
      </ListBase>
    </div>
  )
}
