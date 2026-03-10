/**
 * Shared tile constants for the feature (overlay) layer.
 *
 * Tile indices are 1-based in Phaser tilemaps (0 = transparent / empty).
 * These values correspond to the canvas-generated 'tiles' texture whose
 * frames are laid out
 *
 */
export const TILE_SIZE = 16

export const T = {
  EMPTY: -1, // Phaser "no tile" — ground layer shows through
  WATER: 2,
  DIRT: 3,
  STONE: 4,
} as const

export type TileValue = (typeof T)[keyof typeof T]

/** Feature-layer 2-D grid. Rows first, then columns. */
export type TileGrid = TileValue[][]

/**
 * Build a uniform ground grid filled with one grass frame, then let the
 * caller mutate individual cells to add variety.
 *
 * @param cols        Map width in tiles.
 * @param rows        Map height in tiles.
 * @param frame       0-based frame index in grass.png (default 0).
 *
 * Phaser tilemap indices are 1-based (0 = transparent/empty), so every
 * stored value is (frame + 1).  Pass the raw 0-based frame number here.
 */
export function buildGroundGrid(cols: number, rows: number, frame = 0): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(frame))
}

/**
 * Convenience: set a rectangular region of a ground grid to a given frame.
 * Mutates the grid in place and returns it for chaining.
 */
export function fillRect(
  grid: number[][],
  row0: number,
  col0: number,
  row1: number,
  col1: number,
  frame: number,
): number[][] {
  for (let r = row0; r <= row1; r++)
    for (let c = col0; c <= col1; c++) if (grid[r]?.[c] !== undefined) grid[r][c] = frame
  return grid
}
