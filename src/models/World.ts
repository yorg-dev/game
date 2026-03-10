// ─────────────────────────────────────────
// WORLD
// A named environment owned by an
// Organization. Holds all Lands, Connections,
// Teams, and Users for that environment.
// ─────────────────────────────────────────

/**
 * A World belongs to one Organization.
 * An Organization can have many Worlds (e.g. "Production", "Staging", "Sandbox").
 *
 *   Organization → World(s) → Land(s) → LandPlacement(s)
 */
export interface World {
  id: string // "world_acme_01"
  name: string // "Production", "Staging"
  organizationId: string // references Organization.id

  /** ISO-8601 timestamps. */
  createdAt: string
  updatedAt: string
}
