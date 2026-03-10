import type { Notification } from '../models/Notification'

export const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_001',
    title: 'Order Agent completed task',
    message:
      'Successfully processed 12 refund requests from Shopify. All customers notified via email.',
    severity: 'success',
    category: 'agent',
    timestamp: '2026-02-25T10:14:00Z',
    isRead: false,
    agentName: 'Order Agent',
  },
  {
    id: 'notif_002',
    title: 'Shopify connection expiring',
    message: 'Your Shopify OAuth token expires in 3 days. Re-authenticate to avoid interruptions.',
    severity: 'warning',
    category: 'connection',
    timestamp: '2026-02-25T08:00:00Z',
    isRead: false,
    connectionId: 'shopify-demo',
    actionLabel: 'Re-authenticate',
  },
  {
    id: 'notif_003',
    title: 'New agent template available',
    message: 'The Inventory Sync Agent template has been published to the community library.',
    severity: 'info',
    category: 'system',
    timestamp: '2026-02-24T16:45:00Z',
    isRead: true,
  },
  {
    id: 'notif_004',
    title: 'Support Agent failed',
    message:
      'Could not retrieve tickets from Zendesk — API rate limit exceeded. Retrying in 15 minutes.',
    severity: 'error',
    category: 'agent',
    timestamp: '2026-02-24T14:22:00Z',
    isRead: true,
    agentName: 'Support Agent',
    connectionId: 'zendesk-main',
  },
  {
    id: 'notif_005',
    title: 'Weekly summary ready',
    message: 'Your agents completed 47 tasks this week across 3 integrations.',
    severity: 'info',
    category: 'task',
    timestamp: '2026-02-24T09:00:00Z',
    isRead: true,
  },
]
