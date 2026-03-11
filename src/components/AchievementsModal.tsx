import { useState, useEffect } from 'react'
import { EventBus } from '../game/EventBus'
import * as achievementStore from '../game/achievements/achievementStore'
import type { Achievement, AchievementRarity } from '@/models/Achievement'

// ─── Styles ───────────────────────────────────────────────────────────────────

const RARITY_STYLE: Record<AchievementRarity, { border: string; badge: string; label: string }> = {
  common: {
    border: 'border-[#9a6b28]',
    badge: 'bg-[#dcc898] border-[#9a6b28] text-[#5a3810]',
    label: 'Common',
  },
  rare: {
    border: 'border-[#5a7cb8]',
    badge: 'bg-[#c8ddf5] border-[#5a7cb8] text-[#1a3870]',
    label: 'Rare',
  },
  epic: {
    border: 'border-[#8a50b8]',
    badge: 'bg-[#e8c8f5] border-[#8a50b8] text-[#4a1870]',
    label: 'Epic',
  },
  legendary: {
    border: 'border-[#c8900a]',
    badge: 'bg-[#fff0c0] border-[#c8900a] text-[#703000]',
    label: 'Legendary',
  },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const earned = !!achievement.unlockedAt
  const s = RARITY_STYLE[achievement.rarity]

  return (
    <div
      className={`relative flex flex-col gap-2 p-3 rounded-xl border-2 bg-[#dcc898] transition-opacity ${s.border} ${earned ? 'opacity-100' : 'opacity-45'}`}
    >
      {/* Icon */}
      <div className="text-2xl leading-none">{earned ? achievement.icon : '🔒'}</div>

      {/* Title + rarity */}
      <div>
        <p className={`text-xs font-bold leading-tight ${earned ? 'text-[#3d2010]' : 'text-[#7a5230]'}`}>
          {achievement.title}
        </p>
        <span
          className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${s.badge}`}
        >
          {s.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-[10px] text-[#7a5230] leading-snug">{achievement.description}</p>

      {/* Unlock date */}
      {earned && achievement.unlockedAt && (
        <p className="text-[9px] font-mono text-[#9a6b28] mt-auto">
          {formatDate(achievement.unlockedAt)}
        </p>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'earned' | 'locked'

const CATEGORY_LABELS: Record<string, string> = {
  exploration: '🗺️ Exploration',
  agents: '🤖 Agents',
  social: '💬 Social',
  quests: '📜 Quests',
  mastery: '👑 Mastery',
}

export function AchievementsModal() {
  const [open, setOpen] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>(() =>
    achievementStore.getAchievementsWithProgress(),
  )
  const [filter, setFilter] = useState<FilterTab>('all')
  const [category, setCategory] = useState<string | null>(null)

  useEffect(() => {
    achievementStore.initAchievementListeners()
    achievementStore.loadAchievements()
  }, [])

  useEffect(() => {
    const unsubShow = EventBus.on('show-achievements', () => setOpen(true))
    const unsubUpdated = EventBus.on('achievements-updated', () =>
      setAchievements(achievementStore.getAchievementsWithProgress()),
    )
    const unsubUnlocked = EventBus.on('achievement-unlocked', () =>
      setAchievements(achievementStore.getAchievementsWithProgress()),
    )
    return () => {
      unsubShow()
      unsubUpdated()
      unsubUnlocked()
    }
  }, [])

  if (!open) return null

  const earned = achievements.filter((a) => !!a.unlockedAt)
  const locked = achievements.filter((a) => !a.unlockedAt)

  const byStatus =
    filter === 'earned' ? earned : filter === 'locked' ? locked : achievements

  const categories = Array.from(new Set(achievements.map((a) => a.category))).filter(Boolean)

  const visible = category ? byStatus.filter((a) => a.category === category) : byStatus

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: achievements.length },
    { key: 'earned', label: 'Earned', count: earned.length },
    { key: 'locked', label: 'Locked', count: locked.length },
  ]

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative flex flex-col w-full max-w-lg max-h-[82vh] bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#dcc898] border-b-4 border-[#7a5230] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#3d2010]">Achievements</h2>
            <p className="text-xs text-[#7a5230] mt-0.5">
              {earned.length} of {achievements.length} earned
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
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

        {/* ── Status tabs ─────────────────────────────────────────────── */}
        <div className="flex border-b-2 border-[#7a5230] shrink-0 bg-[#dcc898]">
          {TABS.map(({ key, label, count }) => (
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
              <span className="ml-1 text-[10px] tabular-nums">({count})</span>
            </button>
          ))}
        </div>

        {/* ── Category filter ──────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b-4 border-[#7a5230] shrink-0 bg-[#dcc898]">
          <button
            onClick={() => setCategory(null)}
            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
              category === null
                ? 'bg-[#7a5230] border-[#5a3810] text-[#f5edd5]'
                : 'bg-[#c8b07a] border-[#9a6b28] text-[#5a3810] hover:bg-[#baa068]'
            }`}
          >
            All categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === category ? null : cat)}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                category === cat
                  ? 'bg-[#7a5230] border-[#5a3810] text-[#f5edd5]'
                  : 'bg-[#c8b07a] border-[#9a6b28] text-[#5a3810] hover:bg-[#baa068]'
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* ── Achievement grid ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-3xl">{filter === 'earned' ? '🔒' : '🏆'}</p>
              <p className="text-sm font-bold text-[#3d2010]">
                {filter === 'earned' ? 'Nothing earned yet' : 'All unlocked!'}
              </p>
              <p className="text-xs text-[#9a6b28]">
                {filter === 'earned' ? 'Keep playing to earn achievements.' : 'You did it!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {visible.map((a) => (
                <AchievementCard key={a.id} achievement={a} />
              ))}
            </div>
          )}
        </div>

        {/* ── Progress bar ────────────────────────────────────────────── */}
        <div className="shrink-0 border-t-4 border-[#7a5230] bg-[#dcc898] px-5 py-3 flex items-center gap-3">
          <span className="text-[10px] font-bold text-[#7a5230] uppercase tracking-wider shrink-0">
            Progress
          </span>
          <div className="flex-1 h-2 rounded-full bg-[#c8b07a] border border-[#9a6b28] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#c8974c] transition-all duration-500"
              style={{
                width:
                  achievements.length > 0
                    ? `${Math.round((earned.length / achievements.length) * 100)}%`
                    : '0%',
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-[#7a5230] shrink-0 tabular-nums">
            {achievements.length > 0
              ? `${Math.round((earned.length / achievements.length) * 100)}%`
              : '0%'}
          </span>
        </div>
      </div>
    </div>
  )
}
