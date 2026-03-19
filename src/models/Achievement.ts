export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  rarity: AchievementRarity
  category: string
  /** ISO timestamp — present when earned, absent when locked. */
  unlocked_at?: string
}
