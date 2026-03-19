import type { AgentTemplate } from '@/models/AgentTemplate'

// Module-level store so both React and Phaser can access template definitions
// synchronously. Seeded from built-in blueprints; call setAgentTemplates() to
// replace with server-fetched templates if the API is available.

const BLUEPRINTS: AgentTemplate[] = [
  {
    id: 'returns-agent',
    slug: 'returns-agent',
    name: 'Returns Agent',
    description: 'Handles customer return and refund requests end to end',
    category: 'ecommerce',
    skills: [
      {
        skill_id: 'shopify:get_order',
        order: 1,
        is_required: true,
        input_mapping: { orderId: 'trigger.data.order_id' },
      },
      {
        skill_id: 'shopify:create_refund',
        order: 2,
        is_required: true,
        input_mapping: { orderId: 'trigger.data.order_id', amount: 'steps.1.output.total_price' },
        condition: 'steps.1.output.financial_status !== "refunded"',
      },
      {
        skill_id: 'gmail:send_email',
        order: 3,
        is_required: false,
        input_mapping: {
          to: 'trigger.data.customer_email',
          subject: '"Your refund has been processed"',
        },
      },
    ],
    required_integrations: ['shopify', 'gmail'],
    sprite: 'engineering',
    color: '#4aff8c',
    author_type: 'agent',
    is_published: true,
  },
  {
    id: 'outreach-agent',
    slug: 'outreach-agent',
    name: 'Outreach Agent',
    description: 'Runs personalised outbound campaigns and logs activity to your CRM',
    category: 'sales',
    skills: [
      {
        skill_id: 'apollo:find_leads',
        order: 1,
        is_required: true,
        input_mapping: { filters: 'trigger.data.filters' },
      },
      {
        skill_id: 'gmail:send_email',
        order: 2,
        is_required: true,
        input_mapping: { to: 'steps.1.output.email', body: 'trigger.data.email_body' },
        condition: 'steps.1.output.email !== null',
      },
      {
        skill_id: 'salesforce:log_activity',
        order: 3,
        is_required: false,
        input_mapping: { leadId: 'steps.1.output.id', notes: '"Outreach email sent"' },
      },
    ],
    required_integrations: ['apollo', 'gmail', 'salesforce'],
    sprite: 'sales',
    color: '#4a9eff',
    author_type: 'agent',
    is_published: true,
  },
  {
    id: 'support-agent',
    slug: 'support-agent',
    name: 'Support Agent',
    description: 'Triages incoming tickets, looks up orders and sends resolutions',
    category: 'support',
    skills: [
      {
        skill_id: 'zendesk:get_ticket',
        order: 1,
        is_required: true,
        input_mapping: { ticketId: 'trigger.data.ticket_id' },
      },
      {
        skill_id: 'shopify:get_order',
        order: 2,
        is_required: false,
        input_mapping: { orderId: 'steps.1.output.order_id' },
        condition: 'steps.1.output.order_id !== null',
      },
      {
        skill_id: 'zendesk:reply_ticket',
        order: 3,
        is_required: true,
        input_mapping: { ticketId: 'trigger.data.ticket_id', message: 'trigger.data.resolution' },
      },
      {
        skill_id: 'zendesk:close_ticket',
        order: 4,
        is_required: false,
        input_mapping: { ticketId: 'trigger.data.ticket_id' },
      },
    ],
    required_integrations: ['zendesk', 'shopify'],
    sprite: 'support',
    color: '#c97bff',
    author_type: 'agent',
    is_published: true,
  },
  {
    id: 'social-agent',
    slug: 'social-agent',
    name: 'Social Agent',
    description: 'Generates, schedules and tracks social posts across platforms',
    category: 'marketing',
    skills: [
      {
        skill_id: 'openai:generate_content',
        order: 1,
        is_required: true,
        input_mapping: { prompt: 'trigger.data.topic', tone: 'trigger.data.tone' },
      },
      {
        skill_id: 'buffer:schedule_post',
        order: 2,
        is_required: true,
        input_mapping: { content: 'steps.1.output.text', scheduledAt: 'trigger.data.post_time' },
      },
      {
        skill_id: 'buffer:get_analytics',
        order: 3,
        is_required: false,
        input_mapping: { postId: 'steps.2.output.post_id' },
      },
    ],
    required_integrations: ['openai', 'buffer'],
    sprite: 'marketing',
    color: '#ff7b4a',
    author_type: 'agent',
    is_published: true,
  },
  {
    id: 'finance-agent',
    slug: 'finance-agent',
    name: 'Finance Agent',
    description: 'Reconciles transactions, flags anomalies and generates reports',
    category: 'ecommerce',
    skills: [
      {
        skill_id: 'stripe:list_transactions',
        order: 1,
        is_required: true,
        input_mapping: { from: 'trigger.data.period_start', to: 'trigger.data.period_end' },
      },
      {
        skill_id: 'xero:reconcile',
        order: 2,
        is_required: true,
        input_mapping: { transactions: 'steps.1.output.transactions' },
        condition: 'steps.1.output.transactions.length > 0',
      },
      {
        skill_id: 'xero:generate_report',
        order: 3,
        is_required: false,
        input_mapping: { reconciliationId: 'steps.2.output.id' },
      },
    ],
    required_integrations: ['stripe', 'xero'],
    sprite: 'finance',
    color: '#ffe04a',
    author_type: 'agent',
    is_published: true,
  },
]

let templates: AgentTemplate[] = [...BLUEPRINTS]

export function setAgentTemplates(t: AgentTemplate[]): void {
  templates = t
}

export function getAgentTemplates(): AgentTemplate[] {
  return templates
}

export function findAgentTemplate(id: string): AgentTemplate | undefined {
  return templates.find((t) => t.id === id)
}
