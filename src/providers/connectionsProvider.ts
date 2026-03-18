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
