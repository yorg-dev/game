import { useState } from 'react'
import type { AgentTemplate } from '@/models/AgentTemplate'
import { getAgentTemplates } from '@/game/agentTemplates/agentTemplateStore'
import {
  GameDialog,
  GameDialogContent,
  GameDialogHeader,
  GameDialogTitle,
  GameDialogFooter,
  gameBtn,
  gameBtnGhost,
  gameInput,
} from '@/components/ui/game-dialog'

interface Props {
  onSubmit: (name: string, templateId: string) => void
  onCancel: () => void
}

type Step = 'choose-template' | 'name'

function TemplateGrid({
  templates,
  selected,
  onSelect,
}: {
  templates: AgentTemplate[]
  selected: AgentTemplate | null
  onSelect: (t: AgentTemplate) => void
}) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-2xl">🤖</p>
        <p className="text-sm font-bold text-soil-800">No agent templates available</p>
        <p className="text-xs text-wood-600">Check back later</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-5 max-h-72 overflow-y-auto">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t)}
          className={`flex flex-col gap-1.5 rounded-lg border-2 p-3 text-left transition-colors ${
            selected?.id === t.id
              ? 'border-wood-900 bg-parchment-400'
              : 'border-wood-600 bg-parchment-250 hover:border-wood-700 hover:bg-parchment-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-wood-700/40"
              style={{ background: t.color }}
            />
            <span className="text-[10px] border border-wood-600 text-wood-700 bg-parchment-150 px-1.5 py-0 rounded font-bold">
              {t.category}
            </span>
          </div>
          <div className="text-sm font-bold text-soil-800 leading-tight">{t.name}</div>
          <div className="text-xs text-wood-700 leading-snug line-clamp-2">{t.description}</div>
          <div className="flex items-center justify-between mt-auto pt-1 text-[10px] text-wood-600">
            <span>
              {t.skills.length} skill{t.skills.length !== 1 ? 's' : ''}
            </span>
            <span className="truncate max-w-[8rem]">{t.required_integrations.join(' · ')}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

export function NewAgentModal({ onSubmit, onCancel }: Props) {
  const [step, setStep] = useState<Step>('choose-template')
  const [template, setTemplate] = useState<AgentTemplate | null>(null)
  const [name, setName] = useState('')

  const templates = getAgentTemplates().filter((t) => t.is_published)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !template) return
    onSubmit(name.trim(), template.id)
  }

  return (
    <GameDialog open onOpenChange={(o) => !o && onCancel()}>
      <GameDialogContent className="max-w-lg">
        <GameDialogHeader className="pr-10">
          <GameDialogTitle>New Agent</GameDialogTitle>
          <div className="flex items-center gap-2 pt-1 text-xs text-wood-700">
            <span className={step !== 'choose-template' ? 'line-through opacity-50' : 'font-bold'}>
              1 · Choose template
            </span>
            <span>›</span>
            <span className={step === 'name' ? 'font-bold' : 'opacity-50'}>
              2 · Name your agent
            </span>
          </div>
        </GameDialogHeader>

        {/* Step 1: template grid */}
        {step === 'choose-template' && (
          <>
            <TemplateGrid templates={templates} selected={template} onSelect={setTemplate} />
            <GameDialogFooter>
              <button onClick={onCancel} className={gameBtnGhost}>
                Cancel
              </button>
              <button
                disabled={!template}
                onClick={() => template && setStep('name')}
                className={gameBtn}
              >
                Next ›
              </button>
            </GameDialogFooter>
          </>
        )}

        {/* Step 2: name input */}
        {step === 'name' && template && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3 rounded-lg border-2 border-wood-600 bg-parchment-250 px-3 py-2">
              <span
                className="w-3 h-3 rounded-full shrink-0 border border-wood-700/40"
                style={{ background: template.color }}
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-soil-800">{template.name}</div>
                <div className="text-xs text-wood-700">
                  {template.skills.length} skills · {template.required_integrations.join(' · ')}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="agent-name"
                className="text-xs font-bold text-wood-700 uppercase tracking-widest"
              >
                Name
              </label>
              <input
                id="agent-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name for this agent…"
                className={gameInput}
              />
            </div>

            <GameDialogFooter className="-mx-5 -mb-4">
              <button
                type="button"
                onClick={() => setStep('choose-template')}
                className={gameBtnGhost}
              >
                ‹ Back
              </button>
              <button type="submit" disabled={!name.trim()} className={gameBtn}>
                Create
              </button>
            </GameDialogFooter>
          </form>
        )}
      </GameDialogContent>
    </GameDialog>
  )
}
