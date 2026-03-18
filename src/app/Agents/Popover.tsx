import { useState, useEffect, useRef } from 'react'
import { RecordContextProvider } from 'ra-core'
import { EventBus } from '@/game/EventBus'
import { AGENT_TEMPLATES } from '@/mocks/agentTemplates'
import { agentLevelProvider } from '@/providers/agentLevelProvider'
import { agentChannelProvider } from '@/providers/agentChannelProvider'
import type { AgentLevel } from '@/models/AgentLevel'
import { XP_PER_LEVEL, MAX_LEVEL } from '@/models/AgentLevel'
import { AgentOverview } from './Overview'
import { AgentChat } from './Chat'
import type { SelectedAgent, ChatMessage, AgentTab } from './types'

export function AgentPopover() {
  const [agent, setAgent] = useState<SelectedAgent | null>(null)
  const [tab, setTab] = useState<AgentTab>('overview')
  const [history, setHistory] = useState<Record<number, ChatMessage[]>>({})
  const [draft, setDraft] = useState('')
  const [agentLevel, setAgentLevel] = useState<AgentLevel | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  // Track whether we're using the real API channel (vs EventBus mock fallback)
  const usingRealApi = useRef(false)

  // Open popover when an agent is clicked in the game
  useEffect(() => {
    return EventBus.on('agent-clicked', ({ id, name, templateId, tab }) => {
      const template = AGENT_TEMPLATES.find((t) => t.id === templateId)
      if (!template) return
      setAgent({ id, name, template })
      setTab(tab ?? 'overview')
      setAgentLevel(null)
      agentLevelProvider.getLevel(template.slug).then((lvl) => {
        if (lvl) setAgentLevel(lvl)
      })
    })
  }, [])

  // Connect to AgentChannel when an agent is open
  useEffect(() => {
    if (!agent) return

    const slug = agent.template.slug
    agentChannelProvider.connect(slug)
    usingRealApi.current = agentChannelProvider.isConnected

    const unsub = agentChannelProvider.onMessage((msg) => {
      usingRealApi.current = true

      if (msg.type === 'result') {
        setHistory((prev) => {
          const agentMsgs = prev[agent.id] ?? []
          let resolved = false
          const updated = agentMsgs.map((m) => {
            if (!resolved && m.from === 'agent' && m.pending) {
              resolved = true
              return { ...m, text: msg.output, pending: false }
            }
            return m
          })
          return { ...prev, [agent.id]: updated }
        })
      } else if (msg.type === 'tool_executing') {
        setHistory((prev) => ({
          ...prev,
          [agent.id]: [
            ...(prev[agent.id] ?? []),
            {
              id: `tool_${Date.now()}`,
              from: 'agent' as const,
              text: `⚙️ Running ${msg.toolName}…`,
              ts: Date.now(),
              pending: true,
            },
          ],
        }))
      } else if (msg.type === 'tool_executed') {
        setHistory((prev) => {
          const agentMsgs = prev[agent.id] ?? []
          let resolved = false
          const updated = agentMsgs.map((m) => {
            if (!resolved && m.pending && m.text.includes(msg.toolName)) {
              resolved = true
              return { ...m, text: `✓ ${msg.toolName} triggered`, pending: false }
            }
            return m
          })
          return { ...prev, [agent.id]: updated }
        })
      } else if (msg.type === 'tool_error') {
        setHistory((prev) => {
          const agentMsgs = prev[agent.id] ?? []
          let resolved = false
          const updated = agentMsgs.map((m) => {
            if (!resolved && m.pending) {
              resolved = true
              return { ...m, text: `✗ ${msg.toolName}: ${msg.message}`, pending: false }
            }
            return m
          })
          return { ...prev, [agent.id]: updated }
        })
      } else if (msg.type === 'error') {
        setHistory((prev) => {
          const agentMsgs = prev[agent.id] ?? []
          let resolved = false
          const updated = agentMsgs.map((m) => {
            if (!resolved && m.pending) {
              resolved = true
              return { ...m, text: `Error: ${msg.message}`, pending: false }
            }
            return m
          })
          return { ...prev, [agent.id]: updated }
        })
      }
    })

    return () => {
      unsub()
      usingRealApi.current = false
    }
  }, [agent?.id])

  // Live-update the XP bar when this agent gains XP while the popover is open
  useEffect(() => {
    return EventBus.on('agent-xp-gained', ({ agentId, xpGained, level, xp, xpToNext }) => {
      if (!agent || agentId !== agent.id) return
      setAgentLevel((prev) => ({
        level,
        xp,
        xp_to_next: xpToNext,
        command_count: (prev?.command_count ?? 0) + 1,
        last_used_at: new Date().toISOString(),
        xp_gained: xpGained,
      }))
    })
  }, [agent])

  // Fallback: handle mock responses from GameScene when real API isn't connected
  useEffect(() => {
    return EventBus.on('agent-response', ({ messageId, agentId, text }) => {
      if (usingRealApi.current) return
      setHistory((prev) => {
        const msgs = prev[agentId] ?? []
        const replaced = msgs.map((m) =>
          m.id === `${messageId}-pending`
            ? { ...m, id: messageId, text, pending: false, from: 'agent' as const }
            : m,
        )
        return { ...prev, [agentId]: replaced }
      })
    })
  }, [])

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, agent?.id])

  function handleClose() {
    setAgent(null)
    setDraft('')
  }

  function handleRemove() {
    if (!agent) return
    EventBus.emit('remove-agent', { id: agent.id })
    handleClose()
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!agent || !draft.trim()) return
    const messageId = `msg_${Date.now()}`
    const text = draft.trim()

    setHistory((prev) => ({
      ...prev,
      [agent.id]: [
        ...(prev[agent.id] ?? []),
        { id: messageId, from: 'user', text, ts: Date.now() },
        { id: `${messageId}-pending`, from: 'agent', text: '…', ts: Date.now(), pending: true },
      ],
    }))

    // Try real API first; fall back to EventBus (GameScene mock handler)
    agentChannelProvider.sendChat(text)
    // Always emit for achievements/quests listening on agent-message
    EventBus.emit('agent-message', { messageId, agentId: agent.id, text })

    setDraft('')
  }

  if (!agent) return null

  const messages = history[agent.id] ?? []

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <RecordContextProvider value={agent}>
        <div
          className={`relative flex flex-col w-full max-w-md bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden ${tab === 'chat' ? 'h-[520px]' : 'h-auto'}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
        >
          {/* ── Close button ─────────────────────────────────────────── */}
          <button
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] hover:brightness-110 transition-[filter]"
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

          {/* ── Header ───────────────────────────────────────────────── */}
          <div className="flex items-start gap-3 px-5 pt-5 pb-4 shrink-0 bg-[#dcc898] border-b-4 border-[#7a5230]">
            <div
              className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold border-2 border-[#7a5230]/40"
              style={{ background: agent.template.color, color: '#3d2010' }}
            >
              {agent.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0 pt-0.5 pr-10">
              <h2 className="text-base font-bold text-[#3d2010] leading-tight truncate">
                {agent.name}
              </h2>
              <p className="text-xs text-[#7a5230] mt-0.5 leading-snug line-clamp-2">
                {agent.template.description}
              </p>
              {agentLevel && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#7a5230] shrink-0">
                    {agentLevel.level >= MAX_LEVEL ? 'MAX' : `Lv.${agentLevel.level}`}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-[#b8955a]/40 overflow-hidden border border-[#7a5230]/30">
                    <div
                      className="h-full rounded-full bg-[#c8974c] transition-all duration-500"
                      style={{
                        width:
                          agentLevel.level >= MAX_LEVEL
                            ? '100%'
                            : `${((agentLevel.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%`,
                      }}
                    />
                  </div>
                  {agentLevel.level < MAX_LEVEL && (
                    <span className="text-[10px] text-[#9a6b28] shrink-0 tabular-nums">
                      {agentLevel.xp_to_next} XP
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Tab bar ──────────────────────────────────────────────── */}
          <div className="flex border-b-4 border-[#7a5230] px-5 shrink-0 bg-[#dcc898]">
            {(['overview', 'chat'] as AgentTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-1 mr-5 pb-2.5 pt-2 text-sm font-bold capitalize transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:transition-all ${
                  tab === t
                    ? 'text-[#3d2010] after:bg-[#7a5230]'
                    : 'text-[#9a6b28] hover:text-[#5a3810] after:bg-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Tab content ──────────────────────────────────────────── */}
          {tab === 'overview' && (
            <AgentOverview onClose={handleClose} onRemove={handleRemove} />
          )}
          {tab === 'chat' && (
            <AgentChat
              agentId={agent.id}
              agentName={agent.name}
              template={agent.template}
              messages={messages}
              draft={draft}
              onChange={setDraft}
              onSubmit={handleSend}
              bottomRef={bottomRef}
            />
          )}
        </div>
      </RecordContextProvider>
    </div>
  )
}
