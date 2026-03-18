import { T, TILE_SIZE, buildGroundGrid, fillRect } from './tiles'
import type { MapDefinition } from './MapDefinition'
import { BIOM, DIRT, FENCE, GRASS, WATER } from './constants'

const COLS = 30
const ROWS = 17

function buildGroundData() {
  // Frame 12 (row 1, col 1 of grass.png) — clean interior tile with no borders.
  const g = buildGroundGrid(COLS, ROWS, GRASS.common_fill)

  fillRect(g, 2, 5, 2, COLS - 4, GRASS.top_border)
  g[3][3] = GRASS.top_border
  g[3][4] = GRASS.top_left_inner_corner

  fillRect(g, 4, COLS - 3, 9, COLS - 3, GRASS.r_border)
  fillRect(g, 11, 18, ROWS - 3, 18, GRASS.r_border)

  fillRect(g, ROWS - 2, 4, ROWS - 2, 17, GRASS.bottom_border)
  fillRect(g, 10, 19, 10, COLS - 3, GRASS.bottom_border)

  fillRect(g, 4, 2, ROWS - 3, 2, GRASS.left_border)

  // Grass Corners
  // TOP LEFT
  g[3][2] = GRASS.top_left_corner;
  g[2][4] = GRASS.top_left_corner;

  g[2][COLS - 4] = GRASS.tr_corner;
  g[3][COLS - 3] = GRASS.tr_corner;
  g[3][COLS - 4] = GRASS.top_right_inner_corner;

  g[ROWS - 2][18] = GRASS.br_corner;
  g[10][COLS - 3] = GRASS.br_corner;
  g[10][18] = GRASS.br_inner_corner;

  g[ROWS - 3][2] = GRASS.bl_corner;
  g[ROWS - 2][3] = GRASS.bl_corner;
  g[ROWS - 3][3] = GRASS.bl_inner_corner;

  return g
}

function buildWaterData() {
  return Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => {
      if (
        y === 0 || y === 1 ||                 // top side
        y === 2 && x === (COLS - 3) ||        // top-right

        x === COLS - 2 || x === COLS - 1 ||   // right side
        y > 10 && x > 18 ||                   // right cut out

        y === ROWS - 1 ||                     // bottom
        y === (ROWS - 2) && x === 2 ||        // bottom-left

        x === 0 || x === 1 ||                 // left side
        y === 2 && x === 2 ||  y === 2 && x === 3 // top-left
      ) return WATER.one;
      return -1
    }),
  )
}

function buildDirtData() {
  const g: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(-1))

  fillRect(g, 4, 21, 4, 25, DIRT.top_border);
  fillRect(g, 4, 20, 4, 20, DIRT.top_left_corner);
  fillRect(g, 4, 26, 4, 26, DIRT.top_right_corner);
  fillRect(g, 5, 21, 8, 25, DIRT.common_fill);
  fillRect(g, 5, 26, 8, 26, DIRT.right_border);
  fillRect(g, 5, 20, 8, 20, DIRT.left_border);
  fillRect(g, 9, 21, 9, 25, DIRT.bottom_border);
  fillRect(g, 9, 20, 9, 20, DIRT.bottom_left_corner);
  fillRect(g, 9, 26, 9, 26, DIRT.bottom_right_corner);

  /* helper examples
   *
   *
    // Paint a horizontal dirt path (3 tiles tall) from startCol to endCol.
    function hPath(startCol: number, endCol: number, midRow: number) {
      for (let c = startCol; c <= endCol; c++) {
        const isLeft = c === startCol
        const isRight = c === endCol
        g[midRow - 1][c] = isLeft ? TL : isRight ? LFT : TOP
        g[midRow][c] = isLeft ? LFT : isRight ? RGT : FILL
        g[midRow + 1][c] = isLeft ? BL : isRight ? BR : BOT
      }
    }

    // Paint a vertical dirt path (3 tiles wide) from startRow to endRow.
    function vPath(startRow: number, endRow: number, midCol: number) {
      for (let r = startRow; r <= endRow; r++) {
        const isTop = r === startRow
        const isBot = r === endRow
        g[r][midCol - 1] = isTop ? TL : isBot ? BL : LFT
        g[r][midCol] = isTop ? TOP : isBot ? BOT : FILL
        g[r][midCol + 1] = isTop ? TR : isBot ? BR : RGT
      }
    }
  */

  return g
}

function buildFenceData() {
  const g: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(-1))

  fillRect(g, 4, 20, 4, 25, FENCE.horizontal_middle);
  g[4][26] = FENCE.grid_top_right;
  fillRect(g, 5, 26, 8, 26, FENCE.vertical_middle);
  g[9][26] = FENCE.grid_right_bottom;
  g[5][19] = FENCE.vertical_bottom;
  fillRect(g, 9, 18, 9, 25, FENCE.horizontal_middle);
  g[4][19] = FENCE.grid_top_left;

  return g
}

// ── Feature layer ─────────────────────────────────────────────────────────────

function buildFeatures() {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => T.EMPTY))
}

const DECORATIONS: MapDefinition['decorations'] = [
  { frame: BIOM.thin_tree_top, row: 2, col: 3, collides: true },    // thin tree
  { frame: BIOM.thin_tree_bottom, row: 3, col: 3, collides: true },

  { frame: BIOM.thin_tree_top, row: 6, col: 11, collides: true },   // thin tree
  { frame: BIOM.thin_tree_bottom, row: 7, col: 11, collides: true },

  { frame: 1, row: 2, col: 4, collides: true },                     // big tree
  { frame: 2, row: 2, col: 5, collides: true },
  { frame: 10, row: 3, col: 4, collides: true },
  { frame: 11, row: 3, col: 5, collides: true },

  { frame: 17, col: 4, row: 4, collides: true },                    // rocks
  { frame: 17, col: 17, row: 3, collides: true },

  { frame: BIOM.sunflower_top, col: 24, row: 4, collides: true },   // sunflower
  { frame: BIOM.sunflower_bottom, col: 24, row: 5, collides: true },

  { frame: 5, col: 7, row: 7, collides: true },                     // mushroom
  { frame: 5, col: 22, row: 7, collides: true },
];

export const TUTORIAL_MAP: MapDefinition = {
  id: 'tutorial',
  name: 'Tutorial',
  description: 'A welcoming starting area for new visitors.',
  cols: COLS,
  rows: ROWS,
  tileSize: TILE_SIZE,
  groundData: buildGroundData(),
  waterData: buildWaterData(),
  dirtData: buildDirtData(),
  fenceData: buildFenceData(),
  features: buildFeatures() as MapDefinition['features'],
  collidingTiles: [T.STONE],
  spawnTile: { col: Math.floor(COLS / 2), row: Math.floor(ROWS / 2) + 3 },
  bgColor: undefined,
  decorations: DECORATIONS,
}
