import type { RefObject } from 'react'
import type { AgentTemplate } from '@/models/AgentTemplate'
import type { ChatMessage } from './types'

interface AgentChatProps {
  agentId: number
  agentName: string
  template: AgentTemplate
  messages: ChatMessage[]
  draft: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  bottomRef: RefObject<HTMLDivElement | null>
}

export function AgentChat({
  agentName,
  template,
  messages,
  draft,
  onChange,
  onSubmit,
  bottomRef,
}: AgentChatProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold border-2 border-[#7a5230]/40 mb-1"
              style={{ background: template.color, color: '#3d2010' }}
            >
              {agentName.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-bold text-[#3d2010]">{agentName}</p>
            <p className="text-xs text-[#9a6b28]">Send a message to get started</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {msg.from === 'agent' && (
                  <div
                    className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold border border-[#7a5230]/40 mt-0.5"
                    style={{ background: template.color, color: '#3d2010' }}
                  >
                    {agentName.charAt(0).toUpperCase()}
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
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Message ${agentName}…`}
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
  )
}
