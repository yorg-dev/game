export type QuestStatus = 'locked' | 'active' | 'completed'

export interface QuestStep {
  id:          string
  description: string
  isComplete:  boolean
}

export interface Quest {
  id:          string
  title:       string
  description: string
  status:      QuestStatus
  steps:       QuestStep[]
}
