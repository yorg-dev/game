import { useState, useEffect, useCallback } from 'react'
import { NewAgentModal } from '@/app/Agents/NewModal'
import { NewConnectionModal } from '@/app/Connections/NewModal'
import { AgentPopover } from '@/app/Agents/Popover'
import { ConnectionPopover } from '@/app/Connections/Popover'
import { DialogBox } from '@/app/Game/Dialog'
import { NotificationsModal } from '@/app/Notifications/List'
import { EventBus } from '@/game/EventBus'
import { AGENT_TEMPLATES } from '@/mocks/agentTemplates'
import { APPS } from '@/mocks/apps'
import type { Connection } from '@/models/Connection'

// ─── Types ───────────────────────────────────────────────────────────────────

type PanelId =
  | 'new-agent'
  | 'new-connection'
  | 'agent-popover'
  | 'connection-popover'
  | 'dialog-box'
  | 'notifications'
  | 'quests'

const PANELS: { id: PanelId; label: string; description: string }[] = [
  { id: 'new-agent', label: 'New Agent Modal', description: '2-step modal to spawn an agent' },
  {
    id: 'new-connection',
    label: 'New Connection Modal',
    description: '2-step modal to add an integration',
  },
  { id: 'agent-popover', label: 'Agent Popover', description: 'Overview + chat tabs for an agent' },
  {
    id: 'connection-popover',
    label: 'Connection Popover',
    description: 'Info panel for a connection house',
  },
  { id: 'dialog-box', label: 'Dialog Box', description: 'RPG-style typewriter dialog' },
  {
    id: 'notifications',
    label: 'Notifications Modal',
    description: 'Bulletin board notification list',
  },
  { id: 'quests', label: 'Quests', description: 'Quest / tutorial localStorage controls' },
]

// ─── Mock data for previews ───────────────────────────────────────────────────

const MOCK_CONNECTION: Connection = {
  id: 'shopify-demo',
  appId: 'shopify',
  label: 'Shopify — Demo Store',
  status: 'connected',
  credentials: {},
  connectedAt: '2025-06-01T09:00:00Z',
  lastUsedAt: '2026-02-20T14:32:00Z',
}

const MOCK_DIALOG_LINES = [
  {
    speaker: 'Merchant',
    speakerColor: '#96bf48',
    text: 'Welcome to the Shopify house. Your store data is synced and ready.',
  },
  {
    speaker: 'Merchant',
    speakerColor: '#96bf48',
    text: 'You can place your agents here to handle orders, refunds, and fulfilment tasks automatically.',
  },
  {
    speaker: 'System',
    speakerColor: '#c8974c',
    text: 'All actions are logged. Press [Space] to continue.',
  },
]

// ─── Panel renderers ──────────────────────────────────────────────────────────

function NewAgentPanel() {
  const [open, setOpen] = useState(false)
  const [last, setLast] = useState<string | null>(null)
  return (
    <div className="flex flex-col items-center gap-4">
      <DebugButton onClick={() => setOpen(true)}>Open New Agent Modal</DebugButton>
      {last && <p className="text-xs text-emerald-400 font-mono">✓ Submitted: {last}</p>}
      {open && (
        <NewAgentModal
          onSubmit={(name, templateId) => {
            setLast(`${name} (${templateId})`)
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}

function NewConnectionPanel() {
  const [open, setOpen] = useState(false)
  const [last, setLast] = useState<string | null>(null)
  return (
    <div className="flex flex-col items-center gap-4">
      <DebugButton onClick={() => setOpen(true)}>Open New Connection Modal</DebugButton>
      {last && <p className="text-xs text-emerald-400 font-mono">✓ Submitted: {last}</p>}
      {open && (
        <NewConnectionModal
          onSuccess={(appId, connection) => {
            setLast(`${connection.name} (${appId})`)
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}

function AgentPopoverPanel() {
  const [activeId, setActiveId] = useState(0)

  function open(tab: 'overview' | 'chat') {
    const t = AGENT_TEMPLATES[activeId]
    if (!t) return
    EventBus.emit('agent-clicked', { id: 1, name: 'Debug Agent', templateId: t.id, tab })
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <label className="text-xs text-gray-400 uppercase tracking-widest">Template</label>
        <select
          value={activeId}
          onChange={(e) => setActiveId(Number(e.target.value))}
          className="bg-gray-800 text-gray-200 text-sm px-3 py-1.5 rounded border border-gray-600 focus:outline-none"
        >
          {AGENT_TEMPLATES.map((t, i) => (
            <option key={t.id} value={i}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <DebugButton onClick={() => open('overview')}>Open → Overview tab</DebugButton>
        <DebugButton onClick={() => open('chat')}>Open → Chat tab</DebugButton>
      </div>
      <AgentPopover />
    </div>
  )
}

function ConnectionPopoverPanel() {
  const [appIndex, setAppIndex] = useState(0)
  const available = APPS.filter((a) => a.isAvailable)

  function open() {
    const app = available[appIndex]
    if (!app) return
    const conn: Connection = { ...MOCK_CONNECTION, appId: app.id, label: `${app.name} — Demo` }
    EventBus.emit('connection-clicked', { connectionId: conn.id, appId: app.id, connection: conn })
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <label className="text-xs text-gray-400 uppercase tracking-widest">App</label>
        <select
          value={appIndex}
          onChange={(e) => setAppIndex(Number(e.target.value))}
          className="bg-gray-800 text-gray-200 text-sm px-3 py-1.5 rounded border border-gray-600 focus:outline-none"
        >
          {available.map((a, i) => (
            <option key={a.id} value={i}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <DebugButton onClick={open}>Open Connection Popover</DebugButton>
      <ConnectionPopover />
    </div>
  )
}

function DialogBoxPanel() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col items-center gap-4">
      <DebugButton onClick={() => setOpen(true)}>Open Dialog Box</DebugButton>
      <p className="text-xs text-gray-500">
        Renders at bottom of screen — click or press Space to advance
      </p>
      {open && <DialogBox lines={MOCK_DIALOG_LINES} onClose={() => setOpen(false)} />}
    </div>
  )
}

function NotificationsPanel() {
  return (
    <div className="flex flex-col items-center gap-4">
      <DebugButton onClick={() => EventBus.emit('sign-clicked', undefined)}>
        Open Notifications Modal
      </DebugButton>
      <NotificationsModal />
    </div>
  )
}

const TUTORIAL_KEY = 'yorg.tutorialSeen'

function QuestsPanel() {
  const [seen, setSeen] = useState(() => !!localStorage.getItem(TUTORIAL_KEY))

  function reset() {
    localStorage.removeItem(TUTORIAL_KEY)
    setSeen(false)
  }

  function markSeen() {
    localStorage.setItem(TUTORIAL_KEY, '1')
    setSeen(true)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs text-gray-400 uppercase tracking-widest">Tutorial status</p>
        <p
          className={`text-sm font-mono font-bold ${seen ? 'text-emerald-400' : 'text-amber-400'}`}
        >
          {seen ? `"${TUTORIAL_KEY}" = "1"  (seen)` : `"${TUTORIAL_KEY}" not set  (unseen)`}
        </p>
      </div>
      <div className="flex gap-3">
        <DebugButton onClick={reset}>Reset tutorial (remove key)</DebugButton>
        <button
          onClick={markSeen}
          className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors border border-gray-500"
        >
          Mark as seen
        </button>
      </div>
      <p className="text-xs text-gray-600 max-w-xs text-center">
        After resetting, reload the game page — the 3-line welcome dialog will play automatically on
        first scene creation.
      </p>
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function DebugButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors border border-emerald-500"
    >
      {children}
    </button>
  )
}

function PanelRenderer({ id }: { id: PanelId }) {
  switch (id) {
    case 'new-agent':
      return <NewAgentPanel />
    case 'new-connection':
      return <NewConnectionPanel />
    case 'agent-popover':
      return <AgentPopoverPanel />
    case 'connection-popover':
      return <ConnectionPopoverPanel />
    case 'dialog-box':
      return <DialogBoxPanel />
    case 'notifications':
      return <NotificationsPanel />
    case 'quests':
      return <QuestsPanel />
  }
}

// ─── CSS Override hook ────────────────────────────────────────────────────────

function useLiveCss(css: string) {
  useEffect(() => {
    let el = document.getElementById('debug-live-css') as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = 'debug-live-css'
      document.head.appendChild(el)
    }
    el.textContent = css
    return () => {
      if (el) el.textContent = ''
    }
  }, [css])
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DebugPage() {
  const [activePanel, setActivePanel] = useState<PanelId>('new-agent')
  const [customCss, setCustomCss] = useState('')

  useLiveCss(customCss)

  const currentPanel = PANELS.find((p) => p.id === activePanel)!

  const handleCssChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomCss(e.target.value)
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
        <span className="text-base font-bold font-mono text-emerald-400 tracking-tight">
          ⬡ Component Lab
        </span>
        <span className="text-gray-600 text-xs">
          — dev only · <span className="font-mono">/#/debug</span>
        </span>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <nav className="w-56 shrink-0 border-r border-gray-800 bg-gray-900 flex flex-col py-3 gap-0.5">
          <p className="px-4 text-[10px] uppercase tracking-widest text-gray-600 pb-1">
            Components
          </p>
          {PANELS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePanel(p.id)}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors border-r-2 ${
                activePanel === p.id
                  ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border-transparent'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        {/* Right pane */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Panel title bar */}
          <div className="px-6 py-3 border-b border-gray-800 bg-gray-900/50 shrink-0">
            <p className="text-sm font-semibold text-gray-200">{currentPanel.label}</p>
            <p className="text-xs text-gray-500">{currentPanel.description}</p>
          </div>

          {/* Preview area */}
          <div className="flex-1 flex items-center justify-center p-10 bg-[#1a1a2e] relative overflow-auto">
            <PanelRenderer id={activePanel} />
          </div>

          {/* CSS override editor */}
          <div className="shrink-0 border-t border-gray-800 bg-gray-900">
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">
                Live CSS Override
              </span>
              {customCss.trim() && (
                <span className="text-[10px] text-emerald-400 font-mono">● active</span>
              )}
              {customCss.trim() && (
                <button
                  onClick={() => setCustomCss('')}
                  className="ml-auto text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                >
                  clear
                </button>
              )}
            </div>
            <textarea
              value={customCss}
              onChange={handleCssChange}
              placeholder={CSS_PLACEHOLDER}
              spellCheck={false}
              className="w-full h-32 bg-gray-950 text-emerald-300 font-mono text-xs px-4 py-3 resize-none focus:outline-none border-0 placeholder:text-gray-700"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const CSS_PLACEHOLDER = `/* Styles injected live into the page — use to tweak component appearance */

/* Example: change modal background */
/* .debug-target { background: #1a1a2e !important; } */

/* Example: override Tailwind arbitrary colors */
/* [class*="bg-\\[#e8d5a8\\]"] { background-color: #1e293b !important; } */`
