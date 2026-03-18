import { useState } from 'react'
import type { Quest, QuestStatus } from '@/models/Quest'

type FilterTab = 'all' | 'active' | 'completed'

const STATUS_LABEL: Record<QuestStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  locked: 'Locked',
}

const STATUS_STYLE: Record<QuestStatus, string> = {
  active: 'border-[#4a7c20] bg-[#5a9c28] text-white',
  completed: 'border-[#8b6c2a] bg-[#c8974c] text-[#3d2010]',
  locked: 'border-[#9a6b28] bg-[#dcc898] text-[#7a5230]',
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
]

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="w-full h-2 rounded-full bg-[#c8b07a] border border-[#9a6b28] overflow-hidden">
      <div
        className="h-full rounded-full bg-[#5a9c28] transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="8" height="7" viewBox="0 0 8 7" fill="none" aria-hidden="true">
      <path d="M1 3.5L3 5.5L7 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true">
      <rect x="1" y="5" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 5V3.5a2 2 0 0 1 4 0V5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  )
}

export function QuestCard({ quest, index }: { quest: Quest; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const doneCount = quest.steps.filter((s) => s.isComplete).length
  const isLocked = quest.status === 'locked'

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden transition-opacity ${
        isLocked ? 'opacity-60' : 'opacity-100'
      } border-[#9a6b28] bg-[#dcc898]`}
    >
      <button
        onClick={() => !isLocked && setExpanded((v) => !v)}
        disabled={isLocked}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#c8b07a] disabled:cursor-not-allowed transition-colors"
      >
        <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border-2 border-[#9a6b28] bg-[#e8d5a8] text-[11px] font-bold text-[#7a5230] mt-0.5">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#3d2010]">{quest.title}</span>
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${STATUS_STYLE[quest.status]}`}
            >
              {isLocked && <LockIcon />}
              {STATUS_LABEL[quest.status]}
            </span>
          </div>

          <p className="text-xs text-[#7a5230] mt-0.5 leading-snug">{quest.description}</p>

          {!isLocked && (
            <div className="mt-2 flex items-center gap-2">
              <ProgressBar done={doneCount} total={quest.steps.length} />
              <span className="text-[10px] font-bold text-[#7a5230] shrink-0 tabular-nums">
                {doneCount}/{quest.steps.length}
              </span>
            </div>
          )}

          {isLocked && (
            <p className="text-[10px] text-[#9a6b28] mt-1 italic">
              Complete the previous quest to unlock
            </p>
          )}
        </div>

        {!isLocked && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className={`shrink-0 mt-1.5 text-[#9a6b28] transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
          >
            <path
              d="M1 3l4 4 4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
        )}
      </button>

      {expanded && !isLocked && (
        <div className="border-t-2 border-[#9a6b28] px-4 py-3 flex flex-col gap-2">
          {quest.steps.map((step) => (
            <div key={step.id} className="flex items-start gap-3">
              <div
                className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  step.isComplete
                    ? 'border-[#4a7c20] bg-[#5a9c28]'
                    : 'border-[#9a6b28] bg-[#e8d5a8]'
                }`}
              >
                {step.isComplete && <CheckIcon />}
              </div>
              <span
                className={`text-xs leading-snug ${
                  step.isComplete ? 'text-[#7a7050] line-through' : 'text-[#3d2010] font-medium'
                }`}
              >
                {step.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  quests: Quest[]
  onClose: () => void
}

export function QuestBrowserModal({ quests, onClose }: Props) {
  const [filter, setFilter] = useState<FilterTab>('all')

  const counts: Record<FilterTab, number> = {
    all: quests.length,
    active: quests.filter((q) => q.status === 'active').length,
    completed: quests.filter((q) => q.status === 'completed').length,
  }

  const visible = quests.filter((q) => {
    if (filter === 'all') return true
    if (filter === 'active') return q.status === 'active' || q.status === 'locked'
    return q.status === 'completed'
  })

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-lg max-h-[80vh] bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#dcc898] border-b-4 border-[#7a5230] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#3d2010]">Quests</h2>
            <p className="text-xs text-[#7a5230] mt-0.5">
              {counts.completed} of {counts.all} completed
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] hover:brightness-110 transition-[filter]"
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

        {/* Filter tabs */}
        <div className="flex border-b-4 border-[#7a5230] shrink-0 bg-[#dcc898]">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`relative flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:transition-all ${
                filter === key
                  ? 'text-[#3d2010] after:bg-[#7a5230]'
                  : 'text-[#9a6b28] hover:text-[#5a3810] after:bg-transparent'
              }`}
            >
              {label}
              {counts[key] > 0 && (
                <span className="ml-1 text-[10px] font-bold text-[#9a6b28] tabular-nums">
                  ({counts[key]})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Quest list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {visible.length === 0 ? (
            <p className="text-center text-xs text-[#9a6b28] italic py-8">
              {filter === 'completed' ? 'No completed quests yet.' : 'No quests found.'}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {visible.map((quest) => (
                <QuestCard key={quest.id} quest={quest} index={quests.indexOf(quest)} />
              ))}
            </div>
          )}
        </div>

        {/* Overall progress bar */}
        <div className="shrink-0 border-t-4 border-[#7a5230] bg-[#dcc898] px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[#7a5230] uppercase tracking-wider shrink-0">
              Overall
            </span>
            <ProgressBar done={counts.completed} total={counts.all} />
            <span className="text-[10px] font-bold text-[#7a5230] shrink-0 tabular-nums">
              {counts.all > 0 ? Math.round((counts.completed / counts.all) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
