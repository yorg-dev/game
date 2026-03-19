import { useNavigate } from 'react-router'
import { ListBase, ResourceContextProvider, useTranslate } from 'ra-core'
import { Plus } from 'lucide-react'
import {
  GameDialog,
  GameDialogContent,
  GameDialogHeader,
  GameDialogTitle,
  gameBtn,
} from '@/components/ui/game-dialog'
import ConnectionGrid from './Grid'

export function ConnectionListModal() {
  const navigate = useNavigate()
  const translate = useTranslate()

  return (
    <GameDialog open onOpenChange={(o) => !o && navigate('/')}>
      <GameDialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <GameDialogHeader className="flex-row flex items-center justify-between pr-14">
          <GameDialogTitle>
            {translate('resources.connections.name', { smart_count: 2, _: 'Connections' })}
          </GameDialogTitle>
          <button onClick={() => navigate('/connections/create')} className={gameBtn + ' text-xs'}>
            <Plus className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
            {translate('blaq.connections.actions.create', { _: 'New Connection' })}
          </button>
        </GameDialogHeader>

        <div className="overflow-y-auto flex-1 p-5">
          <ResourceContextProvider value="connections">
            <ListBase disableSyncWithLocation perPage={50} sort={{ field: 'name', order: 'ASC' }}>
              <ConnectionGrid />
            </ListBase>
          </ResourceContextProvider>
        </div>
      </GameDialogContent>
    </GameDialog>
  )
}
