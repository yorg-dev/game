import { useState, useEffect } from 'react'
import { EventBus } from '../game/EventBus'
import { getApp } from '@/mocks/apps'
import type { App } from '@/models/App'
import type { Connection } from '@/models/Connection'

interface Selected {
  app:        App
  connection: Connection
}

const STATUS_COLOR: Record<string, string> = {
  connected:    'bg-emerald-600',
  disconnected: 'bg-[#9a6b28]',
  expired:      'bg-amber-600',
  error:        'bg-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  connected:    'Connected',
  disconnected: 'Disconnected',
  expired:      'Expired',
  error:        'Error',
}

export function ConnectionPopover() {
  const [selected, setSelected] = useState<Selected | null>(null)

  useEffect(() => {
    const unsub = EventBus.on('connection-clicked', ({ appId, connection }) => {
      const app = getApp(appId)
      if (!app) return
      setSelected({ app, connection })
    })
    return unsub
  }, [])

  if (!selected) return null
  const { app, connection } = selected

  return (
    <div data-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
      <div
        className="relative w-full max-w-sm bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.nativeEvent.stopImmediatePropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setSelected(null)}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] hover:brightness-110 transition-[filter]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M10 2L2 10M2 2l8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"/>
          </svg>
        </button>

        {/* Coloured top band */}
        <div className="h-2 w-full shrink-0" style={{ background: app.color }} />

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-5">

          {/* Identity */}
          <div className="flex items-center gap-4 pr-10">
            <div
              className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-xl font-bold border-2 border-[#9a6b28]"
              style={{ background: app.color + '33', color: app.color }}
            >
              {app.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#3d2010] leading-tight">{app.name}</h2>
              <p className="text-sm text-[#7a5230] mt-0.5">{connection.label}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-[#5a3810] leading-relaxed border-2 border-[#9a6b28] bg-[#dcc898] rounded-lg px-3 py-2">
            {app.description}
          </p>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5 rounded-lg bg-[#dcc898] border-2 border-[#9a6b28] px-3 py-2.5">
              <span className="text-[10px] font-bold text-[#7a5230] uppercase tracking-widest">Status</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLOR[connection.status] ?? 'bg-[#9a6b28]'}`} />
                <span className="text-sm font-bold text-[#3d2010]">
                  {STATUS_LABEL[connection.status] ?? connection.status}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg bg-[#dcc898] border-2 border-[#9a6b28] px-3 py-2.5">
              <span className="text-[10px] font-bold text-[#7a5230] uppercase tracking-widest">Auth</span>
              <span className="text-sm font-bold text-[#3d2010] font-mono">{app.authType}</span>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5 rounded-lg bg-[#dcc898] border-2 border-[#9a6b28] px-3 py-2.5">
              <span className="text-[10px] font-bold text-[#7a5230] uppercase tracking-widest">Category</span>
              <span className="text-xs bg-[#c8b07a] border border-[#9a6b28] text-[#3d2010] font-bold px-2 py-0.5 rounded w-fit capitalize">
                {app.category}
              </span>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between pt-1 border-t-2 border-[#b8955a]">
            <span className="text-xs text-[#7a5230]">
              Connected {new Date(connection.connectedAt).toLocaleDateString()}
            </span>
            {connection.lastUsedAt && (
              <span className="text-xs text-[#7a5230]">
                Used {new Date(connection.lastUsedAt).toLocaleDateString()}
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
