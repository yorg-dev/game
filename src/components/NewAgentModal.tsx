import { useState } from 'react'
import { AGENT_TEMPLATES } from '@/mocks/agentTemplates'
import type { AgentTemplate } from '@/models/AgentTemplate'

interface Props {
  onSubmit: (name: string, templateId: string) => void
  onCancel: () => void
}

type Step = 'choose-template' | 'name'

// ── Shared pixel-RPG button styles ───────────────────────────────────────────
const btnPrimary = 'px-4 py-1.5 rounded-lg border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] text-sm font-bold hover:brightness-110 active:shadow-[inset_0_-1px_0_0_#5a3810,inset_0_1px_0_0_#c8a060] disabled:opacity-40 disabled:cursor-not-allowed transition-[filter]'
const btnGhost   = 'px-4 py-1.5 rounded-lg border-2 border-[#9a6b28] bg-[#dcc898] text-[#5a3810] text-sm font-bold hover:bg-[#c8b07a] transition-colors'

const CancelButton = (props: { onCancel: () => void }) => {
  const { onCancel } = props

  return (
    <button
      onClick={onCancel}
      aria-label="Close"
      className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] hover:brightness-110 transition-[filter]"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M10 2L2 10M2 2l8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"/>
      </svg>
    </button>
  );
};

export function NewAgentModal(props: Props) {
  const { onSubmit, onCancel }  = props
  const [step, setStep]         = useState<Step>('choose-template')
  const [template, setTemplate] = useState<AgentTemplate | null>(null)
  const [name, setName]         = useState('')

  const title: string = "New Agent"

  function handleNext() {
    if (template) setStep('name')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !template) return
    onSubmit(name.trim(), template.id)
  }

  return (
    <div data-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="relative w-full max-w-lg bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.nativeEvent.stopImmediatePropagation()}
      >
        <CancelButton onCancel={onCancel} />

        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b-4 border-[#7a5230] bg-[#dcc898]">
          <h2 className="text-[#3d2010] font-bold text-base pr-10">{title}</h2>
          <div className="flex items-center gap-2 pt-1 text-xs text-[#7a5230]">
            <span className={step !== 'choose-template' ? 'line-through opacity-50' : 'font-bold'}>
              1 · Choose template
            </span>
            <span>›</span>
            <span className={step === 'name' ? 'font-bold' : 'opacity-50'}>
              2 · Name your agent
            </span>
          </div>
        </div>

        {/* Step 1: template grid */}
        {step === 'choose-template' && (
          <>
            <div className="grid grid-cols-2 gap-2 p-5 max-h-72 overflow-y-auto">
              {AGENT_TEMPLATES.filter(t => t.isPublished).map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t)}
                  className={`flex flex-col gap-1.5 rounded-lg border-2 p-3 text-left transition-colors ${
                    template?.id === t.id
                      ? 'border-[#5a3810] bg-[#c8b07a]'
                      : 'border-[#9a6b28] bg-[#dcc898] hover:border-[#7a5230] hover:bg-[#c8b07a]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-[#7a5230]/40" style={{ background: t.color }} />
                    <span className="text-[10px] border border-[#9a6b28] text-[#7a5230] bg-[#e8d5a8] px-1.5 py-0 rounded font-bold">
                      {t.category}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#3d2010] leading-tight">{t.name}</div>
                  <div className="text-xs text-[#7a5230] leading-snug line-clamp-2">{t.description}</div>
                  <div className="flex items-center justify-between mt-auto pt-1 text-[10px] text-[#9a6b28]">
                    <span>{t.skills.length} skill{t.skills.length !== 1 ? 's' : ''}</span>
                    <span className="truncate max-w-[8rem]">{t.requiredIntegrations.join(' · ')}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t-4 border-[#7a5230] bg-[#dcc898]">
              <button onClick={onCancel} className={btnGhost}>Cancel</button>
              <button disabled={!template} onClick={handleNext} className={btnPrimary}>Next ›</button>
            </div>
          </>
        )}

        {/* Step 2: name input */}
        {step === 'name' && template && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3 rounded-lg border-2 border-[#9a6b28] bg-[#dcc898] px-3 py-2">
              <span className="w-3 h-3 rounded-full shrink-0 border border-[#7a5230]/40" style={{ background: template.color }} />
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#3d2010]">{template.name}</div>
                <div className="text-xs text-[#7a5230]">
                  {template.skills.length} skills · {template.requiredIntegrations.join(' · ')}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="agent-name" className="text-xs font-bold text-[#7a5230] uppercase tracking-widest">Name</label>
              <input
                id="agent-name"
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter a name for this agent…"
                className="w-full px-3 py-2 rounded-lg bg-[#f5edd5] border-2 border-[#9a6b28] text-[#3d2010] text-sm placeholder:text-[#b8955a] focus:outline-none focus:border-[#5a3810] transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t-4 border-[#7a5230] bg-[#dcc898] -mx-5 -mb-4 px-5 py-4">
              <button type="button" onClick={() => setStep('choose-template')} className={btnGhost}>‹ Back</button>
              <button type="submit" disabled={!name.trim()} className={btnPrimary}>Create</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
