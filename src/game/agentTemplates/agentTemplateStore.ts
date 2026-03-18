import type { AgentTemplate } from '@/models/AgentTemplate'

// Module-level store so both React and Phaser can access template definitions
// synchronously. React sets this after useGetList resolves; Phaser reads it.

let templates: AgentTemplate[] = []

export function setAgentTemplates(t: AgentTemplate[]): void {
  templates = t
}

export function getAgentTemplates(): AgentTemplate[] {
  return templates
}

export function findAgentTemplate(id: string): AgentTemplate | undefined {
  return templates.find((t) => t.id === id)
}
