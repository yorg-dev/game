import type { Achievement } from '@/models/Achievement'

/** Minimal fallback used when the API is unavailable. */
export const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Walk around the world using WASD.',
    icon: '👣',
    rarity: 'common',
    category: 'exploration',
  },
  {
    id: 'agent-summoner',
    title: 'Agent Summoner',
    description: 'Spawn your first AI agent.',
    icon: '🤖',
    rarity: 'common',
    category: 'agents',
  },
]
