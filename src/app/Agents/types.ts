import type { AgentTemplate } from '@/models/AgentTemplate'

export interface SelectedAgent {
  id: number
  name: string
  template: AgentTemplate
}

export interface ChatMessage {
  id: string
  from: 'user' | 'agent'
  text: string
  ts: number
  pending?: boolean
}

export type AgentTab = 'overview' | 'chat'
