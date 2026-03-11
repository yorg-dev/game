import httpProvider from './httpProvider'
import type { Achievement } from '@/models/Achievement'
import { SAMPLE_ACHIEVEMENTS } from '@/mocks/achievements'

const api = import.meta.env.VITE_API_URL as string

function url(path: string): string {
  return `${api}/${path}`
}

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

export const achievementProvider = {
  async getAchievements(): Promise<Achievement[]> {
    if (!api) return SAMPLE_ACHIEVEMENTS
    try {
      const { json } = await httpProvider(url('achievements'))
      const camelized = camelize(json)
      const list = Array.isArray(camelized) ? camelized : (camelized?.achievements ?? [])
      return list as Achievement[]
    } catch {
      return SAMPLE_ACHIEVEMENTS
    }
  },
}
