import httpProvider from './httpProvider'
import type { Tool, CreateToolInput } from '@/models/Tool'

const api = import.meta.env.VITE_API_URL as string

function url(path: string): string {
  return `${api}/${path}`
}

export const toolsProvider = {
  async list(connectionId: string): Promise<Tool[]> {
    if (!api) return []
    const { json } = await httpProvider(url(`connections/${connectionId}/tools`))
    return json as Tool[]
  },

  async create(connectionId: string, data: CreateToolInput): Promise<Tool> {
    const { json } = await httpProvider(url(`connections/${connectionId}/tools`), {
      method: 'POST',
      body: JSON.stringify({ tool: data }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    return json as Tool
  },

  async update(connectionId: string, toolId: string, data: Partial<CreateToolInput>): Promise<Tool> {
    const { json } = await httpProvider(url(`connections/${connectionId}/tools/${toolId}`), {
      method: 'PATCH',
      body: JSON.stringify({ tool: data }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    return json as Tool
  },

  async destroy(connectionId: string, toolId: string): Promise<void> {
    await httpProvider(url(`connections/${connectionId}/tools/${toolId}`), { method: 'DELETE' })
  },
}
