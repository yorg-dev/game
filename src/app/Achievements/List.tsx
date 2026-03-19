import { useState, useEffect } from 'react'
import { ListBase, useListContext } from 'ra-core'
import { EventBus } from '@/game/EventBus'
import * as achievementStore from '@/game/achievements/achievementStore'
import type { Achievement, AchievementRarity } from '@/models/Achievement'
import {
  GameDialog,
  GameDialogContent,
  GameDialogHeader,
  GameDialogTitle,
  GameDialogDescription,
} from '@/components/ui/game-dialog'

const RARITY_STYLE: Record<AchievementRarity, { border: string; badge: string; label: string }> = {
  common: {
    border: 'border-wood-600',
    badge: 'bg-parchment-250 border-wood-600 text-wood-900',
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

const CATEGORY_LABELS: Record<string, string> = {
  exploration: '🗺️ Exploration',
  agents: '🤖 Agents',
  social: '💬 Social',
  quests: '📜 Quests',
  mastery: '👑 Mastery',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const earned = !!achievement.unlocked_at
  const s = RARITY_STYLE[achievement.rarity]

  return (
    <div
      className={`relative flex flex-col gap-2 p-3 rounded-xl border-2 bg-parchment-250 transition-opacity ${s.border} ${earned ? 'opacity-100' : 'opacity-45'}`}
    >
      <div className="text-2xl leading-none">{earned ? achievement.icon : '🔒'}</div>

      <div>
        <p
          className={`text-xs font-bold leading-tight ${earned ? 'text-soil-800' : 'text-wood-700'}`}
        >
          {achievement.title}
        </p>
        <span
          className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${s.badge}`}
        >
          {s.label}
        </span>
      </div>

      <p className="text-[10px] text-wood-700 leading-snug">{achievement.description}</p>

      {earned && achievement.unlocked_at && (
        <p className="text-[9px] font-mono text-wood-600 mt-auto">
          {formatDate(achievement.unlocked_at)}
        </p>
      )}
    </div>
  )
}

type FilterTab = 'all' | 'earned' | 'locked'

function AchievementGrid() {
  const { data: achievementDefs } = useListContext<Achievement>()

  const [achievements, setAchievements] = useState<Achievement[]>(() =>
    achievementStore.getAchievementsWithProgress(),
  )
  const [filter, setFilter] = useState<FilterTab>('all')
  const [category, setCategory] = useState<string | null>(null)

  // Sync API data into the store, then merge with localStorage progress
  useEffect(() => {
    if (achievementDefs && achievementDefs.length > 0) {
      achievementStore.setAchievements(achievementDefs)
      setAchievements(achievementStore.getAchievementsWithProgress())
    }
  }, [achievementDefs])

  // Keep local state in sync with store updates and unlocks
  useEffect(() => {
    const unsubUpdated = EventBus.on('achievements-updated', () =>
      setAchievements(achievementStore.getAchievementsWithProgress()),
    )
    const unsubUnlocked = EventBus.on('achievement-unlocked', () =>
      setAchievements(achievementStore.getAchievementsWithProgress()),
    )
    return () => {
      unsubUpdated()
      unsubUnlocked()
    }
  }, [])

  const earned = achievements.filter((a) => !!a.unlocked_at)
  const locked = achievements.filter((a) => !a.unlocked_at)
  const byStatus = filter === 'earned' ? earned : filter === 'locked' ? locked : achievements
  const categories = Array.from(new Set(achievements.map((a) => a.category))).filter(Boolean)
  const visible = category ? byStatus.filter((a) => a.category === category) : byStatus

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: achievements.length },
    { key: 'earned', label: 'Earned', count: earned.length },
    { key: 'locked', label: 'Locked', count: locked.length },
  ]

  return (
    <>
      <div className="flex border-b-2 border-wood-700 shrink-0 bg-parchment-250">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`relative flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:transition-all ${
              filter === key
                ? 'text-soil-800 after:bg-wood-700'
                : 'text-wood-600 hover:text-wood-900 after:bg-transparent'
            }`}
          >
            {label}
            <span className="ml-1 text-[10px] tabular-nums">({count})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b-4 border-wood-700 shrink-0 bg-parchment-250">
        <button
          onClick={() => setCategory(null)}
          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
            category === null
              ? 'bg-wood-700 border-wood-900 text-parchment-50'
              : 'bg-parchment-400 border-wood-600 text-wood-900 hover:bg-[#baa068]'
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
                ? 'bg-wood-700 border-wood-900 text-parchment-50'
                : 'bg-parchment-400 border-wood-600 text-wood-900 hover:bg-[#baa068]'
            }`}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-3xl">{filter === 'earned' ? '🔒' : '🏆'}</p>
            <p className="text-sm font-bold text-soil-800">
              {filter === 'earned' ? 'Nothing earned yet' : 'All unlocked!'}
            </p>
            <p className="text-xs text-wood-600">
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

      <div className="shrink-0 border-t-4 border-wood-700 bg-parchment-250 px-5 py-3 flex items-center gap-3">
        <span className="text-[10px] font-bold text-wood-700 uppercase tracking-wider shrink-0">
          Progress
        </span>
        <div className="flex-1 h-2 rounded-full bg-parchment-400 border border-wood-600 overflow-hidden">
          <div
            className="h-full rounded-full bg-wood-500 transition-all duration-500"
            style={{
              width:
                achievements.length > 0
                  ? `${Math.round((earned.length / achievements.length) * 100)}%`
                  : '0%',
            }}
          />
        </div>
        <span className="text-[10px] font-bold text-wood-700 shrink-0 tabular-nums">
          {achievements.length > 0
            ? `${Math.round((earned.length / achievements.length) * 100)}%`
            : '0%'}
        </span>
      </div>
    </>
  )
}

export function AchievementList() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    achievementStore.initAchievementListeners()
  }, [])

  useEffect(() => {
    return EventBus.on('show-achievements', () => setOpen(true))
  }, [])

  return (
    <GameDialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <GameDialogContent className="max-w-lg max-h-[82vh] flex flex-col">
        <GameDialogHeader className="pr-14">
          <GameDialogTitle>Achievements</GameDialogTitle>
          <GameDialogDescription></GameDialogDescription>
        </GameDialogHeader>

        <ListBase
          resource="achievements"
          perPage={200}
          sort={{ field: 'id', order: 'ASC' }}
          disableSyncWithLocation
        >
          <AchievementGrid />
        </ListBase>
      </GameDialogContent>
    </GameDialog>
  )
}
