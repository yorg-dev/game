// ---------------------------------------------------------------------------
// AgentExecutionPanel
//
// Floating panel (bottom-right) that shows a live skill-by-skill execution
// view when an agent acknowledges a command.  This is the product's defining
// moment: the user can watch each tool call fire in real time.
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef } from 'react'
import { EventBus } from '@/game/EventBus'
import { findAgentTemplate } from '@/game/agentTemplates/agentTemplateStore'

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = 'waiting' | 'running' | 'done'

interface StepState {
  skillId: string
  status: StepStatus
}

interface ExecutionState {
  agentId: number
  agentName: string
  templateColor: string
  command: string
  steps: StepState[]
  complete: boolean
  summary: string
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="5"
        cy="5"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="14"
        strokeDashoffset="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="8" height="7" viewBox="0 0 8 7" fill="none" aria-hidden="true">
      <path d="M1 3.5L3 5.5L7 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AgentExecutionPanel() {
  const [state, setState] = useState<ExecutionState | null>(null)
  const [mounted, setMounted] = useState(false)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubExec = EventBus.on(
      'agent-executing',
      ({ agentId, agentName, templateId, command, steps }) => {
        if (dismissTimer.current) clearTimeout(dismissTimer.current)
        const template = findAgentTemplate(templateId)
        setState({
          agentId,
          agentName,
          templateColor: template?.color ?? '#9a6b28',
          command,
          steps: steps.map((skillId) => ({ skillId, status: 'waiting' })),
          complete: false,
          summary: '',
        })
        // Tick to next frame so the CSS transition fires from the initial state.
        requestAnimationFrame(() => setMounted(true))
      },
    )

    const unsubProgress = EventBus.on('agent-step-progress', ({ agentId, stepIndex, status }) => {
      setState((prev) => {
        if (!prev || prev.agentId !== agentId) return prev
        const steps = prev.steps.map((s, i) => (i === stepIndex ? { ...s, status } : s))
        return { ...prev, steps }
      })
    })

    const unsubComplete = EventBus.on('agent-execution-complete', ({ agentId, summary }) => {
      setState((prev) => {
        if (!prev || prev.agentId !== agentId) return prev
        return { ...prev, complete: true, summary }
      })
      dismissTimer.current = setTimeout(() => {
        setMounted(false)
        setTimeout(() => setState(null), 350)
      }, 4000)
    })

    return () => {
      unsubExec()
      unsubProgress()
      unsubComplete()
    }
  }, [])

  function dismiss() {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    setMounted(false)
    setTimeout(() => setState(null), 350)
  }

  if (!state) return null

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 w-64 rounded-2xl border-4 border-wood-700 bg-parchment-150 shadow-[inset_0_0_0_3px_var(--color-parchment-50)] overflow-hidden transition-all duration-300 ${
        mounted ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-2.5 px-4 py-2.5 border-b-4 border-wood-700 transition-colors duration-500 ${
          state.complete ? 'bg-[#b8d890]' : 'bg-parchment-250'
        }`}
      >
        <div
          className="w-3 h-3 rounded-full shrink-0 border border-wood-700/40"
          style={{ background: state.templateColor }}
        />
        <span className="flex-1 text-sm font-bold text-soil-800 truncate">{state.agentName}</span>
        {state.complete && (
          <span className="text-[10px] font-bold text-[#3a6010] uppercase tracking-wider shrink-0">
            ✓ Done
          </span>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="w-5 h-5 flex items-center justify-center text-wood-600 hover:text-soil-800 transition-colors shrink-0"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path
              d="M1 1l6 6M7 1l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
        </button>
      </div>

      {/* ── Command label ───────────────────────────────────────────────────── */}
      <div className="px-4 pt-2.5 pb-2 border-b-2 border-parchment-400">
        <p className="text-[9px] font-bold text-wood-700 uppercase tracking-widest mb-0.5">
          Command
        </p>
        <p className="text-xs text-soil-800 font-medium leading-snug line-clamp-2">
          &ldquo;{state.command}&rdquo;
        </p>
      </div>

      {/* ── Skill steps ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {state.steps.map((step, i) => (
          <div key={`${step.skillId}-${i}`} className="flex items-center gap-2.5">
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                step.status === 'done'
                  ? 'border-grass-700 bg-grass-600'
                  : step.status === 'running'
                    ? 'border-[#b87820] bg-[#e8a830] text-soil-800'
                    : 'border-wood-600 bg-parchment-250 text-wood-600'
              }`}
            >
              {step.status === 'done' ? (
                <CheckIcon />
              ) : step.status === 'running' ? (
                <SpinnerIcon />
              ) : (
                <span className="text-[9px] font-bold leading-none">{i + 1}</span>
              )}
            </div>
            <span
              className={`text-[11px] font-mono leading-tight transition-colors duration-200 ${
                step.status === 'done'
                  ? 'text-[#7a7050] line-through'
                  : step.status === 'running'
                    ? 'text-soil-800 font-bold'
                    : 'text-wood-600'
              }`}
            >
              {step.skillId}
            </span>
          </div>
        ))}
      </div>

      {/* ── Completion summary ──────────────────────────────────────────────── */}
      {state.complete && (
        <div className="px-4 pb-3 -mt-1">
          <div className="rounded-lg bg-[#c8e8a0] border-2 border-[#6a9c30] px-3 py-2">
            <p className="text-[10px] font-bold text-[#3a6010]">Task complete</p>
            {state.summary && (
              <p className="text-[10px] text-[#3a6010] mt-0.5 leading-snug line-clamp-2">
                {state.summary}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
