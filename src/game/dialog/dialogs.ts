import type { DialogScript } from './DialogScript'

/**
 * Keyed by a trigger ID (item type, NPC id, etc.).
 * GameScene emits dialog-start with the resolved script.
 */
export const DIALOGS: Record<string, DialogScript> = {

  chest: {
    lines: [
      { speaker: 'Chest',  speakerColor: '#f0a030', text: "You open the chest and find... a stack of API credentials." },
      { speaker: 'Chest',  speakerColor: '#f0a030', text: "These look useful. Your agents might need them to connect to external services." },
      { speaker: 'Agent',  speakerColor: '#4ade80', text: "Nice. I'll add these to the connections panel." },
    ],
  },

  'conn_home': {
    lines: [
      { speaker: 'Home Base', speakerColor: '#7ab8d8', text: "This is your team's home base. All your agents spawn here." },
      { speaker: 'Home Base', speakerColor: '#7ab8d8', text: "Use the toolbar to spawn new agents and assign them to integrations." },
    ],
  },

  'conn_shopify_01': {
    lines: [
      { speaker: 'Shopify', speakerColor: '#96bf48', text: "Shopify is connected. Your ecommerce agents can process orders and refunds." },
      { speaker: 'Agent',   speakerColor: '#4ade80', text: "I can handle inventory checks, order lookups, and customer refunds from here." },
    ],
  },

  'conn_xero_01': {
    lines: [
      { speaker: 'Xero',  speakerColor: '#00aacc', text: "Xero accounting is live. Invoices, bills, and payroll are all accessible." },
      { speaker: 'Agent', speakerColor: '#4ade80', text: "Point me at a finance task and I'll run the numbers." },
    ],
  },

  'conn_gmail_01': {
    lines: [
      { speaker: 'Gmail', speakerColor: '#ea4335', text: "Gmail is connected. I can read, draft, and send emails on your behalf." },
      { speaker: 'Agent', speakerColor: '#4ade80', text: "Want me to draft a follow-up? Just issue a command." },
    ],
  },

  'conn_stripe_01': {
    lines: [
      { speaker: 'Stripe', speakerColor: '#6772e5', text: "Stripe payments are live. Charges, refunds, and subscriptions are all within reach." },
      { speaker: 'Agent',  speakerColor: '#4ade80', text: "I'll flag any failed payments automatically." },
    ],
  },

}

/** Fallback dialog when no specific script exists for a connection. */
export function getConnectionDialog(connectionId: string, appName: string): DialogScript {
  return DIALOGS[connectionId] ?? {
    lines: [
      { speaker: appName, speakerColor: '#c8974c', text: `${appName} is connected and ready.` },
      { speaker: 'Agent', speakerColor: '#4ade80', text: 'I can use this integration to complete tasks. Just give me a command.' },
    ],
  }
}
