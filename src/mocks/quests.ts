import type { Quest } from '@/models/Quest'

export const TUTORIAL_QUEST: Quest = {
  id:          'tutorial',
  title:       'Getting Started',
  description: 'Learn the basics of managing your world.',
  status:      'active',
  steps: [
    { id: 'move',    description: 'Move around using WASD',               isComplete: false },
    { id: 'connect', description: 'Add a new connection from the menu',    isComplete: false },
    { id: 'agent',   description: 'Spawn an agent and give it a command',  isComplete: false },
  ],
}

export const SAMPLE_QUESTS: Quest[] = [TUTORIAL_QUEST]
