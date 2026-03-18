import { useEffect, useState } from 'react'
import { EventBus } from '@/game/EventBus'
import type { AppInterior, InteriorAction } from '@/game/interiors/AppInterior'
import type { Connection } from '@/models/Connection'

interface IndoorState {
  appId: string
  connection: Connection
  interior: AppInterior
}

const PIXEL_FRAME: React.CSSProperties = {
  border: '3px solid #0d0705',
  boxShadow: '0 0 0 3px #c8974c, 0 0 0 6px #0d0705',
  imageRendering: 'pixelated',
  background: '#1a0e06',
}

function ActionCard({
  action,
  accentColor,
  onClick,
}: {
  action: InteriorAction
  accentColor: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 w-full px-3 py-2.5 text-left transition-colors"
      style={{
        background: '#0d0705',
        border: '2px solid #2a1608',
        outline: 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#1a0e06')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '#0d0705')}
    >
      <span
        className="shrink-0 w-7 h-7 flex items-center justify-center text-sm font-bold"
        style={{
          background: accentColor + '33',
          border: `2px solid ${accentColor}`,
          color: accentColor,
          fontFamily: 'monospace',
        }}
      >
        {action.icon}
      </span>

      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ fontFamily: 'monospace', color: '#f0e0c0' }}
        >
          {action.label}
        </span>
        <span
          className="text-[10px] leading-snug"
          style={{ fontFamily: 'monospace', color: '#7a5a3a' }}
        >
          {action.description}
        </span>
      </div>
    </button>
  )
}

function ActionModal({
  action,
  accentColor,
  onClose,
}: {
  action: InteriorAction
  accentColor: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm" style={PIXEL_FRAME}>
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '2px solid #2a1608' }}
        >
          <span
            className="w-8 h-8 flex items-center justify-center text-base font-bold shrink-0"
            style={{
              background: accentColor + '33',
              border: `2px solid ${accentColor}`,
              color: accentColor,
              fontFamily: 'monospace',
            }}
          >
            {action.icon}
          </span>
          <span
            className="flex-1 text-[13px] font-bold uppercase tracking-widest"
            style={{ fontFamily: 'monospace', color: accentColor }}
          >
            {action.label}
          </span>
          <button
            onClick={onClose}
            className="text-[#7a5a3a] hover:text-[#f0e0c0] text-base leading-none"
            style={{ fontFamily: 'monospace' }}
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-3">
          <p
            className="text-[11px] leading-relaxed"
            style={{ fontFamily: 'monospace', color: '#c0a070' }}
          >
            {action.description}
          </p>
          <div
            className="flex items-center justify-center py-8 text-[10px] uppercase tracking-widest"
            style={{ border: '2px dashed #2a1608', color: '#4a2c14', fontFamily: 'monospace' }}
          >
            Action UI coming soon
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 text-[11px] font-bold uppercase tracking-widest transition-colors"
            style={{
              background: accentColor,
              color: '#0d0705',
              border: `2px solid ${accentColor}`,
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function IndoorHUD() {
  const [state, setState] = useState<IndoorState | null>(null)
  const [activeAction, setActiveAction] = useState<InteriorAction | null>(null)
  const [actionsVisible, setActionsVisible] = useState(false)

  useEffect(() => {
    const unsubEnter = EventBus.on('enter-house', ({ appId, connection, interior }) => {
      setState({ appId, connection, interior })
      setActiveAction(null)
      setActionsVisible(false)
    })
    const unsubExit = EventBus.on('exit-house', () => {
      setState(null)
      setActiveAction(null)
    })
    const unsubTerminal = EventBus.on('terminal-interact', ({ action }) => {
      setActiveAction(action)
    })
    return () => {
      unsubEnter()
      unsubExit()
      unsubTerminal()
    }
  }, [])

  if (!state) return null

  const { interior, connection } = state
  const accent = interior.accentColor

  function handleLeave() {
    EventBus.emit('leave-house', undefined)
  }

  return (
    <>
      {/* Top-center HUD bar */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0"
        style={PIXEL_FRAME}
      >
        <div className="w-2 self-stretch" style={{ background: accent }} />

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex flex-col leading-tight">
            <span
              className="text-[12px] font-bold uppercase tracking-widest"
              style={{ fontFamily: 'monospace', color: accent }}
            >
              {interior.displayName}
            </span>
            <span
              className="text-[9px] uppercase tracking-widest"
              style={{ fontFamily: 'monospace', color: '#4a2c14' }}
            >
              {connection.label} · {connection.status}
            </span>
          </div>
        </div>

        <button
          onClick={() => setActionsVisible((v) => !v)}
          className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
          style={{
            borderLeft: '2px solid #2a1608',
            fontFamily: 'monospace',
            color: actionsVisible ? accent : '#7a5a3a',
            cursor: 'pointer',
            background: actionsVisible ? '#2a1608' : 'transparent',
          }}
        >
          Actions {actionsVisible ? '▲' : '▼'}
        </button>

        <button
          onClick={handleLeave}
          className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest"
          style={{
            borderLeft: '2px solid #2a1608',
            fontFamily: 'monospace',
            color: '#c84040',
            cursor: 'pointer',
            background: 'transparent',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#2a1608')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          ← Leave
        </button>
      </div>

      {/* Dropdown action panel */}
      {actionsVisible && (
        <div
          className="fixed top-[52px] left-1/2 -translate-x-1/2 z-50 w-72 flex flex-col gap-px overflow-hidden"
          style={{ ...PIXEL_FRAME, boxShadow: '0 0 0 3px #c8974c, 0 0 0 6px #0d0705' }}
        >
          <div
            className="px-3 py-1.5 text-[9px] uppercase tracking-widest"
            style={{ fontFamily: 'monospace', color: '#4a2c14', borderBottom: '2px solid #2a1608' }}
          >
            Walk to a {interior.terminalLabel.toLowerCase()} and press [E], or click below:
          </div>
          {interior.actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              accentColor={accent}
              onClick={() => {
                setActiveAction(action)
                setActionsVisible(false)
              }}
            />
          ))}
        </div>
      )}

      {/* Action modal */}
      {activeAction && (
        <ActionModal
          action={activeAction}
          accentColor={accent}
          onClose={() => setActiveAction(null)}
        />
      )}
    </>
  )
}
