export type LeaderboardPeriod = 'day' | 'week' | 'month'
export type LeaderboardType = 'users' | 'lands'

export interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  score: number
}

export interface Leaderboard {
  period: LeaderboardPeriod
  type: LeaderboardType
  entries: LeaderboardEntry[]
  currentUserEntry: LeaderboardEntry | null
}
