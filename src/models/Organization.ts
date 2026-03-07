// ─────────────────────────────────────────
// ORGANIZATION
// Top-level tenant. Owns Worlds, Users, and
// Teams. Everything in the system is scoped
// to an Organization.
// ─────────────────────────────────────────

/**
 * An Organization is the root tenant in the hierarchy.
 *
 *   Organization → World(s) → Land(s) → LandPlacement(s)
 *
 * Users and Teams belong to an Organization and are granted
 * access to its Worlds and Lands.
 */
export interface Organization {
  id:   string   // "org_acme_01"
  name: string   // "Acme Corp"
}
