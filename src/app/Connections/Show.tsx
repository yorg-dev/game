import { useRecordContext } from 'ra-core'
import type { Connection } from '@/models/Connection'
import {
  GameDialogHeader,
  GameDialogTitle,
  GameDialogDescription,
} from '@/components/ui/game-dialog'

const STATUS_COLOR: Record<string, string> = {
  connected: 'bg-emerald-600',
  disconnected: 'bg-wood-600',
  expired: 'bg-amber-600',
  error: 'bg-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  expired: 'Expired',
  error: 'Error',
}

export function ConnectionShow() {
  const connection = useRecordContext<Connection>()
  if (!connection) return null

  const displayName = connection.label || connection.app_id

  return (
    <>
      <GameDialogHeader className="pr-14">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-base font-bold border-2 border-wood-600 bg-parchment-150 text-wood-700">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <GameDialogTitle>{displayName}</GameDialogTitle>
            <GameDialogDescription className="font-mono">{connection.app_id}</GameDialogDescription>
          </div>
        </div>
      </GameDialogHeader>

      <div className="flex flex-col gap-4 px-5 py-5">
        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5 rounded-lg bg-parchment-250 border-2 border-wood-600 px-3 py-2.5">
            <span className="text-[10px] font-bold text-wood-700 uppercase tracking-widest">
              Status
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLOR[connection.status] ?? 'bg-wood-600'}`}
              />
              <span className="text-sm font-bold text-soil-800">
                {STATUS_LABEL[connection.status] ?? connection.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg bg-parchment-250 border-2 border-wood-600 px-3 py-2.5">
            <span className="text-[10px] font-bold text-wood-700 uppercase tracking-widest">
              App ID
            </span>
            <span className="text-sm font-bold text-soil-800 font-mono truncate">
              {connection.app_id}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t-2 border-parchment-500">
          <span className="text-xs text-wood-700">
            Connected {new Date(connection.connected_at).toLocaleDateString()}
          </span>
          {connection.last_used_at && (
            <span className="text-xs text-wood-700">
              Used {new Date(connection.last_used_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </>
  )
}
