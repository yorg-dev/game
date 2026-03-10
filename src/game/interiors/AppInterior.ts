export interface InteriorAction {
  id: string
  label: string
  description: string
  icon: string // single character / emoji shown on terminal + HUD
}

export interface AppInterior {
  displayName: string
  floorColor: string // hex — used to paint the floor tile
  wallColor: string // hex — used to paint the wall tile
  accentColor: string // brand color for terminals and highlights
  terminalLabel: string // generic label shown above interactive counters
  actions: InteriorAction[]
}

export const DEFAULT_INTERIOR: AppInterior = {
  displayName: 'Building',
  floorColor: '#b8956a',
  wallColor: '#3a2510',
  accentColor: '#c8974c',
  terminalLabel: 'Terminal',
  actions: [
    { id: 'view-info', label: 'View Info', description: 'See building information', icon: 'i' },
  ],
}

export const APP_INTERIORS: Record<string, AppInterior> = {
  shopify: {
    displayName: 'Shopify Store',
    floorColor: '#d4c4a0',
    wallColor: '#2a4a1a',
    accentColor: '#96bf48',
    terminalLabel: 'Counter',
    actions: [
      {
        id: 'view-orders',
        label: 'View Orders',
        description: 'Browse recent customer orders and status',
        icon: 'O',
      },
      {
        id: 'process-refund',
        label: 'Process Refund',
        description: 'Issue a full or partial refund for an order',
        icon: 'R',
      },
      {
        id: 'check-inventory',
        label: 'Check Inventory',
        description: 'View current stock levels across products',
        icon: 'I',
      },
      {
        id: 'update-product',
        label: 'Update Product',
        description: 'Edit a product title, price, or description',
        icon: 'P',
      },
    ],
  },

  xero: {
    displayName: 'Xero Office',
    floorColor: '#c8d8e0',
    wallColor: '#1a3050',
    accentColor: '#13b5ea',
    terminalLabel: 'Desk',
    actions: [
      {
        id: 'view-invoices',
        label: 'View Invoices',
        description: 'Browse outstanding and paid invoices',
        icon: 'V',
      },
      {
        id: 'create-invoice',
        label: 'Create Invoice',
        description: 'Generate a new invoice for a client',
        icon: '+',
      },
      {
        id: 'reconcile',
        label: 'Reconcile',
        description: 'Match bank transactions to your accounts',
        icon: '=',
      },
      {
        id: 'report',
        label: 'Financial Report',
        description: 'Pull a profit & loss or balance sheet report',
        icon: '$',
      },
    ],
  },

  stripe: {
    displayName: 'Stripe Vault',
    floorColor: '#d0ccf0',
    wallColor: '#1a1540',
    accentColor: '#635bff',
    terminalLabel: 'Terminal',
    actions: [
      {
        id: 'view-payments',
        label: 'View Payments',
        description: 'Browse recent charges and transactions',
        icon: 'P',
      },
      {
        id: 'issue-refund',
        label: 'Issue Refund',
        description: 'Refund a charge to the original card',
        icon: 'R',
      },
      {
        id: 'subscriptions',
        label: 'Subscriptions',
        description: 'View and manage active subscriptions',
        icon: 'S',
      },
      {
        id: 'view-payouts',
        label: 'View Payouts',
        description: 'Check payout schedule and history',
        icon: '$',
      },
    ],
  },

  gmail: {
    displayName: 'Gmail Hub',
    floorColor: '#f0d8d4',
    wallColor: '#3a1010',
    accentColor: '#ea4335',
    terminalLabel: 'Inbox',
    actions: [
      {
        id: 'view-inbox',
        label: 'View Inbox',
        description: 'Read recent incoming emails',
        icon: 'I',
      },
      {
        id: 'compose',
        label: 'Compose Email',
        description: 'Draft and send a new email',
        icon: 'C',
      },
      {
        id: 'search',
        label: 'Search Messages',
        description: 'Find messages by keyword or sender',
        icon: 'S',
      },
      {
        id: 'view-sent',
        label: 'Sent Box',
        description: 'Review emails you have already sent',
        icon: 'T',
      },
    ],
  },

  salesforce: {
    displayName: 'Salesforce HQ',
    floorColor: '#c8e4f0',
    wallColor: '#0a2030',
    accentColor: '#00a1e0',
    terminalLabel: 'Station',
    actions: [
      {
        id: 'view-leads',
        label: 'View Leads',
        description: 'Browse your open lead pipeline',
        icon: 'L',
      },
      {
        id: 'create-contact',
        label: 'Create Contact',
        description: 'Add a new contact to the CRM',
        icon: '+',
      },
      {
        id: 'log-activity',
        label: 'Log Activity',
        description: 'Record a call, email, or meeting',
        icon: 'A',
      },
      {
        id: 'view-pipeline',
        label: 'View Pipeline',
        description: 'See opportunities by stage',
        icon: 'P',
      },
    ],
  },

  zendesk: {
    displayName: 'Zendesk Support',
    floorColor: '#c8e8d8',
    wallColor: '#032830',
    accentColor: '#03363d',
    terminalLabel: 'Helpdesk',
    actions: [
      {
        id: 'view-tickets',
        label: 'View Tickets',
        description: 'Browse open and pending support tickets',
        icon: 'T',
      },
      {
        id: 'reply-ticket',
        label: 'Reply to Ticket',
        description: 'Send a response to a customer ticket',
        icon: 'R',
      },
      {
        id: 'create-ticket',
        label: 'Create Ticket',
        description: 'Open a new ticket on behalf of a user',
        icon: '+',
      },
      {
        id: 'view-reports',
        label: 'View Reports',
        description: 'Check ticket volume and resolution stats',
        icon: 'G',
      },
    ],
  },

  // 'home' appId (from sampleConnections — id: 'home', appId: 'Home')
  Home: {
    displayName: 'Home Base',
    floorColor: '#c8a96e',
    wallColor: '#4a2c14',
    accentColor: '#c8974c',
    terminalLabel: 'Station',
    actions: [
      {
        id: 'view-agents',
        label: 'View Agents',
        description: 'See all agents and their current tasks',
        icon: 'A',
      },
      {
        id: 'spawn-agent',
        label: 'Spawn Agent',
        description: 'Create a new agent for your team',
        icon: '+',
      },
      {
        id: 'view-activity',
        label: 'Activity Log',
        description: 'Review recent agent actions and tasks',
        icon: 'L',
      },
    ],
  },
}
