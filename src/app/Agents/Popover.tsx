import { useState, useEffect, useRef } from 'react'
import { RecordContextProvider } from 'ra-core'
import { EventBus } from '@/game/EventBus'
import { GameDialog, GameDialogContent, GameDialogTitle } from '@/components/ui/game-dialog'
import { findAgentTemplate } from '@/game/agentTemplates/agentTemplateStore'
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
      const template = findAgentTemplate(templateId)
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

  const messages = history[agent?.id ?? -1] ?? []

  return (
    <GameDialog open={!!agent} onOpenChange={(o) => !o && handleClose()}>
      <GameDialogContent
        className={`max-w-md flex flex-col p-0 ${tab === 'chat' ? 'h-[520px]' : 'h-auto'}`}
      >
        {agent && (
          <RecordContextProvider value={agent}>
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-start gap-3 px-5 pt-5 pb-4 shrink-0 bg-parchment-250 border-b-4 border-wood-700">
              <div
                className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold border-2 border-wood-700/40"
                style={{ background: agent.template.color, color: '#3d2010' }}
              >
                {agent.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0 pt-0.5 pr-10">
                <GameDialogTitle className="truncate">{agent.name}</GameDialogTitle>
                <p className="text-xs text-wood-700 mt-0.5 leading-snug line-clamp-2">
                  {agent.template.description}
                </p>
                {agentLevel && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-wood-700 shrink-0">
                      {agentLevel.level >= MAX_LEVEL ? 'MAX' : `Lv.${agentLevel.level}`}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-parchment-500/40 overflow-hidden border border-wood-700/30">
                      <div
                        className="h-full rounded-full bg-wood-500 transition-all duration-500"
                        style={{
                          width:
                            agentLevel.level >= MAX_LEVEL
                              ? '100%'
                              : `${((agentLevel.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%`,
                        }}
                      />
                    </div>
                    {agentLevel.level < MAX_LEVEL && (
                      <span className="text-[10px] text-wood-600 shrink-0 tabular-nums">
                        {agentLevel.xp_to_next} XP
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Tab bar ────────────────────────────────────────────── */}
            <div className="flex border-b-4 border-wood-700 px-5 shrink-0 bg-parchment-250">
              {(['overview', 'chat'] as AgentTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative px-1 mr-5 pb-2.5 pt-2 text-sm font-bold capitalize transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:transition-all ${
                    tab === t
                      ? 'text-soil-800 after:bg-wood-700'
                      : 'text-wood-600 hover:text-wood-900 after:bg-transparent'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ── Tab content ────────────────────────────────────────── */}
            {tab === 'overview' && <AgentOverview onClose={handleClose} onRemove={handleRemove} />}
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
          </RecordContextProvider>
        )}
      </GameDialogContent>
    </GameDialog>
  )
}
