export interface AgentLevel {
  level: number
  xp: number
  xp_to_next: number
  command_count: number
  last_used_at: string | null
}

export interface XpResult {
  level: number
  xp: number
  xp_gained: number
  xp_to_next: number
  leveled_up: boolean
  previous_level: number
}

export type XpType = 'command' | 'voice' | 'chat'

export const XP_PER_LEVEL = 100
export const MAX_LEVEL = 10
