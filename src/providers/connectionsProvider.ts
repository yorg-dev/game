import httpProvider from './httpProvider'

const api = import.meta.env.VITE_API_URL as string

function url(path: string): string {
  return `${api}/${path}`
}

export interface ApiConnection {
  id: string
  name: string
  active: boolean
  connection_type: string
  options: Record<string, string>
}

export interface CreateConnectionInput {
  name: string
  connection_type: string
  options: Record<string, string>
}

export const connectionsProvider = {
  async list(): Promise<ApiConnection[]> {
    if (!api) return []
    const { json } = await httpProvider(url('connections'))
    return json as ApiConnection[]
  },

  async create(data: CreateConnectionInput): Promise<ApiConnection> {
    const { json } = await httpProvider(url('connections'), {
      method: 'POST',
      body: JSON.stringify({ connection: data }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    return json as ApiConnection
  },

  async update(id: string, data: Partial<CreateConnectionInput>): Promise<ApiConnection> {
    const { json } = await httpProvider(url(`connections/${id}`), {
      method: 'PATCH',
      body: JSON.stringify({ connection: data }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    return json as ApiConnection
  },

  async destroy(id: string): Promise<void> {
    await httpProvider(url(`connections/${id}`), { method: 'DELETE' })
  },
}
