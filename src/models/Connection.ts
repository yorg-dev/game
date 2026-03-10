import type { App } from './App'

// ─────────────────────────────────────────
// CONNECTION
// A live link between the workspace and a
// 3rd-party App, holding the credentials an
// Agent needs to execute Skills against it.
// ─────────────────────────────────────────

/** Lifecycle state of the connection. */
export type ConnectionStatus =
  | 'connected' // credentials valid, ready to use
  | 'disconnected' // intentionally unlinked by the owner
  | 'expired' // oauth token has passed its expiry
  | 'error' // last health-check or auth attempt failed

/**
 * A workspace's authenticated link to a single App.
 *
 * One Connection per App per workspace (or per store/account if the owner
 * has multiple — use `label` to distinguish them).
 *
 * Agents look up a Connection by `appId` at runtime to retrieve the
 * credentials required to execute their Skills.
 */
export interface Connection {
  id: string // "conn_shopify_01"
  appId: string // references App.id — "shopify"

  /**
   * Human-readable label set by the owner.
   * Useful when the same App is connected more than once
   * (e.g. two Shopify stores).
   * @example "Main Store", "EU Warehouse"
   */
  label: string

  status: ConnectionStatus

  /**
   * Stored credential values, keyed by the credential names declared in
   * `App.requiredCredentials`.
   *
   * In production these values would be encrypted at rest; here they are
   * typed as strings to keep the model simple.
   *
   * @example { shopify_access_token: "shpat_…", shopify_store_url: "mystore.myshopify.com" }
   */
  credentials: Record<string, string>

  /** ISO-8601 timestamp when the connection was first established. */
  connectedAt: string

  /**
   * ISO-8601 expiry for oauth2 access tokens.
   * Undefined for api_key / basic connections that don't expire.
   */
  expiresAt?: string

  /** ISO-8601 timestamp of the most recent successful skill execution. */
  lastUsedAt?: string

  /** Human-readable reason populated when status is "error". */
  errorMessage?: string
}

// ─────────────────────────────────────────
// Helper types
// ─────────────────────────────────────────

/**
 * Pair returned when resolving an AgentTemplate's required integrations.
 * `connection` is undefined when no matching Connection exists yet.
 */
export interface AppConnectionStatus {
  app: App
  connection: Connection | undefined
}
