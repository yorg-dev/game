import { useState, useEffect, useRef } from 'react'
import { useGetList } from 'ra-core'
import { EventBus } from '@/game/EventBus'
import * as questStore from '@/game/quest/questStore'
import { QuestBrowserModal } from './Browser'
import type { Quest } from '@/models/Quest'

function CheckIcon() {
  return (
    <svg width="8" height="7" viewBox="0 0 8 7" fill="none" aria-hidden="true">
      <path d="M1 3.5L3 5.5L7 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  )
}

export function QuestTracker() {
  const [quests, setQuests] = useState<Quest[]>(() => questStore.getQuestsWithProgress())
  const [minimized, setMinimized] = useState(false)
  const [showBrowser, setShowBrowser] = useState(false)
  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  const [newlyDone, setNewlyDone] = useState<Set<string>>(new Set())
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: questDefs } = useGetList<Quest>('quests', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'id', order: 'ASC' },
  })

  useEffect(() => {
    questStore.initQuestListeners()
  }, [])

  useEffect(() => {
    if (questDefs && questDefs.length > 0) {
      questStore.setQuests(questDefs)
      setQuests(questStore.getQuestsWithProgress())
    }
  }, [questDefs])

  useEffect(() => {
    return EventBus.on('quests-updated', () => {
      setQuests(questStore.getQuestsWithProgress())
    })
  }, [])

  useEffect(() => {
    return EventBus.on('quest-step-completed', ({ questId, stepId }) => {
      const updated = questStore.getQuestsWithProgress()
      setQuests(updated)

      const key = `${questId}:${stepId}`
      setNewlyDone((prev) => new Set(prev).add(key))
      setTimeout(() => {
        setNewlyDone((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }, 800)

      const quest = updated.find((q) => q.id === questId)
      if (quest?.status === 'completed') {
        if (celebrateTimer.current) clearTimeout(celebrateTimer.current)
        setCelebratingId(questId)
        celebrateTimer.current = setTimeout(() => {
          setCelebratingId(null)
        }, 3200)
      }
    })
  }, [])

  const activeQuest = quests.find((q) => q.status === 'active')
  const celebratingQuest = celebratingId ? quests.find((q) => q.id === celebratingId) : null
  const nextQuest = celebratingId ? quests.find((q) => q.status === 'active') : null
  const displayQuest = celebratingQuest ?? activeQuest

  if (!displayQuest && !celebratingId && !showBrowser) return null

  // ── Minimized pill ──────────────────────────────────────────────────────────
  if (minimized) {
    const doneCount = displayQuest?.steps.filter((s) => s.is_complete).length ?? 0
    const totalCount = displayQuest?.steps.length ?? 0
    return (
      <>
        <button
          onClick={() => setMinimized(false)}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl border-4 border-wood-700 bg-parchment-150 shadow-[inset_0_0_0_3px_var(--color-parchment-50)] text-soil-800 text-xs font-bold hover:brightness-105 active:brightness-95 transition-[filter]"
          title="Show quest tracker"
        >
          <span className="text-sm leading-none">📋</span>
          <span className="leading-none">
            {doneCount}/{totalCount}
          </span>
        </button>
        {showBrowser && <QuestBrowserModal quests={quests} onClose={() => setShowBrowser(false)} />}
      </>
    )
  }

  const isCelebrating = !!celebratingId

  // ── Full panel ──────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={`fixed bottom-4 left-4 z-40 w-56 rounded-2xl border-4 overflow-hidden transition-colors duration-500 ${
          isCelebrating
            ? 'border-[#8b6c2a] bg-[#f5c84a] shadow-[inset_0_0_0_3px_#ffe88a]'
            : 'border-wood-700 bg-parchment-150 shadow-[inset_0_0_0_3px_var(--color-parchment-50)]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-2 border-b-4 transition-colors duration-500 ${
            isCelebrating ? 'bg-[#e8a830] border-[#8b6c2a]' : 'bg-parchment-250 border-wood-700'
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${
              isCelebrating ? 'text-soil-800' : 'text-wood-700'
            }`}
          >
            {isCelebrating ? '✓ Quest Complete!' : 'Active Quest'}
          </span>
          <button
            onClick={() => setMinimized(true)}
            aria-label="Minimize quest tracker"
            className="w-5 h-5 flex items-center justify-center rounded text-wood-600 hover:text-soil-800 transition-colors text-base leading-none"
          >
            ─
          </button>
        </div>

        {/* Quest body */}
        {displayQuest && (
          <div className="px-4 py-3 flex flex-col gap-2.5">
            <div>
              <p className="text-sm font-bold text-soil-800 leading-tight">{displayQuest.title}</p>
              <p className="text-[10px] text-wood-700 mt-0.5 leading-snug">
                {displayQuest.description}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              {displayQuest.steps.map((step) => {
                const isNew = newlyDone.has(`${displayQuest.id}:${step.id}`)
                return (
                  <div key={step.id} className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                        step.is_complete
                          ? `border-grass-700 bg-grass-600 ${isNew ? 'scale-125' : 'scale-100'}`
                          : 'border-wood-600 bg-parchment-250 scale-100'
                      }`}
                    >
                      {step.is_complete && <CheckIcon />}
                    </div>
                    <span
                      className={`text-xs leading-snug transition-colors ${
                        step.is_complete
                          ? 'text-[#7a7050] line-through'
                          : 'text-soil-800 font-medium'
                      }`}
                    >
                      {step.description}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Next quest unlock banner */}
        {isCelebrating && nextQuest && (
          <div className="px-4 pb-3 -mt-1">
            <div className="rounded-lg bg-[#e8a830] border-2 border-[#8b6c2a] px-3 py-2">
              <p className="text-[10px] font-bold text-soil-800">🔓 Unlocked: {nextQuest.title}</p>
              <p className="text-[10px] text-wood-900 mt-0.5">{nextQuest.description}</p>
            </div>
          </div>
        )}

        {/* Browse all quests */}
        <div className={`px-4 pb-3 ${displayQuest || (isCelebrating && nextQuest) ? '' : 'pt-1'}`}>
          <button
            onClick={() => setShowBrowser(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed border-parchment-500 text-xs text-wood-600 font-bold hover:border-wood-700 hover:text-wood-900 hover:bg-parchment-250 transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <rect
                x="0.5"
                y="0.5"
                width="3.5"
                height="3.5"
                rx="0.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect
                x="6"
                y="0.5"
                width="3.5"
                height="3.5"
                rx="0.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect
                x="0.5"
                y="6"
                width="3.5"
                height="3.5"
                rx="0.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect
                x="6"
                y="6"
                width="3.5"
                height="3.5"
                rx="0.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            Browse all quests
          </button>
        </div>
      </div>

      {showBrowser && <QuestBrowserModal quests={quests} onClose={() => setShowBrowser(false)} />}
    </>
  )
}
