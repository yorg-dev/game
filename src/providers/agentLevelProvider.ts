import httpProvider from './httpProvider'
import type { AgentLevel, XpResult, XpType } from '@/models/AgentLevel'

const api = import.meta.env.VITE_API_URL as string

function url(path: string): string {
  return `${api}/${path}`
}

export const agentLevelProvider = {
  async getLevel(agentSlug: string): Promise<AgentLevel | null> {
    if (!api) return null
    try {
      const { json } = await httpProvider(url(`agents/${agentSlug}/level`))
      return json as AgentLevel
    } catch {
      return null
    }
  },

  async recordXp(agentSlug: string, xpType: XpType): Promise<XpResult | null> {
    if (!api) return null
    try {
      const { json } = await httpProvider(url(`agents/${agentSlug}/xp`), {
        method: 'POST',
        body: JSON.stringify({ xp_type: xpType }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      })
      return json as XpResult
    } catch {
      return null
    }
  },
}
