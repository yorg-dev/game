import httpProvider from './httpProvider'
import type { Expert } from '@/models/Expert'

const api = import.meta.env.VITE_API_URL as string

export const expertsProvider = {
  async list(): Promise<Expert[]> {
    if (!api) return []
    const { json } = await httpProvider(`${api}/experts`)
    return json as Expert[]
  },

  async show(id: string): Promise<Expert> {
    const { json } = await httpProvider(`${api}/experts/${id}`)
    return json as Expert
  },
}
