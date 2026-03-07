import { ToolbarSlot } from './ToolbarSlot'

interface AddConnectionSlotProps {
  onClick: () => void
}

function ConnectionIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Left plug body */}
      <rect x="2" y="10" width="7" height="8" rx="1" fill="#3a1e08"/>
      <rect x="3" y="11" width="5" height="6" fill="#f0a030"/>
      {/* Left prongs */}
      <rect x="4" y="7" width="2" height="3" fill="#3a1e08"/>
      <rect x="7" y="7" width="2" height="3" fill="#3a1e08"/>
      {/* Left cable */}
      <rect x="9" y="13" width="4" height="2" fill="#3a1e08"/>
      {/* Chain link */}
      <rect x="12" y="11" width="4" height="6" rx="1" fill="#3a1e08"/>
      <rect x="13" y="12" width="2" height="4" fill="#c8974c"/>
      {/* Right cable */}
      <rect x="15" y="13" width="4" height="2" fill="#3a1e08"/>
      {/* Right plug body */}
      <rect x="19" y="10" width="7" height="8" rx="1" fill="#3a1e08"/>
      <rect x="20" y="11" width="5" height="6" fill="#f0a030"/>
      {/* Right prongs */}
      <rect x="19" y="7" width="2" height="3" fill="#3a1e08"/>
      <rect x="22" y="7" width="2" height="3" fill="#3a1e08"/>
      {/* Plus badge */}
      <rect x="18" y="18" width="8" height="8" rx="2" fill="#4ade80"/>
      <rect x="21" y="20" width="2" height="4" fill="#fff"/>
      <rect x="19" y="22" width="6" height="2" fill="#fff"/>
    </svg>
  )
}

export function AddConnectionSlot({ onClick }: AddConnectionSlotProps) {
  return (
    <ToolbarSlot onClick={onClick} label="Add Connection" hotkey="C">
      <ConnectionIcon />
    </ToolbarSlot>
  )
}
