export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error'

export type NotificationCategory = 'agent' | 'connection' | 'task' | 'system'

export interface Notification {
  id: string
  title: string
  message: string
  severity: NotificationSeverity
  category: NotificationCategory
  timestamp: string // ISO-8601
  isRead: boolean
  agentId?: number
  agentName?: string
  connectionId?: string
  actionLabel?: string
  actionPayload?: Record<string, unknown>
}
