import { useState, useEffect } from 'react'
import { EventBus } from '@/game/EventBus'
import { findAgentTemplate } from '@/game/agentTemplates/agentTemplateStore'
import type { AgentTemplate } from '@/models/AgentTemplate'
import type { Connection } from '@/models/Connection'
import { NewAgentModal } from '@/app/Agents/NewModal'
import { NewConnectionModal } from '@/app/Connections/NewModal'
import { CreateAccountModal } from '@/app/Auth/CreateAccount'
import { GameToolbar } from './Toolbar'
import { DialogBox } from './Dialog'
import type { DialogLine } from '@/game/dialog/DialogScript'
import type { ApiConnection } from '@/models/Connection'
import type { Tool } from '@/models/Tool'

interface AgentEntry {
  id: number
  name: string
  template: AgentTemplate
}

const STATUS_DOT: Record<string, string> = {
  connected: 'bg-emerald-600',
  disconnected: 'bg-wood-600',
  expired: 'bg-amber-600',
  error: 'bg-red-700',
}

const HOTKEYS = [
  { keys: ['W', 'A', 'S', 'D'], label: 'Move agent' },
  { keys: ['N'], label: 'New agent' },
  { keys: ['C'], label: 'Add connection' },
  { keys: ['M'], label: 'Toggle menu' },
  { keys: ['T'], label: 'Toggle toolbar' },
  { keys: ['L'], label: 'Leaderboard' },
  { keys: ['X'], label: 'Experts directory' },
  { keys: ['P'], label: 'Toggle minimap' },
  { keys: ['/'], label: 'Issue command' },
  { keys: ['Esc'], label: 'Close / cancel' },
] as { keys: string[]; label: string }[]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
  label,
  count,
  expanded,
  onToggle,
}: {
  label: string
  count: number
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-left hover:bg-parchment-400 transition-colors group"
    >
      <span className="text-[11px] font-bold text-wood-700 uppercase tracking-widest group-hover:text-soil-800 transition-colors">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {count > 0 && (
          <span className="text-[11px] font-bold text-wood-600 tabular-nums">{count}</span>
        )}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`text-wood-600 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
        >
          <path
            d="M1 3l4 4 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </div>
    </button>
  )
}

function HotkeysModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-parchment-150 border-4 border-wood-700 rounded-2xl shadow-[inset_0_0_0_3px_var(--color-parchment-50)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-wood-700 bg-wood-500 shadow-[inset_0_2px_0_0_var(--color-wood-300),inset_0_-3px_0_0_var(--color-wood-900)] text-soil-800 hover:brightness-110 transition-[filter]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M10 2L2 10M2 2l8 8"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="square"
            />
          </svg>
        </button>

        <div className="px-5 pt-5 pb-3 border-b-4 border-wood-700 bg-parchment-250 pr-14">
          <h2 className="text-soil-800 font-bold text-base">Keyboard Shortcuts</h2>
        </div>

        <div className="flex flex-col gap-0.5 p-4">
          {HOTKEYS.map(({ keys, label }) => (
            <div
              key={label}
              className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-parchment-250 transition-colors"
            >
              <span className="text-sm font-bold text-soil-800">{label}</span>
              <div className="flex items-center gap-1">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-flex items-center justify-center min-w-[1.6rem] h-6 px-1.5 rounded-md border-2 border-wood-600 bg-parchment-250 shadow-[inset_0_2px_0_0_#f0e0c0,inset_0_-2px_0_0_var(--color-wood-700)] text-[11px] font-mono font-bold text-soil-800 leading-none"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GameMenu({ canManage = false }: { canManage?: boolean }) {
  const [open, setOpen] = useState(false)
  const [agents, setAgents] = useState<AgentEntry[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [agentExpanded, setAgentExpanded] = useState(true)
  const [connExpanded, setConnExpanded] = useState(true)
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [showConnModal, setShowConnModal] = useState(false)
  const [settingsExpanded, setSettingsExpanded] = useState(false)
  const [showHotkeys, setShowHotkeys] = useState(false)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const [dialogLines, setDialogLines] = useState<DialogLine[] | null>(null)

  let dynamicCount = 0

  useEffect(() => {
    if (!canManage) return
    function onKeyDown(e: KeyboardEvent) {
      if (showAgentModal || showConnModal || showHotkeys) return
      const tag = (document.activeElement?.tagName ?? '').toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault()
          setShowAgentModal(true)
          break
        case 'c':
        case 'C':
          e.preventDefault()
          setShowConnModal(true)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          setOpen((v) => !v)
          break
        case 't':
        case 'T':
          e.preventDefault()
          setToolbarVisible((v) => !v)
          break
        case 'l':
        case 'L':
          e.preventDefault()
          EventBus.emit('show-leaderboard', undefined)
          break
        case 'x':
        case 'X':
          e.preventDefault()
          EventBus.emit('show-experts', undefined)
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canManage, showAgentModal, showConnModal, showHotkeys])

  useEffect(() => {
    const unsubSpawned = EventBus.on('agent-spawned', ({ id, name, templateId }) => {
      const template = findAgentTemplate(templateId)
      if (!template) return
      setAgents((prev) =>
        prev.some((s) => s.id === id) ? prev : [...prev, { id, name, template }],
      )
    })
    const unsubDialog = EventBus.on('dialog-start', ({ lines }) => setDialogLines(lines))
    const unsubRemoved = EventBus.on('agent-removed', ({ id }) =>
      setAgents((prev) => prev.filter((s) => s.id !== id)),
    )
    const unsubReady = EventBus.on('scene-ready', () =>
      EventBus.emit('request-agent-sync', undefined),
    )
    const unsubConns = EventBus.on('connections-loaded', ({ connections }) =>
      setConnections(connections),
    )
    EventBus.emit('request-agent-sync', undefined)
    return () => {
      unsubSpawned()
      unsubRemoved()
      unsubReady()
      unsubDialog()
      unsubConns()
    }
  }, [])

  function handleNewAgent(name: string, templateId: string) {
    EventBus.emit('spawn-agent', { name, templateId })
    setShowAgentModal(false)
  }

  function handleNewConnection(appId: string, apiConnection: ApiConnection, _tool: Tool | null) {
    const col = dynamicCount % 4
    const row = Math.floor(dynamicCount / 4)
    const pos = { x: 200 + col * 80, y: 200 + row * 80 }
    dynamicCount++
    const newConn: Connection = {
      id: apiConnection.id,
      app_id: appId,
      label: apiConnection.name,
      status: 'connected',
      credentials: {},
      connected_at: new Date().toISOString(),
    }
    setConnections((prev) => [...prev, newConn])
    EventBus.emit('add-connection', {
      connectionId: apiConnection.id,
      appId,
      worldX: pos.x,
      worldY: pos.y,
      connection: newConn,
    })
    setShowConnModal(false)
  }

  function handleClickConnection(conn: Connection) {
    EventBus.emit('connection-clicked', {
      connectionId: conn.id,
      appId: conn.app_id,
      connection: conn,
    })
  }

  const closeButton = (
    <button
      onClick={() => setOpen(false)}
      aria-label="Close menu"
      className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-wood-700 bg-wood-500 shadow-[inset_0_2px_0_0_var(--color-wood-300),inset_0_-3px_0_0_var(--color-wood-900)] text-soil-800 hover:brightness-110 transition-[filter]"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M10 2L2 10M2 2l8 8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
        />
      </svg>
    </button>
  )

  return (
    <>
      {/* Floating open button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="fixed top-4 left-4 z-50 w-12 h-12 rounded-xl border-4 border-wood-700 bg-parchment-150 shadow-[inset_0_0_0_3px_var(--color-parchment-50),inset_0_0_0_5px_#c8a86a] hover:brightness-105 active:brightness-95 transition-[filter] flex items-center justify-center"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
            <rect y="0" width="18" height="2.5" rx="1.25" fill="#7a5230" />
            <rect y="5.75" width="18" height="2.5" rx="1.25" fill="#7a5230" />
            <rect y="11.5" width="18" height="2.5" rx="1.25" fill="#7a5230" />
          </svg>
        </button>
      )}

      {/* Guest panel */}
      {!canManage && open && (
        <nav
          className="fixed top-0 left-0 z-50 h-full flex flex-col bg-parchment-150 border-r-4 border-wood-700 shadow-[inset_-3px_0_0_var(--color-parchment-50)]"
          style={{ width: '17rem' }}
        >
          <div className="relative flex items-center px-5 py-4 border-b-4 border-wood-700 bg-parchment-250 shrink-0">
            <span className="text-soil-800 font-bold tracking-widest text-sm uppercase select-none">
              Menu
            </span>
            {closeButton}
          </div>
          <div className="flex-1 flex flex-col gap-3 px-4 py-5">
            <p className="text-xs text-wood-700">
              Sign in to manage your land, add agents, and connect apps.
            </p>
            <button
              onClick={() => {
                setOpen(false)
                EventBus.emit('show-login', { tab: 'register' })
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-wood-700 bg-wood-500 shadow-[inset_0_2px_0_0_var(--color-wood-300),inset_0_-3px_0_0_var(--color-wood-900)] text-soil-800 text-sm font-bold hover:brightness-110 transition-[filter]"
            >
              <span className="text-base leading-none">+</span>
              Create Land
            </button>
            <button
              onClick={() => {
                setOpen(false)
                EventBus.emit('show-leaderboard', undefined)
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-wood-600 bg-parchment-250 text-wood-900 text-sm font-bold hover:bg-parchment-400 transition-colors"
            >
              <span className="text-base leading-none">🏆</span>
              Leaderboard
            </button>
            <button
              onClick={() => {
                setOpen(false)
                EventBus.emit('show-experts', undefined)
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-wood-600 bg-parchment-250 text-wood-900 text-sm font-bold hover:bg-parchment-400 transition-colors"
            >
              <span className="text-base leading-none">⭐</span>
              Experts
            </button>
          </div>
        </nav>
      )}

      {/* Owner panel */}
      {canManage && open && (
        <nav
          className="fixed top-0 left-0 z-50 h-full flex flex-col bg-parchment-150 border-r-4 border-wood-700 shadow-[inset_-3px_0_0_var(--color-parchment-50)]"
          style={{ width: '17rem' }}
        >
          <div className="relative flex items-center px-5 py-4 border-b-4 border-wood-700 bg-parchment-250 shrink-0">
            <span className="text-soil-800 font-bold tracking-widest text-sm uppercase select-none">
              Menu
            </span>
            {closeButton}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-1 px-3 py-3">
              {/* Agents */}
              <SectionHeader
                label="Agents"
                count={agents.length}
                expanded={agentExpanded}
                onToggle={() => setAgentExpanded((v) => !v)}
              />
              {agentExpanded && (
                <div className="flex flex-col gap-1 mt-0.5 mb-2 px-1">
                  {agents.length === 0 ? (
                    <p className="text-wood-600 text-xs px-2 py-1.5 italic">No agents yet</p>
                  ) : (
                    agents.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-parchment-250 border-2 border-wood-600"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-wood-700/40"
                          style={{ background: s.template.color }}
                        />
                        <span className="flex-1 text-sm font-bold text-soil-800 truncate">
                          {s.name}
                        </span>
                        <span className="text-[10px] border border-wood-600 bg-parchment-150 text-wood-700 font-bold px-1.5 py-0 rounded shrink-0">
                          {s.template.name}
                        </span>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => setShowAgentModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 mt-0.5 rounded-lg border-2 border-dashed border-parchment-500 text-left text-xs text-wood-600 font-bold hover:border-wood-700 hover:text-wood-900 hover:bg-parchment-250 transition-colors w-full"
                  >
                    <span className="text-sm leading-none">+</span>
                    <span>New Agent</span>
                  </button>
                </div>
              )}

              <div className="mx-2 my-1 border-t-2 border-parchment-500" />

              {/* Connections */}
              <SectionHeader
                label="Connections"
                count={connections.length}
                expanded={connExpanded}
                onToggle={() => setConnExpanded((v) => !v)}
              />
              {connExpanded && (
                <div className="flex flex-col gap-1 mt-0.5 mb-2 px-1">
                  {connections.length === 0 ? (
                    <p className="text-wood-600 text-xs px-2 py-1.5 italic">No connections yet</p>
                  ) : (
                    connections.map((conn) => (
                      <button
                        key={conn.id}
                        onClick={() => handleClickConnection(conn)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg border-2 border-wood-600 bg-parchment-250 cursor-pointer text-left w-full hover:border-wood-700 hover:bg-parchment-400 transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-wood-700/30 bg-wood-600" />
                        <span className="flex-1 text-sm font-bold text-soil-800 truncate">
                          {conn.label || conn.app_id}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 border border-wood-700/30 ${STATUS_DOT[conn.status] ?? 'bg-wood-600'}`}
                        />
                      </button>
                    ))
                  )}
                  <button
                    onClick={() => setShowConnModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 mt-0.5 rounded-lg border-2 border-dashed border-parchment-500 text-left text-xs text-wood-600 font-bold hover:border-wood-700 hover:text-wood-900 hover:bg-parchment-250 transition-colors w-full"
                  >
                    <span className="text-sm leading-none">+</span>
                    <span>Add Connection</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Settings footer */}
          <div className="shrink-0 border-t-4 border-wood-700 bg-parchment-250 px-3 py-2">
            <SectionHeader
              label="Settings"
              count={0}
              expanded={settingsExpanded}
              onToggle={() => setSettingsExpanded((v) => !v)}
            />
            {settingsExpanded && (
              <div className="mt-1 mb-1 px-1 flex flex-col gap-1">
                <button
                  onClick={() => setShowHotkeys(true)}
                  className="flex items-center gap-2 px-3 py-2 w-full rounded-lg border-2 border-wood-600 bg-parchment-150 text-left text-xs text-wood-900 font-bold hover:bg-parchment-400 hover:border-wood-700 transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="shrink-0 text-wood-700"
                  >
                    <rect x="0.5" y="2.5" width="11" height="7" rx="1.5" stroke="currentColor" />
                    <rect x="2" y="4.5" width="2" height="1.5" rx="0.5" fill="currentColor" />
                    <rect x="5" y="4.5" width="2" height="1.5" rx="0.5" fill="currentColor" />
                    <rect x="8" y="4.5" width="2" height="1.5" rx="0.5" fill="currentColor" />
                    <rect x="3.5" y="7" width="5" height="1.5" rx="0.5" fill="currentColor" />
                  </svg>
                  Keyboard shortcuts
                </button>
                <button
                  onClick={() => setShowCreateAccount(true)}
                  className="flex items-center gap-2 px-3 py-2 w-full rounded-lg border-2 border-wood-600 bg-parchment-150 text-left text-xs text-wood-900 font-bold hover:bg-parchment-400 hover:border-wood-700 transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="shrink-0 text-wood-700"
                  >
                    <circle cx="6" cy="4" r="2.5" stroke="currentColor" />
                    <path
                      d="M1 11c0-2.21 2.239-4 5-4s5 1.79 5 4"
                      stroke="currentColor"
                      strokeLinecap="square"
                    />
                  </svg>
                  Save map / Create account
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Dialog */}
      {dialogLines && <DialogBox lines={dialogLines} onClose={() => setDialogLines(null)} />}

      {/* Toolbar */}
      {canManage && toolbarVisible && (
        <GameToolbar
          onAddAgent={() => setShowAgentModal(true)}
          onAddConnection={() => setShowConnModal(true)}
          onLeaderboard={() => EventBus.emit('show-leaderboard', undefined)}
          onExperts={() => EventBus.emit('show-experts', undefined)}
        />
      )}

      {/* Modals */}
      {canManage && showAgentModal && (
        <NewAgentModal onSubmit={handleNewAgent} onCancel={() => setShowAgentModal(false)} />
      )}
      {canManage && showConnModal && (
        <NewConnectionModal
          onSuccess={handleNewConnection}
          onCancel={() => setShowConnModal(false)}
        />
      )}
      {showCreateAccount && (
        <CreateAccountModal
          onSuccess={() => setShowCreateAccount(false)}
          onCancel={() => setShowCreateAccount(false)}
        />
      )}
      {showHotkeys && <HotkeysModal onClose={() => setShowHotkeys(false)} />}
    </>
  )
}
