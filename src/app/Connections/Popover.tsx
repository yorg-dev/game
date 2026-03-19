import { useState, useEffect } from 'react'
import { RecordContextProvider } from 'ra-core'
import { EventBus } from '@/game/EventBus'
import type { Connection } from '@/models/Connection'
import { ConnectionShow } from './Show'
import { GameDialog, GameDialogContent } from '@/components/ui/game-dialog'

export function ConnectionPopover() {
  const [connection, setConnection] = useState<Connection | null>(null)

  useEffect(() => {
    return EventBus.on('connection-clicked', ({ connection }) => {
      setConnection(connection)
    })
  }, [])

  return (
    <GameDialog open={!!connection} onOpenChange={(o) => !o && setConnection(null)}>
      <GameDialogContent className="max-w-sm">
        <RecordContextProvider value={connection ?? undefined}>
          <ConnectionShow />
        </RecordContextProvider>
      </GameDialogContent>
    </GameDialog>
  )
}
