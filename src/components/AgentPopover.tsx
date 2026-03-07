import { useState, useEffect, useRef } from 'react'
import { EventBus } from '../game/EventBus'
import { AGENT_TEMPLATES } from '@/mocks/agentTemplates'
import { APPS } from '@/mocks/apps'
import type { AgentTemplate } from '@/models/AgentTemplate'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SelectedAgent {
  id:       number
  name:     string
  template: AgentTemplate
}

type Tab = 'overview' | 'chat'

interface ChatMessage {
  id:       string
  from:     'user' | 'agent'
  text:     string
  ts:       number
  pending?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AgentPopover() {
  const [agent, setAgent]     = useState<SelectedAgent | null>(null)
  const [tab, setTab]         = useState<Tab>('overview')
  const [history, setHistory] = useState<Record<number, ChatMessage[]>>({})
  const [draft, setDraft]     = useState('')
  const bottomRef             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = EventBus.on('agent-clicked', ({ id, name, templateId, tab }) => {
      const template = AGENT_TEMPLATES.find(t => t.id === templateId)
      if (!template) return
      setAgent({ id, name, template })
      setTab(tab ?? 'overview')
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = EventBus.on('agent-response', ({ messageId, agentId, text }) => {
      setHistory(prev => {
        const msgs = prev[agentId] ?? []
        const replaced = msgs.map(m =>
          m.id === `${messageId}-pending`
            ? { ...m, id: messageId, text, pending: false, from: 'agent' as const }
            : m
        )
        return { ...prev, [agentId]: replaced }
      })
    })
    return unsub
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, agent?.id])

  function handleClose() { setAgent(null); setDraft('') }

  function handleRemove() {
    if (!agent) return
    EventBus.emit('remove-agent', { id: agent.id })
    handleClose()
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!agent || !draft.trim()) return
    const messageId = `msg_${Date.now()}`
    setHistory(prev => ({
      ...prev,
      [agent.id]: [
        ...(prev[agent.id] ?? []),
        { id: messageId,              from: 'user',  text: draft.trim(), ts: Date.now() },
        { id: `${messageId}-pending`, from: 'agent', text: '…',         ts: Date.now(), pending: true },
      ],
    }))
    EventBus.emit('agent-message', { messageId, agentId: agent.id, text: draft.trim() })
    setDraft('')
  }

  if (!agent) return null

  const { template } = agent
  const messages = history[agent.id] ?? []

  return (
    <div data-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className={`relative flex flex-col w-full max-w-md bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden ${tab === 'chat' ? 'h-[520px]' : 'h-auto'}`}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.nativeEvent.stopImmediatePropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] hover:brightness-110 transition-[filter]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M10 2L2 10M2 2l8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"/>
          </svg>
        </button>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 shrink-0 bg-[#dcc898] border-b-4 border-[#7a5230]">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold border-2 border-[#7a5230]/40"
            style={{ background: template.color, color: '#3d2010' }}
          >
            {agent.name.charAt(0).toUpperCase()}
          </div>

          {/* Name + description */}
          <div className="flex-1 min-w-0 pt-0.5 pr-10">
            <h2 className="text-base font-bold text-[#3d2010] leading-tight truncate">
              {agent.name}
            </h2>
            <p className="text-xs text-[#7a5230] mt-0.5 leading-snug line-clamp-2">
              {template.description}
            </p>
          </div>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────── */}
        <div className="flex border-b-4 border-[#7a5230] px-5 shrink-0 bg-[#dcc898]">
          {(['overview', 'chat'] as Tab[]).map(t => (
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

        {/* ── Overview ───────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto">

            {/* Badges */}
            <div className="flex items-center gap-2">
              <span className="bg-[#c8b07a] border border-[#9a6b28] text-[#3d2010] text-xs font-bold px-2.5 py-1 rounded-md capitalize">
                {template.category}
              </span>
              <span className="bg-[#c8b07a] border border-[#9a6b28] text-[#3d2010] text-xs font-bold px-2.5 py-1 rounded-md">
                {template.name}
              </span>
            </div>

            {/* Skills */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-[#7a5230] uppercase tracking-widest">Skills</p>
              <div className="flex flex-col gap-1.5">
                {template.skills.map(skill => (
                  <div
                    key={skill.skillId}
                    className="flex items-center gap-3 rounded-lg bg-[#dcc898] border-2 border-[#9a6b28] px-3 py-2"
                  >
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 border border-[#7a5230]/30"
                      style={{ background: template.color + '55', color: '#3d2010' }}
                    >
                      {skill.order}
                    </span>
                    <span className="flex-1 text-sm text-[#3d2010] font-mono truncate">
                      {skill.skillId}
                    </span>
                    {!skill.isRequired && (
                      <span className="text-[10px] text-[#9a6b28] shrink-0 font-bold">optional</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Required apps */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-[#7a5230] uppercase tracking-widest">Required Apps</p>
              <div className="flex flex-wrap gap-2">
                {template.requiredIntegrations.map(appId => {
                  const app = APPS.find(a => a.id === appId)
                  return (
                    <div
                      key={appId}
                      className="flex items-center gap-2 rounded-lg bg-[#dcc898] border-2 border-[#9a6b28] px-3 py-1.5"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: app?.color ?? '#9a6b28' }} />
                      <span className="text-sm font-bold text-[#3d2010]">{app?.name ?? appId}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1 border-t-2 border-[#b8955a]">
              <button
                onClick={() => { EventBus.emit('select-agent', { id: agent.id }); handleClose() }}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm font-bold text-[#3d2010] border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] hover:brightness-110 transition-[filter]"
              >
                Take Control
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm font-bold text-[#f5e8d5] border-2 border-[#7a2828] bg-[#b84040] shadow-[inset_0_2px_0_0_#d86868,inset_0_-3px_0_0_#5a1818] hover:brightness-110 transition-[filter]"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* ── Chat ───────────────────────────────────────────────────── */}
        {tab === 'chat' && (
          <div className="flex flex-col flex-1 min-h-0">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold border-2 border-[#7a5230]/40 mb-1"
                    style={{ background: template.color, color: '#3d2010' }}
                  >
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-bold text-[#3d2010]">{agent.name}</p>
                  <p className="text-xs text-[#9a6b28]">Send a message to get started</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 py-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {msg.from === 'agent' && (
                        <div
                          className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold border border-[#7a5230]/40 mt-0.5"
                          style={{ background: template.color, color: '#3d2010' }}
                        >
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] px-3.5 py-2 rounded-xl text-sm leading-relaxed break-words border-2 font-medium ${
                          msg.from === 'user'
                            ? 'bg-[#7a5230] border-[#5a3810] text-[#f5edd5] rounded-tr-sm'
                            : 'bg-[#dcc898] border-[#9a6b28] text-[#3d2010] rounded-tl-sm'
                        } ${msg.pending ? 'opacity-60 italic' : ''}`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="px-5 py-3 border-t-4 border-[#7a5230] bg-[#dcc898] shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder={`Message ${agent.name}…`}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#f5edd5] border-2 border-[#9a6b28] text-[#3d2010] text-sm placeholder:text-[#b8955a] focus:outline-none focus:border-[#5a3810]"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="shrink-0 px-4 py-2 rounded-lg border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] text-sm font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-[filter]"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
