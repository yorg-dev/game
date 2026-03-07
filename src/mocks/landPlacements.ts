import type { LandPlacement } from '@/models/LandPlacement'

/**
 * Demo placements for 'land_main_01'.
 *
 * Coordinates match the values currently hardcoded in GameScene.ts and
 * mocks/connections.ts so this data can replace them in Step 4.
 *
 *   Home house  → (240, 136)   — CONNECTION_HOUSE_POSITIONS['home']
 *   Sign        → (184, 152)   — homeAnchor.x - 56, homeAnchor.y + 16
 *   Chest       → (312, 136)   — homeAnchor.x + 72, homeAnchor.y
 *
 * In production these are fetched from GET /lands/:land_id/placements
 */
// Placements are user-placed content (connections, agents).
// Map objects (home, bulletin board, chest) live in SAMPLE_LAND_OBJECTS.
export const SAMPLE_LAND_PLACEMENTS: LandPlacement[] = []

/**
 * Helper — filter placements by land and entity type.
 * Mirrors the query you'd issue against the real API.
 */
export function getPlacementsByType(
  landId:     string,
  entityType: LandPlacement['entityType'],
): LandPlacement[] {
  return SAMPLE_LAND_PLACEMENTS.filter(
    p => p.landId === landId && p.entityType === entityType,
  )
}
