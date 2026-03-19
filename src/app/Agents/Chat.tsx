import type { RefObject } from 'react'
import type { AgentTemplate } from '@/models/AgentTemplate'
import type { ChatMessage } from './types'
import { gameBtn, gameInput } from '@/components/ui/game-dialog'

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
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold border-2 border-wood-700/40 mb-1"
              style={{ background: template.color, color: '#3d2010' }}
            >
              {agentName.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-bold text-soil-800">{agentName}</p>
            <p className="text-xs text-wood-600">Send a message to get started</p>
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
                    className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold border border-wood-700/40 mt-0.5"
                    style={{ background: template.color, color: '#3d2010' }}
                  >
                    {agentName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3.5 py-2 rounded-xl text-sm leading-relaxed break-words border-2 font-medium ${
                    msg.from === 'user'
                      ? 'bg-wood-700 border-wood-900 text-parchment-50 rounded-tr-sm'
                      : 'bg-parchment-250 border-wood-600 text-soil-800 rounded-tl-sm'
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
      <div className="px-5 py-3 border-t-4 border-wood-700 bg-parchment-250 shrink-0">
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Message ${agentName}…`}
            className={`flex-1 ${gameInput}`}
          />
          <button type="submit" disabled={!draft.trim()} className={`shrink-0 ${gameBtn}`}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
