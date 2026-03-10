// ─────────────────────────────────────────
// Supporting types
// ─────────────────────────────────────────

/** Where in the Agent's skill tree this capability lives. */
export type SkillCategory = 'ecommerce' | 'email' | 'crm' | 'social' | 'ops'

/** How the skill is initiated. */
export type TriggerType = 'manual' | 'webhook' | 'scheduled' | 'event'

/** Minimal JSON Schema (draft-07 subset) used for input/output contracts. */
export type JSONSchema = {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array' | 'null'
  properties?: Record<string, JSONSchema>
  required?: string[]
  items?: JSONSchema
  description?: string
  [key: string]: unknown
}

// ─────────────────────────────────────────
// SKILL
// The atomic unit. One capability. One job.
// ─────────────────────────────────────────
export interface Skill {
  id: string // "shopify:refund_transaction"
  name: string // "Refund Transaction"
  description: string // "Issues a full or partial refund for a Shopify order"
  category: SkillCategory
  integration: string // "shopify" — which platform this skill belongs to

  // What this skill needs to run
  requiredCredentials: string[] // ["shopify_access_token", "shopify_store_url"]
  inputSchema: JSONSchema // what data it needs to execute
  outputSchema: JSONSchema // what data it returns

  // How it behaves
  triggerType: TriggerType
  triggerEvent?: string // "shopify/order.created" — only when triggerType is "event"

  isComposable: boolean // can this skill be chained after another?
  version: string // "1.0.0"
}
