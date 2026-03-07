// ─────────────────────────────────────────
// LAND OBJECT
// A structural or interactive element that
// belongs to the land's design, not to a
// user's placed content.
// ─────────────────────────────────────────

/**
 * Static/semi-static elements defined by the land itself.
 * Distinct from LandPlacements (user-placed connections/agents).
 *
 * The land owner positions these when building the land.
 * Some types are always present (home, bulletin_board).
 * Others carry type-specific config (chest has items, portal has a destination).
 */
export type LandObjectType =
  | 'home'           // the Home building — player identity anchor
  | 'bulletin_board' // readable announcements / quests board
  | 'chest'          // interactive storage / loot
  | 'spawn_point'    // where players enter the land
  | 'portal'         // teleporter to another land

/**
 * Admin-defined interior definition for a map object.
 * Returned nested inside LandObject when the object has an interior.
 * Use layout.data to render the interior when a player enters the object.
 */
export interface LandLayout {
  id:   string
  name: string
  data: Record<string, unknown>
}

export interface LandObject {
  id:         string
  landId:     string
  objectType: LandObjectType

  /** World-space pixel coordinates. */
  x: number
  y: number

  /**
   * Type-specific config.
   * portal   → { destinationLandId: string }
   * chest    → { items: string[] }
   * Others   → {}
   */
  config: Record<string, unknown>

  /**
   * Interior definition — present when the object has an admin-defined interior.
   * Null when no interior has been configured yet; handle gracefully.
   */
  layout: LandLayout | null

  /** ISO-8601 timestamps. */
  createdAt: string
  updatedAt: string
}
