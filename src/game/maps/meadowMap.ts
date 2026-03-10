import { T, TILE_SIZE, buildGroundGrid, fillRect } from './tiles'
import type { MapDefinition } from './MapDefinition'

const COLS = 30
const ROWS = 17

// ── Ground layer ─────────────────────────────────────────────────────────────
//
// grass.png frame reference (0-based, 11 cols × 7 rows):
//
//  Row 0  →  0  1  2  3  4  5  6  7  8  9 10
//  Row 1  → 11 12 13 14 15 16 17 18 19 20 21
//  Row 2  → 22 23 24 25 26 27 28 29 30 31 32  (oval patch details)
//  Row 3  → 33 34 35 36 37 38 39 40 41 42 43  (larger blocks)
//  Row 4  → 44 45 46 47 48 49 50 51 52 53 54
//  Row 5  → 55 56 57 58 59 60 61 62 63 64 65
//  Row 6  → 66 67 68 69 70 71 72 73 74 75 76  (lighter/sandy)
//
// Tip: open grass.png in any image editor, enable a 16 px grid, and count
// tiles left→right, top→bottom starting at 0 to find the one you want.

function buildGroundData() {
  // Frame 12 (row 1, col 1 of grass.png) — clean interior tile with no borders.
  const g = buildGroundGrid(COLS, ROWS, 12)

  fillRect(g, 1, 2, 1, COLS - 3, 1) // top border
  fillRect(g, 2, COLS - 2, ROWS - 3, COLS - 2, 13) // right border
  fillRect(g, ROWS - 2, 2, ROWS - 2, COLS - 3, 23) // bottom border
  fillRect(g, 2, 1, ROWS - 3, 1, 11) // left border

  // Grass Corners
  g[1][1] = 0 // top left
  g[1][COLS - 2] = 2 // top right
  g[ROWS - 2][COLS - 2] = 24 // bottom right
  g[ROWS - 2][1] = 22 // bottom left

  return g
}

// ── Water layer ───────────────────────────────────────────────────────────────
//
// water.png frame reference (0-based, 4 cols × 1 row, each 16×16):
//   0  1  2  3
//
// Values are 1-based tile IDs (-1 = no tile).

function buildWaterData() {
  return Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => {
      if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) return 1
      return -1
    }),
  )
}

// ── Feature layer ─────────────────────────────────────────────────────────────

function buildFeatures() {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => T.EMPTY))
}

export const MEADOW_MAP: MapDefinition = {
  id: 'meadow',
  name: 'Meadow',
  description: 'Open grassland with two ponds and a central plaza.',
  cols: COLS,
  rows: ROWS,
  tileSize: TILE_SIZE,
  groundData: buildGroundData(),
  waterData: buildWaterData(),
  features: buildFeatures() as MapDefinition['features'],
  collidingTiles: [T.STONE],
  spawnTile: { col: Math.floor(COLS / 2), row: Math.floor(ROWS / 2) + 3 },
  bgColor: undefined, // '#7dcfbe',
}
