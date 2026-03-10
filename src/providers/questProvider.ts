import httpProvider from './httpProvider'
import type { Quest } from '@/models/Quest'
import { SAMPLE_QUESTS } from '@/mocks/quests'

const api = import.meta.env.VITE_API_URL as string

function url(path: string): string {
  return `${api}/${path}`
}

/** Convert snake_case keys from the Rails API to camelCase. */
function camelize(obj: unknown): any {
  if (Array.isArray(obj)) return obj.map(camelize)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
        camelize(v),
      ]),
    )
  }
  return obj
}

export const questProvider = {
  /**
   * Fetch all quests available in the game.
   * Falls back to SAMPLE_QUESTS when the API is unavailable.
   */
  async getQuests(): Promise<Quest[]> {
    if (!api) return SAMPLE_QUESTS
    try {
      const { json } = await httpProvider(url('quests'))
      return camelize(json) as Quest[]
    } catch {
      return SAMPLE_QUESTS
    }
  },
}
