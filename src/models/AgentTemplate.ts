// ─────────────────────────────────────────
// 2. AGENT TEMPLATE
// A reusable blueprint. One focused role.
// Composed of one OR more skills.
// ─────────────────────────────────────────

export type AgentCategory = 'ecommerce' | 'sales' | 'support' | 'marketing'

/**
 * Links a Skill to an AgentTemplate workflow step.
 * Defines execution order, required-ness, how inputs are sourced,
 * and an optional guard condition.
 */
export interface AgentSkill {
  skillId: string   // references Skill.id  e.g. "shopify:create_refund"
  order:   number   // 1-indexed position in the workflow

  /** When false the agent continues even if this skill fails. */
  isRequired: boolean

  /**
   * Maps skill input fields to runtime data paths.
   * Keys are the skill's inputSchema field names.
   * Values are dot-path expressions into the runtime context,
   * e.g. "trigger.data.order_id" or a previous step's output
   * like "steps.1.output.order_id".
   *
   * @example { "orderId": "trigger.data.order_id" }
   */
  inputMapping: Record<string, string>

  /**
   * Optional guard expression evaluated before the skill runs.
   * The step is skipped (not failed) when the condition is falsy.
   * @example "trigger.data.amount > 0"
   */
  condition?: string
}


export interface AgentTemplate {
  id:          string         // "returns-agent"
  name:        string         // "Returns Agent"
  description: string         // "Handles customer return and refund requests end to end"
  category:    AgentCategory  // "ecommerce" | "sales" | "support" | "marketing"

  /** Ordered list of skill steps — defines the workflow. */
  skills: AgentSkill[]

  /** Integrations that must be connected before deploying. */
  requiredIntegrations: string[]  // ["shopify", "gmail"]

  /** Visual identity on the field.  Currently maps to an existing AgentType key. */
  sprite: string   // "agent-returns" (or a AgentType key for current renderer)
  color:  string   // accent color for this agent type

  authorType:  'agent' | 'community' | 'owner'
  isPublished: boolean
}
