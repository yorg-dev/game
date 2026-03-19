import { useState, useEffect } from 'react'
import { ListBase } from 'ra-core'
import { EventBus } from '@/game/EventBus'
import { ExpertGrid } from './Grid'
import {
  GameDialog,
  GameDialogContent,
  GameDialogHeader,
  GameDialogTitle,
  GameDialogDescription,
} from '@/components/ui/game-dialog'

export function ExpertList() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    return EventBus.on('show-experts', () => setOpen(true))
  }, [])

  return (
    <GameDialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <GameDialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <GameDialogHeader className="pr-14">
          <GameDialogTitle>Experts Directory</GameDialogTitle>
          <GameDialogDescription>
            Find specialists who can help with your land.
          </GameDialogDescription>
        </GameDialogHeader>

        <ListBase
          resource="experts"
          perPage={100}
          sort={{ field: 'name', order: 'ASC' }}
          disableSyncWithLocation
        >
          <ExpertGrid />
        </ListBase>
      </GameDialogContent>
    </GameDialog>
  )
}
