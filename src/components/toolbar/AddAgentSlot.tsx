import { ToolbarSlot } from './ToolbarSlot'

interface AddAgentSlotProps {
  onClick: () => void
}

function AgentIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Antenna */}
      <rect x="13" y="1" width="2" height="3" fill="#3a1e08" />
      <rect x="12" y="4" width="4" height="2" fill="#3a1e08" />
      {/* Head */}
      <rect x="7" y="6" width="14" height="11" rx="1" fill="#3a1e08" />
      <rect x="8" y="7" width="12" height="9" fill="#c8e8f8" />
      {/* Eyes */}
      <rect x="10" y="9" width="3" height="3" fill="#1a90d0" />
      <rect x="15" y="9" width="3" height="3" fill="#1a90d0" />
      <rect x="11" y="10" width="1" height="1" fill="#fff" />
      <rect x="16" y="10" width="1" height="1" fill="#fff" />
      {/* Mouth */}
      <rect x="10" y="13" width="8" height="1" fill="#3a1e08" />
      {/* Body */}
      <rect x="9" y="17" width="10" height="8" rx="1" fill="#3a1e08" />
      <rect x="10" y="18" width="8" height="6" fill="#7ab8d8" />
      {/* Chest light */}
      <rect x="13" y="19" width="2" height="2" fill="#1a90d0" />
      {/* Plus badge */}
      <rect x="18" y="18" width="8" height="8" rx="2" fill="#4ade80" />
      <rect x="21" y="20" width="2" height="4" fill="#fff" />
      <rect x="19" y="22" width="6" height="2" fill="#fff" />
    </svg>
  )
}

export function AddAgentSlot({ onClick }: AddAgentSlotProps) {
  return (
    <ToolbarSlot onClick={onClick} label="New Agent" hotkey="N">
      <AgentIcon />
    </ToolbarSlot>
  )
}
