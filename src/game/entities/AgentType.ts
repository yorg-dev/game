export type AgentType = 'engineering' | 'marketing' | 'sales' | 'support' | 'finance' | 'risk'

export interface AgentConfig {
  readonly label:      string
  readonly color:      string  // CSS color — used in React UI
  readonly shirtColor: string  // Canvas color — used to paint the sprite
}

export const AGENT_TYPES: Record<AgentType, AgentConfig> = {
  engineering: { label: 'Engineering', color: '#4a9eff', shirtColor: '#4a7cc7' },
  marketing:   { label: 'Marketing',   color: '#ff7b4a', shirtColor: '#c7603a' },
  sales:       { label: 'Sales',       color: '#4aff8c', shirtColor: '#3aa860' },
  support:     { label: 'Support',     color: '#c97bff', shirtColor: '#8b5bc7' },
  finance:     { label: 'Finance',     color: '#ffe04a', shirtColor: '#c7a83a' },
  risk:        { label: 'Risk',        color: '#ffe04a', shirtColor: '#c7a83a' },
}
