import type { TileGrid } from './tiles'

/**
 * Pure-data description of a game map.
 * No Phaser types — this can be imported anywhere without pulling in the engine.
 *
 * To add a new map:
 *   1. Create src/game/maps/myMap.ts that exports a MapDefinition.
 *   2. Register it in src/game/maps/index.ts.
 *   3. Optionally add positions to sampleConnections.ts for that map's houses.
 */
export interface MapDefinition {
  /** Unique key used in the registry. */
  id: string
  /** Display name shown in any map-picker UI. */
  name: string
  description: string

  /** Map dimensions in tiles. */
  cols: number
  rows: number
  tileSize: number

  groundData: number[][]

  /**
   * Feature (overlay) layer grid.  Values come from the T constants in tiles.ts.
   * T.EMPTY (0) = transparent so the ground layer shows through.
   */
  features: TileGrid

  /**
   * Feature-layer tile indices that should block character movement.
   * Typically [T.STONE, T.WATER].
   */
  collidingTiles: number[]

  /**
   * Optional water layer grid.  Values are 1-based tile IDs (i.e. water.png)
   * (use 1 for frame 0, 2 for frame 1, etc.).  -1 = no tile (transparent).
   * When present, GameScene renders a dedicated water layer and sets up
   * collision automatically.
   */
  waterData?: number[][]

  /** Default player spawn in tile coordinates (col, row). */
  spawnTile: { col: number; row: number }

  /** Phaser backgroundColor string (hex or CSS colour). */
  bgColor?: string
}
