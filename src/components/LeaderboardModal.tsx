import { useState, useEffect } from 'react'
import { leaderboardProvider } from '@/providers/leaderboardProvider'
import type {
  Leaderboard,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardType,
} from '@/models/Leaderboard'

interface Props {
  onClose: () => void
}

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
        isCurrentUser ? 'border-[#7a5230] bg-[#c8b07a]' : 'border-[#9a6b28] bg-[#dcc898]'
      }`}
    >
      <span className="w-7 text-center text-sm font-bold shrink-0 text-[#7a5230]">
        {MEDAL[entry.rank] ?? `${entry.rank}`}
      </span>
      <span className="flex-1 text-sm font-bold text-[#3d2010] truncate">
        {entry.name}
        {isCurrentUser && (
          <span className="ml-1.5 text-[10px] font-bold text-[#7a5230] normal-case">(you)</span>
        )}
      </span>
      <span className="text-sm font-bold text-[#3d2010] tabular-nums shrink-0">
        {entry.score.toLocaleString()}{' '}
        <span className="text-xs text-[#7a5230] font-normal">pts</span>
      </span>
    </div>
  )
}

export function LeaderboardModal({ onClose }: Props) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('week')
  const [type, setType] = useState<LeaderboardType>('users')
  const [data, setData] = useState<Leaderboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    leaderboardProvider
      .fetch(type, period)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load leaderboard.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [type, period])

  const currentUserId = data?.currentUserEntry?.id
  const showCurrentUserFooter =
    data?.currentUserEntry && !data.entries.some((e) => e.id === data.currentUserEntry!.id)

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] hover:brightness-110 transition-[filter]"
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

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b-4 border-[#7a5230] bg-[#dcc898] pr-14">
          <h2 className="text-[#3d2010] font-bold text-base">Leaderboard</h2>
        </div>

        {/* Type tabs */}
        <div className="flex border-b-4 border-[#7a5230] px-5 bg-[#dcc898]">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`relative px-1 mr-5 pb-2.5 pt-2 text-sm font-bold transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:transition-all ${
                type === t.key
                  ? 'text-[#3d2010] after:bg-[#7a5230]'
                  : 'text-[#9a6b28] hover:text-[#5a3810] after:bg-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex gap-2 px-5 py-3 border-b-2 border-[#b8955a]">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${
                period === p.key
                  ? 'border-[#5a3810] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-2px_0_0_#5a3810] text-[#3d2010]'
                  : 'border-[#9a6b28] bg-[#dcc898] text-[#7a5230] hover:bg-[#c8b07a]'
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
                  className="h-10 rounded-lg bg-[#dcc898] border-2 border-[#b8955a] animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <p className="text-xs text-red-700 font-bold bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-4">
              {error}
            </p>
          )}

          {!loading && !error && data?.entries.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <span className="text-3xl">🏆</span>
              <p className="text-sm font-bold text-[#3d2010]">No scores yet</p>
              <p className="text-xs text-[#9a6b28]">
                Complete achievements to appear on the leaderboard.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            data?.entries.map((entry) => (
              <RankRow key={entry.id} entry={entry} isCurrentUser={entry.id === currentUserId} />
            ))}
        </div>

        {/* Current user footer — shown only when outside top 25 */}
        {showCurrentUserFooter && data?.currentUserEntry && (
          <div className="px-5 py-3 border-t-4 border-[#7a5230] bg-[#dcc898]">
            <p className="text-[10px] font-bold text-[#7a5230] uppercase tracking-widest mb-1.5">
              Your rank
            </p>
            <RankRow entry={data.currentUserEntry} isCurrentUser={true} />
          </div>
        )}
      </div>
    </div>
  )
}
