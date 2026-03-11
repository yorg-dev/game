import { useState, useEffect, useRef } from 'react'
import { EventBus } from '../game/EventBus'
import * as questStore from '../game/quest/questStore'
import { QuestBrowserModal } from './QuestBrowserModal'
import type { Quest } from '@/models/Quest'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="8" height="7" viewBox="0 0 8 7" fill="none" aria-hidden="true">
      <path d="M1 3.5L3 5.5L7 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuestTracker() {
  const [quests, setQuests] = useState<Quest[]>(() => questStore.getQuestsWithProgress())
  const [minimized, setMinimized] = useState(false)
  const [showBrowser, setShowBrowser] = useState(false)
  // ID of the quest currently showing the "complete" celebration
  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  // Which steps just completed (for per-step bounce animation)
  const [newlyDone, setNewlyDone] = useState<Set<string>>(new Set())
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize quest listeners and load definitions from the API once
  useEffect(() => {
    questStore.initQuestListeners()
    questStore.loadQuests()
  }, [])

  // Re-render when quest definitions are refreshed from the API
  useEffect(() => {
    const unsub = EventBus.on('quests-updated', () => {
      setQuests(questStore.getQuestsWithProgress())
    })
    return unsub
  }, [])

  // React to individual step completions
  useEffect(() => {
    const unsub = EventBus.on('quest-step-completed', ({ questId, stepId }) => {
      const updated = questStore.getQuestsWithProgress()
      setQuests(updated)

      // Flash the newly-completed step checkbox
      const key = `${questId}:${stepId}`
      setNewlyDone((prev) => new Set(prev).add(key))
      setTimeout(() => {
        setNewlyDone((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }, 800)

      // If the whole quest just finished, trigger celebration
      const quest = updated.find((q) => q.id === questId)
      if (quest?.status === 'completed') {
        if (celebrateTimer.current) clearTimeout(celebrateTimer.current)
        setCelebratingId(questId)
        celebrateTimer.current = setTimeout(() => {
          setCelebratingId(null)
        }, 3200)
      }
    })
    return unsub
  }, [])

  // Resolved display state
  const activeQuest = quests.find((q) => q.status === 'active')
  const celebratingQuest = celebratingId ? quests.find((q) => q.id === celebratingId) : null
  const nextQuest = celebratingId ? quests.find((q) => q.status === 'active') : null
  const displayQuest = celebratingQuest ?? activeQuest

  // Nothing to show once all quests are done
  if (!displayQuest && !celebratingId && !showBrowser) return null

  // ── Minimized pill ──────────────────────────────────────────────────────────
  if (minimized) {
    const doneCount = displayQuest?.steps.filter((s) => s.isComplete).length ?? 0
    const totalCount = displayQuest?.steps.length ?? 0
    return (
      <>
        <button
          onClick={() => setMinimized(false)}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl border-4 border-[#7a5230] bg-[#e8d5a8] shadow-[inset_0_0_0_3px_#f5edd5] text-[#3d2010] text-xs font-bold hover:brightness-105 active:brightness-95 transition-[filter]"
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
            : 'border-[#7a5230] bg-[#e8d5a8] shadow-[inset_0_0_0_3px_#f5edd5]'
        }`}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className={`flex items-center justify-between px-4 py-2 border-b-4 transition-colors duration-500 ${
            isCelebrating ? 'bg-[#e8a830] border-[#8b6c2a]' : 'bg-[#dcc898] border-[#7a5230]'
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${
              isCelebrating ? 'text-[#3d2010]' : 'text-[#7a5230]'
            }`}
          >
            {isCelebrating ? '✓ Quest Complete!' : 'Active Quest'}
          </span>
          <button
            onClick={() => setMinimized(true)}
            aria-label="Minimize quest tracker"
            className="w-5 h-5 flex items-center justify-center rounded text-[#9a6b28] hover:text-[#3d2010] transition-colors text-base leading-none"
          >
            ─
          </button>
        </div>

        {/* ── Quest body ─────────────────────────────────────────────────── */}
        {displayQuest && (
          <div className="px-4 py-3 flex flex-col gap-2.5">
            {/* Title + description */}
            <div>
              <p className="text-sm font-bold text-[#3d2010] leading-tight">{displayQuest.title}</p>
              <p className="text-[10px] text-[#7a5230] mt-0.5 leading-snug">
                {displayQuest.description}
              </p>
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-1.5">
              {displayQuest.steps.map((step) => {
                const isNew = newlyDone.has(`${displayQuest.id}:${step.id}`)
                return (
                  <div key={step.id} className="flex items-center gap-2.5">
                    {/* Checkbox */}
                    <div
                      className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                        step.isComplete
                          ? `border-[#4a7c20] bg-[#5a9c28] ${isNew ? 'scale-125' : 'scale-100'}`
                          : 'border-[#9a6b28] bg-[#dcc898] scale-100'
                      }`}
                    >
                      {step.isComplete && <CheckIcon />}
                    </div>

                    {/* Label */}
                    <span
                      className={`text-xs leading-snug transition-colors ${
                        step.isComplete
                          ? 'text-[#7a7050] line-through'
                          : 'text-[#3d2010] font-medium'
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

        {/* ── Next quest unlock banner ────────────────────────────────────── */}
        {isCelebrating && nextQuest && (
          <div className="px-4 pb-3 -mt-1">
            <div className="rounded-lg bg-[#e8a830] border-2 border-[#8b6c2a] px-3 py-2">
              <p className="text-[10px] font-bold text-[#3d2010]">🔓 Unlocked: {nextQuest.title}</p>
              <p className="text-[10px] text-[#5a3810] mt-0.5">{nextQuest.description}</p>
            </div>
          </div>
        )}

        {/* ── Browse all quests button ────────────────────────────────────── */}
        <div className={`px-4 pb-3 ${displayQuest || (isCelebrating && nextQuest) ? '' : 'pt-1'}`}>
          <button
            onClick={() => setShowBrowser(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed border-[#b8955a] text-xs text-[#9a6b28] font-bold hover:border-[#7a5230] hover:text-[#5a3810] hover:bg-[#dcc898] transition-colors"
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
