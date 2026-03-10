import { AddAgentSlot } from './AddAgentSlot'
import { AddConnectionSlot } from './AddConnectionSlot'

interface GameToolbarProps {
  onAddAgent: () => void
  onAddConnection: () => void
}

export function GameToolbar({ onAddAgent, onAddConnection }: GameToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none">
      {/* Outer wood frame */}
      <div
        className="rounded-lg p-[5px]"
        style={{
          background: '#7c4a1e',
          boxShadow:
            'inset 0 2px 0 0 #a0622a, inset 0 -3px 0 0 #4e2a0e, 0 4px 12px rgba(0,0,0,0.6)',
          border: '3px solid #3e1e08',
        }}
      >
        {/* Inner dark wood trough */}
        <div
          className="rounded px-3 py-2 flex items-center gap-2"
          style={{
            background: '#4a2c14',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          <AddAgentSlot onClick={onAddAgent} />
          <AddConnectionSlot onClick={onAddConnection} />
        </div>
      </div>
    </div>
  )
}
