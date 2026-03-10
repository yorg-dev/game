interface ToolbarSlotProps {
  onClick?: () => void
  label?: string
  hotkey?: string
  active?: boolean
  children: React.ReactNode
}

export function ToolbarSlot({ onClick, label, hotkey, active, children }: ToolbarSlotProps) {
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
