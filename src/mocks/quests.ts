import type { Quest } from '@/models/Quest'

export const TUTORIAL_QUEST: Quest = {
  id: 'tutorial',
  title: 'Welcome to Yorg',
  description: 'Learn the basics of your AI world.',
  status: 'active',
  steps: [
    { id: 'move', description: 'Walk around with WASD', isComplete: false },
    { id: 'spawn', description: 'Spawn your first agent', isComplete: false },
    { id: 'command', description: 'Give all agents a command', isComplete: false },
  ],
}

export const EXPLORE_QUEST: Quest = {
  id: 'explore',
  title: 'Dive Deeper',
  description: 'Discover what makes AI agents powerful.',
  status: 'locked',
  steps: [
    { id: 'direct-chat', description: 'Chat directly with an agent', isComplete: false },
    { id: 'connection', description: 'Add your first integration', isComplete: false },
    { id: 'voice', description: 'Try a voice command', isComplete: false },
  ],
}

export const SAMPLE_QUESTS: Quest[] = [TUTORIAL_QUEST, EXPLORE_QUEST]
