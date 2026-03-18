// ---------------------------------------------------------------------------
// ToolbarSlot — shared base button
// ---------------------------------------------------------------------------

interface ToolbarSlotProps {
  onClick?: () => void
  label?: string
  hotkey?: string
  active?: boolean
  children: React.ReactNode
}

function ToolbarSlot({ onClick, label, hotkey, active, children }: ToolbarSlotProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative flex items-center justify-center w-14 h-14 rounded-sm bg-[#c8974c] border-2 border-[#9a6b28] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#7a4e1a,2px_2px_0_0_#3a1e08] hover:brightness-110 active:shadow-[inset_0_-1px_0_0_#7a4e1a,inset_0_1px_0_0_#c8a060] transition-[filter,box-shadow] duration-75 cursor-pointer${active ? ' brightness-125 ring-2 ring-yellow-300/60' : ''}`}
    >
      {children}
      {hotkey && (
        <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-[#3a1e08]/60 leading-none select-none">
          {hotkey}
        </span>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Slot icons
// ---------------------------------------------------------------------------

function AgentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ imageRendering: 'pixelated' }}>
      <rect x="13" y="1" width="2" height="3" fill="#3a1e08" />
      <rect x="12" y="4" width="4" height="2" fill="#3a1e08" />
      <rect x="7" y="6" width="14" height="11" rx="1" fill="#3a1e08" />
      <rect x="8" y="7" width="12" height="9" fill="#c8e8f8" />
      <rect x="10" y="9" width="3" height="3" fill="#1a90d0" />
      <rect x="15" y="9" width="3" height="3" fill="#1a90d0" />
      <rect x="11" y="10" width="1" height="1" fill="#fff" />
      <rect x="16" y="10" width="1" height="1" fill="#fff" />
      <rect x="10" y="13" width="8" height="1" fill="#3a1e08" />
      <rect x="9" y="17" width="10" height="8" rx="1" fill="#3a1e08" />
      <rect x="10" y="18" width="8" height="6" fill="#7ab8d8" />
      <rect x="13" y="19" width="2" height="2" fill="#1a90d0" />
      <rect x="18" y="18" width="8" height="8" rx="2" fill="#4ade80" />
      <rect x="21" y="20" width="2" height="4" fill="#fff" />
      <rect x="19" y="22" width="6" height="2" fill="#fff" />
    </svg>
  )
}

function ConnectionIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="10" width="7" height="8" rx="1" fill="#3a1e08" />
      <rect x="3" y="11" width="5" height="6" fill="#f0a030" />
      <rect x="4" y="7" width="2" height="3" fill="#3a1e08" />
      <rect x="7" y="7" width="2" height="3" fill="#3a1e08" />
      <rect x="9" y="13" width="4" height="2" fill="#3a1e08" />
      <rect x="12" y="11" width="4" height="6" rx="1" fill="#3a1e08" />
      <rect x="13" y="12" width="2" height="4" fill="#c8974c" />
      <rect x="15" y="13" width="4" height="2" fill="#3a1e08" />
      <rect x="19" y="10" width="7" height="8" rx="1" fill="#3a1e08" />
      <rect x="20" y="11" width="5" height="6" fill="#f0a030" />
      <rect x="19" y="7" width="2" height="3" fill="#3a1e08" />
      <rect x="22" y="7" width="2" height="3" fill="#3a1e08" />
      <rect x="18" y="18" width="8" height="8" rx="2" fill="#4ade80" />
      <rect x="21" y="20" width="2" height="4" fill="#fff" />
      <rect x="19" y="22" width="6" height="2" fill="#fff" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ imageRendering: 'pixelated' }}>
      <rect x="9" y="4" width="10" height="10" fill="#3a1e08" />
      <rect x="10" y="5" width="8" height="8" fill="#f5c842" />
      <rect x="6" y="5" width="3" height="6" fill="#3a1e08" />
      <rect x="7" y="6" width="2" height="4" fill="#d4a020" />
      <rect x="19" y="5" width="3" height="6" fill="#3a1e08" />
      <rect x="19" y="6" width="2" height="4" fill="#d4a020" />
      <rect x="10" y="14" width="8" height="2" fill="#3a1e08" />
      <rect x="11" y="15" width="6" height="1" fill="#c89010" />
      <rect x="12" y="16" width="4" height="4" fill="#3a1e08" />
      <rect x="13" y="17" width="2" height="3" fill="#c89010" />
      <rect x="9" y="20" width="10" height="3" fill="#3a1e08" />
      <rect x="10" y="21" width="8" height="1" fill="#f5c842" />
      <rect x="13" y="8" width="2" height="2" fill="#fff8c0" />
      <rect x="12" y="9" width="4" height="1" fill="#fff8c0" />
    </svg>
  )
}

function ExpertsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="5" width="8" height="7" rx="1" fill="#3a1e08" />
      <rect x="4" y="6" width="6" height="5" fill="#f5c8a0" />
      <rect x="3" y="12" width="8" height="6" rx="1" fill="#3a1e08" />
      <rect x="4" y="13" width="6" height="4" fill="#5870c8" />
      <rect x="8" y="10" width="4" height="4" rx="1" fill="#f5c842" />
      <rect x="9" y="11" width="2" height="2" fill="#fff" />
      <rect x="10" y="3" width="8" height="8" rx="1" fill="#3a1e08" />
      <rect x="11" y="4" width="6" height="6" fill="#f5c8a0" />
      <rect x="10" y="11" width="8" height="7" rx="1" fill="#3a1e08" />
      <rect x="11" y="12" width="6" height="5" fill="#c85870" />
      <rect x="15" y="1" width="5" height="5" rx="1" fill="#f5c842" />
      <rect x="16" y="2" width="3" height="3" fill="#fff" />
      <rect x="17" y="2" width="1" height="3" fill="#f5c842" />
      <rect x="16" y="3" width="3" height="1" fill="#f5c842" />
      <rect x="17" y="5" width="8" height="7" rx="1" fill="#3a1e08" />
      <rect x="18" y="6" width="6" height="5" fill="#f5c8a0" />
      <rect x="17" y="12" width="8" height="6" rx="1" fill="#3a1e08" />
      <rect x="18" y="13" width="6" height="4" fill="#58c870" />
      <rect x="2" y="19" width="24" height="2" fill="#3a1e08" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// GameToolbar
// ---------------------------------------------------------------------------

interface GameToolbarProps {
  onAddAgent: () => void
  onAddConnection: () => void
  onLeaderboard: () => void
  onExperts: () => void
}

export function GameToolbar({ onAddAgent, onAddConnection, onLeaderboard, onExperts }: GameToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none">
      <div
        className="rounded-lg p-[5px]"
        style={{
          background: '#7c4a1e',
          boxShadow: 'inset 0 2px 0 0 #a0622a, inset 0 -3px 0 0 #4e2a0e, 0 4px 12px rgba(0,0,0,0.6)',
          border: '3px solid #3e1e08',
        }}
      >
        <div
          className="rounded px-3 py-2 flex items-center gap-2"
          style={{ background: '#4a2c14', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}
        >
          <ToolbarSlot onClick={onAddAgent} label="New Agent" hotkey="N">
            <AgentIcon />
          </ToolbarSlot>
          <ToolbarSlot onClick={onAddConnection} label="Add Connection" hotkey="C">
            <ConnectionIcon />
          </ToolbarSlot>
          <ToolbarSlot onClick={onLeaderboard} label="Leaderboard" hotkey="L">
            <TrophyIcon />
          </ToolbarSlot>
          <ToolbarSlot onClick={onExperts} label="Experts Directory" hotkey="X">
            <ExpertsIcon />
          </ToolbarSlot>
        </div>
      </div>
    </div>
  )
}
