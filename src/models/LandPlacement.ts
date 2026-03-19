// ─────────────────────────────────────────
// LAND PLACEMENT
// A single entity positioned at a specific
// location on a Land. The join record between
// a Land and anything that can appear on it.
// ─────────────────────────────────────────

/**
 * Every distinct thing that can be placed on a Land.
 * Extend this union as new entity types are introduced.
 */
export type PlacementEntityType =
  | 'connection' // an authenticated integration (Shopify, GitHub, …)
  | 'agent' // an AI agent NPC

/**
 * A LandPlacement records that a specific entity exists on a Land
 * at a given world-space position.
 *
 * The same Connection (or Agent, etc.) can appear on multiple Lands —
 * each appearance is a separate LandPlacement with its own coordinates.
 *
 * Deleting a LandPlacement removes the entity from the Land without
 * deleting the underlying entity itself.
 */
export interface LandPlacement {
  id: string // "lp_01"
  land_id: string // parent Land

  /** Discriminator — determines which table/collection entity_id points to. */
  entity_type: PlacementEntityType

  /** Foreign key into the entity's own table (connections, agents, …). */
  entity_id: string

  /** World-space pixel coordinates of the placed entity. */
  world_x: number
  world_y: number

  /** ISO-8601 timestamps. */
  created_at: string
  updated_at: string
}
