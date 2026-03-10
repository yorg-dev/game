import { T, TILE_SIZE, buildGroundGrid, fillRect } from './tiles'
import type { MapDefinition } from './MapDefinition'

const COLS = 30
const ROWS = 17

function buildFeatures() {
  // Stone border everywhere
  const data: number[][] = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => {
      if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) return T.STONE
      return T.EMPTY
    }),
  )

  // Wide coastal sea — right 22 columns
  const shoreCol = COLS - 23
  for (let y = 1; y < ROWS - 1; y++) for (let x = shoreCol; x < COLS - 1; x++) data[y][x] = T.WATER

  // Ragged shoreline: indent water a couple of tiles in places
  const inlets = [3, 7, 12, 18, 25, 29]
  for (const row of inlets) {
    if (row < ROWS - 1) {
      data[row][shoreCol - 1] = T.WATER
      data[row][shoreCol - 2] = T.WATER
    }
  }

  // Horizontal dirt road running across the land half
  const roadY = Math.floor(ROWS / 2)
  for (let x = 1; x < shoreCol; x++) data[roadY][x] = T.DIRT

  // Vertical dirt road from top to road
  const roadX = Math.floor(shoreCol / 3)
  for (let y = 1; y <= roadY; y++) data[y][roadX] = T.DIRT

  // Stone dock jutting into the water
  const dockY = Math.floor(ROWS / 2) - 4
  for (let x = shoreCol; x <= shoreCol + 4; x++) if (x < COLS - 1) data[dockY][x] = T.STONE

  // Scatter stone ruins in the land area
  const ruins: [number, number, number, number][] = [
    [4, 6, 6, 9], // top-left ruin
    [22, 6, 25, 9], // mid ruin
    [8, 22, 11, 25], // bottom ruin
  ]
  for (const [r0, c0, r1, c1] of ruins)
    for (let y = r0; y <= r1; y++)
      for (let x = c0; x <= c1; x++)
        if (x < shoreCol && x > 0 && y > 0 && y < ROWS - 1) data[y][x] = T.STONE

  return data
}

function buildGroundData() {
  // Frame 2: the coastal map uses a different base grass tile for a different mood.
  const g = buildGroundGrid(COLS, ROWS, 2)
  // Sandy/lighter patches near the shoreline (frames 66–68, row 6).
  const shoreCol = COLS - 23
  fillRect(g, 2, shoreCol - 6, ROWS - 3, shoreCol - 3, 66)
  return g
}

export const COAST_MAP: MapDefinition = {
  id: 'coast',
  name: 'Coastline',
  description: 'A rugged coastal settlement with a sea to the east and scattered ruins.',
  cols: COLS,
  rows: ROWS,
  tileSize: TILE_SIZE,
  groundData: buildGroundData(),
  features: buildFeatures() as MapDefinition['features'],
  collidingTiles: [T.STONE, T.WATER],
  spawnTile: { col: 8, row: Math.floor(ROWS / 2) + 3 },
  bgColor: '#0d1b2e',
}
