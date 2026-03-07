// ─────────────────────────────────────────
// APP
// A 3rd-party platform that Agents connect
// to in order to run Skills.
// ─────────────────────────────────────────

/** Broad category describing what the app does. */
export type AppCategory =
  | 'ecommerce'   // Shopify, WooCommerce
  | 'crm'         // Salesforce, HubSpot
  | 'email'       // Gmail, Outlook
  | 'finance'     // Xero, QuickBooks, Stripe
  | 'social'      // Buffer, Twitter, LinkedIn
  | 'ai'          // OpenAI, Anthropic
  | 'support'     // Zendesk, Intercom
  | 'prospecting' // Apollo, Hunter

/** How the owner authenticates against the app's API. */
export type AuthType = 'oauth2' | 'api_key' | 'basic'

/**
 * A 3rd-party application that can be connected to the workspace.
 * Skills reference an App via `Skill.integration` (matches `App.id`).
 * AgentTemplates declare which apps they need via `requiredIntegrations`.
 */
export interface App {
  /** Stable identifier. Must match `Skill.integration` and `AgentTemplate.requiredIntegrations` entries. */
  id: string          // "shopify"

  name: string        // "Shopify"
  description: string // "ecommerce platform for online stores"
  category: AppCategory

  /** How the owner proves identity to this app. */
  authType: AuthType

  /**
   * Credential keys this app requires.
   * These are the same keys listed in `Skill.requiredCredentials`.
   */
  requiredCredentials: string[]  // ["shopify_access_token", "shopify_store_url"]

  /** Accent color used in the UI (hex). */
  color: string

  /** Whether the app is available for connection in the current build. */
  isAvailable: boolean
}
