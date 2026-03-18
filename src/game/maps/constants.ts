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

export const GRASS = {
  bl_corner: 22,
  bl_inner_corner: 17,
  bottom_border: 23,
  br_inner_corner: 16,
  br_corner: 24,
  common_fill: 12,
  left_border: 11,
  top_border: 1,
  top_left_inner_corner: 28,
  top_left_corner: 0,
  top_right_inner_corner: 27,
  tr_corner: 2,
  r_border: 13,
}

// ── Water layer ───────────────────────────────────────────────────────────────
//
// water.png frame reference (0-based, 4 cols × 1 row, each 16×16):
//   0  1  2  3
//
// Values are 1-based tile IDs (-1 = no tile).

export const WATER = {
  one: 0,
  two: 1,
  three: 2,
  four: 3,
}

// ── Dirt layer ────────────────────────────────────────────────────────────────
//
// dirt_01.png frame reference (0-based, 8 cols × 8 rows, each 16×16 px):
//
//  Row 0 →  0  1  2  3  4  5  6  7
//  Row 1 →  8  9 10 11 12 13 14 15
//  Row 2 → 16 17 18 19 20 21 22 23
//  Row 3 → 24 25 26 27 28 29 30 31
//  Row 4 → 32 33 34 35 36 37 38 39
//  Row 5 → 40 41 42 43 44 45 46 47
//  Row 6 → 48 49 50 51 52 53 54 55
//  Row 7 → 56 57 58 59 60 61 62 63
//
// Values stored are 1-based (frame + 1); -1 = no tile.

export const DIRT = {
  bottom_border: 42,
  bottom_left_corner: 41,
  bottom_right_corner: 43,
  common_fill: 0,
  left_border: 33,
  right_border: 35,
  top_border: 26,
  top_right_corner: 27,
  top_left_corner: 25,
}

// ── Fence layer ───────────────────────────────────────────────────────────────
//
// fences.png frame reference (0-based, 4 cols × 4 rows, each 16×16 px):
//
//  Row 0 →  0  1  2  3
//  Row 1 →  4  5  6  7
//  Row 2 →  8  9 10 11
//  Row 3 → 12 13 14 15
//
// Values stored are 1-based (frame + 1); -1 = no tile. All non-empty tiles collide.

export const FENCE = {
  grid_top_left: 1,
  grid_top_middle: 2,
  grid_top_right: 3,
  grid_right_bottom: 11,
  horizontal_left: 13,
  horizontal_middle: 14,
  horizontal_right: 15,
  single: 12,
  vertical_top: 0,
  vertical_middle: 4,
  vertical_bottom: 8,
}

// ── Biom Layer ───────────────────────────────────────────────────────────────
//
// biom.png frame reference (0-based, 9 cols × 5 rows, each 16×16 px):
//
//  Row 0 →  0  1  2  3  4  5  6  7  8
//  Row 1 →  9 10 11 12 13 14 15 16 17
//  Row 2 → 18 19 20 21 22 23 24 25 26
//  Row 3 → 27 28 29 30 31 32 33 34 35
//  Row 4 → 36 37 38 39 40 41 42 43 44
//

export const BIOM = {
  mushroom: 5,
  rock_small: 16,
  rock_big: 17,
  sunflower_top: 26,
  sunflower_bottom: 35,
  thin_tree_top: 0,
  thin_tree_bottom: 9,
}
