import { useState, useEffect, useRef } from 'react'
import { EventBus } from '@/game/EventBus'
import { wsProvider } from '@/providers/wsProvider'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string
  authorName: string
  text: string
  ts: number
  fromSelf: boolean
}

type ChatTab = 'world' | 'land' | 'agents'

interface AgentEntry {
  id: number
  name: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseMention(
  text: string,
  agents: AgentEntry[],
): { agentId: number | null; cleanText: string } {
  const match = text.match(/^@(\S+)\s*(.*)$/s)
  if (match) {
    const agent = agents.find((a) => a.name.toLowerCase() === match[1].toLowerCase())
    if (agent) return { agentId: agent.id, cleanText: match[2].trim() || text }
  }
  return { agentId: null, cleanText: text }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MessageList({
  messages,
  tab,
  agents,
  bottomRef,
}: {
  messages: ChatMessage[]
  tab: ChatTab
  agents: AgentEntry[]
  bottomRef: React.RefObject<HTMLDivElement | null>
}) {
  if (tab === 'agents' && agents.length === 0) {
    return (
      <p className="text-[#9a6b28] text-xs px-2 py-4 italic text-center">
        No agents in this land
      </p>
    )
  }
  if (messages.length === 0) {
    return (
      <p className="text-[#9a6b28] text-xs px-2 py-4 italic text-center">No messages yet</p>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex flex-col gap-0.5 ${msg.fromSelf ? 'items-end' : 'items-start'}`}
        >
          {!msg.fromSelf && (
            <span className="text-[10px] font-bold text-[#9a6b28] px-1">{msg.authorName}</span>
          )}
          <div
            className={`max-w-[85%] px-3 py-1.5 rounded-xl text-sm leading-relaxed break-words border-2 font-medium ${
              msg.fromSelf
                ? 'bg-[#7a5230] border-[#5a3810] text-[#f5edd5] rounded-tr-sm'
                : 'bg-[#dcc898] border-[#9a6b28] text-[#3d2010] rounded-tl-sm'
            } ${msg.text === '…' ? 'opacity-60 italic' : ''}`}
          >
            {msg.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

function MessageInput({
  draft,
  tab,
  agents,
  onChange,
  onSubmit,
}: {
  draft: string
  tab: ChatTab
  agents: AgentEntry[]
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  const disabled = tab === 'agents' && agents.length === 0
  return (
    <div className="shrink-0 border-t-4 border-[#7a5230] bg-[#dcc898] px-3 py-3">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            tab === 'agents' ? 'Message all agents, or @name for one' : `Message ${tab}…`
          }
          disabled={disabled}
          className="flex-1 px-3 py-2 rounded-lg bg-[#f5edd5] border-2 border-[#9a6b28] text-[#3d2010] text-sm placeholder:text-[#b8955a] focus:outline-none focus:border-[#5a3810] disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!draft.trim() || disabled}
          className="shrink-0 px-3 py-2 rounded-lg border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] text-sm font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-[filter]"
        >
          Send
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

const TABS: { key: ChatTab; label: string }[] = [
  { key: 'world', label: 'World' },
  { key: 'land', label: 'Land' },
  { key: 'agents', label: 'Agents' },
]

export function ChatPanel() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ChatTab>('world')
  const [worldMessages, setWorldMessages] = useState<ChatMessage[]>([])
  const [landMessages, setLandMessages] = useState<ChatMessage[]>([])
  const [agentMessages, setAgentMessages] = useState<ChatMessage[]>([])
  const [agents, setAgents] = useState<AgentEntry[]>([])
  const [draft, setDraft] = useState('')
  const [unread, setUnread] = useState({ world: false, land: false, agents: false })

  const bottomRef = useRef<HTMLDivElement>(null)
  const openRef = useRef(open)
  const tabRef = useRef(activeTab)

  useEffect(() => { openRef.current = open }, [open])
  useEffect(() => { tabRef.current = activeTab }, [activeTab])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [worldMessages, landMessages, agentMessages, activeTab])

  // WebSocket: incoming chat-message
  useEffect(() => {
    return wsProvider.on('chat-message', (msg) => {
      const newMsg: ChatMessage = {
        id: `ws_${msg.ts}_${Math.random()}`,
        authorName: msg.authorName,
        text: msg.text,
        ts: msg.ts,
        fromSelf: false,
      }
      if (msg.scope === 'world') {
        setWorldMessages((prev) => [...prev, newMsg])
        if (!openRef.current || tabRef.current !== 'world') {
          setUnread((u) => ({ ...u, world: true }))
        }
      } else {
        setLandMessages((prev) => [...prev, newMsg])
        if (!openRef.current || tabRef.current !== 'land') {
          setUnread((u) => ({ ...u, land: true }))
        }
      }
    })
  }, [])

  // EventBus: agent lifecycle
  useEffect(() => {
    const unsubSpawned = EventBus.on('agent-spawned', ({ id, name }) => {
      setAgents((prev) => (prev.some((a) => a.id === id) ? prev : [...prev, { id, name }]))
    })
    const unsubRemoved = EventBus.on('agent-removed', ({ id }) => {
      setAgents((prev) => prev.filter((a) => a.id !== id))
    })
    EventBus.emit('request-agent-sync', undefined)
    return () => {
      unsubSpawned()
      unsubRemoved()
    }
  }, [])

  // EventBus: agent responses
  useEffect(() => {
    return EventBus.on('agent-response', ({ messageId, agentId, text }) => {
      const agent = agents.find((a) => a.id === agentId)
      const agentName = agent?.name ?? `Agent ${agentId}`
      setAgentMessages((prev) => {
        const replaced = prev.map((m) =>
          m.id === `${messageId}-pending`
            ? { ...m, id: `${messageId}-agent`, authorName: agentName, text, fromSelf: false }
            : m,
        )
        if (replaced.some((m) => m.id === `${messageId}-agent`)) return replaced
        return [
          ...prev,
          { id: `${messageId}-agent`, authorName: agentName, text, ts: Date.now(), fromSelf: false },
        ]
      })
      if (!openRef.current || tabRef.current !== 'agents') {
        setUnread((u) => ({ ...u, agents: true }))
      }
    })
  }, [agents])

  function handleTabClick(tab: ChatTab) {
    setActiveTab(tab)
    setUnread((u) => ({ ...u, [tab]: false }))
  }

  function handleOpen() {
    setOpen(true)
    setUnread((u) => ({ ...u, [activeTab]: false }))
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return

    const messageId = `msg_${Date.now()}`
    const authorName = 'You'

    if (activeTab === 'world' || activeTab === 'land') {
      wsProvider.send({ type: 'chat', scope: activeTab, text, authorName })
      setWorldMessages((prev) =>
        activeTab === 'world'
          ? [...prev, { id: messageId, authorName, text, ts: Date.now(), fromSelf: true }]
          : prev,
      )
      setLandMessages((prev) =>
        activeTab === 'land'
          ? [...prev, { id: messageId, authorName, text, ts: Date.now(), fromSelf: true }]
          : prev,
      )
    } else {
      const { agentId, cleanText } = parseMention(text, agents)
      setAgentMessages((prev) => [
        ...prev,
        { id: messageId, authorName, text, ts: Date.now(), fromSelf: true },
      ])
      if (agentId !== null) {
        setAgentMessages((prev) => [
          ...prev,
          { id: `${messageId}-pending`, authorName: 'Agent', text: '…', ts: Date.now(), fromSelf: false },
        ])
        EventBus.emit('agent-message', { messageId, agentId, text: cleanText })
      } else {
        EventBus.emit('command-issued', { id: messageId, text })
      }
    }

    setDraft('')
  }

  const hasUnread = unread.world || unread.land || unread.agents
  const activeMessages =
    activeTab === 'world' ? worldMessages : activeTab === 'land' ? landMessages : agentMessages

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <button
          onClick={handleOpen}
          aria-label="Open chat"
          className="fixed top-4 right-20 z-50 w-12 h-12 rounded-xl border-4 border-[#7a5230] bg-[#e8d5a8] shadow-[inset_0_0_0_3px_#f5edd5,inset_0_0_0_5px_#c8a86a] hover:brightness-105 active:brightness-95 transition-[filter] flex items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 3h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6l-4 3V4a1 1 0 0 1 1-1z"
              stroke="#7a5230"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
          {hasUnread && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#b84040] border-2 border-[#e8d5a8]" />
          )}
        </button>
      )}

      {/* Side panel */}
      {open && (
        <div
          className="fixed top-0 right-0 z-50 h-full flex flex-col bg-[#e8d5a8] border-l-4 border-[#7a5230] shadow-[-3px_0_0_#f5edd5]"
          style={{ width: '17rem' }}
        >
          {/* Header */}
          <div className="relative flex items-center px-5 py-4 border-b-4 border-[#7a5230] bg-[#dcc898] shrink-0">
            <span className="text-[#3d2010] font-bold tracking-widest text-sm uppercase select-none">
              Chat
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] hover:brightness-110 transition-[filter]"
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
          </div>

          {/* Tab bar */}
          <div className="flex border-b-4 border-[#7a5230] shrink-0 bg-[#dcc898]">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabClick(key)}
                className={`relative flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:transition-all ${
                  activeTab === key
                    ? 'text-[#3d2010] after:bg-[#7a5230]'
                    : 'text-[#9a6b28] hover:text-[#5a3810] after:bg-transparent'
                }`}
              >
                {label}
                {unread[key] && activeTab !== key && (
                  <span className="inline-block ml-1 w-1.5 h-1.5 rounded-full bg-[#b84040] align-middle" />
                )}
              </button>
            ))}
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <MessageList
              messages={activeMessages}
              tab={activeTab}
              agents={agents}
              bottomRef={bottomRef}
            />
          </div>

          <MessageInput
            draft={draft}
            tab={activeTab}
            agents={agents}
            onChange={setDraft}
            onSubmit={handleSend}
          />
        </div>
      )}
    </>
  )
}
