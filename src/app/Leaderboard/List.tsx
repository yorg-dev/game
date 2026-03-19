import { useState, useEffect } from 'react'
import { useGetList } from 'ra-core'
import { EventBus } from '@/game/EventBus'
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardType } from '@/models/Leaderboard'
import {
  GameDialog,
  GameDialogContent,
  GameDialogHeader,
  GameDialogTitle,
} from '@/components/ui/game-dialog'

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
]

const TYPES: { key: LeaderboardType; label: string }[] = [
  { key: 'users', label: 'Players' },
  { key: 'lands', label: 'Lands' },
]

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function RankRow({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border-2 ${
        isCurrentUser ? 'border-wood-700 bg-parchment-400' : 'border-wood-600 bg-parchment-250'
      }`}
    >
      <span className="w-7 text-center text-sm font-bold shrink-0 text-wood-700">
        {MEDAL[entry.rank] ?? `${entry.rank}`}
      </span>
      <span className="flex-1 text-sm font-bold text-soil-800 truncate">
        {entry.name}
        {isCurrentUser && (
          <span className="ml-1.5 text-[10px] font-bold text-wood-700 normal-case">(you)</span>
        )}
      </span>
      <span className="text-sm font-bold text-soil-800 tabular-nums shrink-0">
        {(entry.score ?? 0).toLocaleString()}{' '}
        <span className="text-xs text-wood-700 font-normal">pts</span>
      </span>
    </div>
  )
}

export function LeaderboardList() {
  const [open, setOpen] = useState(false)
  const [period, setPeriod] = useState<LeaderboardPeriod>('week')
  const [type, setType] = useState<LeaderboardType>('users')

  useEffect(() => {
    return EventBus.on('show-leaderboard', () => setOpen(true))
  }, [])

  const {
    data = [],
    isPending: loading,
    error,
  } = useGetList<LeaderboardEntry>('leaderboards', {
    filter: { type, period },
    pagination: { page: 1, perPage: 25 },
    sort: { field: 'rank', order: 'ASC' },
  })

  return (
    <GameDialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <GameDialogContent className="max-w-md">
        <GameDialogHeader className="pr-14">
          <GameDialogTitle>Leaderboard</GameDialogTitle>
        </GameDialogHeader>

        {/* Type tabs */}
        <div className="flex border-b-4 border-wood-700 px-5 bg-parchment-250">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`relative px-1 mr-5 pb-2.5 pt-2 text-sm font-bold transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:transition-all ${
                type === t.key
                  ? 'text-soil-800 after:bg-wood-700'
                  : 'text-wood-600 hover:text-wood-900 after:bg-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex gap-2 px-5 py-3 border-b-2 border-parchment-500">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${
                period === p.key
                  ? 'border-wood-900 bg-wood-500 shadow-[inset_0_2px_0_0_var(--color-wood-300),inset_0_-2px_0_0_var(--color-wood-900)] text-soil-800'
                  : 'border-wood-600 bg-parchment-250 text-wood-700 hover:bg-parchment-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Entries */}
        <div className="flex flex-col gap-1.5 px-5 py-4 min-h-[260px] max-h-[360px] overflow-y-auto">
          {loading && (
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 rounded-lg bg-parchment-250 border-2 border-parchment-500 animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <p className="text-xs text-red-700 font-bold bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-4">
              {error?.message ?? 'Could not load leaderboard.'}
            </p>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <span className="text-3xl">🏆</span>
              <p className="text-sm font-bold text-soil-800">No scores yet</p>
              <p className="text-xs text-wood-600">
                Complete achievements to appear on the leaderboard.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            data.map((entry) => <RankRow key={entry.id} entry={entry} isCurrentUser={false} />)}
        </div>
      </GameDialogContent>
    </GameDialog>
  )
}
