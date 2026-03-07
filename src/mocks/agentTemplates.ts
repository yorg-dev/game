import type { AgentTemplate } from '@/models/AgentTemplate'

/**
 * Built-in agent templates authored by Agents.
 * `sprite` values match existing AgentType keys so the current renderer can
 * resolve the character spritesheet without extra assets.
 */
export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id:          'returns-agent',
    name:        'Returns Agent',
    description: 'Handles customer return and refund requests end to end',
    category:    'ecommerce',
    skills: [
      {
        skillId:      'shopify:get_order',
        order:        1,
        isRequired:   true,
        inputMapping: { orderId: 'trigger.data.order_id' },
      },
      {
        skillId:      'shopify:create_refund',
        order:        2,
        isRequired:   true,
        inputMapping: { orderId: 'trigger.data.order_id', amount: 'steps.1.output.total_price' },
        condition:    'steps.1.output.financial_status !== "refunded"',
      },
      {
        skillId:      'gmail:send_email',
        order:        3,
        isRequired:   false,
        inputMapping: { to: 'trigger.data.customer_email', subject: '"Your refund has been processed"' },
      },
    ],
    requiredIntegrations: ['shopify', 'gmail'],
    sprite:     'engineering',
    color:      '#4aff8c',
    authorType: 'agent',
    isPublished: true,
  },
  {
    id:          'outreach-agent',
    name:        'Outreach Agent',
    description: 'Runs personalised outbound campaigns and logs activity to your CRM',
    category:    'sales',
    skills: [
      {
        skillId:      'apollo:find_leads',
        order:        1,
        isRequired:   true,
        inputMapping: { filters: 'trigger.data.filters' },
      },
      {
        skillId:      'gmail:send_email',
        order:        2,
        isRequired:   true,
        inputMapping: { to: 'steps.1.output.email', body: 'trigger.data.email_body' },
        condition:    'steps.1.output.email !== null',
      },
      {
        skillId:      'salesforce:log_activity',
        order:        3,
        isRequired:   false,
        inputMapping: { leadId: 'steps.1.output.id', notes: '"Outreach email sent"' },
      },
    ],
    requiredIntegrations: ['apollo', 'gmail', 'salesforce'],
    sprite:     'sales',
    color:      '#4a9eff',
    authorType: 'agent',
    isPublished: true,
  },
  {
    id:          'support-agent',
    name:        'Support Agent',
    description: 'Triages incoming tickets, looks up orders and sends resolutions',
    category:    'support',
    skills: [
      {
        skillId:      'zendesk:get_ticket',
        order:        1,
        isRequired:   true,
        inputMapping: { ticketId: 'trigger.data.ticket_id' },
      },
      {
        skillId:      'shopify:get_order',
        order:        2,
        isRequired:   false,
        inputMapping: { orderId: 'steps.1.output.order_id' },
        condition:    'steps.1.output.order_id !== null',
      },
      {
        skillId:      'zendesk:reply_ticket',
        order:        3,
        isRequired:   true,
        inputMapping: { ticketId: 'trigger.data.ticket_id', message: 'trigger.data.resolution' },
      },
      {
        skillId:      'zendesk:close_ticket',
        order:        4,
        isRequired:   false,
        inputMapping: { ticketId: 'trigger.data.ticket_id' },
      },
    ],
    requiredIntegrations: ['zendesk', 'shopify'],
    sprite:     'support',
    color:      '#c97bff',
    authorType: 'agent',
    isPublished: true,
  },
  {
    id:          'social-agent',
    name:        'Social Agent',
    description: 'Generates, schedules and tracks social posts across platforms',
    category:    'marketing',
    skills: [
      {
        skillId:      'openai:generate_content',
        order:        1,
        isRequired:   true,
        inputMapping: { prompt: 'trigger.data.topic', tone: 'trigger.data.tone' },
      },
      {
        skillId:      'buffer:schedule_post',
        order:        2,
        isRequired:   true,
        inputMapping: { content: 'steps.1.output.text', scheduledAt: 'trigger.data.post_time' },
      },
      {
        skillId:      'buffer:get_analytics',
        order:        3,
        isRequired:   false,
        inputMapping: { postId: 'steps.2.output.post_id' },
      },
    ],
    requiredIntegrations: ['openai', 'buffer'],
    sprite:     'marketing',
    color:      '#ff7b4a',
    authorType: 'agent',
    isPublished: true,
  },
  {
    id:          'finance-agent',
    name:        'Finance Agent',
    description: 'Reconciles transactions, flags anomalies and generates reports',
    category:    'ecommerce',
    skills: [
      {
        skillId:      'stripe:list_transactions',
        order:        1,
        isRequired:   true,
        inputMapping: { from: 'trigger.data.period_start', to: 'trigger.data.period_end' },
      },
      {
        skillId:      'xero:reconcile',
        order:        2,
        isRequired:   true,
        inputMapping: { transactions: 'steps.1.output.transactions' },
        condition:    'steps.1.output.transactions.length > 0',
      },
      {
        skillId:      'xero:generate_report',
        order:        3,
        isRequired:   false,
        inputMapping: { reconciliationId: 'steps.2.output.id' },
      },
    ],
    requiredIntegrations: ['stripe', 'xero'],
    sprite:     'finance',
    color:      '#ffe04a',
    authorType: 'agent',
    isPublished: true,
  },
]
