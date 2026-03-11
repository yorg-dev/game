import type { App } from '@/models/App'
import type { Connection, AppConnectionStatus } from '@/models/Connection'

/**
 * Registry of all supported 3rd-party apps.
 * IDs must match the values used in Skill.integration
 * and AgentTemplate.requiredIntegrations.
 */
export const APPS: App[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'eCommerce platform for online stores — orders, products, refunds',
    category: 'ecommerce',
    authType: 'api_key',
    requiredCredentials: ['shopify_access_token', 'shopify_store_url'],
    color: '#96bf48',
    isAvailable: true,
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Cloud accounting — invoices, reconciliation, financial reports',
    category: 'finance',
    authType: 'oauth2',
    requiredCredentials: ['xero_client_id', 'xero_client_secret'],
    color: '#13b5ea',
    isAvailable: true,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing — transactions, subscriptions, payouts',
    category: 'finance',
    authType: 'api_key',
    requiredCredentials: ['stripe_secret_key'],
    color: '#635bff',
    isAvailable: true,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Google email — send, receive, and manage messages',
    category: 'email',
    authType: 'oauth2',
    requiredCredentials: ['google_client_id', 'google_client_secret'],
    color: '#ea4335',
    isAvailable: true,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'CRM — leads, contacts, opportunities, activity logging',
    category: 'crm',
    authType: 'oauth2',
    requiredCredentials: [
      'salesforce_client_id',
      'salesforce_client_secret',
      'salesforce_instance_url',
    ],
    color: '#00a1e0',
    isAvailable: true,
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Customer support platform — tickets, macros, replies',
    category: 'support',
    authType: 'api_key',
    requiredCredentials: ['zendesk_subdomain', 'zendesk_api_token', 'zendesk_email'],
    color: '#03363d',
    isAvailable: true,
  },
  {
    id: 'apollo',
    name: 'Apollo',
    description: 'Sales intelligence — lead search, enrichment, sequences',
    category: 'prospecting',
    authType: 'api_key',
    requiredCredentials: ['apollo_api_key'],
    color: '#3b82f6',
    isAvailable: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'AI models — content generation, summarisation, classification',
    category: 'ai',
    authType: 'api_key',
    requiredCredentials: ['openai_api_key'],
    color: '#10a37f',
    isAvailable: true,
  },
  {
    id: 'buffer',
    name: 'Buffer',
    description: 'Social media scheduling — posts, queues, analytics',
    category: 'social',
    authType: 'oauth2',
    requiredCredentials: ['buffer_client_id', 'buffer_client_secret'],
    color: '#168eea',
    isAvailable: true,
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Open-source workflow automation — webhooks, HTTP requests, and 400+ integrations',
    category: 'automation',
    authType: 'api_key',
    requiredCredentials: ['api_key'],
    color: '#ea4b71',
    isAvailable: true,
    connectionType: 'n8n',
  },
]

/** Look up an App by its id. Returns undefined if not found. */
export function getApp(id: string): App | undefined {
  return APPS.find((a) => a.id === id)
}

/**
 * Given an agent template's required integration ids and the workspace's
 * current connections, returns the connection status for each required app.
 *
 * @example
 * const statuses = resolveConnections(['shopify', 'gmail'], workspaceConnections)
 * const missing  = statuses.filter(s => s.connection === undefined)
 */
export function resolveConnections(
  requiredIntegrations: string[],
  connections: Connection[],
): AppConnectionStatus[] {
  return requiredIntegrations.map((appId) => ({
    app: getApp(appId) ?? ({ id: appId, name: appId } as App),
    connection: connections.find((c) => c.appId === appId && c.status === 'connected'),
  }))
}
