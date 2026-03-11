import { ToolbarSlot } from './ToolbarSlot'

interface ExpertsSlotProps {
  onClick: () => void
}

function ExpertsIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Person 1 - left */}
      <rect x="3" y="5" width="8" height="7" rx="1" fill="#3a1e08" />
      <rect x="4" y="6" width="6" height="5" fill="#f5c8a0" />
      <rect x="3" y="12" width="8" height="6" rx="1" fill="#3a1e08" />
      <rect x="4" y="13" width="6" height="4" fill="#5870c8" />
      {/* Star badge on person 1 */}
      <rect x="8" y="10" width="4" height="4" rx="1" fill="#f5c842" />
      <rect x="9" y="11" width="2" height="2" fill="#fff" />

      {/* Person 2 - center (taller, highlighted) */}
      <rect x="10" y="3" width="8" height="8" rx="1" fill="#3a1e08" />
      <rect x="11" y="4" width="6" height="6" fill="#f5c8a0" />
      <rect x="10" y="11" width="8" height="7" rx="1" fill="#3a1e08" />
      <rect x="11" y="12" width="6" height="5" fill="#c85870" />
      {/* Star badge - center expert */}
      <rect x="15" y="1" width="5" height="5" rx="1" fill="#f5c842" />
      <rect x="16" y="2" width="3" height="3" fill="#fff" />
      <rect x="17" y="2" width="1" height="3" fill="#f5c842" />
      <rect x="16" y="3" width="3" height="1" fill="#f5c842" />

      {/* Person 3 - right */}
      <rect x="17" y="5" width="8" height="7" rx="1" fill="#3a1e08" />
      <rect x="18" y="6" width="6" height="5" fill="#f5c8a0" />
      <rect x="17" y="12" width="8" height="6" rx="1" fill="#3a1e08" />
      <rect x="18" y="13" width="6" height="4" fill="#58c870" />

      {/* Ground line */}
      <rect x="2" y="19" width="24" height="2" fill="#3a1e08" />
    </svg>
  )
}

export function ExpertsSlot({ onClick }: ExpertsSlotProps) {
  return (
    <ToolbarSlot onClick={onClick} label="Experts Directory" hotkey="X">
      <ExpertsIcon />
    </ToolbarSlot>
  )
}
