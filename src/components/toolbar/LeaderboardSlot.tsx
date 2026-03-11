import { ToolbarSlot } from './ToolbarSlot'

interface LeaderboardSlotProps {
  onClick: () => void
}

function TrophyIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Cup body */}
      <rect x="9" y="4" width="10" height="10" fill="#3a1e08" />
      <rect x="10" y="5" width="8" height="8" fill="#f5c842" />
      {/* Handles */}
      <rect x="6" y="5" width="3" height="6" fill="#3a1e08" />
      <rect x="7" y="6" width="2" height="4" fill="#d4a020" />
      <rect x="19" y="5" width="3" height="6" fill="#3a1e08" />
      <rect x="19" y="6" width="2" height="4" fill="#d4a020" />
      {/* Cup bottom taper */}
      <rect x="10" y="14" width="8" height="2" fill="#3a1e08" />
      <rect x="11" y="15" width="6" height="1" fill="#c89010" />
      {/* Stem */}
      <rect x="12" y="16" width="4" height="4" fill="#3a1e08" />
      <rect x="13" y="17" width="2" height="3" fill="#c89010" />
      {/* Base */}
      <rect x="9" y="20" width="10" height="3" fill="#3a1e08" />
      <rect x="10" y="21" width="8" height="1" fill="#f5c842" />
      {/* Star detail on cup */}
      <rect x="13" y="8" width="2" height="2" fill="#fff8c0" />
      <rect x="12" y="9" width="4" height="1" fill="#fff8c0" />
    </svg>
  )
}

export function LeaderboardSlot({ onClick }: LeaderboardSlotProps) {
  return (
    <ToolbarSlot onClick={onClick} label="Leaderboard" hotkey="L">
      <TrophyIcon />
    </ToolbarSlot>
  )
}
