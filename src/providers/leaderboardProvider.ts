import httpProvider from './httpProvider'
import type { Leaderboard, LeaderboardPeriod, LeaderboardType } from '@/models/Leaderboard'

const api = import.meta.env.VITE_API_URL as string

export const leaderboardProvider = {
  async fetch(type: LeaderboardType, period: LeaderboardPeriod): Promise<Leaderboard> {
    const { json } = await httpProvider(
      `${api}/leaderboard?type=${type}&period=${period}`
    )
    const raw = json as {
      period: LeaderboardPeriod
      type: LeaderboardType
      entries: Array<{ rank: number; id: string; name: string; score: number }>
      current_user_entry: { rank: number; id: string; name: string; score: number } | null
    }
    return {
      period: raw.period,
      type: raw.type,
      entries: raw.entries,
      currentUserEntry: raw.current_user_entry,
    }
  },
}
