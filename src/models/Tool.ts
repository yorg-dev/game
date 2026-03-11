export interface Tool {
  id: string
  name: string
  description: string | null
  active: boolean
  tool_type: 'webhook' | 'mcp_tool'
  options: Record<string, string>
  connection_id: string
}

export interface CreateToolInput {
  name: string
  description?: string
  tool_type: 'webhook' | 'mcp_tool'
  options: Record<string, string>
  active?: boolean
}
